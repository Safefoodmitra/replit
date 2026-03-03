"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  Flame, X, Search, Thermometer, Clock, Camera, 
  CheckCheck, Zap, Calendar, ShieldCheck, PenTool, Snowflake,
  Split, Eraser, Eye, Check, Globe, Utensils, 
  Edit3, Trash2, GitPullRequest,
  Plus, Database, RefreshCw, Download, 
  Activity,
  History,
  Timer,
  CheckSquare, Square,
  Play,
  CheckCircle2,
  Info,
  Lock,
  XCircle,
  BarChart3,
  Filter,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  AlertTriangle,
  RotateCw,
  Save,
  ImageIcon,
  FileText,
  QrCode,
  Package,
  Trash,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  Hourglass,
  Layers
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';
import Logo from './Logo';
import { CookingRecordEntry } from '../types';

// --- ISO 22000 Types ---
interface DocControlInfo {
    docRef: string;
    version: string;
    effectiveDate: string;
    approvedBy: string;
}

interface CookingCardProps {
    entry: CookingRecordEntry;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onVerification: () => void;
    openCookModal: () => void;
    handleCompleteCooking: () => void;
    onDownload: () => void;
    formatTimeLapse: (s: string, e?: string) => string;
    onSplit: () => void; 
    onSplitCooked: () => void;
    now: number;
}

// --- Constants ---
const OVEN_NUMBERS = ["OVEN-01", "OVEN-02", "OVEN-03", "OVEN-04", "RANGE-01", "GRILL-01"];
const COOKED_PURPOSES = ["Direct Serve", "Cooling"];

// --- Sub-Components ---

const AgingProgressBar: React.FC<{ startTime: string, now: number }> = ({ startTime, now }) => {
    const startMs = new Date(startTime).getTime();
    const elapsedMs = now - startMs;
    const totalMs = 24 * 60 * 60 * 1000;
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    const progress = Math.min(100, (elapsedMs / totalMs) * 100);
    
    const remainingHours = remainingMs / 3600000;
    
    let color = "bg-emerald-500";
    let textColor = "text-emerald-700";
    let label = "Safe to Use";

    if (remainingHours <= 0) {
        color = "bg-rose-600";
        textColor = "text-rose-700";
        label = "EXPIRED - DISCARD";
    } else if (remainingHours <= 2) {
        color = "bg-rose-500 animate-pulse";
        textColor = "text-rose-600 font-black";
        label = "CRITICAL: USE NOW";
    } else if (remainingHours <= 6) {
        color = "bg-amber-500";
        textColor = "text-amber-700 font-bold";
        label = "PRIORITY: 18H+ AGED";
    }

    return (
        <div className="space-y-1.5 w-full animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
                <span className={`text-[8px] font-black uppercase tracking-widest ${textColor}`}>{label}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {remainingHours <= 0 ? '0h 0m' : `${Math.floor(remainingHours)}h ${Math.floor((remainingMs % 3600000) / 60000)}m`} Left
                </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                <div 
                    className={`h-full transition-all duration-1000 ${color}`} 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    );
};

const SignaturePad: React.FC<{ onSave: (data: string) => void, initialData?: string, label?: string }> = ({ onSave, initialData, label = "Signature Auth" }) => {
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
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
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
            </div>
        </div>
    );
};

