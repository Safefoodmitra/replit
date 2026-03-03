"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  Plus, Snowflake, Search, Filter, 
  CheckCircle2, History, X,
  Thermometer, Clock, MapPin, Camera, Building2,
  CheckCheck, Zap, Calendar, ShieldCheck, Waves, PenTool,
  ChevronLeft, ChevronsLeft, ChevronsRight, FileDown,
  ClipboardList, ShieldAlert, Timer, ImageIcon, Eraser,
  Split, Warehouse, Info, Loader2, Play, Package,
  Globe, Check, Droplets, Microwave,
  ChevronRight, Hourglass, Lock,
  PlusCircle,
  Trash2,
  Download,
  CheckSquare,
  Square,
  TrendingUp,
  Activity,
  ZapOff,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  XCircle,
  QrCode,
  Save,
  User,
  Shield
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';
import Logo from './Logo';

// --- Types ---

interface IssuedItem {
  id: string;
  location: string;
  quantity: number;
  timestamp: string;
}

type ThawMethod = 'Refrigerator' | 'Chilled water' | 'Microwave';

const MOCK_DEPTS = [
    "Main Kitchen", "Banquet Kitchen", "Bakery Section", "Pastry Section", 
    "Butchery", "Cold Kitchen", "Staff Cafeteria", "Production Line 1", 
    "Production Line 2", "Dispatch Area", "Satellite Kitchen", "Events Hall"
];

interface ThawingRecordEntry {
  uuid: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  productName: string;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  supplierName: string;
  thawStartDate: string; 
  
  // Column 2 - Initiation
  thawMethod?: ThawMethod;
  thawStartTime?: string; 
  initialTemp?: number;
  initialTempImg?: string;
  waterTemp?: number;
  waterTempImg?: string;
  initiatedBy?: string;
  initiatedBySign?: string;
  initiationComments?: string;
  
  // Column 3 - Termination
  thawEndDate?: string;
  thawEndTime?: string; 
  finalTemp?: number;
  finalTempImg?: string;
  secondaryShelfLife?: string; 
  secondaryExpiry?: string;
  completedBy?: string;
  completedBySign?: string;
  completionComments?: string;
  totalQuantity: number;
  remainingQuantity: number;
  issued: IssuedItem[];

  // Column 5 - Verification
  isVerified: boolean;
  verifierName?: string;
  verificationComments?: string; 
  verifierSignature?: string; 
  verificationDate?: string;

  unitName: string;
  locationName: string;
  regionalName: string;
  departmentName: string;
}

// --- ISO 22000 Types ---
interface DocControlInfo {
    docRef: string;
    version: string;
    effectiveDate: string;
    approvedBy: string;
}

// --- Helper Components ---

const SearchableDropdown = ({ options, value, onChange, placeholder }: { options: string[], value: string, onChange: (val: string) => void, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-4 bg-white border-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
            >
                <span className={value ? "text-slate-800" : "text-slate-400"}>{value || placeholder}</span>
                <ChevronDown size={14} className="text-slate-400" />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-slate-50 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input
                                autoFocus
                                className="w-full pl-7 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-400"
                                placeholder="Search location..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <div
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                                className="px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            >
                                {opt}
                            </div>
                        )) : <div className="px-3 py-2 text-[10px] text-slate-400 italic">No matches</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

const SignaturePad: React.FC<{ onSave: (data: string) => void, initialData?: string, label?: string }> = ({ onSave, initialData, label = "Digital Signature" }) => {
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
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
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
        <div className="space-y-2 text-left">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                <button type="button" onClick={clear} className="text-[9px] font-black text-rose-500 uppercase hover:underline flex items-center gap-1">
                    <Eraser size={10} /> Reset
                </button>
            </div>
            <div className="w-full h-24 bg-slate-50 border-2 border-slate-100 border-dashed rounded-2xl relative overflow-hidden shadow-inner cursor-crosshair">
                <canvas ref={canvasRef} width={500} height={96} className="w-full h-full" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw} />
            </div>
        </div>
    );
};

// --- Main ThawingRecord Component ---

interface ThawingRecordProps {
  entries: ThawingRecordEntry[];
  setEntries: React.Dispatch<React.SetStateAction<any[]>>;
  onIssueToCooking?: (thawEntry: ThawingRecordEntry, quantity: number, location: string) => void;
}

