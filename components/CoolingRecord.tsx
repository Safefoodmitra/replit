"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  Snowflake, X, Search, Thermometer, Clock, Camera, Building2,
  CheckCheck, Zap, Calendar, ShieldCheck, PenTool,
  Plus, Database, RefreshCw, Download, 
  CheckCircle2, Globe, MapPin, Package, History,
  Info, ChevronRight, ChevronDown, ChevronUp,
  Trash2, Edit3, UserCheck, Loader2, Play,
  SlidersHorizontal, BarChart3, Activity, 
  CheckSquare, Square, Timer, ArrowRight,
  MoreVertical, FileText, Split, Eraser,
  ShieldAlert, ImageIcon, Check, ChevronsLeft, ChevronLeft, ChevronsRight, ClipboardCheck, MessageSquare,
  XCircle, ListChecks, Leaf, Beef,
  Wind,
  AlertCircle,
  QrCode,
  Waves,
  TrendingUp,
  Flame,
  TimerOff,
  PlusCircle,
  Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';
import Logo from './Logo';
import { CoolingRecordEntry, CoolingIssuedItem } from '../types';

const COOLING_METHODS = ["Blast Chiller", "Ice Bath", "Cold Water Bath", "Ambient Air (Pre-cool)"];
const CHILLER_IDS = ["BC-UNIT-01", "BC-UNIT-02", "BC-UNIT-03", "BC-MAIN-HALL"];
const PURPOSES = ["Reheating", "Cold Prep", "Service", "Portioning", "Storage", "Staff Meal", "Transfer"];

const statusColorMap: Record<string, string> = {
    'NOT_STARTED': 'bg-slate-100 text-slate-500 border-slate-200',
    'INITIAL': 'bg-blue-50 text-blue-700 border-blue-100',
    'STAGE_1': 'bg-orange-50 text-orange-700 border-orange-100',
    'COMPLETED': 'bg-emerald-50 text-emerald-700 border-emerald-100'
};

