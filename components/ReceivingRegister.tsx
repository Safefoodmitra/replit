"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Truck, 
    Plus, 
    Search, 
    ShieldCheck, 
    Clock, 
    CheckCheck, 
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Thermometer,
    X,
    CheckCircle2,
    User,
    Hash,
    PenTool,
    Package,
    ClipboardCheck,
    Signature,
    Camera,
    Check,
    Eraser,
    Trash2,
    Warehouse,
    ClipboardList,
    Shield as ShieldIcon,
    Timer,
    UserCheck,
    Loader2,
    Layers,
    Calendar,
    Globe,
    SlidersHorizontal,
    Activity,
    ChevronsLeft,
    ChevronsRight,
    GitPullRequest,
    Link as LinkIcon,
    CheckSquare,
    Info,
    Tag,
    Filter,
    FileText,
    Star,
    FileSearch,
    FileDigit,
    MapPin,
    AlertCircle,
    ImageIcon,
    Zap,
    Download,
    TrendingUp,
    FileUp,
    AlertTriangle,
    MoreVertical,
    Edit3,
    FileEdit,
    ExternalLink,
    Save,
    QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ReceivingEntry, Supplier, RawMaterial } from '../types';
import { renderToString } from 'react-dom/server';
import Logo from './Logo';
import html2canvas from 'html2canvas';

// --- ISO 22000 Types ---
interface DocControlInfo {
    docRef: string;
    version: string;
    effectiveDate: string;
    approvedBy: string;
}

// --- Global Helpers ---

const createEmptyMaterialItem = () => ({
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    materialName: "",
    brand: "",
    batchNo: "",
    mfgDate: "",
    expDate: "",
    orderedQty: "",
    receivedQty: "",
    unit: "KG",
    temperature: "",
    tempImage: null,
    coaFiles: [],
    selectedCoaId: null,
    hasCoa: false,
    discrepancyType: "Shortfall", 
    shortfallReason: "",
    shelfLifeStr: "",
    storageType: "" 
});

const calculateShelfLife = (mfgDateStr: string, expiryDateStr: string) => {
    if (!mfgDateStr || !expiryDateStr) return { days: 0, hours: 0, percentage: 0 };
    const start = new Date(mfgDateStr + 'T00:00:00');
    const end = new Date(expiryDateStr + 'T23:59:59');
    const now = new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return { days: -1, hours: 0, percentage: 0 };
    const totalMs = end.getTime() - start.getTime(); 
    const remainingMs = end.getTime() - now.getTime(); 
    if (remainingMs <= 0) return { days: 0, hours: 0, percentage: 0 };
    const days = Math.floor(remainingMs / (24 * 3600000));
    const hours = Math.floor((remainingMs % (24 * 3600000)) / 3600000);
    const percentage = totalMs > 0 ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)) : 0;
    return { days, hours, percentage };
};

const addDurationToDate = (startDateStr: string, shelfLifeStr: string): string => {
    if (!startDateStr || !shelfLifeStr || shelfLifeStr === '-' || shelfLifeStr === 'None') return '';
    try {
        const date = new Date(startDateStr + 'T00:00:00');
        if (isNaN(date.getTime())) return '';
        const daysMatch = shelfLifeStr.match(/(\d+)\s*Days/i);
        const hoursMatch = shelfLifeStr.match(/(\d+)\s*Hours/i);
        const days = daysMatch ? parseInt(daysMatch[1]) : 0;
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        if (days === 0 && hours === 0) return '';
        date.setHours(date.getHours() + (days * 24) + hours);
        return date.toISOString().split('T')[0];
    } catch (e) { return ''; }
};

const MOCK_VENDORS = ["Quality Meats Ltd.", "DairyBest", "Fresh Produce Inc.", "Ocean Harvest", "Baker's Choice"];
const MOCK_PRODUCTS: Record<string, string[]> = {
    "Quality Meats Ltd.": ["Beef Tenderloin", "Chicken Breast", "Lamb Shovels"],
    "DairyBest": ["Whole Milk", "Greek Yogurt", "Cheddar Cheese"],
    "Fresh Produce Inc.": ["Organic Tomatoes", "Baby Spinach", "Bell Peppers"],
    "Ocean Harvest": ["Salmon Fillet", "Tiger Prawns", "Sea Bass"],
    "Baker's Choice": ["All Purpose Flour", "Dry Yeast", "Caster Sugar"],
    "All": ["Beef Tenderloin", "Chicken Breast", "Lamb Shovels", "Whole Milk", "Greek Yogurt", "Cheddar Cheese", "Organic Tomatoes", "Baby Spinach", "Bell Peppers", "Salmon Fillet", "Tiger Prawns", "Sea Bass", "All Purpose Flour", "Dry Yeast", "Caster Sugar"]
};

const DEFAULT_SIGN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAYCAYAAAA9O98vAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAbUlEQVR4nO3SQRGAQAwEwbV/Z6YCPvSABmRBDpCExL1mZp7OnNnu7p6ZeTpzZru7e2bm6cyZ7e7umZmnM2e2u7tnZp7OnNnu7v4Bq89Xv7O5v28AAAAASUVORK5CYII=";

const GENERATED_DATA: ReceivingEntry[] = Array.from({ length: 40 }).map((_, i) => {
    const vendor = MOCK_VENDORS[i % MOCK_VENDORS.length];
    const products = MOCK_PRODUCTS[vendor] || MOCK_PRODUCTS.All;
    const product = products[i % products.length];
    const status = i % 10 === 0 ? 'Rejected' : i % 5 === 0 ? 'Partial' : 'Approved';
    return {
        id: (i + 1).toString(),
        rec: `REC-${89000 + i}`,
        date: `2025-05-${(i % 28) + 1}`.padStart(10, '0'),
        time: `${(i % 12) + 1}:00 ${i % 2 === 0 ? 'AM' : 'PM'}`,
        materialName: product,
        brand: `${vendor} Premium`,
        vendor: vendor,
        invoiceNo: `INV-${vendor.substring(0, 2).toUpperCase()}-${400 + i}`,
        poNumber: `PO-${7700 + i}`,
        batchNo: `BN-${100 + i}-X`,
        orderedQty: 50,
        receivedQty: status === 'Approved' ? 50 : 40,
        unit: 'KG',
        mfgDate: '2025-04-01',
        expDate: '2025-06-30',
        temperature: i % 4 === 0 ? 4.2 : 3.8,
        tempImageSrc: "https://images.unsplash.com/photo-1584269656462-2334cb2823c1?q=80&w=200", 
        condition: status === 'Rejected' ? 'Damaged' : 'Good',
        qcStatus: status === 'Rejected' ? 'Rejected' : 'Verified',
        status: status,
        receiver: 'Michael Brown',
        receiverSignature: DEFAULT_SIGN,
        verified: i % 3 === 0,
        verifiedBy: i % 3 === 0 ? 'Jane Smith (QA Mgr)' : undefined,
        verificationComments: i % 3 === 0 ? 'Standard intake verified.' : undefined,
        signatureData: i % 3 === 0 ? DEFAULT_SIGN : undefined,
        vendorEval: 80 + (i % 20),
        attachments: { formE: i % 3 === 0, invoice: i % 2 === 0, coa: i % 4 === 0 }
    };
});

// --- Sub-Components ---

const SignaturePad: React.FC<{ onCapture: (data: string) => void, onClear: () => void, initialData?: string }> = ({ onCapture, onClear, initialData }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current?.querySelector('canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (initialData) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = initialData;
        }
    }, [initialData]);

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        const canvas = canvasRef.current?.querySelector('canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx?.beginPath(); ctx?.moveTo(x, y);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current?.querySelector('canvas');
        const ctx = canvas?.getContext('2d');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx?.lineTo(x, y); ctx?.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current?.querySelector('canvas');
        if (canvas) onCapture(canvas.toDataURL());
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <PenTool size={12} /> Digital Signature
                </label>
                <button type="button" onClick={() => {
                    const canvas = canvasRef.current?.querySelector('canvas');
                    const ctx = canvas.getContext('2d');
                    if (canvas) ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    onClear();
                }} className="text-[9px] font-black text-rose-500 hover:underline flex items-center gap-1"><Eraser size={10} /> Reset</button>
            </div>
            <div ref={canvasRef} className="w-full h-24 bg-slate-50 border-2 border-slate-100 border-dashed rounded-2xl relative overflow-hidden shadow-inner cursor-crosshair">
                <canvas width={500} height={96} className="w-full h-full" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw} />
                {!isDrawing && !initialData && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <span className="text-3xl font-black uppercase -rotate-12 select-none tracking-tighter">Sign to verify</span>
                    </div>
                )}
            </div>
        </div>
    );
};

interface SearchSelectProps {
    label: string;
    options: string[];
    value: string;
    onChange: (val: string) => void;
    icon?: React.ReactNode;
    placeholder?: string;
    required?: boolean;
    secondaryLabels?: Record<string, string>;
}