export default function ThawingRecord({ entries, setEntries, onIssueToCooking }: ThawingRecordProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [now, setNow] = useState(Date.now());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // ISO 22000 Doc Control State
  const [docControlData] = useState<DocControlInfo>({
      docRef: 'THAW-RGST-22',
      version: '1.4',
      effectiveDate: new Date().toISOString().split('T')[0],
      approvedBy: 'Quality Assurance Director'
  });

  // Modal State
  const [activeModal, setActiveModal] = useState<'STEP1' | 'STEP2' | 'VERIFY' | 'BULK_VERIFY' | 'ISSUE' | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ThawingRecordEntry | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<any>({});
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeLapseInternal = (start?: string, end?: string, currentNow?: number) => {
    if (!start) return '--:--';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : (currentNow || now);
    const diff = Math.max(0, endTime - startTime);
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };

  const stats = useMemo(() => {
      const pending = entries.filter(e => e.status === 'PENDING').length;
      const inFlow = entries.filter(e => e.status === 'IN_PROGRESS').length;
      const dueAuth = entries.filter(e => e.status === 'COMPLETED' && !e.isVerified).length;
      const verified = entries.filter(e => e.isVerified).length;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const todayCount = entries.filter(e => e.thawStartDate === todayStr).length;
      const total = entries.length;
      const avgDay = (total / 7).toFixed(1);

      let totalLapse = 0;
      let lapseCount = 0;
      entries.forEach(e => {
          if (e.thawStartTime && e.thawEndTime) {
              const diff = new Date(e.thawEndTime).getTime() - new Date(e.thawStartTime).getTime();
              totalLapse += diff;
              lapseCount++;
          }
      });
      const avgLapseMs = lapseCount ? totalLapse / lapseCount : 0;
      const avgLapse = lapseCount 
          ? `${Math.floor(avgLapseMs / 3600000)}h ${Math.floor((avgLapseMs % 3600000) / 60000)}m` 
          : '---';

      return { pending, inFlow, dueAuth, verified, todayCount, total, avgDay, avgLapse };
  }, [entries]);

  const filteredEntries = useMemo(() => {
      let data = entries;
      if (statusFilter === 'PENDING') data = data.filter(e => e.status === 'PENDING');
      else if (statusFilter === 'IN_PROGRESS') data = data.filter(e => e.status === 'IN_PROGRESS');
      else if (statusFilter === 'DUE_AUTH') data = data.filter(e => e.status === 'COMPLETED' && !e.isVerified);
      else if (statusFilter === 'VERIFIED') data = data.filter(e => e.isVerified);

      if (dateFrom) {
        data = data.filter(e => new Date(e.thawStartDate) >= new Date(dateFrom));
      }
      if (dateTo) {
        data = data.filter(e => new Date(e.thawStartDate) <= new Date(dateTo));
      }

      return data.filter(e => e.productName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [entries, searchTerm, statusFilter, dateFrom, dateTo]);

  const paginatedEntries = useMemo(() => {
      const start = (currentPage - 1) * rowsPerPage;
      return filteredEntries.slice(start, start + rowsPerPage);
  }, [filteredEntries, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredEntries.length / rowsPerPage);

  const toggleCard = (id: string) => {
    const next = new Set(expandedCardIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedCardIds(next);
  };

  const handleOpenStep1 = (entry: ThawingRecordEntry) => {
      setSelectedEntry(entry);
      setFormData({
          thawMethod: 'Refrigerator',
          initialTemp: '',
          waterTemp: '',
          initiatedBy: 'Chef User',
          initiationComments: '',
          signature: ''
      });
      setActiveModal('STEP1');
  };

  const handleOpenStep2 = (entry: ThawingRecordEntry) => {
      setSelectedEntry(entry);
      setFormData({
          finalTemp: '',
          completedBy: 'Chef User',
          completionComments: '',
          signature: ''
      });
      setActiveModal('STEP2');
  };

  const handleOpenVerify = (entry: ThawingRecordEntry) => {
      setSelectedEntry(entry);
      setFormData({
          verifierName: 'QA Manager',
          verificationComments: '',
          signature: ''
      });
      setActiveModal('VERIFY');
  };

  const handleBulkVerifyOpen = () => {
      if (selectedIds.size === 0) return;
      setFormData({
          verifierName: 'QA Manager',
          verificationComments: 'Batch verification of thawing records.',
          signature: ''
      });
      setActiveModal('BULK_VERIFY');
  };

  const handleOpenIssue = (entry: ThawingRecordEntry) => {
      setSelectedEntry(entry);
      setFormData({
          splits: [{ id: Date.now(), location: '', quantity: '' }]
      });
      setActiveModal('ISSUE');
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setFormData((prev: any) => ({ ...prev, [field]: ev.target?.result as string }));
          };
          reader.readAsDataURL(file as Blob);
      }
      e.target.value = '';
  };

  const handleSubmitStep1 = () => {
      if (!selectedEntry) return;
      const nowIso = new Date().toISOString();
      setEntries(prev => prev.map(e => e.uuid === selectedEntry.uuid ? {
          ...e,
          status: 'IN_PROGRESS',
          thawStartTime: nowIso,
          thawMethod: formData.thawMethod,
          initialTemp: parseFloat(formData.initialTemp),
          initialTempImg: formData.initialTempImg,
          waterTemp: parseFloat(formData.waterTemp),
          waterTempImg: formData.waterTempImg,
          initiatedBy: formData.initiatedBy,
          initiatedBySign: formData.signature,
          initiationComments: formData.initiationComments
      } : e));
      setActiveModal(null);
  };

  const handleSubmitStep2 = () => {
      if (!selectedEntry) return;
      const nowIso = new Date().toISOString();
      const shelfLifeDate = new Date(nowIso);
      shelfLifeDate.setDate(shelfLifeDate.getDate() + 1);
      
      setEntries(prev => prev.map(e => e.uuid === selectedEntry.uuid ? {
          ...e,
          status: 'COMPLETED',
          thawEndTime: nowIso,
          thawEndDate: nowIso.split('T')[0],
          finalTemp: parseFloat(formData.finalTemp),
          finalTempImg: formData.finalTempImg,
          completedBy: formData.completedBy,
          completedBySign: formData.signature,
          completionComments: formData.completionComments,
          secondaryShelfLife: '24 Hours',
          secondaryExpiry: shelfLifeDate.toISOString()
      } : e));
      setActiveModal(null);
  };

  const handleSubmitVerify = () => {
      if (!selectedEntry) return;
      setEntries(prev => prev.map(e => e.uuid === selectedEntry.uuid ? {
          ...e,
          isVerified: true,
          verifierName: formData.verifierName,
          verifierSignature: formData.signature,
          verificationComments: formData.verificationComments,
          verificationDate: new Date().toISOString()
      } : e));
      setActiveModal(null);
  };

  const handleSubmitBulkVerify = () => {
      const nowIso = new Date().toISOString();
      setEntries(prev => prev.map(e => {
          if (selectedIds.has(e.uuid) && e.status === 'COMPLETED' && !e.isVerified && e.remainingQuantity === 0) {
              return {
                  ...e,
                  isVerified: true,
                  verifierName: formData.verifierName,
                  verifierSignature: formData.signature,
                  verificationComments: formData.verificationComments,
                  verificationDate: nowIso
              };
          }
          return e;
      }));
      setSelectedIds(new Set());
      setActiveModal(null);
  };

  const handleSubmitIssue = () => {
      if (!selectedEntry) return;
      const splits = formData.splits || [];
      let totalSplitQty = 0;
      const validSplits: any[] = [];
      for (const split of splits) {
          const qty = parseFloat(split.quantity);
          if (!split.location) { alert("Please select a location for all entries."); return; }
          if (isNaN(qty) || qty <= 0) { alert("Please enter valid quantities."); return; }
          totalSplitQty += qty;
          validSplits.push({ location: split.location, quantity: qty });
      }
      if (totalSplitQty > selectedEntry.remainingQuantity) {
          alert(`Total split quantity (${totalSplitQty} KG) exceeds available quantity (${selectedEntry.remainingQuantity} KG).`);
          return;
      }
      const newItems: IssuedItem[] = validSplits.map(s => ({
          id: `iss-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          location: s.location,
          quantity: s.quantity,
          timestamp: new Date().toISOString()
      }));

      // HANDSHAKE TRIGGER: Push issued thawed materials to the Cooking buffer
      if (onIssueToCooking) {
          validSplits.forEach(s => {
              onIssueToCooking(selectedEntry, s.quantity, s.location);
          });
      }

      setEntries(prev => prev.map(e => e.uuid === selectedEntry.uuid ? {
          ...e,
          remainingQuantity: e.remainingQuantity - totalSplitQty,
          issued: [...e.issued, ...newItems]
      } : e));
      setActiveModal(null);
  };

  const updateSplitRow = (id: number, field: string, value: string) => {
      setFormData((prev: any) => ({
          ...prev,
          splits: prev.splits.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
      }));
  };

  const addSplitRow = () => {
      setFormData((prev: any) => ({
          ...prev,
          splits: [...prev.splits, { id: Date.now() + Math.random(), location: '', quantity: '' }]
      }));
  };

  const removeSplitRow = (id: number) => {
      setFormData((prev: any) => ({
          ...prev,
          splits: prev.splits.filter((s: any) => s.id !== id)
      }));
  };

  const handleFilterClick = (filter: string) => {
      if (statusFilter === filter) setStatusFilter(null);
      else setStatusFilter(filter);
  };

  const handleRefresh = () => {
      setSearchTerm("");
      setStatusFilter(null);
      setDateFrom("");
      setDateTo("");
      setCurrentPage(1);
  };

  // --- ISO 22000 PDF EXPORT (High-Fidelity Grid Implementation) ---
  const handleExportSinglePDF = async (entry: ThawingRecordEntry) => {
    setIsGeneratingPDF(true);
    
    const printArea = document.createElement('div');
    printArea.style.position = 'fixed';
    printArea.style.top = '-9999px';
    printArea.style.left = '0';
    printArea.style.width = '800px'; 
    printArea.style.backgroundColor = 'white';
    printArea.style.padding = '0';
    printArea.style.fontFamily = 'Arial, Helvetica, sans-serif';
    printArea.style.color = '#000';

    const securityId = `THAW-AUTH-${entry.uuid.substring(0, 8).toUpperCase()}`;
    const timestamp = new Date().toLocaleString();
    
    // QR Code points to a simulated verification URL
    const qrUrl = `https://haccppro.com/registry/thaw/${entry.uuid}`;

    let htmlContent = `
        <div style="padding: 40px; background: #fff; width: 100%; box-sizing: border-box;">
            <!-- TITLE -->
            <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 25px;">
                <h1 style="font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 4px; color: #000;">Thawing Record</h1>
            </div>

            <!-- GRID TABLE START -->
            <table style="width: 100%; border-collapse: collapse; border: 3px solid #000;">
                <!-- ROW 1: Product / Batch / Dates -->
                <tr style="height: 100px;">
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 6px;">Product Name:</div>
                        <div style="font-size: 16px; font-weight: 900; text-transform: uppercase; color: #000;">${entry.productName}</div>
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-top: 15px; margin-bottom: 6px;">Vendor Name:</div>
                        <div style="font-size: 14px; font-weight: 700;">${entry.supplierName}</div>
                    </td>
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; text-align: center; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 10px;">Batch Number:</div>
                        <div style="font-size: 20px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 1px; color: #000;">${entry.batchNumber}</div>
                    </td>
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 8px;">Mfd and expiry date:</div>
                        <div style="font-size: 13px; font-weight: 800; color: #333;">MFG: ${entry.mfgDate}</div>
                        <div style="font-size: 13px; font-weight: 800; margin-top: 8px; color: #e11d48;">EXP: ${entry.expDate}</div>
                    </td>
                </tr>

                <!-- ROW 2: Start / End Date Time -->
                <tr style="height: 100px;">
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 8px;">Starting date and time:</div>
                        <div style="font-size: 15px; font-weight: 900; color: #000;">${entry.thawStartTime ? new Date(entry.thawStartTime).toLocaleString() : 'AWAITING NODE'}</div>
                    </td>
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; text-align: center; background: #fafafa;">
                        <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #cbd5e1; letter-spacing: 2px;">Registry Processor Node</div>
                    </td>
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 8px;">End Date and Time:</div>
                        <div style="font-size: 15px; font-weight: 900; color: #000;">${entry.thawEndTime ? new Date(entry.thawEndTime).toLocaleString() : 'PENDING TERMINATION'}</div>
                    </td>
                </tr>

                <!-- ROW 3: Temps -->
                <tr style="height: 100px;">
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 8px;">Starting Temp:</div>
                        <div style="font-size: 32px; font-weight: 900; color: #e11d48; letter-spacing: -1px;">${entry.initialTemp !== undefined ? `${entry.initialTemp}°C` : '---'}</div>
                    </td>
                    <td style="width: 33.3%; border: 2px solid #000; padding: 15px; text-align: center; vertical-align: middle;">
                         <div style="width: 90px; height: 90px; margin: 0 auto; background: #fff; padding: 8px; border: 1px solid #eee; border-radius: 8px;">
                            ${renderToString(<QRCodeSVG value={qrUrl} size={90} level="H" includeMargin={false} />)}
                        </div>
                        <div style="font-size: 7px; font-weight: 900; text-transform: uppercase; margin-top: 8px; color: #999;">Scan for Validation</div>
                    </td>
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 8px;">Ending Temp:</div>
                        <div style="font-size: 32px; font-weight: 900; color: #10b981; letter-spacing: -1px;">${entry.finalTemp !== undefined ? `${entry.finalTemp}°C` : '---'}</div>
                    </td>
                </tr>

                <!-- ROW 4: Images -->
                <tr style="height: 250px;">
                    <td style="width: 33.3%; border: 2px solid #000; padding: 15px; text-align: center;">
                        <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                            ${entry.initialTempImg ? `<img src="${entry.initialTempImg}" style="max-width: 100%; max-height: 200px; border-radius: 12px; border: 2px solid #000;" />` : `<div style="font-size: 10px; color: #ccc; text-transform: uppercase; font-weight: 900; border: 2px dashed #eee; padding: 40px; border-radius: 12px;">Initiation Core Temp Proof</div>`}
                        </div>
                    </td>
                    <td style="width: 33.3%; border: 2px solid #000; background: #fafafa;"></td>
                    <td style="width: 33.3%; border: 2px solid #000; padding: 15px; text-align: center;">
                        <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                            ${entry.finalTempImg ? `<img src="${entry.finalTempImg}" style="max-width: 100%; max-height: 200px; border-radius: 12px; border: 2px solid #000;" />` : `<div style="font-size: 10px; color: #ccc; text-transform: uppercase; font-weight: 900; border: 2px dashed #eee; padding: 40px; border-radius: 12px;">Final Core Temp Proof</div>`}
                        </div>
                    </td>
                </tr>

                <!-- ROW 5: Name and Sign -->
                <tr style="height: 120px;">
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 12px;">Operator Name and Sign (In):</div>
                        <div style="font-size: 14px; font-weight: 900; margin-bottom: 8px;">${entry.initiatedBy || '---'}</div>
                        ${entry.initiatedBySign ? `<img src="${entry.initiatedBySign}" style="max-height: 50px; mix-blend-multiply: multiply;" />` : '<div style="height: 50px; border-bottom: 1px dashed #ccc;"></div>'}
                    </td>
                    <td style="width: 33.3%; border: 2px solid #000; background: #fafafa;"></td>
                    <td style="width: 33.3%; border: 2px solid #000; padding: 20px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 12px;">Operator Name and Sign (Out):</div>
                        <div style="font-size: 14px; font-weight: 900; margin-bottom: 8px;">${entry.completedBy || '---'}</div>
                        ${entry.completedBySign ? `<img src="${entry.completedBySign}" style="max-height: 50px; mix-blend-multiply: multiply;" />` : '<div style="height: 50px; border-bottom: 1px dashed #ccc;"></div>'}
                    </td>
                </tr>

                <!-- ROW 6: Verification Full Width -->
                <tr>
                    <td colspan="3" style="border: 2px solid #000; padding: 25px; vertical-align: top; background: #fcfcfc;">
                        <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #000; margin-bottom: 15px; border-bottom: 3px solid #000; display: inline-block;">Verification Node (QA Sign-off)</div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div style="flex: 1;">
                                <div style="font-size: 18px; font-weight: 900; margin-bottom: 8px; color: #000;">${entry.verifierName || 'AWAITING QA AUTHORIZATION'}</div>
                                <div style="font-size: 12px; color: #666; font-style: italic;">"${entry.verificationComments || '...'}"</div>
                            </div>
                            <div style="width: 240px; text-align: right;">
                                ${entry.verifierSignature ? `<img src="${entry.verifierSignature}" style="max-height: 70px; mix-blend-multiply: multiply;" />` : '<div style="height: 60px; border-bottom: 2px dashed #000;"></div>'}
                                <div style="font-size: 10px; font-weight: 900; color: #999; margin-top: 8px; text-transform: uppercase;">Auth Date: ${entry.verificationDate || '---'}</div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- FOOTER INFO -->
            <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 9px; font-weight: 900; color: #999; text-transform: uppercase; letter-spacing: 2px;">
                <div>Registry Sync ID: ${entry.uuid}</div>
                <div>Integrity Fingerprint: ${securityId}</div>
                <div>Generated: ${timestamp}</div>
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
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pdfWidth - 60; // larger margin
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 30, 40, imgWidth, imgHeight, undefined, 'FAST');
        pdf.save(`Thawing_Record_${entry.uuid.substring(0,8)}.pdf`);
    } catch (err) {
        console.error("Single PDF Export failed", err);
    } finally {
        document.body.removeChild(printArea);
        setIsGeneratingPDF(false);
    }
  };

  const handleExportPDFBulk = async () => {
    if (filteredEntries.length === 0) return;
    setIsGeneratingPDF(true);
    
    const printArea = document.createElement('div');
    printArea.style.position = 'fixed';
    printArea.style.top = '-9999px';
    printArea.style.left = '0';
    printArea.style.width = '1400px'; 
    printArea.style.backgroundColor = 'white';
    printArea.style.padding = '0';
    printArea.style.fontFamily = 'Arial, Helvetica, sans-serif';
    printArea.style.color = '#1e293b';

    const securityId = `CERT-THAW-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const nowTimestamp = new Date().toLocaleString();

    let htmlContent = `
        <div style="padding: 50px; background: #fff; min-height: 1200px; display: flex; flex-direction: column; position: relative;">
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
                            <div style="font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Thawing Control Registry (ISO 22:2018)</div>
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
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                    <thead>
                        <tr style="background: #1e293b; color: white; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; text-align: left;">
                            <th style="padding: 12px; border: 1px solid #000; width: 18%;">Product Details</th>
                            <th style="padding: 12px; border: 1px solid #000; width: 18%;">Thawing Initiation</th>
                            <th style="padding: 12px; border: 1px solid #000; width: 18%;">Thawing Termination</th>
                            <th style="padding: 12px; border: 1px solid #000; width: 16%;">Split Portfolio</th>
                            <th style="padding: 12px; border: 1px solid #000; width: 12%; text-align: center;">QR Code</th>
                            <th style="padding: 12px; border: 1px solid #000; width: 18%;">Verification</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredEntries.map(e => {
                            const qrPayload = `THAWING_VERIFIED_RECORD\nID:${e.uuid}\nPRODUCT:${e.productName}\nBATCH:${e.batchNumber}\nSTART:${e.thawStartTime || 'N/A'}\nEND:${e.thawEndTime || 'N/A'}\nTEMP_INITIAL:${e.initialTemp || '--'}C\nTEMP_FINAL:${e.finalTemp || '--'}C\nAUTH:${e.verifierName || 'PENDING'}`;
                            
                            return `
                            <tr style="font-size: 10px; border-bottom: 1px solid #000; background: #fff;">
                                <!-- 1. PRODUCT DETAILS -->
                                <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                    <div style="font-weight: 900; color: #000; text-transform: uppercase; margin-bottom: 6px;">${e.productName}</div>
                                    <div style="font-weight: 800; color: #475569; font-family: monospace; margin-bottom: 4px;">BATCH: ${e.batchNumber}</div>
                                    <div style="font-size: 9px; color: #64748b; margin-top: 8px;">
                                        <div style="margin-bottom: 2px;">Unit: ${e.unitName}</div>
                                        <div style="margin-bottom: 2px;">Region: ${e.regionalName}</div>
                                        <div style="margin-bottom: 4px;">Dept: ${e.departmentName}</div>
                                    </div>
                                    <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 6px;">
                                        <div style="font-weight: 700;">MFG: ${e.mfgDate}</div>
                                        <div style="font-weight: 700; color: #e11d48; margin-top: 2px;">EXP: ${e.expDate}</div>
                                    </div>
                                    <div style="font-weight: 800; color: #4f46e5; margin-top: 8px;">VENDOR: ${e.supplierName}</div>
                                </td>

                                <!-- 2. INITIATION DETAILS -->
                                <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                    <div style="font-weight: 800; color: #000; margin-bottom: 6px;">METHOD: ${e.thawMethod || 'N/A'}</div>
                                    <div style="font-size: 9px; margin-bottom: 4px;">START: ${e.thawStartTime ? new Date(e.thawStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '---'}</div>
                                    <div style="font-size: 14px; font-weight: 900; color: #e11d48; margin-top: 8px;">INITIAL: ${e.initialTemp !== undefined ? e.initialTemp : '--'}°C</div>
                                    ${e.initialTempImg ? `<img src="${e.initialTempImg}" style="width: 40px; height: 40px; border-radius: 4px; border: 1px solid #ddd; margin-top: 8px;" />` : ''}
                                    ${e.thawMethod === 'Chilled water' ? `<div style="font-size: 9px; font-weight: 700; color: #0284c7; margin-top: 6px;">WATER: ${e.waterTemp || '--'}°C</div>` : ''}
                                    <div style="font-size: 8px; color: #64748b; margin-top: 8px; font-style: italic;">By: ${e.initiatedBy || '---'}</div>
                                    ${e.initiatedBySign ? `<img src="${e.initiatedBySign}" style="max-height: 25px; mix-blend-multiply: multiply; margin-top: 4px;" />` : ''}
                                </td>

                                <!-- 3. TERMINATION DETAILS -->
                                <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                    <div style="font-size: 9px; margin-bottom: 4px;">END: ${e.thawEndTime ? new Date(e.thawEndTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '---'}</div>
                                    <div style="font-size: 14px; font-weight: 900; color: #10b981; margin-top: 8px;">FINAL: ${e.finalTemp !== undefined ? e.finalTemp : '--'}°C</div>
                                    ${e.finalTempImg ? `<img src="${e.finalTempImg}" style="width: 40px; height: 40px; border-radius: 4px; border: 1px solid #ddd; margin-top: 8px;" />` : ''}
                                    <div style="font-size: 9px; font-weight: 800; color: #4f46e5; margin-top: 8px;">LIFE: ${e.secondaryShelfLife || '---'}</div>
                                    <div style="font-size: 8px; color: #64748b; margin-top: 8px; font-style: italic;">By: ${e.completedBy || '---'}</div>
                                    ${e.completedBySign ? `<img src="${e.completedBySign}" style="max-height: 25px; mix-blend-multiply: multiply; margin-top: 4px;" />` : ''}
                                </td>

                                <!-- 4. SPLIT PORTFOLIO -->
                                <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                    <div style="font-weight: 800; color: #000; font-size: 9px; margin-bottom: 8px;">TOTAL LOAD: ${e.totalQuantity} KG</div>
                                    <div style="space-y: 4px;">
                                        ${e.issued.length > 0 ? e.issued.map(iss => `
                                            <div style="font-size: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 4px;">
                                                <div style="font-weight: 900; color: #334155;">${iss.location}</div>
                                                <div style="color: #4f46e5; font-weight: 800;">${iss.quantity} KG</div>
                                            </div>
                                        `).join('') : '<div style="font-size: 8px; color: #94a3b8; font-style: italic;">No distributions recorded</div>'}
                                    </div>
                                    <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 8px; font-weight: 900; font-size: 9px; color: #e11d48;">
                                        REMAINING: ${e.remainingQuantity} KG
                                    </div>
                                </td>

                                <!-- 5. QR CODE -->
                                <td style="padding: 12px; border: 1px solid #000; text-align: center; vertical-align: middle;">
                                    <div style="display: inline-block; background: #fff; padding: 6px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                        <div style="width: 70px; height: 70px;">
                                            ${renderToString(<QRCodeSVG value={qrPayload} size={70} level="H" includeMargin={false} />)}
                                        </div>
                                    </div>
                                    <div style="font-size: 6px; color: #94a3b8; margin-top: 6px; font-weight: 900; text-transform: uppercase;">Product Passport</div>
                                </td>

                                <!-- 6. VERIFICATION -->
                                <td style="padding: 12px; border: 1px solid #000; vertical-align: top;">
                                    ${e.isVerified ? `
                                        <div style="margin-bottom: 6px;">
                                            <div style="font-weight: 800; color: #059669; font-size: 9px; text-transform: uppercase;">QA Authorized</div>
                                            <div style="font-weight: 900; color: #0f172a; margin-top: 2px;">${e.verifierName}</div>
                                        </div>
                                        ${e.verifierSignature ? `<img src="${e.verifierSignature}" style="max-height: 35px; mix-blend-multiply: multiply; margin-top: 4px;" />` : ''}
                                        <div style="font-size: 8px; color: #64748b; font-style: italic; margin-top: 6px; line-height: 1.3;">"${e.verificationComments || '...'}"</div>
                                        <div style="font-size: 8px; color: #94a3b8; margin-top: 6px;">Date: ${e.verificationDate ? e.verificationDate.split('T')[0] : '---'}</div>
                                    ` : `
                                        <div style="font-size: 9px; color: #f59e0b; font-weight: 900; text-transform: uppercase; text-align: center; padding: 20px 0;">Awaiting Auth</div>
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
                        <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Registry Process Signature</div>
                        <div style="border-bottom: 1px solid #cbd5e1; height: 30px;"></div>
                    </div>
                    <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
                        <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Verification Node Auth</div>
                        <div style="border-bottom: 1px solid #cbd5e1; height: 30px;"></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">
                    <div>System Timestamp: ${nowTimestamp}</div>
                    <div>Electronic Integrity Hash: ${securityId}</div>
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
            logging: false,
            onclone: (clonedDoc) => {
                const qrElements = clonedDoc.querySelectorAll('svg');
                qrElements.forEach(svg => {
                    svg.setAttribute('shape-rendering', 'crispEdges');
                });
            }
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
            
            pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, (pageCanvas.height * pdfWidth) / canvas.width, undefined, 'FAST');
            currentCanvasY += singlePageCanvasHeight;
        }

        pdf.save(`Thawing_Audit_Registry_Bulk_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        console.error("Registry Export failed", err);
    } finally {
        document.body.removeChild(printArea);
        setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
       {/* Dashboard Section */}
       <div className="flex flex-col xl:flex-row gap-6 mb-8">
         <div className="flex-1 w-full overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
             <div className="flex gap-4 min-w-max xl:min-w-0 xl:w-full">
                <div className="w-[85vw] md:w-[45vw] xl:w-auto xl:flex-1 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Activity size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Process Lifecycle</h3>
                    </div>
                    <div className="flex justify-between items-end">
                        {[
                            { label: 'Pending', value: stats.pending, color: 'bg-slate-900', id: 'PENDING' },
                            { label: 'In Flow', value: stats.inFlow, color: 'bg-orange-50', id: 'IN_PROGRESS' },
                            { label: 'Due Auth', value: stats.dueAuth, color: 'bg-indigo-600', id: 'DUE_AUTH' },
                            { label: 'Verified', value: stats.verified, color: 'bg-emerald-500', id: 'VERIFIED' }
                        ].map((stat, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleFilterClick(stat.id)}
                                className={`flex flex-col gap-1 items-center cursor-pointer transition-all hover:scale-105 active:scale-95 p-2 rounded-xl ${statusFilter === stat.id ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''}`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === stat.id ? 'text-indigo-700' : 'text-slate-400'}`}>{stat.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                                    <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-[85vw] md:w-[45vw] xl:w-auto xl:flex-1 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Registry Analytics</h3>
                    </div>
                    <div className="flex justify-between items-end">
                         {[
                            { label: 'Avg/Day', value: stats.avgDay, color: 'bg-blue-500' },
                            { label: 'Today', value: stats.todayCount, color: 'bg-purple-500' },
                            { label: 'Total', value: stats.total, color: 'bg-emerald-500' },
                            { label: 'Avg Lapse', value: stats.avgLapse, color: 'bg-rose-500' }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-slate-900">{stat.value}</span>
                                    <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
         </div>

         <div className="flex flex-col gap-3 xl:w-auto w-full xl:items-end">
             <div className="flex justify-end w-full">
                 <button 
                    onClick={handleRefresh}
                    className="w-full xl:w-14 h-10 xl:h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
                    title="Refresh"
                 >
                     <RefreshCw size={20} />
                 </button>
             </div>

             <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm w-full xl:w-auto justify-end">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
                 <input 
                     type="date" 
                     className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-24 uppercase cursor-pointer"
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

             <div className="flex gap-2 w-full xl:w-auto">
                 <div className="relative group flex-1 xl:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all placeholder:text-slate-300 shadow-inner"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>

                 {selectedIds.size > 0 && (
                     <button 
                         onClick={handleBulkVerifyOpen}
                         className="px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-2 transition-all whitespace-nowrap animate-in zoom-in-95"
                     >
                         <ShieldCheck size={16} strokeWidth={3} /> Verify ({selectedIds.size})
                     </button>
                 )}

                 <button 
                    onClick={handleExportPDFBulk}
                    disabled={isGeneratingPDF}
                    className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95 shrink-0"
                 >
                     {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                 </button>
                 <button className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95 shrink-0">
                     <Calendar size={20} />
                 </button>
             </div>
         </div>
       </div>

       <div className="space-y-6">
          {paginatedEntries.map((row, idx) => (
             <ThawingCard 
                key={row.uuid}
                row={row}
                index={(currentPage - 1) * rowsPerPage + idx + 1}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                onStartStep1={handleOpenStep1}
                onCompleteThaw={handleOpenStep2}
                onVerify={handleOpenVerify}
                onIssue={handleOpenIssue}
                onDownload={() => handleExportSinglePDF(row)}
                isSelected={selectedIds.has(row.uuid)}
                onSelectToggle={() => {
                    const next = new Set(selectedIds);
                    if (next.has(row.uuid)) next.delete(row.uuid); else next.add(row.uuid);
                    setSelectedIds(next);
                }}
                isExpanded={expandedCardIds.has(row.uuid)}
                onToggleExpand={() => toggleCard(row.uuid)}
                now={now}
             />
          ))}
          {paginatedEntries.length === 0 && (
             <div className="p-12 text-center text-slate-400 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <p className="font-bold uppercase tracking-widest text-xs">No Active Thawing Records</p>
             </div>
          )}
       </div>

       {/* --- MODALS --- */}

       {/* Step 1 Modal */}
       {activeModal === 'STEP1' && selectedEntry && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Initiate Thawing</h3>
                   <button onClick={() => setActiveModal(null)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="space-y-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</p>
                      <p className="text-sm font-bold text-slate-800">{selectedEntry.productName}</p>
                      <p className="text-[10px] font-mono text-slate-500">{selectedEntry.batchNumber}</p>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Method</label>
                      <select 
                         className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold outline-none"
                         value={formData.thawMethod}
                         onChange={e => setFormData({...formData, thawMethod: e.target.value})}
                      >
                         <option value="Refrigerator">Refrigerator</option>
                         <option value="Chilled water">Chilled Water</option>
                         <option value="Microwave">Microwave</option>
                      </select>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Core Temp (°C)</label>
                         <div className="flex gap-2">
                            <input 
                               type="number" step="0.1"
                               className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold outline-none"
                               placeholder="0.0"
                               value={formData.initialTemp}
                               onChange={e => setFormData({...formData, initialTemp: e.target.value})}
                            />
                            <button className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-blue-500" onClick={() => document.getElementById('step1-cam')?.click()}><Camera size={18}/></button>
                            <input type="file" id="step1-cam" hidden accept="image/*" onChange={e => handleCameraCapture(e, 'initialTempImg')} />
                         </div>
                         {formData.initialTempImg && (
                             <div className="mt-2 h-32 w-full rounded-xl overflow-hidden border border-slate-200">
                                 <img src={formData.initialTempImg} className="w-full h-full object-cover" />
                             </div>
                         )}
                      </div>
                      
                      {formData.thawMethod === 'Chilled water' && (
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Water Temp (°C)</label>
                             <div className="flex gap-2">
                                <input 
                                   type="number" step="0.1"
                                   className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold outline-none"
                                   placeholder="0.0"
                                   value={formData.waterTemp}
                                   onChange={e => setFormData({...formData, waterTemp: e.target.value})}
                                />
                                <button className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-blue-500" onClick={() => document.getElementById('step1-water-cam')?.click()}><Camera size={18}/></button>
                                <input type="file" id="step1-water-cam" hidden accept="image/*" onChange={e => handleCameraCapture(e, 'waterTempImg')} />
                             </div>
                             {formData.waterTempImg && (
                                <div className="mt-2 h-32 w-full rounded-xl overflow-hidden border border-slate-200">
                                    <img src={formData.waterTempImg} className="w-full h-full object-cover" />
                                </div>
                             )}
                          </div>
                      )}
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Comments</label>
                       <textarea
                           className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold outline-none resize-none h-20"
                           placeholder="Any remarks..."
                           value={formData.initiationComments}
                           onChange={e => setFormData({...formData, initiationComments: e.target.value})}
                       />
                   </div>

                   <SignaturePad onSave={(s) => setFormData({...formData, signature: s})} label="Operator Signature" />
                </div>
                <div className="mt-8 flex justify-end gap-3">
                   <button onClick={() => setActiveModal(null)} className="px-6 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                   <button onClick={handleSubmitStep1} className="px-8 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-blue-700 transition-all">Start Thawing</button>
                </div>
             </div>
          </div>
       )}

       {/* Step 2 Modal */}
       {activeModal === 'STEP2' && selectedEntry && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Complete Process</h3>
                   <button onClick={() => setActiveModal(null)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="space-y-6">
                   <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
                      <Clock size={24} className="text-emerald-500" />
                      <div>
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Elapsed Time</p>
                         <p className="text-xl font-black text-emerald-900">
                             {(() => {
                                 const startTime = new Date(selectedEntry.thawStartTime!).getTime();
                                 const endTime = now;
                                 const diff = Math.max(0, endTime - startTime);
                                 const hours = Math.floor(diff / 3600000);
                                 const mins = Math.floor((diff % 3600000) / 60000);
                                 const secs = Math.floor((diff % 60000) / 1000);
                                 return `${hours}h ${mins}m ${secs}s`;
                             })()}
                         </p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Final Core Temp (°C)</label>
                      <div className="flex gap-2">
                         <input 
                            type="number" step="0.1"
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-lg font-black outline-none"
                            placeholder="0.0"
                            value={formData.finalTemp}
                            onChange={e => setFormData({...formData, finalTemp: e.target.value})}
                         />
                         <button className="p-4 bg-slate-100 rounded-xl text-slate-400 hover:text-blue-500" onClick={() => document.getElementById('step2-cam')?.click()}><Camera size={24}/></button>
                         <input type="file" id="step2-cam" hidden accept="image/*" onChange={e => handleCameraCapture(e, 'finalTempImg')} />
                      </div>
                      {formData.finalTempImg && <div className="mt-2 h-32 w-full rounded-xl overflow-hidden border border-slate-200"><img src={formData.finalTempImg} className="w-full h-full object-cover" /></div>}
                   </div>
                   
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Comments</label>
                       <textarea
                           className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold outline-none resize-none h-20"
                           placeholder="Any remarks..."
                           value={formData.completionComments}
                           onChange={e => setFormData({...formData, completionComments: e.target.value})}
                       />
                   </div>

                   <SignaturePad onSave={(s) => setFormData({...formData, signature: s})} label="Operator Signature" />
                </div>
                <div className="mt-8 flex justify-end gap-3">
                   <button onClick={() => setActiveModal(null)} className="px-6 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                   <button onClick={handleSubmitStep2} className="px-8 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-emerald-700 transition-all">Complete</button>
                </div>
             </div>
          </div>
       )}

       {/* Verify Modal */}
       {activeModal === 'VERIFY' && selectedEntry && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">QA Verification</h3>
                   <button onClick={() => setActiveModal(null)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Comments</label>
                      <textarea 
                         className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none h-24 resize-none"
                         placeholder="Verification notes..."
                         value={formData.verificationComments}
                         onChange={e => setFormData({...formData, verificationComments: e.target.value})}
                      />
                   </div>
                   <SignaturePad onSave={(s) => setFormData({...formData, signature: s})} label="Verifier Signature" />
                </div>
                <div className="mt-8 flex justify-end gap-3">
                   <button onClick={() => setActiveModal(null)} className="px-6 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                   <button onClick={handleSubmitVerify} className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Verify Record</button>
                </div>
             </div>
          </div>
       )}

       {/* Bulk Verify Modal */}
       {activeModal === 'BULK_VERIFY' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                       <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg"><ShieldCheck size={24} className="text-white"/></div>
                       <div>
                           <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bulk Verification</h3>
                           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Batch Authorizing {selectedIds.size} Records</p>
                       </div>
                   </div>
                   <button onClick={() => setActiveModal(null)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Verifier Name</label>
                      <input 
                         className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none"
                         value={formData.verifierName}
                         onChange={e => setFormData({...formData, verifierName: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Comments</label>
                      <textarea 
                         className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none h-24 resize-none"
                         placeholder="Batch verification notes..."
                         value={formData.verificationComments}
                         onChange={e => setFormData({...formData, verificationComments: e.target.value})}
                      />
                   </div>
                   <SignaturePad onSave={(s) => setFormData({...formData, signature: s})} label="Verifier Signature" />
                </div>
                <div className="mt-8 flex justify-end gap-3">
                   <button onClick={() => setActiveModal(null)} className="px-6 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                   <button onClick={handleSubmitBulkVerify} className="px-8 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-emerald-700 transition-all">Verify All</button>
                </div>
             </div>
          </div>
       )}

       {/* Issue Modal */}
       {activeModal === 'ISSUE' && selectedEntry && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Issue / Split</h3>
                   <button onClick={() => setActiveModal(null)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-500 uppercase">Available Registry</span>
                      <div className="text-right">
                          {(() => {
                              const totalIssuing = formData.splits?.reduce((acc: number, curr: any) => acc + (parseFloat(curr.quantity) || 0), 0) || 0;
                              const remaining = Math.max(0, selectedEntry.remainingQuantity - totalIssuing);
                              return (
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-indigo-600">{remaining.toFixed(2)} KG</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Bgn: {selectedEntry.remainingQuantity} KG</span>
                                </div>
                              );
                          })()}
                      </div>
                   </div>

                   <div className="space-y-4">
                       {formData.splits?.map((split: any, idx: number) => (
                           <div key={split.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2 relative group animate-in slide-in-from-left-2">
                               <div className="flex justify-between items-center mb-1">
                                   <span className="text-[10px] font-black text-slate-400 uppercase">Split #{idx + 1}</span>
                                   {formData.splits.length > 1 && (
                                       <button 
                                           onClick={() => removeSplitRow(split.id)}
                                           className="text-slate-300 hover:text-red-500 transition-colors"
                                       >
                                           <Trash2 size={14} />
                                       </button>
                                   )}
                               </div>
                               <SearchableDropdown
                                   placeholder="Select Location..."
                                   options={MOCK_DEPTS}
                                   value={split.location}
                                   onChange={(val) => updateSplitRow(split.id, 'location', val)}
                               />
                               <div className="relative">
                                   <input 
                                     type="number" step="0.1"
                                     className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold outline-none"
                                     placeholder="Quantity"
                                     value={split.quantity}
                                     onChange={e => updateSplitRow(split.id, 'quantity', e.target.value)}
                                   />
                                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KG</span>
                               </div>
                           </div>
                       ))}
                       <button 
                           onClick={addSplitRow}
                           className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest"
                       >
                           <PlusCircle size={16} /> Add Another Split
                       </button>
                   </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 shrink-0 pt-4 border-t border-slate-100">
                   <button onClick={() => setActiveModal(null)} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                   <button onClick={handleSubmitIssue} className="px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-black transition-all">Confirm Split</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}

interface ThawingCardProps {
    row: ThawingRecordEntry;
    index: number;
    currentPage: number;
    rowsPerPage: number;
    onStartStep1: (entry: ThawingRecordEntry) => void;
    onCompleteThaw: (entry: ThawingRecordEntry) => void;
    onVerify: (entry: ThawingRecordEntry) => void;
    onIssue: (entry: ThawingRecordEntry) => void;
    onDownload: () => void;
    isSelected: boolean;
    onSelectToggle: () => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    now: number;
}

// --- ThawingCard Component ---
const ThawingCard: React.FC<ThawingCardProps> = ({ 
    row, index, currentPage, rowsPerPage,
    onStartStep1, onCompleteThaw, onVerify, onIssue, onDownload, isSelected, onSelectToggle, isExpanded, onToggleExpand, now
}) => {
    const isPending = row.status === 'PENDING';
    const isInProgress = row.status === 'IN_PROGRESS';
    const isCompleted = row.status === 'COMPLETED';
    const isVerified = row.isVerified;

    const formatTimeLapseInternal = (start?: string, end?: string) => {
        if (!start) return '--:--';
        const startTime = new Date(start).getTime();
        const endTime = end ? new Date(end).getTime() : now;
        const diff = Math.max(0, endTime - startTime);
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${hours}h ${mins}m ${secs}s`;
    };

    const getSLADuration = (method?: ThawMethod) => {
        if (method === 'Refrigerator') return 24 * 3600000;
        if (method === 'Chilled water') return 90 * 60000;
        if (method === 'Microwave') return 30 * 60000;
        return 0;
    };

    const slaDuration = getSLADuration(row.thawMethod);
    const elapsed = row.thawStartTime ? now - new Date(row.thawStartTime).getTime() : 0;
    const isSlaViolated = isInProgress && slaDuration > 0 && elapsed > slaDuration;

    // Simulated Production URL for the QR code
    const qrPayload = `https://haccppro.com/registry/thaw/${row.uuid}`;

    return (
        <>
            {/* DESKTOP VIEW */}
            <div className={`hidden xl:flex bg-white rounded-[2.5rem] md:rounded-[3rem] border-2 transition-all duration-500 flex flex-col xl:flex-row group overflow-hidden ${isInProgress ? 'border-orange-400 shadow-2xl scale-[1.01]' : isSelected ? 'border-indigo-600 bg-indigo-50/5 shadow-md' : 'border-slate-100 shadow-sm hover:border-indigo-200'} ${isCompleted ? 'grayscale-[0.2]' : ''}`}>
                
                {/* Column 1: Identity */}
                <div className="p-6 md:p-8 xl:w-[20%] border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col bg-white shrink-0 relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg ${isCompleted ? 'bg-emerald-600' : isInProgress ? 'bg-orange-600 animate-pulse' : 'bg-slate-900'}`}>
                                    {((currentPage - 1) * rowsPerPage + index).toString().padStart(2, '0')}
                                </div>
                                {!isVerified && isCompleted && row.remainingQuantity === 0 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onSelectToggle(); }}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 hover:border-indigo-400'}`}
                                    >
                                        {isSelected && <Check size={14} strokeWidth={4} />}
                                    </button>
                                )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isInProgress ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                {row.status}
                            </span>
                        </div>
                    </div>
                    
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2 group-hover:text-indigo-600 transition-colors truncate">{row.productName}</h4>
                    <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest mb-6"><Globe size={12} className="text-indigo-400" /> {row.unitName} <ChevronRight size={8} /> {row.locationName}</div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1 shadow-inner"><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Registry ID</span><span className="text-[10px] font-black text-slate-800 font-mono tracking-tighter truncate">{row.batchNumber}</span></div>
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1 shadow-inner text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Bgn Qty</span>
                            <span className="text-log font-black text-indigo-600 truncate">{row.totalQuantity} KG</span>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><Calendar size={12}/> MFG: <span className="text-slate-700">{row.mfgDate}</span></div>
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><Clock size={12}/> EXP: <span className="text-rose-600">{row.expDate}</span></div>
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pt-1"><Warehouse size={12}/> Vendor: <span className="text-indigo-600 font-bold">{row.supplierName}</span></div>
                    </div>
                </div>

                {/* Column 2: Step 1 - Initiation */}
                <div className={`p-6 md:p-8 xl:w-[22%] border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col bg-slate-50/20 shrink-0 ${isPending ? 'justify-center' : ''}`}>
                    {isPending ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 py-6">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full animate-pulse shadow-inner"><Play size={32} fill="currentColor" strokeWidth={3} /></div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Step 1 Initiation</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase italic">Awaiting node activation</p>
                            </div>
                            <button onClick={() => onStartStep1(row)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Play size={16} fill="currentColor" /> Start Step 1
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5 animate-in slide-in-from-top-4 duration-300 h-full flex flex-col">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    {row.thawMethod === 'Refrigerator' ? <Snowflake size={14} className="text-blue-500" /> : 
                                    row.thawMethod === 'Chilled water' ? <Droplets size={14} className="text-cyan-500" /> :
                                    <Microwave size={14} className="text-orange-500" />}
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{row.thawMethod}</span>
                                </div>
                                {isSlaViolated && <span className="text-[8px] font-black text-rose-600 animate-pulse uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">SLA Breach</span>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Start Time</span>
                                    <span className="text-sm font-black text-slate-800 leading-none mt-1">{new Date(row.thawStartTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between overflow-hidden">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Core Temp</span>
                                        <span className="text-sm font-black text-rose-500">{row.initialTemp}°C</span>
                                    </div>
                                    {row.initialTempImg && (
                                        <div onClick={() => window.open(row.initialTempImg)} className="w-10 h-10 rounded-lg border-2 border-slate-100 overflow-hidden cursor-pointer hover:border-indigo-400 transition-all shrink-0">
                                            <img src={row.initialTempImg} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* CHILLED WATER LOGIC */}
                                {row.thawMethod === 'Chilled water' && (
                                    <div className="col-span-2 bg-cyan-50/50 p-3 rounded-2xl border border-cyan-100 shadow-sm flex items-center justify-between overflow-hidden animate-in slide-in-from-bottom-1">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="text-[8px] font-black text-cyan-600 uppercase">Water Temp</span>
                                            <span className="text-sm font-black text-cyan-700">{row.waterTemp}°C</span>
                                        </div>
                                        {row.waterTempImg && (
                                            <div onClick={() => window.open(row.waterTempImg)} className="w-12 h-12 rounded-xl border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-all shrink-0">
                                                <img src={row.waterTempImg} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm relative overflow-hidden flex-1">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                        {row.initiatedBySign ? <img src={row.initiatedBySign} className="max-h-full max-w-full object-contain" /> : <PenTool size={16} className="text-slate-300"/>}
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">By: {row.initiatedBy}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl text-white shadow-xl transition-colors duration-500 ${isSlaViolated ? 'bg-rose-600' : 'bg-slate-900'}`}>
                                <div className="flex items-center gap-2"><Clock size={16} className={`text-indigo-400 ${isInProgress ? 'animate-spin-slow' : ''}`}/><span className="text-[10px] font-black uppercase tracking-[0.2em]">Lapse</span></div>
                                <span className="text-lg font-black font-mono tracking-tighter">{formatTimeLapseInternal(row.thawStartTime, row.thawEndTime)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 3: Step 2 - Termination */}
                <div className={`p-6 md:p-8 xl:w-[20%] border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col justify-center gap-3 shrink-0 ${!isCompleted ? 'bg-slate-50/10 grayscale opacity-40' : ''}`}>
                    {isCompleted ? (
                        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300 flex-1">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Terminal</span></div>
                                <span className="text-[10px] font-black text-slate-700">{row.thawEndDate}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-inner">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Final Time</span>
                                    <span className="text-sm font-black text-slate-800 leading-none mt-1">{new Date(row.thawEndTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm overflow-hidden">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-[8px] font-black text-emerald-600 uppercase">Final Temp</span>
                                        <span className="text-sm font-black text-emerald-700">{row.finalTemp}°C</span>
                                    </div>
                                    {row.finalTempImg && (
                                        <div onClick={() => window.open(row.finalTempImg)} className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden cursor-pointer hover:border-emerald-500 transition-all shrink-0">
                                            <img src={row.finalTempImg} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl space-y-1 relative overflow-hidden group/life shadow-sm">
                                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover/life:scale-125 transition-transform"><Timer size={32}/></div>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Life</span>
                                <p className="text-base font-black text-indigo-700 leading-none">{row.secondaryShelfLife}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase pt-1 italic truncate">Exp: {row.secondaryExpiry?.split('T')[0]}</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group/comp">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                <div className="w-14 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                                    {row.completedBySign ? <img src={row.completedBySign} className="max-h-full max-w-full object-contain" /> : <User size={16} className="text-slate-300"/>}
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Finalized By</p>
                                    <p className="text-xs font-black text-slate-800 uppercase leading-none truncate">{row.completedBy}</p>
                                </div>
                            </div>
                        </div>
                    ) : isInProgress ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-6 animate-in fade-in zoom-in-95">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-100 relative group animate-pulse">
                                <Hourglass size={32} className="text-slate-200" />
                            </div>
                            <div className="space-y-4 w-full px-4">
                                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest leading-none">Step 1 Active</p>
                                <button onClick={() => onCompleteThaw(row)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Complete Step 2</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center opacity-10 grayscale scale-110 py-10">
                            <Lock size={64}/>
                            <p className="text-[10px] font-black uppercase mt-4 tracking-[0.3em]">Locked Stage</p>
                        </div>
                    )}
                </div>

                {/* Column 4: Identity Passport (QR) */}
                <div className="p-6 md:p-8 xl:w-[15%] border-b xl:border-b-0 xl:border-r border-slate-50 flex flex-col justify-center items-center bg-white shrink-0">
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-inner group/qr transition-all hover:bg-indigo-50 hover:border-indigo-200">
                        <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <QRCodeSVG value={qrPayload} size={80} level="H" includeMargin={false} />
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/qr:text-indigo-600 transition-colors">Digital ID</p>
                            <p className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter mt-0.5">Scan to Verify</p>
                        </div>
                    </div>
                </div>

                {/* Column 5: Verification & Actions */}
                <div className="p-6 md:p-8 flex flex-col justify-center bg-slate-50/10 xl:flex-1 gap-4">
                    {/* DOWNLOAD BUTTON - HIGH VISIBILITY POSITION */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Output</span>
                        <button 
                            onClick={onDownload} 
                            disabled={isPending}
                            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${isPending ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'}`}
                        >
                            <Download size={18} /> Download Record PDF
                        </button>
                    </div>

                    {/* PORTION DETAILS SECTION */}
                    {row.issued.length > 0 && (
                        <div className="mb-2 space-y-3 animate-in slide-in-from-right-2">
                             <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Split size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Portion Distribution</span>
                             </div>
                             <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                                {row.issued.map((item) => (
                                    <div key={item.id} className="bg-white p-2.5 rounded-xl border border-slate-100 flex justify-between items-center shadow-xs">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-800 uppercase truncate leading-none mb-1">{item.location}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] font-black text-indigo-600">{item.quantity.toFixed(1)} KG</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {isVerified ? (
                        <div className="space-y-4 animate-in zoom-in-95 duration-300 flex flex-col items-center xl:items-end">
                            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden w-full max-w-[300px]">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500 opacity-10 rounded-bl-[2rem]" />
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white shrink-0"><ShieldCheck size={24} strokeWidth={3} /></div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-sm font-black text-slate-900 uppercase leading-tight truncate">{row.verifierName}</p>
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1 italic">Verified Auth</p>
                                    </div>
                                </div>
                                <div className="h-16 w-full bg-white/50 rounded-2xl border border-emerald-100 p-2 mb-4 flex items-center justify-center shadow-inner overflow-hidden">
                                    {row.verifierSignature ? <img src={row.verifierSignature} className="max-h-full max-w-full object-contain" alt="verifier-sign" /> : <PenTool className="text-emerald-200" />}
                                </div>
                                <div className="p-4 bg-white/40 rounded-xl text-left"><p className="text-[9px] font-bold text-slate-600 leading-relaxed italic">"{row.verificationComments || 'Record reviewed and synchronized.'}"</p></div>
                                <div className="mt-4 flex justify-between items-center text-[8px] font-black text-emerald-800 uppercase px-1 opacity-60"><span>Process Cert.</span><span>{row.verificationDate?.split('T')[0]}</span></div>
                            </div>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-white transition-all shadow-sm active:scale-95"><History size={14}/> Node History</button>
                        </div>
                    ) : isCompleted ? (
                        <div className="flex flex-col items-center xl:items-end gap-4 h-full justify-center">
                            {row.remainingQuantity > 0 ? (
                                <div className="p-6 text-center space-y-5 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2.5rem] w-full max-w-[300px] shadow-inner animate-in fade-in">
                                    <Split size={48} className="text-blue-500 mx-auto animate-pulse" />
                                    <p className="text-[10px] font-black text-blue-800 uppercase leading-relaxed tracking-wider">Breakdown Required before authorization</p>
                                    <div className="text-[9px] font-bold text-blue-600 uppercase">Available for split: {row.remainingQuantity.toFixed(1)} / {row.totalQuantity.toFixed(1)} KG</div>
                                    <button onClick={() => onIssue(row)} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"><Split size={16} /> Issue Portions</button>
                                </div>
                            ) : (
                                <div className="p-6 text-center space-y-5 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-[2.5rem] w-full shadow-inner animate-in fade-in">
                                    <ShieldAlert size={48} className="text-amber-500 mx-auto animate-pulse" />
                                    <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed tracking-wider">Awaiting authorization node hand-off.</p>
                                    <button onClick={() => onVerify(row)} className="w-full py-4 bg-amber-400 text-amber-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2"><Zap size={16} className="fill-current" /> Authorize Log</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center py-10 opacity-10 grayscale pointer-events-none scale-110">
                            <ShieldAlert size={64} />
                        </div>
                    )}
                </div>
            </div>

            {/* MOBILE VIEW */}
            <div className="xl:hidden bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                <div className="p-5 flex justify-between items-start cursor-pointer hover:bg-slate-50 transition-colors" onClick={onToggleExpand}>
                   <div className="flex-1 min-w-0 pr-4">
                       <div className="flex items-center gap-2 mb-2">
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isInProgress ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{row.status}</span>
                           <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{row.batchNumber}</span>
                       </div>
                       <h3 className="text-base font-black text-slate-800 leading-tight mb-1 truncate">{row.productName}</h3>
                       <p className="text-xs text-slate-500 font-medium truncate">{row.locationName}</p>
                   </div>
                   <button className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-colors">
                       {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                   </button>
                </div>

                {isExpanded && (
                    <div className="px-5 pb-5 space-y-6 animate-in slide-in-from-top-2 duration-300 border-t border-slate-50 pt-4 bg-slate-50/30">
                        
                        {/* MOBILE DOWNLOAD PDF BUTTON */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Export Certificate</span>
                            <button 
                                onClick={onDownload} 
                                disabled={isPending}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${isPending ? 'bg-slate-100 text-slate-300' : 'bg-emerald-600 text-white shadow-emerald-100'}`}
                            >
                                <Download size={16} /> Download Record PDF
                            </button>
                        </div>

                        {/* TIMER DISPLAY FOR MOBILE IN-PROGRESS */}
                        {isInProgress && (
                           <div className={`flex items-center justify-between px-5 py-4 rounded-2xl text-white shadow-lg animate-pulse ${isSlaViolated ? 'bg-rose-600' : 'bg-slate-900'}`}>
                              <div className="flex items-center gap-3">
                                <Clock size={20} className="text-indigo-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Thaw Lapse</span>
                              </div>
                              <span className="text-xl font-black font-mono tracking-tighter">{formatTimeLapseInternal(row.thawStartTime, row.thawEndTime)}</span>
                           </div>
                        )}

                        {/* MOBILE DIGITAL PASSPORT QR SECTION */}
                        <div className="bg-[#0f172a] text-white rounded-[2rem] p-5 flex items-center justify-between shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-20 h-20 bg-white p-1.5 rounded-2xl shadow-xl flex items-center justify-center border-4 border-indigo-500/20">
                                    <QRCodeSVG value={qrPayload} size={64} level="H" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1.5">Authentic Registry Node</p>
                                    <p className="text-sm font-black uppercase tracking-tight leading-none mb-2">Digital Product ID</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[7px] font-black border border-indigo-500 uppercase">SCAN FOR AUDIT</span>
                                        <ShieldCheck size={12} className="text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-slate-100 pt-3">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Beginning Qty</span>
                                <span className="text-[10px] font-black text-indigo-600">{row.totalQuantity} KG</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">EXP Date</span>
                                <span className="text-[10px] font-bold text-rose-600">{row.expDate}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vendor</span>
                                <span className="text-[10px] font-bold text-indigo-600 truncate max-w-[100px]">{row.supplierName}</span>
                            </div>
                            <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Date</span>
                                 <span className="text-[10px] font-bold text-slate-800">{row.thawStartDate}</span>
                            </div>
                        </div>

                        {/* Initiation Details */}
                        {isInProgress || isCompleted ? (
                             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"/>
                                 <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 1: Initiation</span>
                                     <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{row.thawMethod}</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div><p className="text-[9px] font-bold text-slate-400 uppercase">Start Time</p><p className="text-xs font-black text-slate-800">{new Date(row.thawStartTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p></div>
                                     <div className="text-right"><p className="text-[9px] font-bold text-slate-400 uppercase">Temp</p><p className="text-xs font-black text-indigo-600">{row.initialTemp}°C</p></div>
                                 </div>
                             </div>
                        ) : null}

                        {/* Termination Details */}
                        {isCompleted && (
                             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"/>
                                 <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Termination</span>
                                     <span className="text-[10px] font-bold text-emerald-600">{row.finalTemp}°C</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div><p className="text-[9px] font-bold text-slate-400 uppercase">End Time</p><p className="text-xs font-black text-slate-800">{new Date(row.thawEndTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p></div>
                                     <div className="text-right"><p className="text-[9px] font-bold text-slate-400 uppercase">Lapse</p><p className="text-xs font-black text-slate-800 font-mono">{formatTimeLapseInternal(row.thawStartTime, row.thawEndTime)}</p></div>
                                 </div>
                             </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 grid grid-cols-2 gap-3">
                             {isPending && <button onClick={() => onStartStep1(row)} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-md col-span-2">Start Thawing</button>}
                             {isInProgress && <button onClick={() => onCompleteThaw(row)} className="w-full py-3 bg-orange-500 text-white rounded-xl text-[10px] font-bold uppercase shadow-md col-span-2">Complete Thawing</button>}
                             {isCompleted && (
                                 <>
                                    {row.remainingQuantity > 0 ? (
                                        <button onClick={() => onIssue(row)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-md flex items-center justify-center gap-2"><Split size={14} /> Issue</button>
                                    ) : (
                                        !isVerified && <button onClick={() => onVerify(row)} className="w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase shadow-md">Authorize</button>
                                    )}
                                 </>
                             )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