const isEntrySelectable = (e: CoolingRecordEntry) => 
    e.status === 'COMPLETED' && e.remainingQuantity === 0 && !e.isVerified;

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
        ctx?.beginPath(); ctx?.moveTo(x, y);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx?.lineTo(x, y); ctx?.stroke();
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
        <div className="space-y-3 text-left">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                <button type="button" onClick={clear} className="text-[9px] font-black text-rose-500 uppercase hover:underline flex items-center gap-1">
                    <Eraser size={10} /> Reset
                </button>
            </div>
            <div className="w-full h-24 bg-slate-50 border-2 border-slate-100 border-dashed rounded-2xl relative overflow-hidden shadow-inner cursor-crosshair">
                <canvas ref={canvasRef} width={500} height={96} className="w-full h-full" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw} />
                {!initialData && !isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <span className="text-3xl font-black uppercase -rotate-6 select-none tracking-tighter">Verified Commit</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const TelemetryCell = ({ time, temp, image, user, sign, comments, label, isPending, isDisabled, onAction, colorClass = "text-indigo-600", method, vesselId }: any) => {
    if (isPending) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed min-h-[160px] relative overflow-hidden group">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                    {isDisabled ? <Lock size={18} /> : <Clock size={18}/>}
                </div>
                {isDisabled ? (
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Locked</span>
                ) : (
                    <button onClick={onAction} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm active:scale-95">Log {label}</button>
                )}
                {isDisabled && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl">Complete Previous Step</div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm relative group min-h-[160px]">
             <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                    <span className="text-xs font-bold text-slate-700 font-mono mt-0.5">{new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-black ${colorClass} bg-slate-50 border border-slate-100`}>
                    {temp}°C
                </div>
             </div>

             {method && (
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 rounded border border-blue-100 w-fit">
                    {method === 'Blast Chiller' ? <Wind size={10} className="text-cyan-600"/> : <Snowflake size={10} className="text-blue-500"/>}
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tight truncate max-w-[100px]">{method} {vesselId ? `(${vesselId.split('-').pop()})` : ''}</span>
                 </div>
             )}

             {image && (
                 <div className="relative w-full h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group/img" onClick={() => window.open(image)}>
                     <img src={image} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="Evidence" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-colors">
                         <ImageIcon size={16} className="text-white opacity-0 group-hover/img:opacity-100 drop-shadow-md" />
                     </div>
                 </div>
             )}

             {comments && (
                 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] text-slate-500 italic leading-snug line-clamp-2" title={comments}>"{comments}"</p>
                 </div>
             )}

             <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
                 <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Operator</span>
                    <span className="text-[9px] font-black text-slate-700 truncate" title={user}>{user}</span>
                 </div>
                 {sign ? (
                     <div className="h-8 w-16 bg-slate-50 rounded border border-slate-100 p-0.5 flex items-center justify-center overflow-hidden">
                         <img src={sign} className="max-h-full max-w-full object-contain mix-blend-multiply opacity-80" alt="Sig" />
                     </div>
                 ) : (
                     <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100" title="No Signature">
                         <PenTool size={12} />
                     </div>
                 )}
             </div>
        </div>
    );
};

interface CoolingRecordProps {
  entries: CoolingRecordEntry[];
  setEntries: React.Dispatch<React.SetStateAction<CoolingRecordEntry[]>>;
  onIssueToReheating?: (coolEntry: CoolingRecordEntry, quantity: number) => void;
}

const CoolingRecord: React.FC<CoolingRecordProps> = ({ entries, setEntries, onIssueToReheating }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
    const [now, setNow] = useState(Date.now());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [expandedMobileId, setExpandedMobileId] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [activeModal, setActiveModal] = useState<'INITIAL' | 'STAGE_1' | 'FINAL' | 'VERIFY' | 'ISSUE' | 'BULK_VERIFY' | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<CoolingRecordEntry | null>(null);
    const [method, setMethod] = useState(COOLING_METHODS[0]);
    const [vessel, setVessel] = useState(CHILLER_IDS[0]);
    const [tempInput, setTempInput] = useState("");
    const [tempImg, setTempImg] = useState<string | null>(null);
    const [signature, setSignature] = useState("");
    const [stageComments, setStageComments] = useState("");
    const [verificationComments, setVerificationComments] = useState("");
    const [verificationSignature, setVerificationSignature] = useState("");
    const [stagedIssuances, setStagedIssuances] = useState<Array<{ id: string, quantity: string, purpose: string }>>([ { id: '1', quantity: "", purpose: PURPOSES[0] } ]);
    const cameraRef = useRef<HTMLInputElement>(null);

    const [docControlData] = useState<DocControlInfo>({
        docRef: 'COOL-RGST-03',
        version: '2.4',
        effectiveDate: new Date().toISOString().split('T')[0],
        approvedBy: 'Quality Assurance Director'
    });

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const total = entries.length;
        const avgDaily = (total / 7).toFixed(1); 
        return {
            pendingStart: entries.filter(e => e.status === 'NOT_STARTED').length,
            pendingMonitoring: entries.filter(e => e.status === 'INITIAL').length,
            pendingTerminal: entries.filter(e => e.status === 'STAGE_1').length,
            processActive: entries.filter(e => ['INITIAL', 'STAGE_1'].includes(e.status)).length,
            pendingSplit: entries.filter(e => e.status === 'COMPLETED' && e.remainingQuantity > 0).length,
            pendingVerification: entries.filter(e => e.status === 'COMPLETED' && e.remainingQuantity === 0 && !e.isVerified).length,
            completed: entries.filter(e => e.status === 'COMPLETED' && e.isVerified).length,
            avgDaily
        }
    }, [entries]);

    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = e.productName.toLowerCase().includes(searchTerm.toLowerCase()) || e.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesDashboard = true;
            if (dashboardFilter) {
                if (dashboardFilter === 'pendingStart') matchesDashboard = e.status === 'NOT_STARTED';
                else if (dashboardFilter === 'pendingMonitoring') matchesDashboard = e.status === 'INITIAL';
                else if (dashboardFilter === 'pendingTerminal') matchesDashboard = e.status === 'STAGE_1';
                else if (dashboardFilter === 'incomplete') matchesDashboard = ['INITIAL', 'STAGE_1'].includes(e.status);
                else if (dashboardFilter === 'pendingSplit') matchesDashboard = e.status === 'COMPLETED' && e.remainingQuantity > 0;
                else if (dashboardFilter === 'pendingVerification') matchesDashboard = e.status === 'COMPLETED' && e.remainingQuantity === 0 && !e.isVerified;
                else if (dashboardFilter === 'completed') matchesDashboard = e.status === 'COMPLETED' && e.isVerified;
            }

            let matchesDate = true;
            const recordDateStr = e.startTime || e.cookingEndTime;
            if (recordDateStr) {
                const recordDate = new Date(recordDateStr);
                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    const fromTime = fromDate.setHours(0,0,0,0);
                    if (recordDate.getTime() < fromTime) matchesDate = false;
                }
                if (dateTo && matchesDate) { 
                    const toDate = new Date(dateTo);
                    const toTime = toDate.setHours(23,59,59,999);
                    if (recordDate.getTime() > toTime) matchesDate = false;
                }
            }
            return matchesSearch && matchesDashboard && matchesDate;
        }).sort((a, b) => {
            const statusOrder = { 'INITIAL': 0, 'STAGE_1': 1, 'NOT_STARTED': 2, 'COMPLETED': 3 };
            return (statusOrder as any)[a.status] - (statusOrder as any)[b.status];
        });
    }, [entries, searchTerm, dashboardFilter, dateFrom, dateTo]);

    const totalItemsCount = filteredEntries.length;
    const totalPages = Math.ceil(totalItemsCount / rowsPerPage);
    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredEntries.slice(start, start + rowsPerPage);
    }, [filteredEntries, currentPage, rowsPerPage]);

    const formatTimeDuration = (start: string | undefined, end?: string) => {
        if (!start) return '--:--';
        const sTime = new Date(start).getTime();
        const eTime = end ? new Date(end).getTime() : now;
        const diff = Math.max(0, eTime - sTime);
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        const hStr = hours > 0 ? `${hours}h ` : '';
        return `${hStr}${mins}m ${secs}s`;
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const selectableEntries = useMemo(() => filteredEntries.filter(isEntrySelectable), [filteredEntries]);
    const areAllSelectableSelected = selectableEntries.length > 0 && selectableEntries.every(e => selectedIds.has(e.uuid));

    const handleSelectAll = () => {
        if (areAllSelectableSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(selectableEntries.map(e => e.uuid)));
        }
    };
    
    const openStageModal = (entry: CoolingRecordEntry, stage: typeof activeModal) => {
        setSelectedEntry(entry);
        setTempInput(""); setTempImg(null); setSignature(""); setStageComments("");
        setMethod(entry.method || COOLING_METHODS[0]);
        setVessel(entry.vesselId || CHILLER_IDS[0]);
        if (stage === 'ISSUE') setStagedIssuances([{ id: '1', quantity: "", purpose: PURPOSES[0] }]);
        if (stage === 'VERIFY') { setVerificationComments(""); setVerificationSignature(""); }
        setActiveModal(stage);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setTempImg(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const commitStageUpdate = () => {
        if (activeModal === 'VERIFY' || activeModal === 'BULK_VERIFY') {
            const targetIds = activeModal === 'BULK_VERIFY' ? Array.from(selectedIds) : (selectedEntry ? [selectedEntry.uuid] : []);
            const timestamp = new Date().toISOString();
            
            setEntries(prev => prev.map(e => {
                if (targetIds.includes(e.uuid)) { 
                    return { 
                        ...e, 
                        isVerified: true, 
                        verifierName: 'QA Auditor', 
                        verificationDate: timestamp, 
                        verifierSignature: verificationSignature, 
                        verificationComments: verificationComments 
                    }; 
                }
                return e;
            }));

            if (activeModal === 'BULK_VERIFY') setSelectedIds(new Set());
            setActiveModal(null);
            setSelectedEntry(null);
            return;
        }

        if (!selectedEntry) return;
        const timestamp = new Date().toISOString();
        const temp = parseFloat(tempInput);
        
        setEntries(prev => prev.map(e => {
            if (e.uuid !== selectedEntry.uuid) return e;
            
            if (activeModal === 'INITIAL') {
                return { ...e, status: 'INITIAL', method, vesselId: method === 'Blast Chiller' ? vessel : undefined, startTime: timestamp, initialTemp: temp, initialTempImg: tempImg || undefined, initiationSign: signature, initiatedBy: 'Chef Operator', operatorComments: stageComments, ambientLapse: formatTimeDuration(e.cookingEndTime, timestamp) };
            }
            
            if (activeModal === 'STAGE_1') {
                if (temp < 4) {
                     return {
                        ...e,
                        status: 'COMPLETED',
                        stage1Time: timestamp,
                        stage1Temp: temp,
                        stage1TempImg: tempImg || undefined,
                        stage1Sign: signature,
                        stage1By: 'Chef Operator',
                        stage1Comments: (stageComments ? stageComments + " " : "") + "[Target Reached]",
                        finalTime: timestamp,
                        finalTemp: temp,
                        finalTempImg: tempImg || undefined,
                        finalSign: signature,
                        finalBy: 'Chef Operator',
                        finalComments: "Cooling target (<4°C) reached in Watch Stage. Process finalized.",
                        shelfLifeExpiry: new Date(new Date(timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString()
                     };
                }
                return { ...e, status: 'STAGE_1', stage1Time: timestamp, stage1Temp: temp, stage1TempImg: tempImg || undefined, stage1Sign: signature, stage1By: 'Chef Operator', stage1Comments: stageComments };
            }
            
            if (activeModal === 'FINAL') { 
                return { ...e, status: 'COMPLETED', finalTime: timestamp, finalTemp: temp, finalTempImg: tempImg || undefined, finalSign: signature, finalBy: 'Chef Operator', finalComments: stageComments, shelfLifeExpiry: new Date(new Date(timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString() }; 
            }
            
            return e;
        }));
        
        setActiveModal(null); setSelectedEntry(null);
    };

    const handleIssueCooledFood = () => {
        if (!selectedEntry) return;
        const totalIssuing = stagedIssuances.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
        if (totalIssuing <= 0 || totalIssuing > selectedEntry.remainingQuantity) return;
        
        const newIssuedItems: CoolingIssuedItem[] = stagedIssuances.filter(i => parseFloat(i.quantity) > 0).map(i => ({ id: `iss-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, purpose: i.purpose, quantity: parseFloat(i.quantity), timestamp: new Date().toISOString(), user: 'HACCP Auditor' }));
        
        setEntries(prev => prev.map(e => { 
            if (e.uuid !== selectedEntry.uuid) return e; 
            return { ...e, remainingQuantity: e.remainingQuantity - totalIssuing, issued: [...(e.issued || []), ...newIssuedItems] }; 
        }));

        // Handshake Handoff Trigger
        stagedIssuances.forEach(iss => {
            if (iss.purpose === 'Reheating' && onIssueToReheating) {
                onIssueToReheating(selectedEntry, parseFloat(iss.quantity));
            }
        });

        setActiveModal(null); 
        setSelectedEntry(null); 
        setStagedIssuances([{ id: '1', quantity: "", purpose: PURPOSES[0] }]);
    };

    const generatePDFForEntries = async (targetEntries: CoolingRecordEntry[], filename: string) => {
        const printArea = document.createElement('div');
        printArea.style.position = 'fixed';
        printArea.style.top = '-9999px';
        printArea.style.left = '0';
        printArea.style.width = '1200px'; 
        printArea.style.backgroundColor = 'white';
        printArea.style.padding = '0';
        printArea.style.fontFamily = 'Arial, Helvetica, sans-serif';
        printArea.style.color = '#1e293b';

        const securityId = `CERT-COOL-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const downloadTimestamp = new Date().toLocaleString();

        let htmlContent = `
            <div style="padding: 50px; background: #fff; min-height: 1000px; display: flex; flex-direction: column; position: relative;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 120px; font-weight: 900; color: rgba(226, 232, 240, 0.4); pointer-events: none; text-transform: uppercase; z-index: 0; white-space: nowrap;">Controlled Record</div>
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
                                <div style="font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Cooling Control Registry (ISO 22:2018)</div>
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
                <div style="flex: 1; position: relative; z-index: 10;">
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px;">
                        <thead>
                            <tr style="background: #1e293b; color: white; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">
                                <th style="padding: 12px; text-align: left;">Registry Identity</th>
                                <th style="padding: 12px; text-align: left;">Cooling Telemetry</th>
                                <th style="padding: 12px; text-align: left;">Inventory Path</th>
                                <th style="padding: 12px; text-align: center;">Identity Passport (QR)</th>
                                <th style="padding: 12px; text-align: left;">Authorization</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${targetEntries.map(e => {
                                const qrString = `COOLING_VERIFIED_RECORD\nID:${e.uuid}\nPRODUCT:${e.productName}\nBATCH:${e.batchNumber}\nSTART:${e.startTime || 'PENDING'}\nEND:${e.finalTime || 'PENDING'}\nTEMP_INITIAL:${e.initialTemp || '--'}C\nTEMP_FINAL:${e.finalTemp || '--'}C\nAUTH:${e.verifierName || 'PENDING'}`;
                                return `
                                <tr style="font-size: 10px; border-bottom: 1px solid #e2e8f0; background: #fff;">
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 800; color: #0f172a;">${e.productName}</div>
                                        <div style="font-size: 8px; color: #64748b; margin-top: 4px; font-weight: 700;">BATCH: ${e.batchNumber}</div>
                                        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">MFG: ${e.mfgDate || 'N/A'} | EXP: ${e.expDate || 'N/A'}</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 700;">Method: ${e.method || 'Pending'}</div>
                                        <div style="font-size: 8px; color: #e11d48; margin-top: 4px; font-weight: 800;">Initial: ${e.initialTemp || '---'}°C</div>
                                        <div style="font-size: 8px; color: #10b981; margin-top: 2px; font-weight: 800;">Final: ${e.finalTemp || '---'}°C</div>
                                        <div style="font-size: 8px; color: #64748b; margin-top: 4px; font-weight: 700;">Lapse: ${formatTimeDuration(e.startTime, e.finalTime)}</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 700;">Total: ${e.quantity} ${e.storedUnit}</div>
                                        <div style="font-weight: 900; color: #4f46e5; margin-top: 2px;">Remaining: ${e.remainingQuantity} ${e.storedUnit}</div>
                                        <div style="font-size: 8px; color: #94a3b8; margin-top: 4px;">Unit: ${e.unitName}</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; text-align: center; vertical-align: middle;">
                                        <div style="width: 70px; height: 70px; margin: 0 auto; background: #f8fafc; padding: 5px; border-radius: 4px;">
                                            ${renderToString(<QRCodeSVG value={qrString} size={70} level="H" />)}
                                        </div>
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="margin-bottom: 8px;">
                                            <div style="font-weight: 800; color: #64748b; font-size: 8px;">OPERATOR</div>
                                            <div style="font-weight: 800; color: #0f172a;">${e.initiatedBy || 'N/A'}</div>
                                        </div>
                                        ${e.isVerified ? `
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
            const canvas = await html2canvas(printArea, { scale: 3.5, useCORS: true, backgroundColor: '#ffffff', logging: false });
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
        } catch (err) { console.error("PDF Export failed", err); } finally { document.body.removeChild(printArea); }
    };

    const handleGlobalExportPDF = async () => {
        if (filteredEntries.length === 0) return;
        setIsGeneratingPDF(true);
        const filename = `Complete_Cooling_Registry_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDFForEntries(filteredEntries, filename);
        setIsGeneratingPDF(false);
    };

    const handleExportSinglePDF = async (entry: CoolingRecordEntry) => {
        setIsGeneratingPDF(true);
        const filename = `Cooling_Record_${entry.uuid}_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDFForEntries([entry], filename);
        setIsGeneratingPDF(false);
    };

    return (
        <div className="flex flex-col h-full gap-6 p-4 md:p-0">
            <div className="flex overflow-x-auto snap-x hide-scrollbar xl:grid xl:grid-cols-12 gap-4 items-stretch pb-4 md:pb-0">
                <div className="snap-center shrink-0 w-[280px] md:w-auto xl:col-span-3 bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><RefreshCw size={18} /></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thermal Cycle</h4>
                    </div>
                    <div className="flex justify-between items-center px-2">
                        <button onClick={() => setDashboardFilter('pendingStart')} className={`flex flex-col items-center gap-1 transition-all ${dashboardFilter === 'pendingStart' ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><Play size={16} fill={dashboardFilter === 'pendingStart' ? 'currentColor' : 'none'} /><span className="text-lg font-black text-slate-900 leading-none">{stats.pendingStart}</span><span className="text-[8px] font-black uppercase">Start</span></button>
                        <div className="h-8 w-px bg-slate-100" /><button onClick={() => setDashboardFilter('pendingMonitoring')} className={`flex flex-col items-center gap-1 transition-all ${dashboardFilter === 'pendingMonitoring' ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><Waves size={16} /><span className="text-lg font-black text-slate-900 leading-none">{stats.pendingMonitoring}</span><span className="text-[8px] font-black uppercase">Watch</span></button>
                        <div className="h-8 w-px bg-slate-100" /><button onClick={() => setDashboardFilter('pendingTerminal')} className={`flex flex-col items-center gap-1 transition-all ${dashboardFilter === 'pendingTerminal' ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><Thermometer size={16} /><span className="text-lg font-black text-slate-900 leading-none">{stats.pendingTerminal}</span><span className="text-[8px] font-black uppercase">End</span></button>
                    </div>
                </div>
                <div className="snap-center shrink-0 w-[240px] md:w-auto xl:col-span-3 bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={18} /></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality Audit</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-1">
                        <button onClick={() => setDashboardFilter('incomplete')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${dashboardFilter === 'incomplete' ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}>
                            <span className="text-sm font-black text-slate-900 leading-none">{stats.processActive}</span>
                            <span className="text-[7px] font-black uppercase text-blue-600">Incomplete</span>
                        </button>
                        <button onClick={() => setDashboardFilter('pendingSplit')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${dashboardFilter === 'pendingSplit' ? 'bg-purple-50 border border-purple-200' : 'hover:bg-slate-50'}`}>
                            <span className="text-sm font-black text-slate-900 leading-none">{stats.pendingSplit}</span>
                            <span className="text-[7px] font-black uppercase text-purple-600">Unsplit</span>
                        </button>
                        <button onClick={() => setDashboardFilter('pendingVerification')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${dashboardFilter === 'pendingVerification' ? 'bg-amber-50 border-amber-200' : 'hover:bg-slate-50'}`}>
                            <span className="text-sm font-black text-slate-900 leading-none">{stats.pendingVerification}</span>
                            <span className="text-[7px] font-black uppercase text-amber-600">Due</span>
                        </button>
                        <button onClick={() => setDashboardFilter('completed')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${dashboardFilter === 'completed' ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-slate-50'}`}>
                            <span className="text-sm font-black text-slate-900 leading-none">{stats.completed}</span>
                            <span className="text-[7px] font-black uppercase text-emerald-600">Verified</span>
                        </button>
                    </div>
                </div>
                <div className="snap-center shrink-0 w-[280px] md:w-auto xl:col-span-4 bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><BarChart3 size={18} /></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Matrix</h4>
                    </div>
                    <div className="flex justify-around items-center px-2">
                        <div className="flex flex-col items-center gap-1"><Zap size={16} className="text-indigo-500" /><span className="text-lg font-black text-slate-900 leading-none">{stats.avgDaily}</span><span className="text-[8px] font-black uppercase">Records/Day</span></div>
                        <div className="h-8 w-px bg-slate-100" /><div className="flex flex-col items-center gap-1"><AlertCircle size={16} className="text-rose-400" /><span className="text-lg font-black text-slate-900 leading-none">0</span><span className="text-[8px] font-black uppercase">Alerts</span></div>
                        <div className="h-8 w-px bg-slate-100" /><div className="flex flex-col items-center gap-1"><TrendingUp size={16} className="text-emerald-500" /><span className="text-lg font-black text-slate-900 leading-none">98%</span><span className="text-[8px] font-black uppercase">Compliance</span></div>
                    </div>
                </div>
                <div className="snap-center shrink-0 w-[300px] md:w-auto xl:col-span-2 flex flex-col gap-3">
                    <div className="flex flex-1 gap-2">
                        <button onClick={handleGlobalExportPDF} disabled={isGeneratingPDF} className="flex-1 rounded-[1.75rem] border-2 bg-white border-slate-100 text-slate-400 hover:text-emerald-600 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1"><Download size={16} /><span className="text-[8px] font-black uppercase leading-none">Export</span></button>
                        <button onClick={() => { setSearchTerm(""); setDashboardFilter(null); }} className="flex-1 bg-white border-2 border-slate-100 text-slate-400 rounded-[1.75rem] hover:text-indigo-600 active:scale-95 flex flex-col items-center justify-center gap-1"><RefreshCw size={16} /><span className="text-[8px] font-black uppercase leading-none">Refresh</span></button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-2 md:p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-row items-center gap-2 mb-6 overflow-x-auto hide-scrollbar">
                <button onClick={handleSelectAll} disabled={selectableEntries.length === 0} className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${areAllSelectableSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-400'} ${selectableEntries.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {areAllSelectableSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                <div className="relative group flex-1 min-w-[140px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="Search..." className="w-full pl-9 pr-3 px-2 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-[10px] font-black outline-none focus:border-indigo-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 shadow-inner shrink-0">
                    <input type="date" className="bg-transparent text-[9px] font-bold text-slate-700 outline-none w-20 md:w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <span className="text-slate-300 text-[10px] font-bold">-</span>
                    <input type="date" className="bg-transparent text-[9px] font-bold text-slate-700 outline-none w-20 md:w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="ml-1 text-slate-400 hover:text-rose-500"><X size={12} /></button>}
                </div>
                {selectedIds.size > 0 && (
                     <button onClick={() => { setActiveModal('BULK_VERIFY'); setVerificationComments(""); setVerificationSignature(""); }} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 whitespace-nowrap">Verify ({selectedIds.size})</button>
                )}
            </div>

            <div className="flex flex-col gap-6">
                {paginatedEntries.length > 0 ? paginatedEntries.map((entry, idx) => {
                    const isNotStarted = entry.status === 'NOT_STARTED';
                    const isInitial = entry.status === 'INITIAL';
                    const isStage1 = entry.status === 'STAGE_1';
                    const isInProgress = isInitial || isStage1;
                    const isCompleted = entry.status === 'COMPLETED';
                    const isVerified = !!entry.isVerified;
                    const isSelected = selectedIds.has(entry.uuid);
                    const isMobileExpanded = expandedMobileId === entry.uuid;
                    const canSelect = isEntrySelectable(entry);
                    const qrData = JSON.stringify({ id: entry.uuid, product: entry.productName, batch: entry.batchNumber, status: entry.status, start: entry.startTime, final: entry.finalTime, verified: entry.isVerified });

                    return (
                        <div key={entry.uuid} className={`relative bg-white rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col xl:flex-row group overflow-hidden ${isInProgress ? 'border-orange-400 shadow-2xl scale-[1.01]' : isSelected ? 'border-indigo-600 bg-indigo-50/5 shadow-md' : 'border-slate-100 shadow-sm hover:border-orange-200'}`}>
                            {canSelect && (
                                <div className="absolute top-4 left-4 z-20" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => toggleSelection(entry.uuid)} className={`w-6 h-6 md:w-8 md:h-8 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-300 hover:border-indigo-300'}`}><Check size={14} strokeWidth={4} /></button>
                                </div>
                            )}
                            <div className="flex flex-col xl:flex-row items-stretch divide-y xl:divide-y-0 xl:divide-x divide-slate-100 w-full">
                                <div className={`p-4 md:p-6 xl:p-8 xl:w-[12%] border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col justify-center bg-slate-50/30 ${canSelect ? 'pl-12 md:pl-16' : ''}`}>
                                    <div className="hidden xl:flex flex-col gap-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md ${isInProgress ? 'bg-orange-600' : 'bg-slate-900'}`}>{((currentPage - 1) * rowsPerPage + idx + 1).toString().padStart(2, '0')}</div>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-wider ${statusColorMap[entry.status]}`}>{entry.status.replace('_', ' ')}</span>
                                        </div>
                                        <div className="space-y-0.5"><p className="text-[10px] font-black text-slate-800 uppercase truncate leading-none">{entry.locationName}</p><p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate">{entry.departmentName}</p><div className="h-px bg-slate-200/50 my-1" /><p className="text-[9px] font-black text-slate-400 uppercase truncate leading-none">{entry.unitName}</p><p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest truncate">{entry.regionName}</p></div>
                                    </div>
                                    <div className="xl:hidden flex flex-col gap-3"><div className="flex items-center justify-between pl-2"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg ${isInProgress ? 'bg-orange-600' : 'bg-slate-900'}`}>{((currentPage - 1) * rowsPerPage + idx + 1).toString().padStart(2, '0')}</div><div><h4 className="text-sm font-black text-slate-900 uppercase leading-none">{entry.unitName}</h4><p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wide">{entry.regionName}</p></div></div><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${statusColorMap[entry.status]}`}>{entry.status.replace('_', ' ')}</span></div><div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm"><div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><MapPin size={14} /></div><div className="flex flex-col"><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Operation Point</span><span className="text-[10px] font-black text-slate-700 uppercase">{entry.departmentName} <span className="text-slate-300">•</span> {entry.locationName}</span></div></div></div>
                                </div>
                                <div className="p-6 xl:w-[16%] flex flex-col justify-center gap-1.5"><div className="flex items-center gap-2 mb-1"><Package size={12} className="text-indigo-400" /><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Product Node</span></div><h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight line-clamp-2">{entry.productName}</h4><div className="flex flex-col gap-1 mt-2"><div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded border border-slate-100"><span className="text-[8px] font-black text-slate-400 uppercase">Batch</span><span className="text-[10px] font-mono font-bold text-slate-600">{entry.batchNumber}</span></div><div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded border border-slate-100"><span className="text-[8px] font-black text-slate-400 uppercase">Load</span><span className="text-[10px] font-black text-indigo-600">{entry.quantity} {entry.storedUnit}</span></div></div></div>
                                <div className="xl:hidden p-4 bg-slate-50 border-t border-b border-slate-100 flex items-center justify-between"><div className="flex-1 pr-4 flex gap-2 overflow-x-auto hide-scrollbar">{isNotStarted && (<button onClick={() => openStageModal(entry, 'INITIAL')} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 flex items-center justify-center gap-2"><Play size={14} fill="currentColor" strokeWidth={3} /> Start Cooling</button>)}{(isInitial || isStage1) && (<button onClick={() => openStageModal(entry, 'STAGE_1')} className="w-full py-3 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 flex items-center justify-center gap-2"><Timer size={14} /> Log Monitor</button>)}{isCompleted && (<>{entry.remainingQuantity === 0 && !isVerified ? (<button onClick={() => openStageModal(entry, 'VERIFY')} className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"><ShieldCheck size={14} /> Verify</button>) : isVerified ? (<div className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 whitespace-nowrap"><CheckCircle2 size={14} /> Verified</div>) : null}{entry.remainingQuantity > 0 && (<button onClick={() => openStageModal(entry, 'ISSUE')} className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase shadow-sm active:scale-95 flex items-center justify-center gap-2"><Split size={14} /> Split</button>)}</>)}</div><button onClick={() => setExpandedMobileId(isMobileExpanded ? null : entry.uuid)} className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-xl border transition-all ${isMobileExpanded ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}><ChevronDown size={20} className={`transition-transform duration-300 ${isMobileExpanded ? 'rotate-180' : ''}`} /></button></div>
                                <div className={`${isMobileExpanded ? 'block' : 'hidden xl:flex'} xl:contents`}>
                                    <div className="xl:hidden px-6 py-6 bg-[#0f172a] text-white flex items-center gap-5 border-b border-white/5 relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl" /><div className="w-24 h-24 bg-white p-1.5 rounded-2xl shadow-2xl relative z-10 shrink-0 flex items-center justify-center"><QRCodeSVG value={qrData} size={88} level="H" includeMargin={false} /></div><div className="min-w-0 relative z-10"><p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1.5">Authentic Registry Node</p><p className="text-base font-black uppercase tracking-tight leading-none mb-2">Digital Product ID</p><div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[7px] font-black uppercase border border-indigo-500">Scan to Audit</span><ShieldCheck size={12} className="text-emerald-400" /></div></div></div>
                                    <div className="p-4 xl:w-[16%] flex flex-col justify-center gap-3 border-b xl:border-b-0 border-slate-100 bg-slate-50/20 text-[9px]"><div className="space-y-1"><div className="flex items-center gap-1.5 font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1"><Flame size={10} className="text-orange-500" /> Cooking Trace</div><div className="grid grid-cols-2 gap-x-2 gap-y-1"><div className="flex flex-col"><span className="text-[8px] text-slate-400">Date</span><span className="font-bold text-slate-700">{new Date(entry.cookingEndTime).toLocaleDateString()}</span></div><div className="flex flex-col text-right"><span className="text-[8px] text-slate-400">Time</span><span className="font-bold text-slate-700">{new Date(entry.cookingEndTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div><div className="flex flex-col"><span className="text-[8px] text-slate-400">Temp</span><span className="font-black text-rose-500">{entry.cookTemp}°C</span></div><div className="flex flex-col text-right"><span className="text-[8px] text-slate-400">Lapse</span><span className="font-bold text-slate-600">{entry.cookingTimeLapse || '45m'}</span></div></div></div><div className="space-y-1 pt-1"><div className="flex items-center gap-1.5 font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1"><Snowflake size={10} className="text-blue-500" /> Thawing Trace</div><div className="space-y-1"><div className="flex justify-between"><span className="text-slate-500">Batch:</span> <span className="font-mono font-bold">{entry.batchNumber}</span></div><div className="flex justify-between"><span className="text-slate-500">Method:</span> <span className="font-bold">{entry.thawingMethod || 'N/A'}</span></div><div className="grid grid-cols-2 gap-1 bg-white p-1 rounded border border-slate-100"><div className="text-center border-r border-slate-100"><span className="block text-[7px] text-slate-400 uppercase">Start</span><span className="block font-bold">{entry.thawStartTemp ? `${entry.thawStartTemp}°C` : '-'}</span></div><div className="text-center"><span className="block text-[7px] text-slate-400 uppercase">Final</span><span className="block font-bold text-blue-600">{entry.thawFinalTemp ? `${entry.thawFinalTemp}°C` : '-'}</span></div></div><div className="flex justify-between text-[8px] text-slate-400"><span>MFD: {entry.mfgDate}</span><span>EXP: {entry.expDate}</span></div></div></div></div>
                                    
                                    {/* 1. INITIAL STAGE CELL */}
                                    <div className="p-0 xl:w-[13%] shrink-0 border-b xl:border-b-0 border-slate-100">
                                        <TelemetryCell 
                                            label="Initial" 
                                            time={entry.startTime} 
                                            temp={entry.initialTemp} 
                                            image={entry.initialTempImg} 
                                            user={entry.initiatedBy} 
                                            sign={entry.initiationSign} 
                                            comments={entry.operatorComments} 
                                            isPending={isNotStarted} 
                                            isDisabled={false} // Always allowed if pending
                                            onAction={() => openStageModal(entry, 'INITIAL')} 
                                            colorClass="text-rose-600" 
                                            method={entry.method} 
                                            vesselId={entry.vesselId} 
                                        />
                                    </div>
                                    
                                    {/* 2. WATCH STAGE CELL - DEACTIVATED IF INITIAL NOT STARTED */}
                                    <div className="p-0 xl:w-[13%] shrink-0 bg-slate-50/30 border-b xl:border-b-0 border-slate-100">
                                        <TelemetryCell 
                                            label="Watch" 
                                            time={entry.stage1Time} 
                                            temp={entry.stage1Temp} 
                                            image={entry.stage1TempImg} 
                                            user={entry.stage1By} 
                                            sign={entry.stage1Sign} 
                                            comments={entry.stage1Comments} 
                                            isPending={isNotStarted || isInitial} 
                                            isDisabled={isNotStarted} // Locked if Initial hasn't happened
                                            onAction={() => openStageModal(entry, 'STAGE_1')} 
                                            colorClass="text-orange-600" 
                                        />
                                    </div>
                                    
                                    {/* 3. TERMINAL STAGE CELL - DEACTIVATED IF WATCH NOT STARTED */}
                                    <div className="p-0 xl:w-[13%] shrink-0 border-b xl:border-b-0 border-slate-100">
                                        <TelemetryCell 
                                            label="Terminal" 
                                            time={entry.finalTime} 
                                            temp={entry.finalTemp} 
                                            image={entry.finalTempImg} 
                                            user={entry.finalBy} 
                                            sign={entry.finalSign} 
                                            comments={entry.finalComments} 
                                            isPending={isNotStarted || isInitial || isStage1} 
                                            isDisabled={isNotStarted || isInitial} // Locked if Initial/Watch haven't happened
                                            onAction={() => openStageModal(entry, 'FINAL')} 
                                            colorClass="text-emerald-700" 
                                        />
                                    </div>

                                    <div className="p-6 xl:w-[8%] flex flex-col justify-center gap-3 bg-slate-50/10 border-b xl:border-b-0 border-slate-100"><div className="space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-1"><div className="flex justify-between items-center mb-1"><span className="text-[8px] font-black text-slate-300 uppercase">Portions</span><span className="text-[10px] font-black text-indigo-600">{entry.remainingQuantity}/{entry.quantity}</span></div>{entry.issued.map(iss => (<div key={iss.id} className="bg-white border border-slate-100 rounded-lg p-1.5 shadow-xs text-center"><span className="text-[9px] font-black text-slate-800">{iss.quantity} KG</span><div className="text-[7px] text-slate-400 uppercase truncate">{iss.purpose}</div></div>))}{entry.issued.length === 0 && <div className="text-[8px] text-slate-300 italic text-center py-2">No Issues</div>}</div>{isCompleted && entry.remainingQuantity > 0 && (<button onClick={() => openStageModal(entry, 'ISSUE')} className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase shadow-md active:scale-95"><Split size={10} className="inline mr-1"/> Split</button>)}</div>
                                    <div className="hidden xl:flex p-6 xl:w-[12%] flex-col justify-center items-center bg-white shrink-0 border-r border-slate-50"><div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-inner group/qr transition-all hover:bg-indigo-50 hover:border-indigo-200"><div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100"><QRCodeSVG value={qrData} size={64} level="H" includeMargin={false} /></div><div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/qr:text-indigo-600 transition-colors">Registry ID</p></div></div></div>
                                    <div className="p-6 flex-1 flex flex-col justify-center xl:border-l border-slate-100">
                                        {isVerified ? (
                                            <div className="space-y-3 animate-in zoom-in-95 duration-300 flex flex-col items-center xl:items-end">
                                                <div className="w-full bg-emerald-50 border-2 border-emerald-500 rounded-[2rem] p-4 shadow-xl flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg ring-4 ring-white shrink-0"><ShieldCheck size={20} strokeWidth={3} /></div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Authorization Node</p>
                                                        <p className="text-xs font-black text-slate-800 uppercase truncate">{entry.verifierName}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleExportSinglePDF(entry)} className="w-full py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"><Download size={14}/> Export PDF</button>
                                            </div>
                                        ) : isCompleted ? (
                                            entry.remainingQuantity === 0 ? (
                                                <div className="p-5 text-center space-y-4 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-[2rem] w-full shadow-inner animate-in fade-in">
                                                    <ShieldAlert size={32} className="text-amber-500 mx-auto animate-pulse" />
                                                    <button onClick={() => openStageModal(entry, 'VERIFY')} className="w-full py-3.5 bg-amber-400 text-amber-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-500 active:scale-95 transition-all">Authorize Log</button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center opacity-40 grayscale py-10 scale-90">
                                                    <Split size={48} className="mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-[150px]">Portioning Pending for Authorization</p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="h-full flex items-center justify-center opacity-10 grayscale pointer-events-none scale-110"><ShieldAlert size={48} /></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-24 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white"><Package size={64} className="mx-auto mb-4 opacity-10" /><p className="text-sm font-black uppercase tracking-[0.2em]">Zero Process Hits</p></div>
                )}
            </div>

            {/* Pagination View */}
            <div className="bg-white border border-slate-200 px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 shadow-sm rounded-[2.5rem]">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest:">Display:</span>
                    <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }} className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-black rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"><option value="5">5 Units</option><option value="10">10 Units</option><option value="25">25 Units</option></select>
                </div>
                <div className="flex items-center gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronsLeft size={16} /></button>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"><ChevronLeft size={16} /></button>
                    <div className="px-6 flex flex-col items-center"><span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Page {currentPage}</span><span className="text-[8px] font-bold text-slate-400 uppercase">of {totalPages}</span></div>
                    <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"><ChevronRight size={16} /></button>
                    <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronsRight size={16} /></button>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">System Status: {filteredEntries.length} Active Records</div>
            </div>

            {/* MODALS */}
            {activeModal && activeModal !== 'VERIFY' && activeModal !== 'BULK_VERIFY' && activeModal !== 'ISSUE' && selectedEntry && (
                <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 h-[90vh] sm:h-auto sm:max-h-[90vh]">
                        <div className="sm:hidden w-full flex justify-center pt-3 pb-1 bg-indigo-600"><div className="w-12 h-1.5 bg-white/20 rounded-full" /></div>
                        <div className={`px-6 py-6 md:px-10 md:py-8 text-white flex justify-between items-center shrink-0 shadow-lg ${activeModal === 'FINAL' ? 'bg-emerald-600' : activeModal === 'STAGE_1' ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">{activeModal === 'INITIAL' ? <Play size={28} fill="currentColor" strokeWidth={3} /> : <Timer size={28} />}</div>
                                <div><h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">{activeModal === 'INITIAL' ? 'Start Cooling' : activeModal === 'STAGE_1' ? 'Watch Cycle' : 'End Cooling'}</h3><p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Registry Node Sync Point</p></div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={28} strokeWidth={3} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/20 custom-scrollbar text-left pb-safe">
                            <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Process Item</p><h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none truncate">{selectedEntry.productName}</h4><div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50"><span className="text-[10px] font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">#{selectedEntry.batchNumber}</span><div className="flex items-center gap-1.5"><Thermometer size={14} className="text-rose-500"/><span className="text-xs font-black text-rose-600">{selectedEntry.cookTemp}°C <span className="text-[9px] font-bold text-slate-400">Cooked</span></span></div></div></div>
                            <div className="space-y-6">
                                {activeModal === 'INITIAL' && (
                                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cooling Strategy</label><select value={method} onChange={e => setMethod(e.target.value)} className="w-full h-14 px-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-500 shadow-sm">{COOLING_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>{method === 'Blast Chiller' && (<div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chiller Unit ID</label><select value={vessel} onChange={e => setVessel(e.target.value)} className="w-full h-14 px-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-500 shadow-sm">{CHILLER_IDS.map(v => <option key={v}>{v}</option>)}</select></div>)}</div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Thermometer size={14} className="text-rose-500" /> Core Temperature Reading (°C) <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1"><input autoFocus type="number" step="0.1" className="w-full h-16 md:h-20 bg-white border-2 border-slate-100 rounded-2xl text-4xl font-black text-slate-800 focus:outline-none focus:border-indigo-500 transition-all shadow-inner text-center" placeholder="0.0" value={tempInput} onChange={e => setTempInput(e.target.value)} /><span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">°C</span></div>
                                        <button type="button" onClick={() => cameraRef.current?.click()} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl transition-all border-2 shrink-0 ${tempImg ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-100 text-slate-400'}`}><Camera size={28} /></button>
                                        <input type="file" ref={cameraRef} capture="environment" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </div>
                                    {tempImg && <div className="mt-2 relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-sm animate-in zoom-in-95"><img src={tempImg} className="w-full h-full object-cover" /><button type="button" onClick={() => setTempImg(null)} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1"><X size={10} strokeWidth={4}/></button></div>}
                                </div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><MessageSquare size={14} className="text-indigo-500" /> Operational Remarks</label><textarea className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-medium focus:border-indigo-400 outline-none resize-none h-24 shadow-inner" placeholder="Enter findings..." value={stageComments} onChange={e => setStageComments(e.target.value)} /></div>
                                <SignaturePad onSave={setSignature} label="Lead Operator Authority Signature" />
                            </div>
                        </div>
                        <div className="px-10 py-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-end gap-3 shrink-0 pb-safe"><button onClick={() => setActiveModal(null)} className="px-10 py-4 text-[11px] font-black uppercase text-slate-400 hover:text-rose-600 transition-all bg-slate-50 rounded-xl order-2 md:order-1">Discard</button><button disabled={!tempInput || !signature} onClick={commitStageUpdate} className={`px-16 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98] order-1 md:order-2 ${tempInput && signature ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-100 text-slate-200 cursor-not-allowed'}`}>Commit Telemetry</button></div>
                    </div>
                </div>
            )}

            {(activeModal === 'VERIFY' || activeModal === 'BULK_VERIFY') && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95">
                        <div className="px-10 py-8 bg-emerald-600 text-white flex justify-between items-center shrink-0 shadow-lg">
                            <div className="flex items-center gap-5">
                                <ShieldCheck size={32} strokeWidth={3} />
                                <div><h3 className="text-xl font-black uppercase tracking-tight">Authority Verification</h3><p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mt-1">Registry Validation Sync ({activeModal === 'BULK_VERIFY' ? selectedIds.size : '1'} Record)</p></div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={28} strokeWidth={3} /></button>
                        </div>
                        <div className="p-10 space-y-8 bg-slate-50/20 text-left overflow-y-auto max-h-[60vh] custom-scrollbar">
                            {!selectedEntry && activeModal === 'BULK_VERIFY' && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {Array.from(selectedIds).map(id => {
                                        const e = entries.find(x => x.uuid === id);
                                        return <span key={id} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-800 uppercase shadow-sm">{e?.productName}</span>
                                    })}
                                </div>
                            )}
                            {selectedEntry && (
                                <div className="bg-white border-2 border-emerald-100 p-6 rounded-3xl shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Process Node</p>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none truncate">{selectedEntry.productName}</h4>
                                    <p className="text-[10px] font-mono font-bold text-emerald-600 mt-2 uppercase bg-emerald-50 px-2 py-0.5 rounded w-fit">#{selectedEntry.batchNumber}</p>
                                </div>
                            )}
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Verification Audit Notes</label><textarea className="w-full h-32 p-5 bg-white border-2 border-slate-100 rounded-3xl text-sm font-medium outline-none focus:border-emerald-500 shadow-inner resize-none transition-all" placeholder="Enter findings or feedback..." value={verificationComments} onChange={e => setVerificationComments(e.target.value)} /></div>
                            <SignaturePad onSave={setVerificationSignature} initialData={verificationSignature} label="QA Verifier Authority Signature" />
                        </div>
                        <div className="px-10 py-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0 pb-safe"><button onClick={() => setActiveModal(null)} className="px-10 py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest order-2 sm:order-1 transition-colors">Cancel</button><button disabled={!verificationSignature} onClick={commitStageUpdate} className={`px-16 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 order-1 sm:order-2 ${verificationSignature ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700' : 'bg-slate-100 text-slate-200 cursor-not-allowed'}`}>Finalize Authorization</button></div>
                    </div>
                </div>
            )}

            {activeModal === 'ISSUE' && selectedEntry && (
                <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 h-[90vh] sm:h-auto sm:max-h-[90vh]">
                        <div className="sm:hidden w-full flex justify-center pt-3 pb-1 bg-[#0f172a]"><div className="w-12 h-1.5 bg-white/20 rounded-full" /></div>
                        <div className="px-10 py-8 bg-[#0f172a] text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Split size={24}/></div>
                                <div><h3 className="text-xl font-black uppercase tracking-tight">Cooled Batch Assignment</h3><p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Split Purpose Logic</p></div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={28} strokeWidth={3} /></button>
                        </div>
                        <div className="p-8 space-y-6 text-left flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20">
                            <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Registry</p>
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{selectedEntry.productName}</h4>
                                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase">Available Weight</p><p className="text-xl font-black text-indigo-600">{selectedEntry.remainingQuantity.toFixed(1)} {selectedEntry.storedUnit}</p></div>
                                    <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase">Total Intake</p><p className="text-sm font-bold text-slate-800">{selectedEntry.quantity} {selectedEntry.storedUnit}</p></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {stagedIssuances.map((s, idx) => (
                                    <div key={s.id} className="bg-white p-5 rounded-3xl border-2 border-slate-100 space-y-4 relative group/s animate-in slide-in-from-left-2">
                                        {stagedIssuances.length > 1 && <button onClick={() => setStagedIssuances(stagedIssuances.filter(x => x.id !== s.id))} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose</label><select className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-indigo-400 appearance-none cursor-pointer" value={s.purpose} onChange={e => setStagedIssuances(stagedIssuances.map(x => x.id === s.id ? { ...x, purpose: e.target.value } : x))}>{PURPOSES.map(p => <option key={p}>{p}</option>)}</select></div>
                                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity ({selectedEntry.storedUnit})</label><input type="number" step="0.1" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-indigo-500" placeholder="0.0" value={s.quantity} onChange={e => setStagedIssuances(stagedIssuances.map(x => x.id === s.id ? { ...x, quantity: e.target.value } : x))} /></div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setStagedIssuances([...stagedIssuances, { id: Date.now().toString(), quantity: "", purpose: PURPOSES[0] }])} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest"><PlusCircle size={18} /> Add Another Distribution</button>
                            </div>
                        </div>
                        <div className="px-10 py-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-end gap-3 shrink-0 pb-safe"><button onClick={() => setActiveModal(null)} className="px-10 py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest order-2 sm:order-1 transition-colors">Discard</button><button onClick={handleIssueCooledFood} className="px-16 py-4 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] order-1 md:order-2 flex items-center justify-center gap-3">Commit Portioning</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoolingRecord;