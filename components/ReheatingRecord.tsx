
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
    RefreshCw, 
    Search, 
    Filter, 
    Plus, 
    Clock, 
    Thermometer, 
    CheckCircle2, 
    User, 
    ArrowRight, 
    AlertTriangle, 
    Building2, 
    MapPin, 
    Package, 
    Utensils, 
    ChevronRight, 
    Trash2, 
    Edit, 
    ShieldCheck, 
    History,
    Activity,
    ClipboardCheck,
    Hourglass,
    FileSpreadsheet,
    Zap,
    Play,
    CheckCheck,
    Globe,
    Database,
    Flame,
    Check,
    Snowflake,
    Droplets,
    X,
    PenTool,
    Eraser,
    MessageSquare,
    UserCheck,
    Timer,
    Camera,
    Info,
    Download,
    Loader2,
    ChevronsLeft,
    ChevronLeft,
    ChevronsRight,
    TrendingUp,
    XCircle,
    QrCode,
    Save
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';
import Logo from './Logo';

interface ReheatedItem {
    purpose: string;
    quantity: number;
}

interface ReheatingEntry {
    uuid: string;
    status: 'READY' | 'IN_PROGRESS' | 'DUE_VERIFICATION' | 'COMPLETED';
    corporate: string;
    regional: string;
    unit: string;
    department: string;
    location: string;
    productName: string;
    category: string;
    sourceProductName: string;
    batchNumber: string;
    standardRecipe: string;
    reheatingVessel: string;
    reheatingQuantity: number;
    method: string;
    reheatStart: string;
    reheatCompleted: string;
    initialTemp: number;
    finalTemp?: number;
    duration: string;
    completedBy: string;
    reheatingPurpose: string;
    correctiveAction?: string;
    verifierName?: string;
    verificationComments?: string;
    verifierSignature?: string;
    issued: ReheatedItem[];
    thawTime: string;
    cookTime: string;
    cookTemp: number;
    coolTime: string;
    coolTemp: number;
    completedBySign?: string;
    mfgDate?: string;
    expDate?: string;
}

// --- ISO 22000 Types ---
interface DocControlInfo {
    docRef: string;
    version: string;
    effectiveDate: string;
    approvedBy: string;
}

const SignaturePad: React.FC<{ onSave: (data: string) => void, initialData?: string, label?: string }> = ({ onSave, initialData, label = "Authorized Signature" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (initialData && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0);
                img.src = initialData;
            }
        }
    }, [initialData]);

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) onSave(canvas.toDataURL());
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onSave('');
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                <button type="button" onClick={clear} className="text-[9px] font-black text-rose-500 uppercase hover:underline flex items-center gap-1">
                    <Eraser size={10} /> Reset
                </button>
            </div>
            <div className="w-full h-24 bg-slate-50 border-2 border-slate-100 border-dashed rounded-2xl relative overflow-hidden shadow-inner cursor-crosshair">
                <canvas 
                    ref={canvasRef} 
                    width={500} 
                    height={96} 
                    className="w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                />
                {!initialData && !isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <span className="text-3xl font-black uppercase -rotate-6 select-none tracking-tighter">Sign to Authenticate</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const PURPOSES = ["Hold and Serve", "Direct issue for cooking", "Chill and store"];
const OVEN_NUMBERS = ["OVEN-01", "OVEN-02", "OVEN-03", "OVEN-04", "RANGE-01", "GRILL-01"];

const MOCK_REHEATING_DATA: ReheatingEntry[] = Array.from({ length: 50 }).map((_, i) => {
    const statuses: ReheatingEntry['status'][] = ['READY', 'IN_PROGRESS', 'DUE_VERIFICATION', 'COMPLETED'];
    const status = statuses[i % 4];
    const isCompleted = status === 'COMPLETED';
    const isNotStarted = status === 'READY';
    
    return {
        uuid: `reheat-${100 + i}`,
        status,
        corporate: "FoodCorp",
        regional: "North America",
        unit: "NYC Central Kitchen",
        department: "Main Kitchen",
        location: `Station ${i % 5 + 1}`,
        productName: i % 2 === 0 ? "GRILLED CHICKEN BREAST" : "BLACK ANGUS BEEF PATTIES",
        category: i % 2 === 0 ? "Poultry" : "Beef",
        sourceProductName: i % 2 === 0 ? "Raw Chicken Breast" : "Raw Beef",
        batchNumber: `BT-RE-00${i + 1}-X`,
        standardRecipe: i % 2 === 0 ? "SOP-P-001" : "SOP-B-005",
        reheatingVessel: isNotStarted ? "" : "OVEN-01",
        reheatingQuantity: 5.5 + i,
        method: isNotStarted ? "" : "Blast Oven Reheat",
        reheatStart: isNotStarted ? "" : new Date(Date.now() - (4 * 3600000)).toISOString(),
        reheatCompleted: isCompleted || status === 'DUE_VERIFICATION' ? new Date(Date.now() - (3 * 3600000)).toISOString() : "",
        initialTemp: isNotStarted ? 0 : 4.2,
        finalTemp: isCompleted || status === 'DUE_VERIFICATION' ? 78.5 : undefined,
        duration: isNotStarted ? "" : "18m 30s",
        completedBy: isNotStarted ? "" : "Chef Alex",
        reheatingPurpose: "Hold and Serve",
        correctiveAction: i === 4 ? "Temperature threshold low, extended cycle by 5m." : "",
        verifierName: isCompleted ? "Jane Smith (QA)" : "",
        verificationComments: isCompleted ? "Temperature verified. Critical limits met." : "",
        issued: isCompleted ? [{ purpose: "Main Service", quantity: 5 }] : [],
        thawTime: "2025-08-11 09:00 AM",
        cookTime: "2025-08-11 02:00 PM",
        cookTemp: 92,
        coolTime: "2025-08-11 05:00 PM",
        coolTemp: 3.5,
        mfgDate: '2025-01-10',
        expDate: '2025-06-10'
    };
});

const ReheatingRecord: React.FC = () => {
    const [entries, setEntries] = useState<ReheatingEntry[]>(MOCK_REHEATING_DATA);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<ReheatingEntry['status'] | 'all'>('all');
    const [now, setNow] = useState(Date.now());
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    
    // ISO 22000 Doc Control State
    const [docControlData] = useState<DocControlInfo>({
        docRef: 'REH-RGST-01',
        version: '1.2',
        effectiveDate: new Date().toISOString().split('T')[0],
        approvedBy: 'Quality Assurance Director'
    });

    // Date Filters
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<ReheatingEntry | null>(null);
    const [tempInput, setTempInput] = useState("");
    const [vesselInput, setVesselInput] = useState("OVEN-01");
    const [signature, setSignature] = useState("");

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => ({
        total: entries.length,
        ready: entries.filter(r => r.status === 'READY').length,
        inProgress: entries.filter(r => r.status === 'IN_PROGRESS').length,
        dueVerify: entries.filter(r => r.status === 'DUE_VERIFICATION').length,
        completed: entries.filter(r => r.status === 'COMPLETED').length,
        avgPerDay: (entries.length / 7).toFixed(1),
    }), [entries]);

    const filteredData = useMemo(() => {
        return entries.filter(r => {
            const matchesSearch = r.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                r.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === 'all' || r.status === activeFilter;

            let matchesDate = true;
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0,0,0,0);
                if (!r.reheatStart) matchesDate = false;
                else if (new Date(r.reheatStart) < fromDate) matchesDate = false;
            }
            if (dateTo && matchesDate) {
                const toDate = new Date(dateTo);
                toDate.setHours(23,59,59,999);
                if (!r.reheatStart) matchesDate = false;
                else if (new Date(r.reheatStart) > toDate) matchesDate = false;
            }

            return matchesSearch && matchesFilter && matchesDate;
        });
    }, [searchTerm, activeFilter, entries, dateFrom, dateTo]);

    // Pagination Logic
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 4) pages.push('...');
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            if (currentPage <= 4) { start = 2; end = 5; }
            else if (currentPage >= totalPages - 3) { start = totalPages - 4; end = totalPages - 1; }
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 3) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const formatTimeDisplay = (iso?: string) => {
        if (!iso) return "---";
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatLapse = (start: string, end?: string) => {
        if (!start) return "--:--";
        const sTime = new Date(start).getTime();
        const eTime = end ? new Date(end).getTime() : now;
        const diff = Math.max(0, eTime - sTime);
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        const hStr = hours > 0 ? `${hours}h ` : '';
        return `${hStr}${mins}m ${secs}s`;
    };

    const handleInitiateClick = (entry: ReheatingEntry) => {
        setSelectedEntry(entry);
        setTempInput("");
        setSignature("");
        setIsInitiateModalOpen(true);
    };

    const commitInitiation = () => {
        if (!selectedEntry || !tempInput || !signature) return;
        setEntries(prev => prev.map(e => {
            if (e.uuid !== selectedEntry.uuid) return e;
            return {
                ...e,
                status: 'IN_PROGRESS',
                reheatStart: new Date().toISOString(),
                initialTemp: parseFloat(tempInput),
                reheatingVessel: vesselInput,
                completedBy: "Staff Operator"
            };
        }));
        setIsInitiateModalOpen(false);
        setSelectedEntry(null);
    };

    // --- ISO 22000 PDF EXPORT ENGINE (STANDARD CONTROLLED RECORD) ---
    const generatePDFForEntries = async (targetEntries: ReheatingEntry[], filename: string) => {
        const printArea = document.createElement('div');
        printArea.style.position = 'fixed';
        printArea.style.top = '-9999px';
        printArea.style.left = '0';
        printArea.style.width = '1200px'; 
        printArea.style.backgroundColor = 'white';
        printArea.style.padding = '0';
        printArea.style.fontFamily = 'Arial, Helvetica, sans-serif';
        printArea.style.color = '#1e293b';

        const securityId = `CERT-REH-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const downloadTimestamp = new Date().toLocaleString();

        let htmlContent = `
            <div style="padding: 50px; background: #fff; min-height: 1000px; display: flex; flex-direction: column; position: relative;">
                <!-- WATERMARK -->
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 120px; font-weight: 900; color: rgba(226, 232, 240, 0.4); pointer-events: none; text-transform: uppercase; z-index: 0; white-space: nowrap;">Controlled Record</div>

                <!-- CONTROLLED HEADER (ISO 7.5.2) -->
                <div style="border: 2px solid #1e293b; margin-bottom: 25px; position: relative; z-index: 10; background: #fff;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 15%; padding: 15px; border-right: 2px solid #1e293b; text-align: center;">
                                <div style="width: 60px; height: 60px; margin: 0 auto;">
                                    ${renderToString(<Logo className="w-16 h-16" />)}
                                </div>
                            </td>
                            <td style="width: 55%; padding: 15px; border-right: 2px solid #1e293b;">
                                <div style="font-size: 16px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; color: #0f172a;">HACCP PRO ENTERPRISE SYSTEMS</div>
                                <div style="font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Reheating Control Registry (ISO 22:2018)</div>
                                <div style="font-size: 11px; margin-top: 8px; font-weight: 600; color: #64748b;">Facility Node: NYC Central Kitchen | Location: Manhattan Hub</div>
                            </td>
                            <td style="width: 30%; padding: 0;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 10px; font-weight: 700;">
                                    <tr><td style="padding: 6px 12px; border-bottom: 1px solid #1e293b; background: #f8fafc; color: #64748b;">Doc Ref:</td><td style="padding: 6px 12px; border-bottom: 1px solid #1e293b;">${docControlData.docRef}</td></tr>
                                    <tr><td style="padding: 6px 12px; border-bottom: 1px solid #1e293b; background: #f8fafc; color: #64748b;">Revision:</td><td style="padding: 6px 12px; border-bottom: 1px solid #1e293b;">v${docControlData.version}</td></tr>
                                    <tr><td style="padding: 6px 12px; background: #f8fafc; color: #64748b;">Effective:</td><td style="padding: 6px 12px;">${docControlData.effectiveDate}</td></tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- TABLE SECTION -->
                <div style="flex: 1; position: relative; z-index: 10;">
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px;">
                        <thead>
                            <tr style="background: #1e293b; color: white; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">
                                <th style="padding: 12px; text-align: left;">Registry Identity</th>
                                <th style="padding: 12px; text-align: left;">Process Telemetry</th>
                                <th style="padding: 12px; text-align: left;">Process Ancestry</th>
                                <th style="padding: 12px; text-align: center;">Digital Passport (QR)</th>
                                <th style="padding: 12px; text-align: left;">Authorization</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${targetEntries.map(e => {
                                const qrString = `REHEATING_VERIFIED_RECORD\nID:${e.uuid}\nPRODUCT:${e.productName}\nBATCH:${e.batchNumber}\nSTART:${e.reheatStart || 'PENDING'}\nEND:${e.reheatCompleted || 'PENDING'}\nTEMP_INITIAL:${e.initialTemp || '--'}C\nTEMP_FINAL:${e.finalTemp || '--'}C\nAUTH:${e.verifierName || 'PENDING'}`;
                                return `
                                <tr style="font-size: 10px; border-bottom: 1px solid #e2e8f0; background: #fff;">
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 800; color: #0f172a;">${e.productName}</div>
                                        <div style="font-size: 8px; color: #64748b; margin-top: 4px; font-weight: 700;">BATCH: ${e.batchNumber}</div>
                                        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">MFG: ${e.mfgDate || 'N/A'} | EXP: ${e.expDate || 'N/A'}</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 700;">Vessel: ${e.reheatingVessel || 'Pending'}</div>
                                        <div style="font-size: 8px; color: #e11d48; margin-top: 4px; font-weight: 800;">Initial: ${e.initialTemp || '---'}°C</div>
                                        <div style="font-size: 8px; color: #10b981; margin-top: 2px; font-weight: 800;">Final: ${e.finalTemp || '---'}°C</div>
                                        <div style="font-size: 8px; color: #64748b; margin-top: 4px; font-weight: 700;">Lapse: ${formatLapse(e.reheatStart, e.reheatCompleted)}</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 700;">Cook: ${e.cookTime}</div>
                                        <div style="font-weight: 900; color: #4f46e5; margin-top: 2px;">Cooling End: ${e.coolTime}</div>
                                        <div style="font-size: 8px; color: #94a3b8; margin-top: 4px;">Unit: ${e.unit}</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; text-align: center; vertical-align: middle;">
                                        <div style="width: 70px; height: 70px; margin: 0 auto; background: #f8fafc; padding: 5px; border-radius: 4px;">
                                            ${renderToString(<QRCodeSVG value={qrString} size={70} level="H" />)}
                                        </div>
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="margin-bottom: 8px;">
                                            <div style="font-weight: 800; color: #64748b; font-size: 8px;">OPERATOR</div>
                                            <div style="font-weight: 800; color: #0f172a;">${e.completedBy || 'N/A'}</div>
                                        </div>
                                        ${e.verifierName ? `
                                            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px; border-radius: 4px;">
                                                <div style="font-weight: 800; color: #059669; font-size: 8px;">QA AUTHORIZED</div>
                                                <div style="font-weight: 900; color: #064e3b;">${e.verifierName}</div>
                                            </div>
                                        ` : `
                                            <div style="font-size: 8px; color: #f59e0b; font-weight: 900;">AWAITING AUTH</div>
                                        `}
                                    </td>
                                </tr>
                                `}).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- FOOTER -->
                <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
                    <div style="display: flex; gap: 30px; margin-bottom: 25px;">
                        <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Process Intake Signature</div>
                            <div style="border-bottom: 1px solid #cbd5e1; height: 30px;"></div>
                        </div>
                        <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Verification Node Auth</div>
                            <div style="border-bottom: 1px solid #cbd5e1; height: 30px;"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">
                        <div>Registry Sync: ${downloadTimestamp}</div>
                        <div>Electronic Hash: ${securityId}</div>
                    </div>
                </div>
            </div>
        `;

        printArea.innerHTML = htmlContent;
        document.body.appendChild(printArea);

        try {
            const canvas = await html2canvas(printArea, { 
                scale: 3.5, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                logging: false
            });
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF('l', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const totalCanvasHeight = canvas.height;
            const singlePageCanvasHeight = (pdfHeight * canvas.width) / pdfWidth;
            let currentCanvasY = 0;

            while (currentCanvasY < totalCanvasHeight) {
                if (currentCanvasY > 0) pdf.addPage();
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = Math.min(singlePageCanvasHeight, totalCanvasHeight - currentCanvasY);
                const ctx = pageCanvas.getContext('2d');
                ctx?.drawImage(canvas, 0, currentCanvasY, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
                pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, (pageCanvas.height * pdfWidth) / canvas.width);
                currentCanvasY += singlePageCanvasHeight;
            }
            pdf.save(filename);
        } catch (err) {
            console.error("PDF Export failed", err);
        } finally {
            document.body.removeChild(printArea);
        }
    };

    const handleExportGlobalPDF = async () => {
        setIsGeneratingPDF(true);
        const filename = `Complete_Reheating_Registry_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDFForEntries(filteredData, filename);
        setIsGeneratingPDF(false);
    };

    const handleExportSinglePDF = async (entry: ReheatingEntry) => {
        setIsGeneratingPDF(true);
        const filename = `Reheating_Record_${entry.uuid}_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDFForEntries([entry], filename);
        setIsGeneratingPDF(false);
    };

    return (
        <div className="flex flex-col h-full gap-6 p-4 md:p-0">
            {/* Dashboard Ribbon (KPIs + Global Action Terminal) */}
            <div className="bg-white p-4 lg:p-6 rounded-[2.5rem] border border-slate-200 shadow-xl mb-8 flex flex-col xl:flex-row gap-6 items-stretch xl:items-center overflow-hidden">
                
                {/* Metrics Group: Responsive horizontally on small screens */}
                <div className="flex-1 flex overflow-x-auto hide-scrollbar snap-x pb-1 lg:pb-0">
                    <div className="flex gap-3 min-w-max">
                        {[
                            { label: 'Total Trace', val: stats.total, color: 'bg-slate-900', id: 'all', icon: Database },
                            { label: 'Ready Pool', val: stats.ready, color: 'bg-indigo-600', id: 'READY', icon: Play },
                            { label: 'Reheating', val: stats.inProgress, color: 'bg-amber-500', id: 'IN_PROGRESS', icon: Flame },
                            { label: 'Pending Auth', val: stats.dueVerify, color: 'bg-blue-600', id: 'DUE_VERIFICATION', icon: ClipboardCheck },
                            { label: 'Verified Flow', val: stats.completed, color: 'bg-emerald-600', id: 'COMPLETED', icon: CheckCircle2 },
                            { label: 'Avg Record/Day', val: stats.avgPerDay, color: 'bg-rose-500', id: 'AvgPerDay', icon: TrendingUp }
                        ].map((c, i) => (
                            <button 
                                key={i} 
                                onClick={() => { if(c.id !== 'AvgPerDay') setActiveFilter(c.id as any); setCurrentPage(1); }}
                                className={`p-3 lg:p-4 rounded-2xl border-2 transition-all flex flex-col justify-center text-left relative group active:scale-95 snap-center w-36 lg:w-40 ${activeFilter === c.id ? 'bg-white border-indigo-600 shadow-lg ring-4 ring-indigo-50' : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'}`}
                            >
                                <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">{c.label}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-lg lg:text-xl font-black text-slate-900 tracking-tighter leading-none">{c.val}</p>
                                    <div className={`w-2 h-2 rounded-full ${c.color}`} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Global Action Terminal */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 xl:pl-6 xl:border-l border-slate-100 justify-center sm:justify-start">
                    
                    {/* Date Filters */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 shadow-inner">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 hidden sm:inline">Range:</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-20 sm:w-24 uppercase cursor-pointer"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <span className="text-slate-300 font-bold">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-20 sm:w-24 uppercase cursor-pointer"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                        {(dateFrom || dateTo) && (
                            <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="ml-1 text-slate-400 hover:text-rose-500 transition-colors">
                                <XCircle size={14} />
                            </button>
                        )}
                    </div>

                    <div className="relative group w-full sm:w-48 lg:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Locate batch SKU..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner uppercase tracking-wider"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"><Filter size={20} /></button>
                        <button 
                            onClick={handleExportGlobalPDF}
                            disabled={isGeneratingPDF}
                            className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        </button>
                        <button onClick={() => {}} className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                            <Plus size={18} strokeWidth={3} /> <span className="hidden sm:inline">New Entry</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* List Data */}
            <div className="flex flex-col gap-6">
                {paginatedData.map((row, idx) => {
                    const isReady = row.status === 'READY';
                    const isInProgress = row.status === 'IN_PROGRESS';
                    const isDue = row.status === 'DUE_VERIFICATION';
                    const isCompleted = row.status === 'COMPLETED';
                    const isVerified = !!row.verifierName;

                    const entryQrData = `REHEATING_VERIFIED_RECORD\nID:${row.uuid}\nPRODUCT:${row.productName}\nBATCH:${row.batchNumber}\nSTART:${row.reheatStart || 'PENDING'}\nEND:${row.reheatCompleted || 'PENDING'}\nTEMP_INITIAL:${row.initialTemp || '--'}C\nTEMP_FINAL:${row.finalTemp || '--'}C\nAUTH:${row.verifierName || 'PENDING'}`;

                    return (
                        <div key={row.uuid} className={`bg-white rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col xl:flex-row group overflow-hidden ${isInProgress ? 'border-orange-400 shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm hover:border-orange-200'}`}>
                            {/* 1. IDENTITY BLOCK */}
                            <div className="p-6 md:p-8 border-b xl:border-b-0 xl:border-r border-slate-50 xl:w-[20%] shrink-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg ${isCompleted ? 'bg-emerald-600' : isInProgress ? 'bg-orange-600 animate-pulse' : isReady ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                                            {((currentPage - 1) * rowsPerPage + idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isDue ? 'bg-blue-50 text-blue-700 border-blue-100' : isInProgress ? 'bg-orange-50 text-orange-700 border-orange-100' : isReady ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600'}`}>
                                            {isVerified ? 'Verified' : isDue ? 'Due Verify' : isInProgress ? 'In Progress' : isReady ? 'Ready' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight mb-2 group-hover:text-indigo-600 transition-colors truncate">{row.productName}</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest mb-6">
                                    <Globe size={12} className="text-indigo-400" /> {row.unit} <ChevronRight size={8} /> {row.location}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1 shadow-inner">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Registry ID</span>
                                        <span className="text-[10px] font-black text-slate-800 font-mono tracking-tighter truncate">{row.batchNumber}</span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1 shadow-inner">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Recipe Node</span>
                                        <span className="text-[10px] font-black text-indigo-600 truncate">{row.standardRecipe}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. ANCESTRY BLOCK */}
                            <div className="px-8 py-6 xl:py-8 bg-slate-50/40 border-b xl:border-b-0 xl:border-r border-slate-50 xl:w-[20%] shrink-0">
                                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                    <History size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Process Ancestry</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0"><Snowflake size={14} className="text-blue-500" /></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-baseline mb-0.5"><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Thawing Entry</span><span className="text-[9px] font-bold text-slate-400">{row.thawTime.split(' ')[0]}</span></div>
                                            <div className="flex justify-between items-baseline"><span className="text-[10px] font-black text-slate-700">{row.thawTime.split(' ')[1]} {row.thawTime.split(' ')[2]}</span><span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">Cold Stable</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0"><Flame size={14} className="text-rose-500" /></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-baseline mb-0.5"><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Cooking Final</span><span className="text-[9px] font-bold text-slate-400">{row.cookTime.split(' ')[0]}</span></div>
                                            <div className="flex justify-between items-baseline"><span className="text-[10px] font-black text-slate-700">{row.cookTime.split(' ')[1]} {row.cookTime.split(' ')[2]}</span><span className="text-[9px] font-black text-rose-600">{row.cookTemp}°C</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0"><Droplets size={14} className="text-cyan-500" /></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-baseline mb-0.5"><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Cooling End</span><span className="text-[9px] font-bold text-slate-400">{row.coolTime.split(' ')[0]}</span></div>
                                            <div className="flex justify-between items-baseline"><span className="text-[10px] font-black text-slate-700">{row.coolTime.split(' ')[1]} {row.coolTime.split(' ')[2]}</span><span className="text-[9px] font-black text-cyan-600">{row.coolTemp}°C</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. QR CODE / DIGITAL ID */}
                            <div className="p-6 md:p-8 xl:w-[12%] border-b xl:border-b-0 xl:border-r border-slate-50 flex flex-col justify-center items-center bg-white shrink-0">
                                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-inner group/qr transition-all hover:bg-indigo-50 hover:border-indigo-200">
                                    <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                                        <QRCodeSVG value={entryQrData} size={64} level="H" includeMargin={false} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/qr:text-indigo-600 transition-colors">Registry ID</p>
                                    </div>
                                </div>
                            </div>

                            {/* 4. REHEATING DETAILS */}
                            <div className="p-6 md:p-8 flex flex-col xl:flex-row flex-1 gap-6 items-center">
                                <div className="grid grid-cols-2 xl:flex xl:flex-row gap-8 items-center flex-1 w-full xl:w-auto">
                                    <div className="space-y-4 xl:flex xl:flex-col xl:gap-2 xl:space-y-0">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Play size={10} fill="currentColor" /> Reheat Intake</span>
                                            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shadow-inner xl:min-w-[130px]">
                                                <span className={`text-xs font-black ${isReady ? 'text-slate-300 italic' : 'text-slate-800'}`}>{isReady ? '--:--' : formatTimeDisplay(row.reheatStart)}</span>
                                                <span className={`text-xs font-black font-mono ${isReady ? 'text-slate-300' : 'text-rose-500'}`}>{isReady ? '--' : row.initialTemp}°C</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><CheckCheck size={10} /> Reheat Final</span>
                                            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shadow-inner xl:min-w-[130px]">
                                                <span className={`text-xs font-black ${!isCompleted ? 'text-slate-300 italic' : 'text-slate-800'}`}>{!isCompleted ? '--:--' : formatTimeDisplay(row.reheatCompleted)}</span>
                                                <span className={`text-xs font-black font-mono ${!isCompleted ? 'text-slate-300' : 'text-emerald-600'}`}>{!isCompleted ? '--' : row.finalTemp}°C</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden group/gauge xl:h-full xl:w-[140px] xl:shrink-0">
                                        <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover/gauge:opacity-20 transition-opacity" />
                                        <Clock size={20} className="text-indigo-400 mb-2 group-hover/gauge:animate-spin-slow" />
                                        <span className="text-[8px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Cycle Lapse</span>
                                        <span className={`text-xl font-black tracking-tighter font-mono ${isReady ? 'text-slate-700' : 'text-white'}`}>{isReady ? '00:00' : formatLapse(row.reheatStart, row.reheatCompleted)}</span>
                                    </div>
                                    <div className="col-span-2 xl:col-span-1 xl:flex-1 space-y-4">
                                        <div className="flex justify-between items-center px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><User size={14} className="text-slate-400" /></div>
                                                <div className="min-w-0"><p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Operator</p><p className={`text-xs font-black uppercase truncate ${isReady ? 'text-slate-300 italic' : 'text-slate-800'}`}>{isReady ? 'Unassigned' : row.completedBy}</p></div>
                                            </div>
                                            <div className="flex items-center gap-3 border-l border-slate-50 pl-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Utensils size={14} className="text-slate-400" /></div>
                                                <div className="min-w-0"><p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Vessel</p><p className={`text-xs font-black uppercase truncate ${isReady ? 'text-slate-300 italic' : 'text-slate-800'}`}>{isReady ? 'TBD' : row.reheatingVessel}</p></div>
                                            </div>
                                        </div>
                                        {row.correctiveAction && (<div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2"><AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" /><p className="text-xs text-rose-800 font-bold italic leading-relaxed">"{row.correctiveAction}"</p></div>)}
                                    </div>
                                </div>
                            </div>

                            {/* 5. VERIFICATION BLOCK */}
                            <div className="mt-auto xl:mt-0 p-6 md:p-8 bg-slate-50/50 border-t xl:border-t-0 xl:border-l border-slate-100 xl:w-[18%] flex flex-col justify-center">
                                {isVerified ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg ring-4 ring-white shrink-0"><ShieldCheck size={24} strokeWidth={3} /></div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Authorization Node</p>
                                                <p className="text-xs font-black text-slate-800 uppercase truncate">{row.verifierName}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleExportSinglePDF(row)} className="w-full py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                                            <Download size={12}/> Export PDF
                                        </button>
                                    </div>
                                ) : isDue ? (
                                    <button className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"><ShieldCheck size={20} strokeWidth={3} /> Execute Verification</button>
                                ) : isInProgress ? (
                                    <button className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"><CheckCircle2 size={20} /> End Process Cycle</button>
                                ) : isReady ? (
                                    <button onClick={() => handleInitiateClick(row)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2"><Play size={24} fill="currentColor" /><span>Initiate Reheating</span></button>
                                ) : (
                                    <div className="py-4 text-center text-[10px] font-black uppercase text-slate-300 italic tracking-[0.3em]">Locked Node</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            <div className="bg-white border border-slate-200 px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 shadow-sm rounded-[2.5rem]">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest:">Display:</span>
                    <select 
                        value={rowsPerPage} 
                        onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    >
                        <option value="5">5 Units</option>
                        <option value="10">10 Units</option>
                        <option value="25">25 Units</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1.5 px-3">
                        {getPageNumbers().map((p, i) => (
                            typeof p === 'number' ? (
                                <button 
                                    key={i}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {p}
                                </button>
                            ) : <span key={i} className="px-1 text-slate-300 font-bold">...</span>
                        ))}
                    </div>

                    <button 
                        disabled={currentPage >= totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button 
                        disabled={currentPage >= totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(totalPages)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">
                    Total: {totalItems} Active Records
                </div>
            </div>

            {isInitiateModalOpen && selectedEntry && (
                <div className="fixed inset-0 z-150 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-300 h-[85vh] md:h-auto md:max-h-[94vh]">
                        <div className="px-10 py-10 bg-indigo-600 text-white flex justify-between items-center shrink-0 shadow-lg"><div className="flex items-center gap-5"><Play size={32}/><div><h3 className="text-2xl font-black uppercase tracking-tight leading-none">Process Initiation</h3><p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-2">Critical Regeneration Point (CCP)</p></div></div><button onClick={() => setIsInitiateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90"><X size={28}/></button></div>
                        <div className="p-10 space-y-8 bg-slate-50/20 overflow-y-auto custom-scrollbar flex-1">
                            <div className="bg-white border-2 border-indigo-100 p-6 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm"><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Product Node</p><h4 className="text-xl font-black text-slate-800 uppercase leading-none">{selectedEntry.productName}</h4><p className="text-[10px] font-mono font-bold text-indigo-500 mt-2">{selectedEntry.batchNumber}</p></div><div className="sm:text-right flex flex-col items-end"><div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-blue-200 mb-2">Ancestry Verified</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cooling End Temp</p><p className="text-2xl font-black text-indigo-600 tracking-tighter">{selectedEntry.coolTemp}°C</p></div></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Thermometer size={14} className="text-rose-500" /> Intake Temperature (°C)</label><div className="relative group"><input type="number" step="0.1" autoFocus value={tempInput} onChange={e => setTempInput(e.target.value)} className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-[1.75rem] text-2xl font-black text-slate-800 focus:outline-none focus:border-indigo-500 transition-all shadow-inner" placeholder="0.0" /><div className="absolute right-5 top-1/2 -translate-y-1/2"><button type="button" className="p-3 bg-slate-50 text-slate-300 hover:text-indigo-600 rounded-xl transition-all"><Camera size={20}/></button></div></div></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Utensils size={14} className="text-indigo-500" /> Reheating Vessel</label><select value={vesselInput} onChange={e => setVesselInput(e.target.value)} className="w-full h-[64px] px-5 bg-white border-2 border-slate-100 rounded-[1.75rem] text-sm font-black uppercase text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-inner appearance-none cursor-pointer"><option value="OVEN-01">OVEN-01 (REAR)</option><option value="OVEN-02">OVEN-02 (FRONT)</option><option value="COMBI-01">COMBI-MASTER</option><option value="RANGE-01">RANGE-01</option></select></div></div>
                            <div className="space-y-4"><div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-start gap-4"><Info className="text-blue-500 mt-0.5" size={18} /><p className="text-[11px] font-medium text-blue-700 leading-relaxed uppercase tracking-tight"><span className="font-black">Critical Limit:</span> Reheating must reach a minimum core temperature of <span className="font-black text-blue-900">75°C within 90 minutes</span> to maintain process integrity.</p></div><SignaturePad onSave={setSignature} initialData={signature} label="Operator Authority Commitment" /></div>
                        </div>
                        <div className="px-10 py-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0 pb-safe"><button onClick={() => setIsInitiateModalOpen(false)} className="px-10 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest order-2 sm:order-1">Discard</button><button disabled={!tempInput || !signature} onClick={commitInitiation} className={`px-16 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 order-1 sm:order-2 ${tempInput && signature ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}><CheckCheck size={20} /> Commit Initiation</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Database = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
);

export default ReheatingRecord;