const CookingCard: React.FC<CookingCardProps> = ({ 
    entry, index, isSelected, onSelect,
    onVerification, openCookModal, handleCompleteCooking, onDownload, formatTimeLapse,
    onSplit, onSplitCooked, now
}) => {
    const isThawed = entry.status === 'THAWED';
    const isInProgress = entry.status === 'IN_PROGRESS';
    const isCompleted = entry.status === 'COMPLETED';
    const isVerified = entry.isVerified;

    const totalCookedWeight = Number(entry.cookingQuantity) || 0;
    const distributedWeight = (entry.issued || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const remainingToAssign = Math.max(0, totalCookedWeight - distributedWeight);
    const isFullyDistributed = isCompleted && remainingToAssign === 0 && totalCookedWeight > 0;

    const expiryTime = entry.thawCompletedTime ? new Date(entry.thawCompletedTime).getTime() + 24 * 60 * 60 * 1000 : Infinity;
    const isExpired = isThawed && now > expiryTime;

    return (
        <div className={`bg-white rounded-[2rem] border-2 transition-all duration-300 flex flex-col overflow-hidden border-slate-100 shadow-sm hover:border-indigo-200`}>
            {/* COMPACT INTEGRATED HORIZONTAL GRID */}
            <div className="flex flex-col xl:flex-row items-stretch divide-y xl:divide-y-0 xl:divide-x divide-slate-100 w-full min-h-[220px]">
                
                {/* 1. IDENTITY BLOCK (16%) */}
                <div className="p-6 xl:w-[16%] flex flex-col justify-center bg-slate-50/30 shrink-0 relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                    
                    {/* Bulk Selection Interface */}
                    {isFullyDistributed && !isVerified && (
                        <div className="absolute top-4 left-4 z-20">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-300 hover:border-indigo-400'}`}
                            >
                                {isSelected && <Check size={12} strokeWidth={4} />}
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg ${isCompleted ? 'bg-emerald-600' : isInProgress ? 'bg-orange-600 animate-pulse' : 'bg-slate-900'}`}>
                            {index.toString().padStart(2, '0')}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase border tracking-wider ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isInProgress ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {entry.status}
                        </span>
                    </div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight leading-tight mb-2 truncate">{entry.productName}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-[8px] font-black uppercase tracking-widest mb-4"><Globe size={10} className="text-indigo-400" /> {entry.unitName}</div>
                    <div className="bg-white border border-slate-100 p-2.5 rounded-xl flex flex-col gap-1 shadow-sm">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Batch Registry</span>
                        <span className="text-[10px] font-black text-slate-800 font-mono tracking-tighter truncate">{entry.batchNumber}</span>
                    </div>
                </div>

                {/* 2. PROCESS ORIGIN & SPLIT LINEAGE (27%) - MERGED */}
                <div className="p-6 xl:w-[27%] flex flex-col justify-center gap-4 shrink-0 bg-white">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                <History size={14} className="text-indigo-600" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Process Origin</span>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-black text-slate-800 uppercase leading-none truncate">{entry.sourceProductName}</p>
                                <div className="flex gap-3">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">MFG: {entry.mfgDate}</span>
                                    <span className="text-[8px] font-black text-rose-500 uppercase">EXP: {entry.expDate}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                <GitPullRequest size={14} className="text-indigo-600" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Split Lineage</span>
                            </div>
                            <div className="max-h-[100px] overflow-y-auto custom-scrollbar space-y-2">
                                {entry.parentName && (
                                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex justify-between items-center shadow-md animate-in slide-in-from-left-2">
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-slate-100 uppercase truncate leading-none mb-0.5">Mother Node</p>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase truncate leading-none">{entry.parentName}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-white">{(entry.parentAvailableQty || 0).toFixed(1)}</span>
                                    </div>
                                )}

                                {entry.splits && entry.splits.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {entry.splits.map((split, sidx) => (
                                            <div key={sidx} className={`bg-slate-50 border p-2 rounded-xl flex justify-between items-center shadow-xs ${split.childId === entry.uuid ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-slate-100'}`}>
                                                <p className="text-[9px] font-black text-slate-700 uppercase truncate max-w-[100px]">{split.name}</p>
                                                <span className="text-[10px] font-black text-indigo-600">{split.quantity.toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : !entry.parentName && (
                                    <div className="text-center py-2 border border-dashed border-slate-100 rounded-xl">
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">No lineage split</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. THAWING TELEMETRY (12%) */}
                <div className="p-6 xl:w-[12%] flex flex-col justify-center gap-3 shrink-0 bg-slate-50/20">
                     <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                        <Snowflake size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thaw Audit</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Method</span>
                            <span className="text-[9px] font-bold text-slate-700">{entry.thawingMethod}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-xs">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Final</span>
                            <span className="text-[10px] font-black text-blue-600">{entry.thawFinalTemp}°C</span>
                        </div>
                        <div className="bg-indigo-600 text-white p-2 rounded-xl flex justify-between items-center shadow-md">
                            <span className="text-[8px] font-black uppercase">Pool</span>
                            <span className="text-xs font-black">{entry.availableThawedQty.toFixed(1)} {entry.storedUnit}</span>
                        </div>
                    </div>
                </div>

                {/* 4. PROCESS TELEMETRY (24%) - INITIATOR DETAILS & LAPSES */}
                <div className="p-6 xl:w-[24%] flex flex-col gap-4 shrink-0 bg-white">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Activity size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Process Telemetry</span>
                    </div>
                    
                    <div className="flex flex-col gap-4 flex-1">
                        {/* Initiation Node */}
                        {entry.cookStart ? (
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 relative overflow-hidden group/init">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Intake</span>
                                    <span className="text-[11px] font-black text-rose-600">{entry.initialTemp}°C</span>
                                </div>
                                <p className="text-[10px] font-black text-slate-800 font-mono">{formatTimeDisplay(entry.cookStart)}</p>
                                
                                <div className="flex items-center gap-2 mt-2">
                                    {entry.initialTempImg ? (
                                        <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden cursor-pointer" onClick={() => window.open(entry.initialTempImg)}>
                                            <img src={entry.initialTempImg} className="w-full h-full object-cover" />
                                        </div>
                                    ) : <div className="w-10 h-10 bg-slate-100 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300"><ImageIcon size={14}/></div>}
                                    
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none">Vessel / Init</span>
                                        <span className="text-[9px] font-black text-slate-700 truncate block leading-tight">{entry.cookingVessel}</span>
                                        <span className="text-[9px] font-black text-indigo-600 truncate block leading-tight">{entry.initiatedBy}</span>
                                    </div>
                                    
                                    {entry.initiatedBySign && (
                                        <div className="h-8 w-12 bg-white/50 border border-slate-100 rounded-lg p-0.5 shrink-0 overflow-hidden shadow-xs">
                                            <img src={entry.initiatedBySign} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                        </div>
                                    )}
                                </div>

                                {entry.cookComments && (
                                    <div className="mt-2 p-1.5 bg-white/40 border border-slate-100 rounded-lg text-[8px] text-slate-500 italic leading-tight">
                                        "{entry.cookComments}"
                                    </div>
                                )}
                            </div>
                        ) : <div className="h-full flex flex-col items-center justify-center p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl opacity-40"><Hourglass size={20} className="text-slate-300 mb-1"/><span className="text-[7px] font-black uppercase">Wait Init</span></div>}

                        {/* LAPSE SUMMARY - VISIBLE AFTER COMPLETION */}
                        {isCompleted && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl flex flex-col shadow-xs">
                                    <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest block mb-0.5 leading-none">Thaw Lapse</span>
                                    <span className="text-[11px] font-black text-blue-700 font-mono tracking-tighter leading-none">
                                        {formatTimeLapse(entry.thawStartTime, entry.thawCompletedTime)}
                                    </span>
                                </div>
                                <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl flex flex-col shadow-xs">
                                    <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5 leading-none">Cook Lapse</span>
                                    <span className="text-[11px] font-black text-indigo-700 font-mono tracking-tighter leading-none">
                                        {formatTimeLapse(entry.cookStart, entry.cookCompleted)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Active Lapse - Only during production */}
                        {isInProgress && (
                            <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><Clock size={40}/></div>
                                <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Active Lapse</span>
                                <span className="text-xl font-black font-mono tracking-tighter leading-none">{formatTimeLapse(entry.cookStart, entry.cookCompleted)}</span>
                            </div>
                        )}
                    </div>

                    {/* Aging Indicators (During Thaw Hold) */}
                    <div className="pt-2 flex flex-col gap-2">
                        {entry.thawCompletedTime && !isCompleted && (
                             <AgingProgressBar startTime={entry.thawCompletedTime} now={now} />
                        )}
                        {(isThawed || isInProgress) && (
                            <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl shadow-xs">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-blue-500" />
                                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-tight">HACCP 24H Window</span>
                                </div>
                                <span className="text-[8px] font-black text-emerald-600 uppercase">Authorized</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. DISTRIBUTION SUMMARY (12%) */}
                <div className={`p-6 xl:w-[12%] flex flex-col justify-center gap-2 shrink-0 bg-slate-50/10 ${!isCompleted ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                        <Package size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Registry</span>
                    </div>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                        {isCompleted && (entry.issued || []).length > 0 ? (
                            entry.issued.map((iss, iidx) => (
                                <div key={iidx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                                    <span className="text-[9px] font-black text-indigo-600 uppercase truncate max-w-[60px]">{iss.purpose}</span>
                                    <span className="text-[10px] font-black text-slate-800">{iss.quantity.toFixed(1)} {entry.storedUnit}</span>
                                </div>
                            ))
                        ) : isCompleted ? (
                            <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">
                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Assigning...</span>
                            </div>
                        ) : null}
                    </div>
                    {isCompleted && (
                         <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Pending</span>
                            <span className={`text-[11px] font-black ${remainingToAssign > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{remainingToAssign.toFixed(1)} {entry.storedUnit}</span>
                         </div>
                    )}
                </div>

                {/* 6. ACTIONS & VERIFICATION (FLEX) */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-center gap-4 bg-white relative">
                    {isThawed ? (
                        <div className="flex flex-col gap-2 w-full">
                            {isExpired ? (
                                <button className="w-full py-4 bg-rose-600 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Trash size={18} /> Mark for Disposal
                                </button>
                            ) : (
                                <button onClick={openCookModal} className="w-full py-4 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Flame size={18} fill="currentColor" /> Initiate Cooking
                                </button>
                            )}
                            <button onClick={onSplit} className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Split size={16} /> Split Thawed Batch
                            </button>
                        </div>
                    ) : isInProgress ? (
                        <button onClick={handleCompleteCooking} className="w-full py-4 bg-orange-600 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Timer size={18} /> Complete Process
                        </button>
                    ) : isVerified ? (
                        <div className="flex flex-col gap-3 animate-in zoom-in-95 duration-300 flex flex-col items-center xl:items-end">
                            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden w-full max-w-[320px]">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500 opacity-10 rounded-bl-[2rem]" />
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white shrink-0"><ShieldCheck size={24} strokeWidth={3} /></div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-sm font-black text-slate-900 uppercase leading-tight truncate">{entry.verifierName}</p>
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1 italic">Verified Auth</p>
                                    </div>
                                </div>
                                <div className="h-16 w-full bg-white/50 rounded-2xl border border-emerald-100 p-2 mb-4 flex items-center justify-center shadow-inner overflow-hidden">
                                    {entry.verifierSignature ? <img src={entry.verifierSignature} className="max-h-full max-w-full object-contain" alt="verifier-sign" /> : <PenTool className="text-emerald-200" />}
                                </div>
                                <div className="p-4 bg-white/40 rounded-xl text-left"><p className="text-[9px] font-bold text-slate-600 leading-relaxed italic">"{entry.verificationComments || 'Record reviewed and synchronized.'}"</p></div>
                                <div className="mt-4 flex justify-between items-center text-[8px] font-black text-emerald-800 uppercase px-1 opacity-60"><span>Process Cert.</span><span>{entry.verificationDate || '---'}</span></div>
                            </div>
                            <button onClick={onDownload} className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95">
                                <Download size={14}/> Export Certificate
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 w-full">
                            {!isFullyDistributed ? (
                                <button 
                                    onClick={onSplitCooked} 
                                    className="w-full py-4 bg-indigo-600 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 animate-pulse"
                                >
                                    <Split size={18} strokeWidth={3} /> Assign Split {remainingToAssign.toFixed(1)} {entry.storedUnit}
                                </button>
                            ) : (
                                <button onClick={onVerification} className="w-full py-4 bg-amber-400 text-amber-900 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <ShieldCheck size={18} strokeWidth={3} /> Authorize Log
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Helper ---
const formatTimeDisplay = (iso?: string) => {
    if (!iso) return "---";
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- Main Component ---

interface CookingRecordProps {
  entries: CookingRecordEntry[];
  setEntries: React.Dispatch<React.SetStateAction<CookingRecordEntry[]>>;
  onIssueToCooling?: (cookEntry: CookingRecordEntry, quantity: number) => void;
}

const CookingRecord: React.FC<CookingRecordProps> = ({ entries, setEntries, onIssueToCooling }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'THAWED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
    const [now, setNow] = useState(Date.now());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    
    // ISO 22000 Doc Control State
    const [docControlData] = useState<DocControlInfo>({
        docRef: 'COOK-RGST-42',
        version: '2.1',
        effectiveDate: new Date().toISOString().split('T')[0],
        approvedBy: 'Quality Assurance Director'
    });

    // UI state
    const [activeModal, setActiveModal] = useState<'COOK' | 'FINALIZE' | 'VERIFY' | 'SPLIT' | 'SPLIT_COOKED' | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<CookingRecordEntry | null>(null);
    
    // Form state
    const [productNameInput, setProductNameInput] = useState("");
    const [tempInput, setTempInput] = useState("");
    const [cookedQtyInput, setCookedQtyInput] = useState("");
    const [tempImg, setTempImg] = useState<string | null>(null);
    const [vesselInput, setVesselInput] = useState(OVEN_NUMBERS[0]);
    const [signature, setSignature] = useState("");
    const [comments, setComments] = useState("");

    const [verificationComments, setVerificationComments] = useState("");
    const [verificationSignature, setVerificationSignature] = useState("");

    // Split state
    const [splitName, setSplitName] = useState("");
    const [splitQty, setSplitQty] = useState("");

    // Multi-split state for cooked food distribution
    const [stagedSplits, setStagedSplits] = useState<Array<{ id: string, quantity: string, purpose: string }>>([]);

    // Fixed: Corrected variable name from 'editingBrand' to 'editingEntryId' to fix Cannot find name 'editingBrand' error.
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTimeLapse = (start: string, end?: string) => {
        if (!start) return '--:--';
        const sTime = new Date(start).getTime();
        const eTime = end ? new Date(end).getTime() : now;
        const diff = Math.max(0, eTime - sTime);
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${hours}h ${mins}m ${secs}s`;
    };

    const stats = useMemo(() => ({
        total: entries.length,
        thawed: entries.filter(e => e.status === 'THAWED').length,
        inProgress: entries.filter(e => e.status === 'IN_PROGRESS').length,
        completed: entries.filter(e => e.status === 'COMPLETED').length,
        verified: entries.filter(e => e.isVerified).length,
    }), [entries]);

    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = e.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                e.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === 'ALL' || e.status === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [entries, searchTerm, activeFilter]);

    // Derived Selection State
    const selectableEntries = useMemo(() => {
        return filteredEntries.filter(e => {
            const totalWeight = Number(e.cookingQuantity) || 0;
            const distributedWeight = (e.issued || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
            const remainingToAssign = Math.max(0, totalWeight - distributedWeight);
            return e.status === 'COMPLETED' && remainingToAssign === 0 && totalWeight > 0 && !e.isVerified;
        });
    }, [filteredEntries]);

    const areAllSelected = useMemo(() => {
        return selectableEntries.length > 0 && selectableEntries.every(e => selectedIds.has(e.uuid));
    }, [selectableEntries, selectedIds]);

    const toggleSelectAll = () => {
        if (areAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(selectableEntries.map(e => e.uuid)));
        }
    };

    const toggleSelection = (uuid: string) => {
        const next = new Set(selectedIds);
        if (next.has(uuid)) next.delete(uuid);
        else next.add(uuid);
        setSelectedIds(next);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setTempImg(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleInitiateCook = () => {
        if (!selectedEntry || !tempInput || !signature) return;
        setEntries(prev => prev.map(e => e.uuid === selectedEntry.uuid ? {
            ...e,
            status: 'IN_PROGRESS',
            productName: productNameInput || e.productName,
            cookStart: new Date().toISOString(),
            initialTemp: parseFloat(tempInput),
            initialTempImg: tempImg || undefined,
            cookingVessel: vesselInput,
            initiatedBy: 'Chef Alex',
            initiatedBySign: signature,
            cookComments: comments
        } as CookingRecordEntry : e));
        setActiveModal(null);
        setTempImg(null);
    };

    const handleCompleteCooking = () => {
        const row = selectedEntry;
        if (!row) return;
        const stopTime = new Date().toISOString();
        setEntries(prev => prev.map(e => e.uuid === row.uuid ? { ...e, cookCompleted: stopTime } : e));
        setSelectedEntry({ ...row, cookCompleted: stopTime }); 
        setSignature(""); 
        setComments(""); 
        setCookedQtyInput(""); 
        setActiveModal('FINALIZE');
    };

    const handleFinalizeSubmit = () => {
        if (!selectedEntry || !cookedQtyInput) return;
        
        setEntries(prev => prev.map(e => e.uuid === selectedEntry.uuid ? {
            ...e,
            status: 'COMPLETED',
            cookingQuantity: parseFloat(cookedQtyInput),
            cookCompleted: new Date().toISOString(),
            completedBy: 'Chef Alex',
            completedBySign: '',
            cookComments: '',
            issued: [] 
        } as CookingRecordEntry : e));
        
        setActiveModal(null);
        setSelectedEntry(null);
        setTempImg(null);
        setCookedQtyInput("");
    };

    const commitVerify = () => {
        if (!verificationSignature) return;

        // Targets for verification: single selectedEntry OR bulk selectedIds
        const targetIds = selectedEntry ? [selectedEntry.uuid] : Array.from(selectedIds);

        if (targetIds.length === 0) return;

        setEntries((prev: CookingRecordEntry[]) => prev.map(e => {
            if (targetIds.includes(e.uuid)) {
                return {
                    ...e,
                    isVerified: true,
                    verifierName: 'Jane Smith (QA)',
                    verifierSignature: verificationSignature,
                    verificationComments: verificationComments,
                    verificationDate: new Date().toISOString()
                } as CookingRecordEntry;
            }
            return e;
        }));

        setActiveModal(null);
        setSelectedEntry(null);
        setSelectedIds(new Set());
        setVerificationSignature("");
        setVerificationComments("");
    };

    const handleSplitSubmit = () => {
        if (!selectedEntry || !splitName || !splitQty) return;
        const qty = parseFloat(splitQty);
        if (qty > selectedEntry.availableThawedQty) {
            alert("Split quantity cannot exceed available quantity.");
            return;
        }

        const timestamp = new Date().toISOString();
        const newChildId = `split-${Date.now()}`;
        
        const motherCurrentSplitTotal = (selectedEntry.splits?.reduce((a, b) => a + b.quantity, 0) || 0);
        const motherInitialLoadTotal = selectedEntry.totalThawedQty + motherCurrentSplitTotal;
        const parentNewAvailableQty = selectedEntry.availableThawedQty - qty;

        const newSplitRecord = {
            childId: newChildId,
            name: splitName.toUpperCase(),
            quantity: qty,
            timestamp: timestamp
        };

        const updatedSplitsList = [...(selectedEntry.splits || []), newSplitRecord];

        const newEntry: CookingRecordEntry = {
            ...selectedEntry,
            uuid: newChildId,
            productName: splitName.toUpperCase(),
            sourceProductName: selectedEntry.productName,
            parentName: selectedEntry.productName,
            parentTotalQty: motherInitialLoadTotal,
            parentAvailableQty: parentNewAvailableQty,
            totalThawedQty: qty,
            availableThawedQty: qty,
            cookingQuantity: 0,
            batchNumber: `${selectedEntry.batchNumber}-S${updatedSplitsList.length}`,
            status: 'THAWED',
            isVerified: false,
            cookStart: '',
            cookCompleted: '',
            initiatedBy: '',
            completedBy: '',
            issued: [],
            splits: updatedSplitsList 
        };

        setEntries(prev => {
            return prev.map(e => {
                if (e.uuid === selectedEntry.uuid) {
                    return {
                        ...e,
                        availableThawedQty: parentNewAvailableQty,
                        totalThawedQty: e.totalThawedQty - qty,
                        splits: updatedSplitsList
                    };
                }
                if (e.parentName === selectedEntry.productName && e.batchNumber.startsWith(selectedEntry.batchNumber)) {
                    return {
                        ...e,
                        parentAvailableQty: parentNewAvailableQty,
                        splits: updatedSplitsList
                    };
                }
                return e;
            }).concat(newEntry);
        });

        setActiveModal(null);
        setSplitName("");
        setSplitQty("");
    };

    const handleCookedSplitSubmit = () => {
        if (!selectedEntry) return;

        const totalToAssign = stagedSplits.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
        const currentIssued = (selectedEntry.issued || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
        const remainingToAssign = selectedEntry.cookingQuantity - currentIssued;

        if (totalToAssign > remainingToAssign) {
            alert(`Total distribution (${totalToAssign.toFixed(1)} ${selectedEntry.storedUnit}) exceeds remaining available quantity (${remainingToAssign.toFixed(1)} ${selectedEntry.storedUnit}).`);
            return;
        }

        const newIssuedItems = stagedSplits
            .filter(s => parseFloat(s.quantity) > 0)
            .map(s => ({
                id: `iss-ck-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                purpose: s.purpose,
                quantity: parseFloat(s.quantity),
                timestamp: new Date().toISOString()
            }));

        if (newIssuedItems.length === 0) return;

        setEntries(prev => prev.map(e => {
            if (e.uuid === selectedEntry.uuid) {
                return {
                    ...e,
                    issued: [...(e.issued || []), ...newIssuedItems]
                };
            }
            return e;
        }));

        // Trigger handoffs
        newIssuedItems.forEach(item => {
            if (item.purpose === 'Cooling' && onIssueToCooling) {
                onIssueToCooling(selectedEntry, item.quantity);
            }
        });

        setActiveModal(null);
        setSelectedEntry(null);
        setStagedSplits([]);
    };

    const addStagedSplit = () => {
        setStagedSplits(prev => [...prev, { id: Date.now().toString(), quantity: '', purpose: COOKED_PURPOSES[0] }]);
    };

    const removeStagedSplit = (id: string) => {
        if (stagedSplits.length <= 1) return;
        setStagedSplits(prev => prev.filter(s => s.id !== id));
    };

    const updateStagedSplit = (id: string, field: 'quantity' | 'purpose', value: string) => {
        setStagedSplits(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const generatePDFForEntries = async (targetEntries: CookingRecordEntry[], filename: string) => {
        const printArea = document.createElement('div');
        printArea.style.position = 'fixed';
        printArea.style.top = '-9999px';
        printArea.style.left = '0';
        printArea.style.width = '1400px'; 
        printArea.style.backgroundColor = 'white';
        printArea.style.padding = '0';
        printArea.style.fontFamily = 'Arial, Helvetica, sans-serif';
        printArea.style.color = '#1e293b';

        const securityId = `CERT-COOK-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const downloadTimestamp = new Date().toLocaleString();

        let htmlContent = `
            <div style="padding: 40px; background: #fff; min-height: 1000px; display: flex; flex-direction: column; position: relative;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 140px; font-weight: 900; color: rgba(226, 232, 240, 0.4); pointer-events: none; text-transform: uppercase; z-index: 0; white-space: nowrap;">Controlled Record</div>
                <div style="border: 2px solid #1e293b; margin-bottom: 25px; position: relative; z-index: 10; background: #fff;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 15%; padding: 15px; border-right: 2px solid #1e293b; text-align: center;">
                                <div style="width: 60px; height: 60px; margin: 0 auto;">
                                    ${renderToString(<Logo className="w-16 h-16" />)}
                                </div>
                            </td>
                            <td style="width: 55%; padding: 15px; border-right: 2px solid #1e293b;">
                                <div style="font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; color: #0f172a;">HACCP PRO ENTERPRISE SYSTEMS</div>
                                <div style="font-size: 16px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Bulk Cooking Control Registry (ISO 22000)</div>
                                <div style="font-size: 11px; margin-top: 8px; font-weight: 600; color: #64748b;">Consolidated Production Evidence Log</div>
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
                    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; border-radius: 4px;">
                        <thead>
                            <tr style="background: #1e293b; color: white; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; text-align: left;">
                                <th style="padding: 15px; border: 1px solid #000;">Unit Identification</th>
                                <th style="padding: 15px; border: 1px solid #000;">Cooked Food Info</th>
                                <th style="padding: 15px; border: 1px solid #000;">Material Analysis</th>
                                <th style="padding: 15px; border: 1px solid #000;">Process Telemetry</th>
                                <th style="padding: 15px; border: 1px solid #000;">Operator Details</th>
                                <th style="padding: 15px; border: 1px solid #000; text-align: center;">QR Code</th>
                                <th style="padding: 15px; border: 1px solid #000;">Verification</th>
                                <th style="padding: 15px; border: 1px solid #000; text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${targetEntries.map(e => {
                                const qrString = `COOK_REC_${e.uuid}\nNAME:${e.productName}\nBATCH:${e.batchNumber}\nVERIFIED:${e.isVerified ? 'YES' : 'NO'}`;
                                return `
                                <tr style="font-size: 10px; border-bottom: 1px solid #000; background: #fff;">
                                    <!-- 1. UNIT IDENTIFICATION -->
                                    <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                        <div style="font-weight: 900; color: #000; text-transform: uppercase; margin-bottom: 6px;">${e.locationName}</div>
                                        <div style="color: #475569; font-weight: 700; margin-bottom: 4px;">Dept: ${e.departmentName}</div>
                                        <div style="color: #64748b; font-size: 9px;">${e.unitName}</div>
                                        <div style="color: #94a3b8; font-size: 8px; margin-top: 2px;">${e.regionName}</div>
                                    </td>
                                    <!-- 2. COOKED FOOD INFO -->
                                    <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                        <div style="font-weight: 900; font-size: 12px; color: #4f46e5; margin-bottom: 6px; text-transform: uppercase;">${e.productName}</div>
                                        <div style="font-weight: 700; color: #0f172a;">DATE: ${e.cookCompleted ? e.cookCompleted.split('T')[0] : 'PENDING'}</div>
                                        <div style="color: #64748b; font-weight: 600; margin-top: 4px;">TIME: ${e.cookCompleted ? new Date(e.cookCompleted).toLocaleTimeString() : '---'}</div>
                                    </td>
                                    <!-- 3. MATERIAL ANALYSIS -->
                                    <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                        <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">PROCESSED: ${e.productName}</div>
                                        <div style="color: #475569; margin-bottom: 2px;">Source: ${e.sourceProductName}</div>
                                        <div style="color: #64748b; margin-bottom: 2px;">Category: ${e.category}</div>
                                        <div style="color: #64748b; margin-bottom: 2px;">Brand: ${e.brandName}</div>
                                        <div style="font-weight: 900; color: #000; margin-top: 6px; font-family: monospace;">BATCH: ${e.batchNumber}</div>
                                        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">ID: ${e.productId || e.uuid.split('-')[0]}</div>
                                        <div style="margin-top: 10px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                                            <div style="font-size: 8px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Thawing Trace:</div>
                                            <div style="font-size: 9px; font-weight: 700; color: #334155; margin-top: 2px;">
                                                ${e.thawStartTime ? new Date(e.thawStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                            </div>
                                            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Lapse: ${formatTimeLapse(e.thawStartTime, e.thawCompletedTime)}</div>
                                        </div>
                                    </td>
                                    <!-- 4. PROCESS TELEMETRY -->
                                    <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                        <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">Method: ${e.method || 'Standard Heat'}</div>
                                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                                            <div style="font-size: 16px; font-weight: 900; color: #e11d48;">${e.finalTemp || '---'}°C</div>
                                            ${e.finalTempImg ? `<img src="${e.finalTempImg}" style="width: 40px; height: 40px; border-radius: 4px; border: 1px solid #ddd;" />` : ''}
                                        </div>
                                        <div style="margin-top: 8px; color: #64748b; font-weight: 700;">Lapse: ${formatTimeLapse(e.cookStart, e.cookCompleted)}</div>
                                        <div style="margin-top: 8px; font-weight: 800; font-size: 9px; color: #4f46e5; text-transform: uppercase;">Purpose: ${e.cookingPurpose || 'Service'}</div>
                                    </td>
                                    <!-- 5. OPERATOR DETAILS -->
                                    <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                        <div style="font-weight: 800; color: #334155; margin-bottom: 6px;">${e.completedBy || 'N/A'}</div>
                                        ${e.completedBySign ? `<img src="${e.completedBySign}" style="max-height: 35px; mix-blend-multiply: multiply; margin-bottom: 6px;" />` : '<div style="height: 35px; border-bottom: 1px dashed #ddd; margin-bottom: 6px;"></div>'}
                                        <div style="font-size: 8px; color: #64748b; font-style: italic; line-height: 1.2;">${e.cookComments ? `"${e.cookComments}"` : 'No operator comments.'}</div>
                                    </td>
                                    <!-- 6. QR CODE -->
                                    <td style="padding: 12px; border: 1px solid #000; text-align: center; vertical-align: middle;">
                                        <div style="width: 80px; height: 80px; margin: 0 auto; background: #fff; padding: 5px; border: 1px solid #f1f5f9; border-radius: 4px;">
                                            ${renderToString(<QRCodeSVG value={qrString} size={80} level="H" />)}
                                        </div>
                                        <div style="font-size: 7px; color: #94a3b8; font-weight: 800; margin-top: 4px; text-transform: uppercase;">Product Passport</div>
                                    </td>
                                    <!-- 7. VERIFICATION -->
                                    <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                        <div style="font-weight: 900; color: #0f172a;">${e.verifierName || 'AWAITING AUTH'}</div>
                                        ${e.verifierSignature ? `<img src="${e.verifierSignature}" style="max-height: 35px; mix-blend-multiply: multiply; margin-top: 4px;" />` : '<div style="height: 35px; border-bottom: 1px dashed #ddd; margin-top: 4px;"></div>'}
                                        <div style="font-size: 8px; color: #64748b; font-style: italic; margin-top: 6px;">${e.verificationComments || '...'}</div>
                                    </td>
                                    <!-- 8. STATUS -->
                                    <td style="padding: 12px; border: 1px solid #000; text-align: center; vertical-align: middle;">
                                        <div style="padding: 6px; border-radius: 8px; font-weight: 900; text-transform: uppercase; font-size: 9px; ${e.isVerified ? 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;' : 'background: #fffbeb; color: #92400e; border: 1px solid #fef3c7;'}">
                                            ${e.isVerified ? 'VERIFIED' : e.status}
                                        </div>
                                        <div style="font-size: 8px; color: #94a3b8; margin-top: 6px; font-weight: 700;">${e.verificationDate ? e.verificationDate.split('T')[0] : ''}</div>
                                    </td>
                                </tr>
                                `}).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
                    <div style="display: flex; gap: 30px; margin-bottom: 25px;">
                        <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Lead Production Signature</div>
                            <div style="border-bottom: 1px solid #cbd5e1; height: 30px;"></div>
                        </div>
                        <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">QA Verification Authority</div>
                            <div style="border-bottom: 1px solid #cbd5e1; height: 30px;"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">
                        <div>Registry Synchronization: ${downloadTimestamp}</div>
                        <div>Tamper-Evident Hash: ${securityId}</div>
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
            console.error("PDF Export failed", err);
        } finally {
            document.body.removeChild(printArea);
        }
    };

    const handleExportGlobalPDF = async () => {
        if (filteredEntries.length === 0) return;
        setIsGeneratingPDF(true);
        const filename = `Complete_Cooking_Registry_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDFForEntries(filteredEntries, filename);
        setIsGeneratingPDF(false);
    };

    const handleExportSinglePDF = async (entry: CookingRecordEntry) => {
        setIsGeneratingPDF(true);
        const filename = `Cooking_Record_${entry.uuid}_${new Date().toISOString().split('T')[0]}.pdf`;
        await generatePDFForEntries([entry], filename);
        setIsGeneratingPDF(false);
    };

    const handleBulkVerifyClick = () => {
        if (selectedIds.size === 0) return;
        setSelectedEntry(null); // Clear single entry to signal bulk mode
        setVerificationComments("");
        setVerificationSignature("");
        setActiveModal('VERIFY');
    };

    return (
        <div className="flex flex-col h-full gap-6 p-4 md:p-0">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                {[
                    { label: 'Registry Pool', val: stats.total, color: 'bg-slate-900', icon: Database, id: 'ALL' },
                    { label: 'Thawed Ready', val: stats.thawed, color: 'bg-blue-600', icon: Snowflake, id: 'THAWED' },
                    { label: 'Heat Induction', val: stats.inProgress, color: 'bg-orange-500', icon: Flame, id: 'IN_PROGRESS' },
                    { label: 'Cycle Finished', val: stats.completed, color: 'bg-emerald-600', icon: CheckCircle2, id: 'COMPLETED' },
                    { label: 'Verified Auth', val: stats.verified, color: 'bg-amber-50', icon: ShieldCheck, id: 'VERIFIED' }
                ].map((stat, i) => (
                    <button 
                        key={i} 
                        onClick={() => stat.id !== 'VERIFIED' && setActiveFilter(stat.id as any)}
                        className={`p-6 rounded-[2.5rem] border-2 transition-all text-left flex flex-col justify-between group active:scale-95 ${activeFilter === stat.id ? 'bg-white border-indigo-600 shadow-xl' : 'bg-white border-slate-100 shadow-sm hover:border-indigo-200'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl ${stat.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon size={20} />
                        </div>
                        <div className="mt-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* INTEGRATED ACTION CARD */}
            <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
                    {/* Selection Tools */}
                    <button 
                        onClick={toggleSelectAll}
                        className={`p-3.5 rounded-2xl border-2 transition-all shadow-sm active:scale-95 ${areAllSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-400'}`}
                        title="Select All Eligible"
                    >
                        {areAllSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>

                    <div className="relative group w-full lg:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by product or batch..." 
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner uppercase tracking-wider"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    {selectedIds.size > 0 && (
                        <button 
                            onClick={handleBulkVerifyClick}
                            className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 animate-in zoom-in"
                        >
                            <ShieldCheck size={18} strokeWidth={3} /> Bulk Verify ({selectedIds.size})
                        </button>
                    )}
                    <button className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95" title="Filter Records">
                        <Filter size={20} />
                    </button>
                    <button 
                        onClick={handleExportGlobalPDF}
                        disabled={isGeneratingPDF}
                        className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50" 
                        title="Download Report"
                    >
                        {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                    </button>
                    <button className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95" title="Refresh Registry">
                        <RefreshCw size={20} />
                    </button>
                    <div className="w-px h-8 bg-slate-200 mx-2 hidden lg:block" />
                    <button 
                        onClick={() => {}} 
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={18} strokeWidth={3} /> New Entry
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {filteredEntries.map((row, idx) => (
                    <CookingCard 
                        key={row.uuid}
                        entry={row}
                        index={idx + 1}
                        isSelected={selectedIds.has(row.uuid)} 
                        onSelect={() => toggleSelection(row.uuid)}
                        onVerification={() => { 
                            setSelectedEntry(row); 
                            setVerificationSignature(""); 
                            setVerificationComments(""); 
                            setActiveModal('VERIFY'); 
                        }}
                        openCookModal={() => { setSelectedEntry(row); setProductNameInput(row.productName); setTempInput(""); setTempImg(null); setSignature(""); setComments(""); setActiveModal('COOK'); }}
                        handleCompleteCooking={() => { 
                            const stopTime = new Date().toISOString();
                            setEntries(prev => prev.map(e => e.uuid === row.uuid ? { ...e, cookCompleted: stopTime } : e));
                            setSelectedEntry({ ...row, cookCompleted: stopTime }); 
                            setSignature(""); 
                            setComments(""); 
                            setCookedQtyInput(""); 
                            setActiveModal('FINALIZE'); 
                        }}
                        onDownload={() => handleExportSinglePDF(row)}
                        formatTimeLapse={formatTimeLapse}
                        onSplit={() => { setSelectedEntry(row); setSplitName(""); setSplitQty(""); setActiveModal('SPLIT'); }}
                        onSplitCooked={() => { 
                            setSelectedEntry(row); 
                            const currentIssued = (row.issued || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
                            const remaining = Math.max(0, row.cookingQuantity - currentIssued);
                            setStagedSplits([{ id: '1', quantity: remaining > 0 ? remaining.toString() : '', purpose: COOKED_PURPOSES[0] }]); 
                            setActiveModal('SPLIT_COOKED'); 
                        }}
                        now={now}
                    />
                ))}
            </div>

            {/* MODALS */}
            <input type="file" ref={fileInputRef} capture="environment" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

            {/* SPLIT THAWED MODAL */}
            {activeModal === 'SPLIT' && selectedEntry && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
                        <div className="px-10 py-8 bg-indigo-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Split size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Split Thawed Batch</h3>
                                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Registry Sub-Division</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-6 text-left">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Source</p>
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none truncate">{selectedEntry.productName}</h4>
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Available Quantity</span>
                                    <span className="text-sm font-black text-indigo-600">{selectedEntry.availableThawedQty.toFixed(1)} {selectedEntry.storedUnit}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Product Name <span className="text-red-500">*</span></label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="E.G. SHREE..."
                                        className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black uppercase focus:border-indigo-500 outline-none shadow-inner"
                                        value={splitName}
                                        onChange={e => setSplitName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Split Quantity ({selectedEntry.storedUnit}) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            placeholder="0.0"
                                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-xl font-black focus:border-indigo-500 outline-none shadow-inner"
                                            value={splitQty}
                                            onChange={e => setSplitQty(e.target.value)}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">{selectedEntry.storedUnit}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 pb-safe">
                            <button onClick={() => setActiveModal(null)} className="px-8 py-3 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                            <button 
                                disabled={!splitName || !splitQty || parseFloat(splitQty) <= 0 || parseFloat(splitQty) > selectedEntry.availableThawedQty}
                                onClick={handleSplitSubmit} 
                                className={`px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${splitName && splitQty ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                <CheckCircle2 size={18} strokeWidth={3} /> Confirm Split
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SPLIT COOKED MODAL */}
            {activeModal === 'SPLIT_COOKED' && selectedEntry && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 h-[85vh] md:h-auto max-h-[90vh]">
                        <div className="px-10 py-8 bg-[#0f172a] text-white flex justify-between items-center shrink-0 shadow-lg">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Split size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Cooked Batch Assignment</h3>
                                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Split Purpose Logic</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24} strokeWidth={3} /></button>
                        </div>
                        <div className="p-8 space-y-6 text-left flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20">
                            {(() => {
                                const currentIssued = (selectedEntry.issued || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
                                const totalToAssign = stagedSplits.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
                                const remaining = Math.max(0, selectedEntry.cookingQuantity - currentIssued - totalToAssign);
                                return (
                                    <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><Package size={64}/></div>
                                        <div className="relative z-10 space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Production Registry</p>
                                                <h4 className="text-xl font-black uppercase tracking-tight truncate leading-none">{selectedEntry.productName}</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                                <div>
                                                    <p className="text-[8px] font-black text-white/40 uppercase">Total Yield</p>
                                                    <p className="text-lg font-black text-indigo-400">{selectedEntry.cookingQuantity.toFixed(1)} {selectedEntry.storedUnit}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-white/40 uppercase">Unassigned</p>
                                                    <p className={`text-lg font-black ${remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{remaining.toFixed(1)} {selectedEntry.storedUnit}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <GitPullRequest size={14} className="text-indigo-500" /> Distribution Breakdown
                                </h5>
                                
                                {stagedSplits.map((split, idx) => (
                                    <div key={split.id} className="bg-white p-5 rounded-3xl border-2 border-slate-100 space-y-4 relative group/s animate-in slide-in-from-left-2 relative group">
                                        {stagedSplits.length > 1 && (
                                            <button 
                                                onClick={() => removeStagedSplit(split.id)}
                                                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Purpose</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl text-xs font-black uppercase focus:border-indigo-400 outline-none shadow-inner cursor-pointer transition-all"
                                                    value={split.purpose}
                                                    onChange={e => updateStagedSplit(split.id, 'purpose', e.target.value)}
                                                >
                                                    {COOKED_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity ({selectedEntry.storedUnit})</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        step="0.1"
                                                        placeholder="0.0"
                                                        className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-black focus:border-indigo-500 outline-none shadow-inner transition-all"
                                                        value={split.quantity}
                                                        onChange={e => updateStagedSplit(split.id, 'quantity', e.target.value)}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">{selectedEntry.storedUnit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button 
                                    onClick={addStagedSplit}
                                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    <PlusCircle size={18} /> Add Another Distribution
                                </button>
                            </div>
                        </div>
                        <div className="px-10 py-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-end gap-3 shrink-0 pb-safe">
                            <button onClick={() => setActiveModal(null)} className="px-10 py-4 text-[10px] font-black uppercase text-slate-400 transition-colors">Discard</button>
                            <button 
                                onClick={handleCookedSplitSubmit} 
                                disabled={stagedSplits.some(s => !s.quantity || parseFloat(s.quantity) <= 0)}
                                className={`px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${stagedSplits.every(s => s.quantity && parseFloat(s.quantity) > 0) ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                <CheckCircle2 size={18} strokeWidth={3} /> Commit Distribution
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* COOK MODAL */}
            {activeModal === 'COOK' && selectedEntry && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 h-[85vh] md:h-auto max-h-[90vh]">
                        <div className="px-10 py-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <Flame size={32} />
                                <div><h3 className="text-xl font-black uppercase tracking-tight">{editingEntryId ? 'Edit Identity' : 'Initiate Cooking'}</h3><p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Heat Induction Registry</p></div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-6 overflow-y-auto flex-1 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name <span className="text-red-500">*</span></label>
                                <input required value={productNameInput} onChange={e => setProductNameInput(e.target.value)} className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-black uppercase focus:border-indigo-500 outline-none shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cooking Vessel</label>
                                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase" value={vesselInput} onChange={e => setVesselInput(e.target.value)}>
                                    {OVEN_NUMBERS.map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intake Temp (°C)</label>
                                <div className="flex gap-2">
                                    <input type="number" step="0.1" autoFocus className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-lg font-black focus:border-indigo-500 outline-none shadow-inner" placeholder="0.0" value={tempInput} onChange={e => setTempInput(e.target.value)} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-4 rounded-xl transition-all shadow-sm ${tempImg ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300 hover:text-indigo-600'}`}>
                                        <Camera size={24}/>
                                    </button>
                                </div>
                                {tempImg && (
                                    <div className="mt-2 relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-sm animate-in zoom-in-95">
                                        <img src={tempImg} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setTempImg(null)} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1"><X size={10} strokeWidth={4}/></button>
                                    </div>
                                )}
                            </div>
                            <SignaturePad onSave={setSignature} label="Operator Auth Signature" />
                        </div>
                        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 pb-safe">
                            <button onClick={() => setActiveModal(null)} className="px-8 py-3 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                            <button disabled={!tempInput || !signature || !productNameInput} onClick={handleInitiateCook} className={`px-12 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${tempInput && signature && productNameInput ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Start Cooking</button>
                        </div>
                    </div>
                </div>
            )}

            {/* FINALIZE MODAL */}
            {activeModal === 'FINALIZE' && selectedEntry && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 h-[85vh] md:h-auto max-h-[90vh]">
                        <div className="px-10 py-8 bg-orange-600 text-white flex justify-between items-center shrink-0 shadow-lg">
                            <div className="flex items-center gap-5">
                                <Timer size={32} />
                                <div><h3 className="text-xl font-black uppercase tracking-tight text-white">Stop Process Timer</h3><p className="text-[10px] font-bold text-orange-100 uppercase tracking-widest mt-1">Finalize Production Cycle</p></div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24} strokeWidth={3} /></button>
                        </div>
                        <div className="p-10 space-y-6 overflow-y-auto flex-1 text-left">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-2 space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Process Summary</p>
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">{selectedEntry.productName}</h4>
                                <div className="flex gap-4 mt-2">
                                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase">Intake Temp</span><span className="text-sm font-black text-slate-700">{selectedEntry.initialTemp}°C</span></div>
                                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase">Active Time</span><span className="text-sm font-black text-orange-600">{formatTimeLapse(selectedEntry.cookStart, selectedEntry.cookCompleted)}</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Cooked Weight ({selectedEntry.storedUnit})</label>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-lg font-black outline-none focus:border-indigo-500 shadow-inner" 
                                        placeholder="0.0" 
                                        value={cookedQtyInput}
                                        onChange={e => setCookedQtyInput(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 pb-safe">
                            <button onClick={() => setActiveModal(null)} className="px-8 py-3 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                            <button 
                                disabled={!cookedQtyInput} 
                                onClick={handleFinalizeSubmit} 
                                className={`px-12 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${cookedQtyInput ? 'bg-orange-600 text-white shadow-orange-100 hover:bg-orange-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                <CheckCircle2 size={18} strokeWidth={3} /> Stop Timer & Finalize
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'VERIFY' && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95">
                        <div className="px-10 py-8 bg-emerald-600 text-white flex justify-between items-center shrink-0 shadow-lg">
                            <div className="flex items-center gap-4">
                                <ShieldCheck size={28} strokeWidth={3} />
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight leading-none">Authority Node Verification</h3>
                                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mt-1">Registry Synchronization Node</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={28} strokeWidth={3} /></button>
                        </div>
                        <div className="p-10 space-y-8 bg-slate-50/20 text-left">
                            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-5">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                    {selectedEntry ? <CheckCircle2 size={24}/> : <Layers size={24}/>}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{selectedEntry ? 'Batch to Verify' : 'Bulk Verification'}</p>
                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter truncate">
                                        {selectedEntry ? selectedEntry.productName : `${selectedIds.size} Records Selected`}
                                    </h4>
                                </div>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Verification Audit Notes</label>
                                <textarea 
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 shadow-inner resize-none h-32" 
                                    placeholder="Enter findings for the selected batch..." 
                                    value={verificationComments} 
                                    onChange={e => setVerificationComments(e.target.value)} 
                                />
                            </div>
                            <SignaturePad onSave={setVerificationSignature} initialData={verificationSignature} label="QA Verifier Authority Signature" />
                        </div>
                        <div className="px-10 py-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0 pb-safe">
                            <button onClick={() => setActiveModal(null)} className="px-10 py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest order-2 sm:order-1 transition-colors">Cancel</button>
                            <button 
                                disabled={!verificationSignature} 
                                onClick={commitVerify} 
                                className={`px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all order-1 sm:order-2 ${verificationSignature ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                            >
                                Finalize Authorization
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CookingRecord;