const SearchSelect: React.FC<SearchSelectProps> = ({ label, options, value, onChange, icon, placeholder, required, secondaryLabels }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const filtered = useMemo(() => options.filter(o => o.toLowerCase().includes(search.toLowerCase())), [options, search]);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="relative" ref={containerRef}>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block mb-2">{label} {required && <span className="text-rose-500">*</span>}</label>
            <div onClick={() => setIsOpen(!isOpen)} className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-3xl text-xs font-black focus:outline-none flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                    {icon && <div className="text-slate-300">{icon}</div>}
                    <span className={`truncate ${value ? 'text-slate-900' : 'text-slate-300'}`}>{value || placeholder || `Select ${label}...`}</span>
                </div>
                <ChevronDown size={18} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-72">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/80 sticky top-0">
                        <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-400 shadow-inner" placeholder={`Search ${label.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} /></div>
                    </div>
                    <div className="overflow-y-auto p-1 custom-scrollbar">
                        {filtered.map(opt => (
                            <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }} className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors rounded-xl">
                                <div className="min-w-0 flex flex-col"><span className="text-xs font-black text-slate-800 uppercase group-hover:text-indigo-600 truncate">{opt}</span>{secondaryLabels?.[opt] && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate">{secondaryLabels[opt]}</span>}</div>
                                {value === opt && <Check size={14} className="text-indigo-600" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface ReceivingCardProps {
    entry: ReceivingEntry;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    isExpanded: boolean;
    onToggle: () => void;
    onVerify: () => void;
    onEdit: () => void;
    onDownload: () => void;
}

const ReceivingCard: React.FC<ReceivingCardProps> = ({ entry, index, isSelected, onSelect, isExpanded, onToggle, onVerify, onEdit, onDownload }) => {
    const bsl = calculateShelfLife(entry.mfgDate, entry.expDate);
    const statusColorMap = {
        'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'Partial': 'bg-amber-50 text-amber-700 border-amber-100',
        'Rejected': 'bg-rose-50 text-rose-700 border-rose-100'
    };

    const qrData = useMemo(() => {
        return `REC ID: ${entry.rec}\nBATCH: ${entry.batchNo}\nINV: ${entry.invoiceNo}\nPRODUCT: ${entry.materialName}\nBRAND: ${entry.brand}\nVENDOR: ${entry.vendor}\nQTY ORD: ${entry.orderedQty}\nQTY REC: ${entry.receivedQty}\nUNIT: ${entry.unit}\nTEMP: ${entry.temperature}°C\nCOND: ${entry.condition}\nQC: ${entry.qcStatus}\nSTATUS: ${entry.status}\nRECEIVER: ${entry.receiver}\nVERIFIED: ${entry.verified ? 'YES (' + entry.verifiedBy + ')' : 'PENDING'}`;
    }, [entry]);

    return (
        <div className={`bg-white rounded-[2.5rem] md:rounded-[3rem] border-2 transition-all duration-300 overflow-hidden ${isSelected ? 'border-indigo-600 bg-indigo-50/5 shadow-lg' : 'border-slate-100 hover:border-indigo-200 shadow-sm'} ${entry.verified ? 'opacity-90' : ''}`}>
            
            {/* Desktop Table View Layout */}
            <div className="hidden lg:grid lg:grid-cols-11 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-[140px]">
                <div className="p-4 flex flex-col justify-center gap-2 bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        {!entry.verified && (
                            <button onClick={onSelect} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 hover:border-indigo-400'}`}>
                                {isSelected && <Check size={12} strokeWidth={4} />}
                            </button>
                        )}
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter truncate leading-none">Unit Alpha</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <MapPin size={10} className="text-slate-300" />
                        <span className="truncate">North America</span>
                    </div>
                    <div className="mt-1 text-[8px] font-mono text-slate-300 font-bold">#{entry.rec}</div>
                </div>

                <div className="p-4 flex flex-col justify-center gap-2 bg-white">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-700"><Calendar size={10} className="text-indigo-400" /> {entry.date}</div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-700"><Clock size={10} className="text-indigo-400" /> {entry.time}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase truncate" title={entry.vendor}>{entry.vendor}</div>
                    <span className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase border ${statusColorMap[entry.status as keyof typeof statusColorMap] || 'bg-slate-50 text-slate-500'}`}>{entry.status}</span>
                </div>

                <div className="p-4 flex flex-col justify-center gap-1.5 bg-slate-50/20">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate leading-tight mb-0.5" title={entry.materialName}>{entry.materialName}</h4>
                    <div className="text-[9px] font-mono font-bold text-slate-400 truncate">Batch: {entry.batchNo}</div>
                    <div className="grid grid-cols-1 gap-0.5 text-[9px] text-slate-500"><div className="flex items-center gap-1">MFG: <span className="text-slate-700 font-bold">{entry.mfgDate}</span></div><div className="flex items-center gap-1">EXP: <span className="text-rose-600 font-bold">{entry.expDate}</span></div></div>
                    {bsl && bsl.days !== -1 && (<div className="text-[8px] font-black text-indigo-600 bg-white border border-indigo-100 px-1.5 py-0.5 rounded uppercase w-fit mt-0.5">Life: {bsl.days}d {bsl.hours}h</div>)}
                </div>

                <div className="p-4 flex flex-col justify-center items-center gap-1.5 bg-white">
                    <div className="w-16 h-16 border-2 border-slate-50 rounded-xl flex items-center justify-center p-1.5 shadow-inner bg-white">
                        <QRCodeSVG value={qrData} size={50} level="H" includeMargin={false} />
                    </div>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Digital ID</span>
                </div>

                <div className="p-4 flex flex-col justify-center gap-2 bg-slate-50/20">
                    <div className="text-[9px] font-black text-slate-700 truncate leading-none mb-1">INV: {entry.invoiceNo}</div>
                    <div className="text-[8px] font-bold text-slate-400 truncate leading-none mb-2">PO: {entry.poNumber || 'N/A'}</div>
                    <div className="space-y-1">{[{ label: 'Invoice', status: entry.attachments.invoice }, { label: 'Form E', status: entry.attachments.formE }, { label: 'COA Cert', status: entry.attachments.coa }].map((doc, idx) => (<div key={idx} className="flex items-center justify-between gap-2"><span className="text-[8px] font-bold text-slate-400 uppercase">{doc.label}</span><div className="flex items-center gap-1"><span className={`text-[8px] font-black px-1 rounded uppercase ${doc.status ? 'text-emerald-600' : 'text-slate-300'}`}>{doc.status ? 'Yes' : 'No'}</span>{doc.status && <button className="p-0.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"><FileSearch size={10} /></button>}</div></div>))}</div>
                </div>

                <div className="p-4 flex flex-col justify-center gap-2 bg-white">
                    <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100"><span className="text-[8px] font-black text-slate-400 uppercase">Ordered</span><span className="text-xs font-black text-slate-700">{entry.orderedQty} <span className="text-[8px] opacity-40">{entry.unit}</span></span></div>
                    <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100"><span className="text-[8px] font-black text-slate-400 uppercase">Accepted</span><span className={`text-xs font-black ${entry.status === 'Partial' ? 'text-amber-600' : 'text-emerald-600'}`}>{entry.receivedQty} <span className="text-[8px] opacity-40">{entry.unit}</span></span></div>
                </div>

                <div className="p-4 flex flex-col justify-center items-center gap-2 bg-slate-50/20">
                    <div className="flex flex-col items-center"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Temp</span><div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100"><Thermometer size={10} className="text-blue-500" /><span className="text-xs font-black text-blue-700 font-mono leading-none">{entry.temperature}°C</span></div></div>
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative cursor-pointer hover:border-indigo-400 transition-all shadow-inner">{entry.tempImageSrc ? <img src={entry.tempImageSrc} className="w-full h-full object-cover" onClick={() => window.open(entry.tempImageSrc)} /> : <ImageIcon size={18} className="text-slate-200" />}</div>
                </div>

                <div className="p-4 flex flex-col justify-center items-center gap-2 bg-white">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Eval Score</span>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black border shadow-inner ${entry.vendorEval >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{entry.vendorEval}%</div>
                </div>

                <div className="p-4 flex flex-col justify-center gap-3 bg-slate-50/20">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-2">Receiver</span>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-inner"><User size={12} className="text-slate-300" /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-slate-800 uppercase truncate leading-none">{entry.receiver}</p>
                            </div>
                        </div>
                        {entry.receiverSignature && (
                            <div className="h-10 w-full bg-white rounded-lg border border-slate-100 p-1 flex items-center justify-center overflow-hidden shadow-xs">
                                <img src={entry.receiverSignature} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 flex flex-col justify-center items-center gap-3 bg-white">
                    {entry.verified ? (
                        <div className="space-y-2 w-full animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white shrink-0"><ShieldCheck size={16} /></div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-slate-800 uppercase truncate leading-none mb-1">{entry.verifiedBy}</p>
                                        <span className="text-[7px] font-bold text-emerald-600 uppercase">Authorized</span>
                                    </div>
                                </div>
                                <button onClick={onDownload} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"><Download size={14}/></button>
                            </div>
                            {entry.signatureData && (
                                <div className="h-10 w-full bg-emerald-50 rounded-lg border border-emerald-100 p-1 flex items-center justify-center overflow-hidden">
                                    <img src={entry.signatureData} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 w-full">
                            <button onClick={onVerify} className="w-full py-2 bg-amber-400 text-amber-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-amber-500 active:scale-95 transition-all flex items-center justify-center gap-1.5"><Zap size={10} fill="currentColor" /> Auth Log</button>
                            <div className="flex gap-1">
                                <button onClick={onEdit} className="flex-1 py-1.5 bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-center">Edit</button>
                                <button onClick={onDownload} className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"><Download size={12}/></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden flex flex-col">
                <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">NYC Central Kitchen</span>
                        <h4 className="text-xs font-bold uppercase truncate">North America Region</h4>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onDownload} className="p-2 bg-white/10 text-white/60 hover:text-white rounded-lg border border-white/10 transition-colors"><Download size={16}/></button>
                        <div className="bg-white/10 px-2 py-1 rounded border border-white/10">
                            <span className="text-[8px] font-mono text-white/60">#{entry.rec}</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar size={12} className="text-slate-400" />
                            <span className="text-xs font-black text-slate-800">{entry.date}</span>
                            <div className="h-3 w-px bg-slate-200 mx-1" />
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-xs font-black text-slate-800">{entry.time}</span>
                        </div>
                        <h3 className="text-sm font-black text-indigo-600 uppercase truncate leading-tight mb-1">{entry.vendor}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border w-fit shadow-sm ${statusColorMap[entry.status as keyof typeof statusColorMap]}`}>{entry.status}</span>
                    </div>
                    <div className="flex gap-2">
                        {!entry.verified && (
                            <button onClick={onSelect} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                                {isSelected && <Check size={16} strokeWidth={4} />}
                            </button>
                        )}
                        <button onClick={onToggle} className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-400"><MoreVertical size={16} /></button>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                            <Package size={24} className="text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Product Identity</p>
                            <h4 className="text-base font-black text-slate-800 uppercase leading-none mb-2">{entry.materialName}</h4>
                            <div className="grid grid-cols-2 gap-y-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                    <Hash size={10} /> Batch: <span className="text-slate-800">{entry.batchNo}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                    <Timer size={10} /> Life: <span className="text-indigo-600">{bsl.days}d {bsl.hours}h</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                    <Calendar size={10} /> MFG: <span className="text-slate-800">{entry.mfgDate}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                    <Calendar size={10} /> EXP: <span className="text-rose-600">{entry.expDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-900 text-white rounded-2xl p-5 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-inner shrink-0 flex items-center justify-center">
                                <QRCodeSVG value={qrData} size={56} level="H" includeMargin={false} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Digital Identity Passport</p>
                                <p className="text-sm font-bold leading-tight">Complete Product Metadata</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="px-1.5 py-0.5 bg-indigo-800 rounded text-[7px] font-black border border-indigo-700">SCAN FOR FULL RECORD</span>
                                    <ShieldCheck size={12} className="text-emerald-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                    {!entry.verified ? (
                        <>
                            <button onClick={onVerify} className="flex-[2] py-4 bg-amber-400 text-amber-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <Zap size={14} fill="currentColor" /> Verify Log
                            </button>
                            <button onClick={onEdit} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <FileEdit size={16} />
                            </button>
                        </>
                    ) : (
                        <button className="w-full py-4 bg-white border-2 border-emerald-500 text-emerald-700 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                            <CheckCircle2 size={16} /> Verified Node Registry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

interface ReceivingRegisterProps {
  suppliers?: Supplier[];
  rawMaterials?: RawMaterial[];
}

const ReceivingRegister: React.FC<ReceivingRegisterProps> = ({ suppliers = [], rawMaterials = [] }) => {
    const [entries, setEntries] = useState<ReceivingEntry[]>(GENERATED_DATA);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandedMobileIds, setExpandedMobileIds] = useState<Set<string>>(new Set());
    const [activeFilterDropdown, setActiveFilterDropdown] = useState<'dates' | 'global' | 'status' | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [docFilter, setDocFilter] = useState<{ type: 'coa' | 'formE' | 'invoice', attached: boolean } | null>(null);
    const [dashStatFilter, setDashStatFilter] = useState<'rejections' | 'due' | 'completed' | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // --- ISO 22000 Doc Control State ---
    const [docControlData, setDocControlData] = useState<DocControlInfo>({
        docRef: 'REC-RGST-01',
        version: '4.2',
        effectiveDate: new Date().toISOString().split('T')[0],
        approvedBy: 'Quality Assurance Director'
    });
    const [isDocControlModalOpen, setIsDocControlModalOpen] = useState(false);
    const [tempDocControl, setTempDocControl] = useState<DocControlInfo>(docControlData);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [activeModalSection, setActiveModalSection] = useState<'artifacts' | 'vendorEval' | 'context' | 'authorization' | null>(null);
    const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

    const [dateFilters, setDateFilters] = useState({ receiving: { from: '', to: '' }, mfg: { from: '', to: '' }, exp: { from: '', to: '' } });
    const [globalSearch, setGlobalSearch] = useState({ product: '', vendor: '', brand: '', invoice: '', po: '', reportNo: '' });
    const [metricsFilters, setMetricsFilters] = useState({ status: 'All', tempRange: { from: '', to: '' } });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setActiveFilterDropdown(null); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const summaryStats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEntries = entries.filter(e => e.date === todayStr);
        const totalMatCount = entries.length;
        
        return {
            todayIntake: todayEntries.length,
            avgDailyIntake: (entries.length / 30).toFixed(1),
            rejectedShortage: entries.filter(e => e.status === 'Rejected' || e.status === 'Partial').length,
            verificationDue: entries.filter(e => !e.verified).length,
            completed: entries.filter(e => e.verified).length,
            totalCoa: entries.filter(e => e.attachments.coa).length,
            totalFormE: entries.filter(e => e.attachments.formE).length,
            totalInvoice: entries.filter(e => e.attachments.invoice).length,
            totalCount: totalMatCount
        };
    }, [entries]);

    const [formData, setFormData] = useState<any>({
        vendor: "", invoiceNo: "", poNumber: "", 
        receiver: "Current Admin", signature: null, 
        invoiceFiles: [], formEFiles: [], coaFiles: [],
        evaluations: { vehicleHygiene: "Yes", tempMaintained: "Yes", personnelHygiene: "Yes", packagingIntegrity: "Yes", sealIntact: "Yes", deliverySchedule: "Yes" },
        items: [createEmptyMaterialItem()]
    });

    const toggleSelectAll = () => {
        const unverifiedVisibleIds = paginatedEntries.filter(e => !e.verified).map(e => e.id);
        if (selectedIds.size === unverifiedVisibleIds.length && unverifiedVisibleIds.length > 0) setSelectedIds(new Set());
        else setSelectedIds(new Set(unverifiedVisibleIds));
    };

    const toggleSelectOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkVerify = () => { if (selectedIds.size > 0) setVerificationModal({ isOpen: true, ids: Array.from(selectedIds), comments: '', signature: '' }); };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i);
        else {
            pages.push(1); if (currentPage > 4) pages.push('...');
            let start = Math.max(2, currentPage - 1); let end = Math.min(totalPages - 1, currentPage + 1);
            if (currentPage <= 4) { start = 2; end = 5; }
            else if (currentPage >= totalPages - 3) { start = totalPages - 4; end = totalPages - 1; }
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 3) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const toggleMainSection = (section: 'artifacts' | 'vendorEval' | 'context' | 'authorization') => setActiveModalSection(activeModalSection === section ? null : section);
    const resetForm = () => {
        setFormData({ vendor: "", invoiceNo: "", poNumber: "", receiver: "Current Admin", signature: null, invoiceFiles: [], formEFiles: [], coaFiles: [], evaluations: { vehicleHygiene: "Yes", tempMaintained: "Yes", personnelHygiene: "Yes", packagingIntegrity: "Yes", sealIntact: "Yes", deliverySchedule: "Yes" }, items: [createEmptyMaterialItem()] });
        setExpandedItemIds(new Set()); setActiveModalSection(null); setEditingEntryId(null);
    };

    const handleUpdateItem = (id: string, field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, items: prev.items.map((item: any) => {
            if (item.id !== id) return item;
            const newItem = { ...item, [field]: value };
            if (field === 'materialName' || field === 'brand' || field === 'mfgDate') {
                const material = rawMaterials.find(rm => rm.name === newItem.materialName);
                if (material) {
                    const brand = material.brands.find(b => b.name === newItem.brand);
                    if (brand) {
                        if (brand.shelfLife && brand.shelfLife !== '-' && brand.shelfLife !== 'None') {
                            if (field === 'brand' || !newItem.shelfLifeStr) {
                                newItem.shelfLifeStr = brand.shelfLife;
                            }
                        }
                        newItem.storageType = brand.storage || "";
                    }
                    if (newItem.mfgDate && newItem.shelfLifeStr) {
                         const calculatedExp = addDurationToDate(newItem.mfgDate, newItem.shelfLifeStr);
                         if (calculatedExp) newItem.expDate = calculatedExp;
                    }
                }
            }
            return newItem;
        }) }));
    };

    const handleAddMaterialItem = () => { const newItem = createEmptyMaterialItem(); setFormData((prev: any) => ({ ...prev, items: [...prev.items, newItem] })); setExpandedItemIds(new Set([newItem.id])); };
    const handleRemoveMaterialItem = (id: string) => { if (formData.items.length <= 1) return; setFormData((prev: any) => ({ ...prev, items: prev.items.filter((item: any) => item.id !== id) })); };

    const [verificationModal, setVerificationModal] = useState<{ isOpen: boolean; ids: string[]; comments: string; signature: string; }>({ isOpen: false, ids: [], comments: '', signature: '' });

    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const basicMatch = !searchTerm || [e.materialName, e.vendor, e.rec].some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
            if (!basicMatch) return false;
            const checkDate = (val: string, range: { from: string, to: string }) => {
                if (!range.from && !range.to) return true;
                const dateVal = new Date(val);
                if (range.from && dateVal < new Date(range.from)) return false;
                if (range.to && dateVal > new Date(range.to)) return false;
                return true;
            };
            if (!checkDate(e.date, dateFilters.receiving)) return false;
            if (globalSearch.product && !e.materialName.toLowerCase().includes(globalSearch.product.toLowerCase())) return false;
            if (metricsFilters.status !== 'All' && e.status !== metricsFilters.status) return false;
            
            if (docFilter) {
                if (docFilter.type === 'coa' && e.attachments.coa !== docFilter.attached) return false;
                if (docFilter.type === 'formE' && e.attachments.formE !== docFilter.attached) return false;
                if (docFilter.type === 'invoice' && e.attachments.invoice !== docFilter.attached) return false;
            }

            if (dashStatFilter) {
                if (dashStatFilter === 'rejections' && e.status !== 'Rejected' && e.status !== 'Partial') return false;
                if (dashStatFilter === 'due' && e.verified) return false;
                if (dashStatFilter === 'completed' && !e.verified) return false;
            }

            return true;
        });
    }, [entries, searchTerm, dateFilters, globalSearch, metricsFilters, docFilter, dashStatFilter]);

    const totalItemsCount = filteredEntries.length;
    const totalPages = Math.ceil(totalItemsCount / rowsPerPage);
    const paginatedEntries = useMemo(() => filteredEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredEntries, currentPage, rowsPerPage]);

    const handleQuickSave = () => {
        if (formData.items.some((item: any) => !item.materialName || !item.brand)) return;
        const evals = formData.evaluations;
        const totalPoints = Object.keys(evals).length;
        const scorePoints = Object.values(evals).filter(v => v === 'Yes').length;
        const calculatedScore = Math.round((scorePoints / totalPoints) * 100);
        const now = new Date();
        const autoDate = now.toISOString().split('T')[0];
        const autoTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        
        if (editingEntryId) {
            const entry = entries.find(e => e.id === editingEntryId)!;
            const item = formData.items[0];
            const updatedEntry: ReceivingEntry = { 
                ...entry, 
                vendor: formData.vendor, 
                invoiceNo: formData.invoiceNo, 
                poNumber: formData.poNumber, 
                materialName: item.materialName, 
                brand: item.brand, 
                batchNo: item.batchNo, 
                orderedQty: Number(item.orderedQty), 
                receivedQty: Number(item.receivedQty), 
                unit: item.unit, 
                mfgDate: item.mfgDate, 
                expDate: item.expDate, 
                temperature: item.temperature, 
                status: (Number(item.receivedQty) >= Number(item.orderedQty)) ? 'Approved' : 'Partial', 
                discrepancyType: item.discrepancyType,
                rejectionRemarks: item.shortfallReason,
                vendorEval: calculatedScore,
                receiverSignature: formData.signature || entry.receiverSignature 
            };
            setEntries(prev => prev.map(e => e.id === editingEntryId ? updatedEntry : e));
        } else {
            const newEntries: ReceivingEntry[] = formData.items.map((item: any) => ({ 
                id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
                rec: `REC-${Math.floor(Math.random() * 90000) + 10000}`, 
                date: autoDate, 
                time: autoTime, 
                materialName: item.materialName, 
                brand: item.brand, 
                vendor: formData.vendor, 
                invoiceNo: formData.invoiceNo, 
                poNumber: formData.poNumber, 
                batchNo: item.batchNo, 
                orderedQty: Number(item.orderedQty), 
                receivedQty: Number(item.receivedQty), 
                unit: item.unit, 
                mfgDate: item.mfgDate, 
                expDate: item.expDate, 
                temperature: item.temperature, 
                tempImageSrc: item.tempImage,
                condition: 'Good', 
                qcStatus: 'Verified', 
                status: (Number(item.receivedQty) >= Number(item.orderedQty)) ? 'Approved' : 'Partial', 
                discrepancyType: item.discrepancyType,
                rejectionRemarks: item.shortfallReason,
                receiver: formData.receiver, 
                receiverSignature: formData.signature,
                verified: false, 
                vendorEval: calculatedScore, 
                attachments: { 
                    formE: formData.formEFiles.length > 0, 
                    invoice: !!formData.invoiceNo || formData.invoiceFiles.length > 0, 
                    coa: item.coaFiles.length > 0 || !!item.selectedCoaId || formData.coaFiles.length > 0
                } 
            }));
            setEntries(prev => [...newEntries, ...prev]);
        }
        setIsModalOpen(false); resetForm();
    };

    const handleEdit = (entry: ReceivingEntry) => {
        setEditingEntryId(entry.id);
        setFormData({ 
            vendor: entry.vendor, 
            invoiceNo: entry.invoiceNo, 
            poNumber: entry.poNumber || "", 
            receiver: entry.receiver, 
            signature: entry.receiverSignature,
            items: [{ 
                id: `item-edit-${entry.id}`, 
                materialName: entry.materialName, 
                brand: entry.brand, 
                batchNo: entry.batchNo, 
                mfgDate: entry.mfgDate, 
                expDate: entry.expDate, 
                orderedQty: entry.orderedQty.toString(), 
                receivedQty: entry.receivedQty.toString(), 
                unit: entry.unit, 
                temperature: entry.temperature || "N/A",
                discrepancyType: entry.discrepancyType || "Shortfall",
                shortfallReason: entry.rejectionRemarks || ""
            }], 
            evaluations: { vehicleHygiene: "Yes", tempMaintained: "Yes", personnelHygiene: "Yes", packagingIntegrity: "Yes", sealIntact: "Yes", deliverySchedule: "Yes" } 
        });
        setActiveModalSection('context'); setIsModalOpen(true);
    };

    const handleVerifySubmit = () => {
        const { ids, signature } = verificationModal;
        if (!signature) { alert("Signature required."); return; }
        const verificationTimestamp = new Date().toISOString();
        setEntries(prev => prev.map(e => ids.includes(e.id) ? { 
            ...e, 
            verified: true, 
            verifiedBy: 'Jane Smith (QA Mgr)', 
            signatureData: signature, 
            verificationComments: verificationModal.comments, 
            verificationDate: verificationTimestamp 
        } : e));
        setVerificationModal({ isOpen: false, ids: [], comments: '', signature: '' });
        setSelectedIds(new Set());
    };

    const handleDocFilter = (type: 'coa' | 'formE' | 'invoice', attached: boolean) => {
        if (docFilter?.type === type && docFilter?.attached === attached) {
            setDocFilter(null);
        } else {
            setDocFilter({ type, attached });
        }
        setCurrentPage(1);
    };

    const handleDashStatFilter = (stat: 'rejections' | 'due' | 'completed') => {
        if (dashStatFilter === stat) setDashStatFilter(null);
        else setDashStatFilter(stat);
        setCurrentPage(1);
    };

    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                handleUpdateItem(itemId, 'tempImage', event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditDocControl = () => {
        setTempDocControl({ ...docControlData });
        setIsDocControlModalOpen(true);
    };

    const handleSaveDocControl = () => {
        setDocControlData(tempDocControl);
        setIsDocControlModalOpen(false);
    };

    // Helper for rendering a tabular PDF for a set of entries
    const generatePDFForEntries = async (targetEntries: ReceivingEntry[], filename: string) => {
        const printArea = document.createElement('div');
        printArea.style.position = 'fixed';
        printArea.style.top = '-9999px';
        printArea.style.left = '0';
        printArea.style.width = '1200px'; 
        printArea.style.backgroundColor = 'white';
        printArea.style.padding = '0';
        printArea.style.fontFamily = 'Arial, Helvetica, sans-serif';
        printArea.style.color = '#1e293b';

        const securityId = `CERT-REC-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const now = new Date();
        const downloadTimestamp = now.toLocaleString();

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
                                <div style="font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Raw Material Receiving Registry (ISO 22:2018)</div>
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
                                <th style="padding: 12px; text-align: left;">Product Analysis</th>
                                <th style="padding: 12px; text-align: left;">Quantities</th>
                                <th style="padding: 12px; text-align: center;">Telemetry</th>
                                <th style="padding: 12px; text-align: left;">Identity Passport (QR)</th>
                                <th style="padding: 12px; text-align: left;">Authorization</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${targetEntries.map(e => {
                                const qrString = `REC ID: ${e.rec}\nBATCH: ${e.batchNo}\nINV: ${e.invoiceNo}\nPRODUCT: ${e.materialName}\nBRAND: ${e.brand}\nVENDOR: ${e.vendor}\nQTY ORD: ${e.orderedQty}\nQTY REC: ${e.receivedQty}\nTEMP: ${e.temperature}°C\nCOND: ${e.condition}\nQC: ${e.qcStatus}\nSTATUS: ${e.status}\nRECEIVER: ${e.receiver}\nVERIFIED: ${e.verified ? 'YES' : 'PENDING'}`;
                                return `
                                <tr style="font-size: 10px; border-bottom: 1px solid #e2e8f0; background: #fff;">
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 800; color: #0f172a;">${e.vendor}</div>
                                        <div style="font-size: 8px; color: #64748b; margin-top: 4px;">DATE: ${e.date} | TIME: ${e.time}</div>
                                        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">INV: ${e.invoiceNo}</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 800; color: #4f46e5;">${e.materialName}</div>
                                        <div style="font-size: 8px; color: #64748b; margin-top: 4px; font-weight: 700;">BATCH: ${e.batchNo}</div>
                                        <div style="font-size: 8px; color: #10b981; margin-top: 2px; font-weight: 700;">MFG: ${e.mfgDate}</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 700;">ORD: ${e.orderedQty} ${e.unit}</div>
                                        <div style="font-weight: 900; color: #10b981; margin-top: 2px;">ACC: ${e.receivedQty} ${e.unit}</div>
                                        ${e.rejectionRemarks ? `<div style="font-size: 8px; color: #e11d48; margin-top: 6px; font-weight: 700; background: #fff1f2; padding: 4px; border-radius: 4px;">REMARKS: ${e.rejectionRemarks}</div>` : ''}
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; text-align: center;">
                                        <div style="font-size: 12px; font-weight: 900; color: #3b82f6;">${e.temperature}°C</div>
                                        <div style="font-size: 8px; color: #64748b; margin-top: 4px;">Eval: ${e.vendorEval}%</div>
                                    </td>
                                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; text-align: center;">
                                        <div style="width: 70px; height: 70px; margin: 0 auto; background: #f8fafc; padding: 5px; border-radius: 4px;">
                                            ${renderToString(<QRCodeSVG value={qrString} size={70} level="H" />)}
                                        </div>
                                        <div style="font-size: 7px; color: #94a3b8; margin-top: 4px; font-weight: 900; text-transform: uppercase;">Scan for Complete Record</div>
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="margin-bottom: 8px;">
                                            <div style="font-weight: 800; color: #64748b; font-size: 8px;">OPERATOR</div>
                                            <div style="font-weight: 800; color: #0f172a;">${e.receiver}</div>
                                        </div>
                                        ${e.verified ? `
                                            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px; border-radius: 4px;">
                                                <div style="font-weight: 800; color: #059669; font-size: 8px;">QA AUTHORIZED</div>
                                                <div style="font-weight: 900; color: #064e3b;">${e.verifiedBy}</div>
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
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Registry Intake Signature</div>
                            <div style="border-bottom: 1px solid #cbd5e1; height: 30px;"></div>
                        </div>
                        <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Audit Verification Node</div>
                            <div style="border-bottom: 1px solid #cbd5e1; height: 30px;"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">
                        <div>System Timestamp: ${downloadTimestamp}</div>
                        <div>Electronic Integrity Hash: ${securityId}</div>
                    </div>
                </div>
            </div>
        `;

        printArea.innerHTML = htmlContent;
        document.body.appendChild(printArea);

        try {
            const canvas = await html2canvas(printArea, { 
                scale: 3, 
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
            console.error("Registry Export failed", err);
        } finally {
            document.body.removeChild(printArea);
        }
    };

    const handleExportSinglePDF = async (entry: ReceivingEntry) => {
        setIsGeneratingPDF(true);
        const filename = `Receiving_Record_${entry.rec}_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDFForEntries([entry], filename);
        setIsGeneratingPDF(false);
    };

    const handleExportPDF = async () => {
        if (filteredEntries.length === 0) return;
        setIsGeneratingPDF(true);
        const filename = `Complete_Product_Record_Registry_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDFForEntries(filteredEntries, filename);
        setIsGeneratingPDF(false);
    };

    return (
        <div className="flex flex-col bg-[#f8fafc] text-slate-900 font-sans relative overflow-hidden">
            <div className="mb-10 px-4 md:px-0">
                <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                    <div className="flex flex-1 overflow-x-auto gap-4 snap-x hide-scrollbar xl:overflow-visible w-full items-stretch pb-1 lg:pb-0">
                        <div className={`bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2.5rem] border transition-all shadow-xl flex flex-col gap-2 md:gap-4 min-w-[200px] md:min-w-[280px] md:flex-1 snap-center ${dashStatFilter === 'rejections' ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-3"><div className="p-2 md:p-2.5 bg-blue-600 text-white rounded-xl md:rounded-2xl shadow-lg shrink-0"><Truck size={14} className="md:w-5 md:h-5"/></div><h3 className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-500 truncate">Intake Terminal</h3></div>
                            <div className="grid grid-cols-3 gap-2 md:gap-4"><div className="flex flex-col"><span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase leading-none mb-1.5">Today</span><span className="text-xs md:text-xl font-black text-slate-900 leading-none">{summaryStats.todayIntake}</span></div><div className="flex flex-col"><span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Avg Daily</span><span className="text-xs md:text-xl font-black text-slate-900 leading-none">{summaryStats.avgDailyIntake}</span></div><button onClick={() => handleDashStatFilter('rejections')} className={`flex flex-col text-left transition-all ${dashStatFilter === 'rejections' ? 'scale-110' : ''}`}><span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase leading-none mb-1.5">Rejections</span><span className="text-xs md:text-xl font-black text-rose-600 leading-none">{summaryStats.rejectedShortage}</span></button></div>
                        </div>
                        <div className={`p-3 md:p-4 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl flex flex-col gap-2 md:gap-4 min-w-[180px] md:min-w-[220px] md:flex-1 snap-center transition-all ${dashStatFilter === 'due' || dashStatFilter === 'completed' ? 'bg-indigo-900' : 'bg-indigo-700'}`}>
                            <div className="flex items-center gap-3"><div className="p-2 md:p-2.5 bg-white/10 text-white rounded-xl md:rounded-2xl shadow-inner shrink-0"><ShieldCheck size={14} className="md:w-5 md:h-5"/></div><h3 className="text-[9px] font-black uppercase tracking-widest text-white/50 truncate">Flow Sync</h3></div>
                            <div className="flex gap-4 md:gap-8"><button onClick={() => handleDashStatFilter('due')} className={`flex flex-col text-left transition-all ${dashStatFilter === 'due' ? 'scale-110' : ''}`}><span className="text-[7px] md:text-[8px] font-black text-white/60 uppercase leading-none mb-1.5">Due Verify</span><span className="text-sm md:text-2xl font-black text-amber-400 leading-none">{summaryStats.verificationDue}</span></button><button onClick={() => handleDashStatFilter('completed')} className={`flex flex-col text-left transition-all ${dashStatFilter === 'completed' ? 'scale-110' : ''}`}><span className="text-[7px] md:text-[8px] font-black text-white/60 uppercase leading-none mb-1.5">Completed</span><span className="text-sm md:text-2xl font-black text-emerald-400 leading-none">{summaryStats.completed}</span></button></div>
                        </div>
                        <div className="bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col gap-2 md:gap-4 min-w-[260px] md:min-w-[300px] md:flex-1 snap-center">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 md:p-2.5 bg-slate-900 text-white rounded-xl md:rounded-2xl shadow-lg shrink-0"><FileText size={14} className="md:w-5 md:h-5"/></div>
                                    <h3 className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-500 truncate">Doc Control</h3>
                                </div>
                                <button onClick={handleEditDocControl} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={14}/></button>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-600">
                                    <span className="opacity-50">REF:</span> <span>{docControlData.docRef}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-600">
                                    <span className="opacity-50">VER:</span> <span>{docControlData.version}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hidden xl:flex items-center gap-3 xl:pl-4 xl:border-l border-slate-100 shrink-0">
                        <div className="flex items-center gap-2 relative z-30" ref={dropdownRef}>
                            <button onClick={handleExportPDF} disabled={isGeneratingPDF} className="p-4 rounded-[1.5rem] border-2 bg-white border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-400 transition-all shadow-sm active:scale-95">{isGeneratingPDF ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} strokeWidth={2.5} />}</button>
                            <div className="relative">
                                <button onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'dates' ? null : 'dates')} className={`p-4 rounded-[1.5rem] border-2 transition-all shadow-sm active:scale-95 ${activeFilterDropdown === 'dates' ? 'bg-[#4f46e5] border-[#4f46e5] text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-400'}`}><Calendar size={22} strokeWidth={2.5} /></button>
                                {activeFilterDropdown === 'dates' && (
                                    <div className="fixed md:absolute top-1/2 left-1/2 md:top-full md:left-0 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 mt-0 md:mt-4 w-[calc(100vw-2rem)] md:w-80 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl z-[60] p-8 space-y-6 animate-in fade-in slide-in-from-top-2">
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Calendar size={12} /> Timeline Filters</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase ml-1">Receiving Date</label><div className="flex gap-2"><input type="date" className="flex-1 p-2 bg-slate-50 border rounded-xl text-xs font-bold" value={dateFilters.receiving.from} onChange={e=>setDateFilters({...dateFilters, receiving:{...dateFilters.receiving, from: e.target.value}})}/><input type="date" className="flex-1 p-2 bg-slate-50 border rounded-xl text-xs font-bold" value={dateFilters.receiving.to} onChange={e=>setDateFilters({...dateFilters, receiving:{...dateFilters.receiving, to: e.target.value}})}/></div></div>
                                        </div>
                                        <button onClick={() => setActiveFilterDropdown(null)} className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Apply Filter</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={() => { setEditingEntryId(null); resetForm(); setIsModalOpen(true); }} className="xl:flex-none px-8 py-4 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap"><Plus size={18} strokeWidth={3} /> Add Intake</button>
                    </div>
                </div>
            </div>

            <div className="shrink-0 mb-8 px-4 md:px-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 relative z-10">
                        <button onClick={toggleSelectAll} className={`p-4 rounded-[1.5rem] border-2 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 ${selectedIds.size === paginatedEntries.filter(e => !e.verified && e.status === 'Approved').length && selectedIds.size > 0 ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-400'}`}>{selectedIds.size > 0 ? <CheckCheck size={22} strokeWidth={3} /> : <CheckSquare size={22} strokeWidth={2.5} />}</button>
                        {selectedIds.size > 0 && (<button onClick={handleBulkVerify} className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><ShieldCheck size={22} strokeWidth={3} /><span className="text-[10px] font-black uppercase hidden lg:inline">Bulk Verify ({selectedIds.size})</span></button>)}
                    </div>
                    <div className="relative group flex-1 max-w-lg"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} /><input type="text" placeholder="Search product registry..." className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black focus:outline-none focus:border-indigo-500 transition-all shadow-inner uppercase tracking-wider" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>
            </div>

            <div className="space-y-6 px-4 md:px-0">
                {paginatedEntries.length > 0 ? (
                    paginatedEntries.map((entry, idx) => (
                        <ReceivingCard 
                            key={entry.id} entry={entry} index={(currentPage - 1) * rowsPerPage + idx + 1}
                            isSelected={selectedIds.has(entry.id)} onSelect={() => toggleSelectOne(entry.id)}
                            isExpanded={expandedMobileIds.has(entry.id)} onToggle={() => { const n = new Set(expandedMobileIds); if(n.has(entry.id)) n.delete(entry.id); else n.add(entry.id); setExpandedMobileIds(n); }}
                            onVerify={() => setVerificationModal({ ...verificationModal, isOpen: true, ids: [entry.id] })} 
                            onEdit={() => handleEdit(entry)}
                            onDownload={() => handleExportSinglePDF(entry)}
                        />
                    ))
                ) : (
                    <div className="py-20 text-center text-slate-300"><Package size={64} className="mx-auto mb-4 opacity-10" /><p className="text-sm font-black uppercase tracking-[0.2em]">No entries found matching criteria</p></div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-5 flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4 mt-6">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between sm:justify-start"><div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rows:</span><select value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }} className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-black rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 cursor-pointer shadow-inner"><option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></div><span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: {totalItemsCount} Entries</span></div>
                <div className="flex items-center gap-1 w-full sm:w-auto justify-center"><button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronsLeft size={16} /></button><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={16} /></button><div className="flex gap-1 mx-2">{getPageNumbers().map((p, i) => (typeof p === 'number' ? <button key={i} onClick={() => setCurrentPage(p)} className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}>{p}</button> : <span key={i} className="px-1 text-slate-300 font-bold">...</span>))}</div><button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={16} /></button><button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronsRight size={16} /></button></div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-[850px] rounded-t-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in slide-in-from-bottom md:zoom-in-95 duration-300 h-[92vh] md:h-auto md:max-h-[94vh]">
                        <div className="px-6 py-5 md:px-10 md:py-6 border-b border-slate-50 flex justify-between items-center shrink-0 bg-white"><div className="flex items-center gap-4 md:gap-6"><div className="p-3 md:p-4 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl shrink-0"><Truck size={24} className="md:w-7 md:h-7" /></div><div><h3 className="text-base md:text-xl font-black uppercase tracking-tight text-slate-800">{editingEntryId ? 'Edit Intake' : 'Material Intake'}</h3><p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mt-1 flex items-center gap-2"><Info size={12} className="text-indigo-500" /> Digital cold chain registry</p></div></div><button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 md:p-2.5 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-rose-500 active:scale-90"><X size={20} /></button></div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-50/30 space-y-4">
                            <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-sm">
                                <div onClick={() => toggleMainSection('artifacts')} className="px-5 md:px-8 py-4 md:py-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-all border-b border-slate-50"><div className="flex items-center gap-4 md:gap-5"><div className="p-2.5 md:p-3 bg-slate-900 text-white rounded-xl md:rounded-2xl shadow-lg"><ShieldIcon size={18} className="md:w-5 md:h-5" /></div><div><h4 className="text-[11px] md:text-xs font-black uppercase tracking-[0.15em] text-slate-800">Verification Artifacts</h4><p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Shipment-wide documentation</p></div></div><div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-md transition-transform">{activeModalSection === 'artifacts' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div></div>
                                {activeModalSection === 'artifacts' && (
                                    <div className="p-6 md:p-8 space-y-5 md:space-y-6 animate-in slide-in-from-top-2 duration-300">
                                        <SearchSelect label="Verified Vendor" required options={suppliers?.map(s => s.name) || []} value={formData.vendor} onChange={(val) => setFormData({ ...formData, vendor: val })} icon={<Warehouse size={18} />} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"><div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Invoice Number</label><input value={formData.invoiceNo} onChange={e => setFormData({...formData, invoiceNo: e.target.value})} className="w-full px-5 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-indigo-500 shadow-inner uppercase" placeholder="INV-..." /></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">PO Number</label><input value={formData.poNumber} onChange={e => setFormData({...formData, poNumber: e.target.value})} className="w-full px-5 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-indigo-500 shadow-inner uppercase" placeholder="PO-..." /></div></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceivingRegister;
