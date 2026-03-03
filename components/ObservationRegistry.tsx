"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { 
  Star, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  History, 
  CheckCircle2, 
  Trash2, 
  XCircle, 
  Ban, 
  Wrench, 
  Edit3, 
  Layers, 
  Users, 
  Package, 
  Signal, 
  ArrowRight,
  MoreVertical,
  Calendar,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Save,
  PenTool,
  Check,
  Loader2,
  ShieldAlert,
  CheckCheck,
  MessageSquare,
  Zap,
  ChevronDown,
  Hourglass,
  UserPlus,
  GitCommit,
  Camera,
  ImageIcon,
  Upload,
  FileSpreadsheet,
  FileDown,
  FileUp,
  AlertCircle,
  FileEdit,
  ExternalLink,
  QrCode,
  AlertOctagon,
  Maximize2,
  Tag,
  Eraser,
  Repeat,
  User,
  Building,
  Send,
  Inbox,
  LayoutGrid,
  BookOpen,
  Globe,
  Briefcase,
  SlidersHorizontal,
  Info,
  CalendarDays,
  Hash,
  Target,
  FileWarning,
  Flame,
  FileText,
  BarChart3,
  RotateCcw,
  List,
  Share2
} from 'lucide-react';
import { Entity, HierarchyScope } from '../types';
import ComplaintFormModal from './ComplaintFormModal';
import ObservationAnalytics from './ObservationAnalytics';

// --- Utilities ---

const compressImageFile = async (file: File, targetSizeKB: number = 100): Promise<{ file: File, url: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 1200; 

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
                height *= MAX_DIMENSION / width;
                width = MAX_DIMENSION;
            } else {
                width *= MAX_DIMENSION / height;
                height = MAX_DIMENSION;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
        }

        let quality = 0.9;
        
        const tryCompression = (q: number) => {
             canvas.toBlob((blob) => {
                 if (!blob) {
                     resolve({ file, url: img.src }); 
                     return;
                 }
                 
                 if (blob.size <= targetSizeKB * 1024 || q <= 0.1) {
                     const newFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                     resolve({ file: newFile, url: URL.createObjectURL(blob) });
                 } else {
                     const nextQ = q - 0.1;
                     tryCompression(nextQ);
                 }
             }, 'image/jpeg', q);
        };
        
        tryCompression(quality);
      };
      
      img.onerror = () => {
          resolve({ file, url: img.src });
      };
    };
    
    reader.onerror = () => {
        resolve({ file, url: URL.createObjectURL(file) });
    };
  });
};

const fetchImage = async (url: string): Promise<ArrayBuffer | null> => { 
  try { 
    const response = await fetch(url); 
    const blob = await response.blob(); 
    return await blob.arrayBuffer(); 
  } catch (error) { 
    console.error("Failed to fetch image for excel export", error); 
    return null; 
  } 
};

// --- Types ---

interface TrackingStep {
  id: string;
  label: string;
  user: string;
  timestamp: string;
  comments?: string;
}

interface BreakdownHistoryEntry {
  date: string;
  user: string;
  action: string; 
  comments: string;
  cost?: number;
}

interface ObservationItem {
    id: string;
    title: string;
    sop: string;
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
    level: 'L1' | 'L2' | 'L3' | 'L4';
    mainKitchen: string;
    area: string;
    hierarchy: string;
    closureComments: string | null;
    status: 'OPEN' | 'RESOLVED' | 'PENDING' | 'IN_PROGRESS' | 'PENDING_VERIFICATION';
    duration: string;
    followUpStatus: 'NOT DONE' | 'COMPLIANCE' | 'N/A';
    followUpCount: number;
    followUpDate: string;
    reportedBy: string;
    lastUpdate: string;
    createdDate: string; 
    closureDate?: string; 
    thumbnail: string;
    afterImage?: string;
    allEvidence?: any[];
    isStarred: boolean;
    people: { name: string; impact: number }[];
    assets: { name: string; impact: number }[];
    categories: { name: string; impact: number }[];
    tracking: TrackingStep[];
    parentObservationId?: string; 
    linkedObservationId?: string;
    breakdownDetails?: {
      isActive: boolean; 
      status: 'active' | 'pending-verification' | 'resolved';
      equipment?: string;
      rootCause?: string;
      totalCost: number;
      history: BreakdownHistoryEntry[];
    };
    regionalId?: string;
    unitId?: string;
    departmentId?: string;
    regionalName?: string;
    unitName?: string;
    departmentName?: string;
    inProgressDate?: string;
}

interface AdvancedFilterState {
    sops: string[];
    severities: string[];
    levels: string[];
    staff: string[];
    assets: string[];
    foodCategories: string[];
    regionals: string[];
    units: string[];
    departments: string[];
    locations: string[];
    responsibilities: string[];
    createdFrom: string;
    createdTo: string;
    closureFrom: string;
    closureTo: string;
    inProgressFrom: string;
    inProgressTo: string;
    generalFrom: string;
    generalTo: string;
}

const INITIAL_ADV_FILTERS: AdvancedFilterState = {
    sops: [], severities: [], levels: [], staff: [], assets: [], foodCategories: [],
    regionals: [], units: [], departments: [], locations: [], responsibilities: [],
    createdFrom: '', createdTo: '', closureFrom: '', closureTo: '', 
    inProgressFrom: '', inProgressTo: '', generalFrom: '', generalTo: ''
};

const MOCK_EQUIPMENT_LIST = [
    "Walk-in Chiller 01", "Deep Freezer Alpha-9", "Oven-01", "Blast Chiller XT-500", 
    "Combi Oven Pro-9", "Dishwasher H-200", "Vacuum Packer V-1", "Slicing Machine S-4",
    "Coffee Machine", "Ice Maker", "Salamander Grill", "Ventilation Hood"
];

const DUMMY_SOP_LIST = [
  "Hygiene Maintenance Protocol", "Temperature Audit standard", "Cross-Contamination Prevention", 
  "Pest Control Master Plan", "Allergen Management Policy", "Chemical Handling Procedure",
  "Waste Disposal Guideline", "Receiving & Inspection Standard", "Emergency Evacuation Plan",
  "Cleaning & Sanitization Schedule"
];

const DUMMY_LOCATION_LIST = [
  "La Mesa Kitchen", "La Mesa Restaurant", "IRD", "Receiving", "Main Store", 
  "Banquet Kitchen", "Butchery", "1835 Bar", "Pantry", "Prep Station Alpha", 
  "Cold Storage Node 2", "Loading Docking Bay 4"
];

const DUMMY_DEPT_LIST = ["Food Production", "Engineering", "F&B Service", "Kitchen Stewarding"];

// --- Mock Data Generator ---

const generateMockObservations = (count: number, entities: Entity[]): ObservationItem[] => {
  const sops = ["Hygiene Maintenance", "Temperature Audit", "Cross-Contamination", "Pest Control", "Waste Management", "Chemical Handling", "Personal Hygiene", "Storage Protocol", "Allergen Control", "Cleaning Schedule"];
  const severities: ('MINOR' | 'MAJOR' | 'CRITICAL')[] = ['MINOR', 'MAJOR', 'CRITICAL'];
  const levels: ('L1' | 'L2' | 'L3' | 'L4')[] = ['L1', 'L2', 'L3', 'L4'];
  const areas = ["Main Kitchen", "Banquet Hall", "Cold Storage", "Loading Dock", "Restaurant", "Lobby", "Staff Cafeteria", "Prep Area", "Dishwashing Area", "Dry Store"];
  
  const allUnits = entities.filter(e => e.type === 'unit');
  const statuses: ('OPEN' | 'RESOLVED' | 'PENDING' | 'IN_PROGRESS' | 'PENDING_VERIFICATION')[] = ['OPEN', 'RESOLVED', 'PENDING', 'IN_PROGRESS', 'PENDING_VERIFICATION'];
  const reporters = ['Staff User', 'Chef Alex', 'Auditor Jane', 'Manager Mike', 'QA Sarah', 'Supervisor Tom', 'Admin User', 'System Bot'];
  
  const observations: ObservationItem[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const unit = allUnits[Math.floor(Math.random() * allUnits.length)] || { id: 'unknown', name: 'Unknown Unit', parentId: undefined, masterDepartments: [] as string[] };
    const region = entities.find(e => e.id === unit.parentId) || { id: 'unknown', name: 'Unknown Region' };
    const corp = entities.find(e => e.type === 'corporate') || { id: 'corp-acme', name: 'Acme Catering Group' };

    const dept = (unit.masterDepartments && unit.masterDepartments.length > 0) ? unit.masterDepartments[Math.floor(Math.random() * unit.masterDepartments.length)] : DUMMY_DEPT_LIST[Math.floor(Math.random() * DUMMY_DEPT_LIST.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const reporter = reporters[Math.floor(Math.random() * reporters.length)];
    const sop = sops[Math.floor(Math.random() * sops.length)];
    const sev = severities[Math.floor(Math.random() * severities.length)];
    
    const dateOffset = Math.floor(Math.random() * 180);
    const date = new Date(now.getTime() - (dateOffset * 24 * 60 * 60 * 1000));
    const dateStr = date.toISOString().split('T')[0];
    const displayDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    observations.push({
      id: `OBS-${2025000 + i}`,
      title: `${sev} ${sop} Deviation at ${area}`,
      sop: sop,
      severity: sev,
      level: levels[Math.floor(Math.random() * levels.length)],
      mainKitchen: dept,
      area: area,
      hierarchy: `${corp.name} > ${region.name} > ${unit.name}`,
      regionalId: region.id,
      unitId: unit.id,
      departmentId: dept,
      regionalName: region.name,
      unitName: unit.name,
      departmentName: dept,
      closureComments: status === 'RESOLVED' ? 'Corrective action taken. Area sanitized and verified.' : null,
      status: status,
      duration: `${Math.floor(Math.random() * 15)}d ${Math.floor(Math.random() * 23)}h`,
      followUpStatus: status === 'RESOLVED' ? 'COMPLIANCE' : Math.random() > 0.5 ? 'NOT DONE' : 'N/A',
      followUpCount: Math.floor(Math.random() * 5),
      followUpDate: displayDate,
      reportedBy: reporter,
      lastUpdate: `${displayDate} ${Math.floor(Math.random() * 12) + 8}:30 AM`,
      createdDate: dateStr,
      closureDate: status === 'RESOLVED' ? new Date(date.getTime() + 86400000 * Math.floor(Math.random() * 5)).toISOString().split('T')[0] : undefined,
      thumbnail: `https://images.unsplash.com/photo-${['1584269656462-2334cb2823c1', '1599696840432-8493c0429a34', '1584634731339-252c581abfc5', '1628191010210-a59de33e5941'][i % 4]}?q=80&w=200&auto=format&fit=crop`,
      isStarred: Math.random() > 0.9,
      people: [{ name: reporter.toUpperCase(), impact: 0 }],
      assets: i % 3 === 0 ? [{ name: `Asset-${100+i}`, impact: 0 }] : [],
      categories: i % 4 === 0 ? [{ name: 'Equipment', impact: 0 }] : [{ name: 'Hygiene', impact: 0 }],
      tracking: [
          { id: `t-i-1`, label: 'Reported', user: reporter, timestamp: `${displayDate} 09:00 AM`, comments: 'Issue observed during routine check.' },
          ...(status === 'RESOLVED' ? [{ id: `t-i-2`, label: 'Resolved', user: 'System', timestamp: `${displayDate} 05:00 PM`, comments: 'Auto-closed based on evidence.' }] : [])
      ]
    });
  }
  return observations;
};

// --- Sub-Components ---

const AnalyticNode = ({ label, value, onClick, isActive }: any) => (
    <div 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 group ${isActive ? 'relative' : ''}`}
    >
        <span className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            {label}
        </span>
        <span className={`text-sm font-black transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
            {value}
        </span>
    </div>
);

const AdvancedGlobalFilterModal = ({ onClose, onApply, currentFilters, totalRecords, hierarchicalFilteredReports }: { onClose: () => void, onApply: (filters: AdvancedFilterState) => void, currentFilters: AdvancedFilterState, totalRecords: number, hierarchicalFilteredReports: any[] }) => {
    const [localFilters, setLocalFilters] = useState<AdvancedFilterState>(currentFilters);
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 h-[80vh]">
                <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4"><SlidersHorizontal size={24} /><h3 className="text-xl font-black uppercase tracking-tight">Global Registry Filter</h3></div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24}/></button>
                </div>
                <div className="p-10 space-y-8 bg-white overflow-y-auto custom-scrollbar flex-1 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product keyword</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-indigo-500" value={localFilters.sops[0] || ""} onChange={e => setLocalFilters({...localFilters, sops: [e.target.value]})} placeholder="Search SOP..." /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Severity</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-500" value={localFilters.severities[0] || ""} onChange={e => setLocalFilters({...localFilters, severities: e.target.value ? [e.target.value] : []})}><option value="">Any</option><option value="MINOR">Minor</option><option value="MAJOR">Major</option><option value="CRITICAL">Critical</option></select></div>
                    </div>
                </div>
                <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0"><button type="button" onClick={() => onApply(localFilters)} className="px-12 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700">Apply Matrix</button></div>
            </div>
        </div>
    );
};

const BulkUploadModal = ({ isOpen, onClose, onSave, availableLocations }: { isOpen: boolean, onClose: () => void, onSave: (loc: string, files: File[]) => void, availableLocations: string[] }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [location, setLocation] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-lg p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-3 text-left"><h3 className="text-lg font-bold">Bulk Evidence Upload</h3><button onClick={onClose}><X size={20}/></button></div>
                <div className="space-y-4 text-left">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Location/Dept</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold bg-slate-50 focus:border-indigo-500 outline-none" value={location} onChange={e => setLocation(e.target.value)}>
                        <option value="">Select Location...</option>
                        {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select></div>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all" onClick={() => inputRef.current?.click()}>
                        <Upload size={32} className="text-slate-300 mb-2" /><span className="text-sm font-bold text-slate-500">Click to Upload Images</span>
                        <input type="file" id="bulk-upload-input" ref={inputRef} multiple className="hidden" onChange={e => e.target.files && setFiles(Array.from(e.target.files))} />
                    </div>
                    {files.length > 0 && <div className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 flex items-center justify-between">{files.length} files selected <button onClick={(e) => { e.stopPropagation(); setFiles([]); }} className="text-indigo-400 hover:text-red-500"><X size={14}/></button></div>}
                    <button onClick={() => onSave(location, files)} disabled={!location || files.length === 0} className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-xs font-black uppercase tracking-widest disabled:opacity-30 shadow-lg hover:bg-indigo-700 transition-all">Upload to Registry</button>
                </div>
            </div>
        </div>
    );
};

const ReviewCsvModal = ({ stagedData, onCommit, onCancel, availableLocations, availableDepartments, availableSops }: { stagedData: any[], onCommit: (rows: any[]) => void, onCancel: () => void, availableLocations: string[], availableDepartments: string[], availableSops: string[] }) => {
    const [rows, setRows] = useState(stagedData);

    const handleUpdate = (idx: number, field: string, value: string) => {
        const next = [...rows];
        next[idx] = { ...next[idx], [field]: value };
        setRows(next);
    };

    const handleRemove = (idx: number) => {
        setRows(rows.filter((_, i) => i !== idx));
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-slate-200 animate-in zoom-in-95 overflow-hidden">
                <div className="px-10 py-8 bg-[#1e293b] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <FileUp size={24} />
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Review Import Data</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Reviewing {rows.length} staged records</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-slate-50 custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 sticky top-0 bg-slate-50 z-10">
                            <tr>
                                <th className="px-6 py-2 w-[100px]">Evidence</th>
                                <th className="px-6 py-2 min-w-[200px]">Details</th>
                                <th className="px-6 py-2 min-w-[150px]">Context</th>
                                <th className="px-6 py-2 min-w-[200px]">SOP Reference</th>
                                <th className="px-6 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 group">
                                    <td className="p-4 rounded-l-2xl">
                                        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                                            {row.evidence ? <img src={row.evidence} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={24}/></div>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-2">
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold focus:border-indigo-400 outline-none uppercase"
                                                value={row.title}
                                                onChange={e => handleUpdate(idx, 'title', e.target.value)}
                                                placeholder="Title"
                                            />
                                            <input 
                                                type="date"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold focus:border-indigo-400 outline-none"
                                                value={row.date}
                                                onChange={e => handleUpdate(idx, 'date', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-2">
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] font-bold outline-none focus:border-indigo-400 uppercase cursor-pointer"
                                                value={row.location}
                                                onChange={e => handleUpdate(idx, 'location', e.target.value)}
                                            >
                                                <option value="">Select Location</option>
                                                {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] font-bold outline-none focus:border-indigo-400 uppercase cursor-pointer"
                                                value={row.responsibility}
                                                onChange={e => handleUpdate(idx, 'responsibility', e.target.value)}
                                            >
                                                <option value="">Select Dept</option>
                                                {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign SOP Reference</label>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] font-bold outline-none focus:border-indigo-400 uppercase cursor-pointer"
                                                value={row.sop}
                                                onChange={e => handleUpdate(idx, 'sop', e.target.value)}
                                            >
                                                <option value="">Select SOP...</option>
                                                {availableSops.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="p-4 rounded-r-2xl text-right">
                                        <button onClick={() => handleRemove(idx)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-10 py-8 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onCancel} className="px-10 py-4 text-[10px] font-black uppercase text-slate-400">Discard</button>
                    <button onClick={() => onCommit(rows)} className="px-16 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700">Commit Import</button>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ id, onClose, onConfirm }: { id: string, onClose: () => void, onConfirm: () => void }) => (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-md p-6 text-left">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
            <h3 className="text-xl font-black text-center mb-2">Confirm Delete</h3>
            <p className="text-center text-slate-500 text-sm mb-6">Are you sure you want to permanently remove observation <strong>#{id}</strong>? This action is irreversible.</p>
            <div className="flex gap-3"><button onClick={onClose} className="flex-1 py-3 border rounded-xl text-xs font-black uppercase">Cancel</button><button onClick={onConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase">Delete Record</button></div>
        </div>
    </div>
);

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

const ActionGrid = ({ obs, onAction, isMobile = false }: { obs: ObservationItem, onAction: (type: string, id: string) => void, isMobile?: boolean }) => {
  const breakdownDetails = obs.breakdownDetails;
  const breakdownStatus = breakdownDetails?.status;
  const isBreakdownActive = breakdownDetails?.isActive;
  const [showProcessMenu, setShowProcessMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowProcessMenu(false);
        }
    }
    if (showProcessMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProcessMenu]);

  const btnClass = isMobile 
    ? "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95" 
    : "w-8 h-8 rounded-lg flex items-center justify-center transition-colors";
  const containerClass = isMobile ? "flex flex-wrap justify-between gap-3 w-full relative" : "grid grid-cols-4 gap-1.5 w-full max-w-[200px] relative";
  const iconClass = isMobile ? "w-5 h-5" : "w-4 h-4";
  const iconClassLg = isMobile ? "w-6 h-6" : "w-5 h-5";

  if (obs.status === 'RESOLVED') {
    return (
      <div className={`flex gap-1.5 w-full justify-center ${isMobile ? 'gap-3 mt-2' : ''}`}>
        {obs.breakdownDetails && (
           <button title="Breakdown History" onClick={() => onAction('view-breakdown-history', obs.id)} className={`${btnClass} bg-green-50 border border-green-200 hover:bg-green-100`}><Wrench className={`${iconClass} text-green-600`} /></button>
        )}
        <button title="Mark Compliant" onClick={() => onAction('compliance', obs.id)} className={`${btnClass} bg-green-50 text-green-700 border border-green-200 hover:bg-green-100`}><CheckCircle2 className={iconClass} /></button>
        <button title="Reopen" onClick={() => onAction('not-compliance', obs.id)} className={`${btnClass} bg-red-50 text-red-700 border border-red-200 hover:bg-red-100`}><RotateCcw className={iconClass} /></button>
        <button title="Mark N/A" onClick={() => onAction('hold', obs.id)} className={`${btnClass} bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100`}><Ban className={iconClass} /></button>
        <button title="View Activity Log" onClick={() => onAction('view-log', obs.id)} className={`${btnClass} bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100`}><History className={iconClass} /></button>
        <button title="Delete Record" onClick={() => onAction('delete', obs.id)} className={`${btnClass} bg-red-50 text-red-600 border border-red-200 hover:bg-red-100`}><Trash2 className={iconClass} /></button>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <button title="Not Done" onClick={() => onAction('reject', obs.id)} className={`${btnClass} border border-slate-200 bg-white hover:bg-slate-50 text-slate-700`}><div className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'} rounded-full bg-red-500 flex items-center justify-center`}><X className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} text-white`} strokeWidth={3} /></div></button>
      <button title="Not Applicable" onClick={() => onAction('hold', obs.id)} className={`${btnClass} border border-slate-200 bg-white hover:bg-slate-50 text-slate-400`}><Ban className={iconClassLg} /></button>
      {!breakdownDetails ? (
        <button title="Mark as Breakdown" onClick={() => onAction('initiate-breakdown', obs.id)} className={`${btnClass} border border-slate-200 bg-white hover:bg-slate-50`}><div className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'} bg-red-100 rounded flex items-center justify-center`}><Wrench className={`${iconClass} text-red-600 fill-current`} /></div></button>
      ) : (
        <>
            {breakdownStatus === 'active' && (<button title="Update Breakdown" onClick={() => onAction('update-breakdown', obs.id)} className={`${btnClass} border border-blue-200 bg-blue-50 hover:bg-blue-100`}><Wrench className={`${iconClassLg} text-blue-600`} /></button>)}
            {breakdownStatus === 'pending-verification' && (<button title="Verify Closure" onClick={() => onAction('verify-breakdown', obs.id)} className={`${btnClass} border border-yellow-200 bg-white hover:bg-yellow-50 animate-pulse`}><div className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'} bg-yellow-100 rounded flex items-center justify-center`}><Wrench className={`${iconClass} text-yellow-600 fill-current`} /></div></button>)}
            {(breakdownStatus === 'resolved' || !isBreakdownActive) && (<button title="View History" onClick={() => onAction('view-breakdown-history', obs.id)} className={`${btnClass} border border-green-200 bg-white hover:bg-yellow-50`}><div className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'} bg-green-100 rounded flex items-center justify-center`}><Wrench className={`${iconClass} text-green-600 fill-current`} /></div></button>)}
        </>
      )}
      <button title="Edit" onClick={() => onAction('edit', obs.id)} className={`${btnClass} border border-slate-200 bg-gray-50 hover:bg-gray-100 text-slate-700`}><Edit3 className={iconClass} /></button>
      <div className="relative" ref={menuRef}>
          <button onClick={() => setShowProcessMenu(!showProcessMenu)} className={`${btnClass} ${showProcessMenu ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}><Layers className={iconClass} /></button>
          {showProcessMenu && (
              isMobile ? (
                <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setShowProcessMenu(false)}>
                    <div className="bg-white w-full rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3"><h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Process Actions</h3><button onClick={() => setShowProcessMenu(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={16}/></button></div>
                        <div className="space-y-2">
                            <button onClick={() => { onAction('staffAck', obs.id); setShowProcessMenu(false); }} className="w-full flex items-center gap-3 p-4 bg-yellow-50 rounded-xl text-left text-sm font-bold text-yellow-700 hover:bg-yellow-100 active:scale-95 transition-all"><div className="p-2 bg-yellow-100 rounded-lg"><Hourglass size={18} /></div> Schedule Task</button>
                            <button onClick={() => { onAction('assign', obs.id); setShowProcessMenu(false); }} className="w-full flex items-center gap-3 p-4 bg-cyan-50 rounded-xl text-left text-sm font-bold text-cyan-700 hover:bg-cyan-100 active:scale-95 transition-all"><div className="p-2 bg-cyan-100 rounded-lg"><UserPlus size={18} /></div> Assign Member</button>
                            <button disabled={isBreakdownActive && breakdownStatus !== 'resolved'} onClick={() => { onAction('closure', obs.id); setShowProcessMenu(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl text-left text-sm font-bold transition-all active:scale-95 ${isBreakdownActive && breakdownStatus !== 'resolved' ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}><div className={`p-2 rounded-lg ${isBreakdownActive && breakdownStatus !== 'resolved' ? 'bg-slate-100' : 'bg-green-100'}`}><CheckCheck size={18} /></div> Closure</button>
                        </div>
                    </div>
                </div>
              ) : (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                    <button onClick={() => { onAction('staffAck', obs.id); setShowProcessMenu(false); }} className="flex items-center gap-2 p-2 hover:bg-yellow-50 rounded-lg text-left text-xs font-bold text-yellow-700 transition-colors w-full"><Hourglass size={14} /> Schedule</button>
                    <button onClick={() => { onAction('assign', obs.id); setShowProcessMenu(false); }} className="flex items-center gap-2 p-2 hover:bg-cyan-50 rounded-lg text-left text-xs font-bold text-cyan-700 transition-colors w-full"><UserPlus size={14} /> Assign</button>
                    <button disabled={isBreakdownActive && breakdownStatus !== 'resolved'} onClick={() => { onAction('closure', obs.id); setShowProcessMenu(false); }} className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-bold transition-colors w-full ${isBreakdownActive && breakdownStatus !== 'resolved' ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-green-50 text-green-700'}`}><CheckCheck size={14} /> Closure</button>
                </div>
              )
          )}
      </div>
      <button title="Delete Record" onClick={() => onAction('delete', obs.id)} className={`${btnClass} bg-red-100 text-red-600 hover:bg-red-200 border border-red-200`}><Trash2 className={iconClass} /></button>
    </div>
  );
};

const StatusConsolidatedCard = ({ 
    title, 
    icon: Icon, 
    iconBg, 
    stats, 
    activeCategory, 
    activeMetric, 
    metric, 
    onFilterClick 
}: { 
    title: string, 
    icon: any, 
    iconBg: string, 
    stats: any, 
    activeCategory: string | null, 
    activeMetric: string | null, 
    metric: string, 
    onFilterClick: (cat: 'sent' | 'received' | 'all', metric: string) => void 
}) => {
    const getStatKey = (metric: string) => {
        if (metric === 'RESOLVED') return 'closed';
        if (metric === 'IN_PROGRESS') return 'inProgress';
        return 'open';
    };
    const key = getStatKey(metric);

    return (
        <div className={`bg-white p-5 rounded-[2rem] border transition-all flex flex-col gap-5 shrink-0 snap-center min-w-[280px] md:flex-1 ${activeMetric === metric ? 'border-indigo-600 shadow-2xl ring-4 ring-indigo-50' : 'border-slate-100 shadow-xl shadow-slate-200/40'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl ${iconBg} text-white flex items-center justify-center shadow-lg`}>
                    <Icon size={20} />
                </div>
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] truncate">{title}</h3>
            </div>
            <div className="grid grid-cols-3 gap-y-4 gap-x-4">
                <AnalyticNode 
                    label="Sent" 
                    value={stats.sent[key]} 
                    onClick={() => onFilterClick('sent', metric)} 
                    isActive={activeCategory === 'sent' && activeMetric === metric} 
                />
                <AnalyticNode 
                    label="Received" 
                    value={stats.received[key]} 
                    onClick={() => onFilterClick('received', metric)} 
                    isActive={activeCategory === 'received' && activeMetric === metric} 
                />
                <AnalyticNode 
                    label="Unified" 
                    value={stats.all[key]} 
                    onClick={() => onFilterClick('all', metric)} 
                    isActive={activeCategory === 'all' && activeMetric === metric} 
                />
            </div>
        </div>
    );
};

// --- ObservationCard ---

const ObservationCard: React.FC<{ 
    obs: ObservationItem, 
    onAction: (type: string, id: string) => void,
    onFilterThread?: (rootId: string) => void,
    onViewImage: (url: string, label: string) => void,
    onViewPdf?: (id: string) => void
}> = ({ obs, onAction, onFilterThread, onViewImage }) => {
    return (
        <div className={`bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-stretch w-full p-4 gap-6 hover:shadow-xl transition-all group relative z-10`}>
            
            {/* Image & Star Cluster */}
            <div className="relative shrink-0 flex items-center gap-3 pl-2">
                {/* Before Image */}
                <div 
                    onClick={() => onViewImage(obs.thumbnail, 'Initial Evidence')}
                    className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 relative group/img cursor-pointer hover:border-indigo-50 transition-all shadow-sm"
                >
                    <img src={obs.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="Initial Evidence" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <Maximize2 size={20} className="text-white drop-shadow-md" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-tighter">
                        Initial
                    </div>
                </div>

                {/* After Image (Only if resolved or verified) */}
                {(obs.status === 'RESOLVED' || obs.status === 'PENDING_VERIFICATION') && obs.afterImage && (
                    <div 
                        onClick={() => onViewImage(obs.afterImage!, 'Closure Evidence')}
                        className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 relative group/img cursor-pointer hover:border-emerald-50 transition-all animate-in slide-in-from-left-2 shadow-sm"
                    >
                        <img src={obs.afterImage} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="Closure Evidence" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 size={20} className="text-white drop-shadow-md" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/80 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-tighter">
                            Closure
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={() => onAction('toggle-star', obs.id)}
                    className="absolute -top-2 -right-2 p-2 bg-white border border-slate-100 rounded-full shadow-lg hover:scale-110 transition-transform z-10"
                >
                    <Star size={16} className={obs.isStarred ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} />
                </button>
            </div>

            {/* Core Info & Classification */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-900 text-white text-[9px] font-mono font-black px-2 py-0.5 rounded shadow-sm">
                        {obs.id}
                    </span>
                    {obs.breakdownDetails?.isActive && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black uppercase rounded-full flex items-center gap-1 shadow-sm">
                            <Wrench size={8} /> Maintenance Active
                        </span>
                    )}
                    {obs.parentObservationId && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onFilterThread?.(obs.parentObservationId!); }}
                            className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[8px] font-black uppercase rounded-full flex items-center gap-1 border border-orange-200 hover:bg-orange-200 transition-colors shadow-sm"
                        >
                            <GitCommit size={8} /> Ref: {obs.parentObservationId.split('-').pop()}
                        </button>
                    )}
                </div>
                <h3 className="text-slate-800 text-lg font-black tracking-tight leading-none mb-3 truncate group-hover:text-indigo-600 transition-colors">
                    {obs.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 shadow-xs">
                        <BookOpen size={10} /> SOP: {obs.sop}
                    </span>
                    <span className={`px-3 py-1 border rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xs ${
                        obs.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        obs.severity === 'MAJOR' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                        {obs.severity}
                    </span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 shadow-xs">
                        <Signal size={10} /> {obs.level}
                    </span>
                </div>

                {/* Personnel & Asset Trace */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50 text-left">
                    {obs.people.length > 0 ? obs.people.map((p, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-indigo-600 border border-indigo-100 rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-xs">
                            <Users size={12} /> {p.name}
                        </span>
                    )) : (
                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">No Personnel Linked</span>
                    )}
                    {obs.assets.length > 0 ? obs.assets.map((a, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-xs">
                            <Wrench size={12} /> {a.name}
                        </span>
                    )) : (
                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest ml-4">No Assets Linked</span>
                    )}
                </div>
            </div>

            {/* Responsibility & Narrative (35%) */}
            <div className="flex flex-col xl:flex-row gap-6 xl:w-[35%] shrink-0 h-full border-l border-slate-100 px-6">
                <div className="flex flex-col justify-center gap-1 shrink-0 w-full xl:w-[45%] text-left">
                    <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors shadow-inner shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Responsibility Node</p>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-2 truncate">{obs.mainKitchen}</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase border border-slate-200 truncate">{obs.area}</span>
                            </div>
                            <p className="text-[9px] font-medium text-slate-300 mt-2 uppercase tracking-tighter truncate">{obs.hierarchy}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="w-full h-24 border-2 border-slate-50 rounded-[1.5rem] bg-slate-50/30 p-4 relative overflow-hidden shadow-inner text-left">
                        <span className="text-10px text-slate-400 italic font-medium leading-relaxed block overflow-y-auto max-h-full custom-scrollbar">
                            {obs.closureComments || "Registry synchronization pending closure narrative..."}
                        </span>
                    </div>
                </div>
            </div>

            {/* Lifecycle Timeline (20%) */}
            <div className="flex items-center gap-8 xl:w-[20%] shrink-0 border-l border-slate-100 px-6 text-left">
                <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border w-fit shadow-xs mb-2 ${obs.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                            {obs.status}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            <Clock size={12} className="text-slate-300" /> {obs.duration} in system
                        </div>
                    </div>
                    <div className="h-px bg-slate-100 w-full" />
                    <div className="flex flex-col">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit mb-1.5 border ${obs.followUpStatus === 'COMPLIANCE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            {obs.followUpStatus}
                        </span>
                        <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{obs.followUpCount}{obs.followUpCount === 1 ? 'st' : obs.followUpCount === 2 ? 'nd' : 'rd'} FOLLOW UP</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                            <Calendar size={10} /> {obs.followUpDate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Operator & Action Control Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-end flex-1 shrink-0 border-l border-slate-100 pl-6 pr-2 gap-8">
                <div className="text-right hidden xl:block min-w-[120px]">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Reporter</p>
                    <p className="text-xs text-slate-800 font-black truncate uppercase">{obs.reportedBy}</p>
                    <div className="h-4" />
                    <p className="text-[9px] font-black text-slate-400 uppercase">Last Activity</p>
                    <p className="text-[10px] text-indigo-600 font-black truncate">{obs.lastUpdate}</p>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                    <ActionGrid obs={obs} onAction={onAction} />
                </div>
            </div>
        </div>
    );
};

interface MobileObservationCardProps {
    obs: ObservationItem;
    onAction: (type: string, id: string) => void;
    onSelect: (id: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onViewImage: (url: string, label: string) => void;
    onViewPdf?: (id: string) => void;
    onFilterThread?: (rootId: string) => void;
}

const MobileObservationCard: React.FC<MobileObservationCardProps> = ({
    obs,
    onAction,
    onSelect,
    isExpanded,
    onToggleExpand,
    onViewImage,
    onFilterThread
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isReopened = obs.tracking.some(t => t.label.includes('Reopen'));
    const statusDate = obs.status === 'RESOLVED' && obs.closureDate ? `Closed: ${new Date(obs.closureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : `Created: ${new Date(obs.createdDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

    const handleShare = async () => {
        if (!cardRef.current) return;
        
        try {
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2, 
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedCard = clonedDoc.querySelector('[data-card-id="' + obs.id + '"]') as HTMLElement;
                    if (clonedCard) {
                        clonedCard.style.height = 'auto';
                        clonedCard.style.width = '450px'; 
                        clonedCard.style.overflow = 'visible';
                        clonedCard.style.padding = '20px';
                        clonedCard.style.borderRadius = '32px';

                        // 1. ALWAYS SHOW EXPANDABLE CONTENT IN SHARE IMAGE
                        const expandableContent = clonedCard.querySelector('.share-expandable-content') as HTMLElement;
                        if (expandableContent) {
                            expandableContent.style.display = 'block';
                            expandableContent.style.visibility = 'visible';
                            expandableContent.style.opacity = '1';
                            expandableContent.style.maxHeight = 'none';
                        }

                        // 2. HIDE QUICK ACTIONS AND TOGGLE BUTTON IN SHARE IMAGE
                        const hideElements = clonedCard.querySelectorAll('.share-hide-on-capture');
                        hideElements.forEach(el => {
                            if (el instanceof HTMLElement) {
                                el.style.display = 'none';
                            }
                        });

                        const allElements = clonedCard.getElementsByTagName('*');
                        for (let i = 0; i < allElements.length; i++) {
                            const el = allElements[i] as HTMLElement;
                            const style = window.getComputedStyle(el);
                            if (style.overflow === 'hidden' && !el.classList.contains('share-expandable-content')) el.style.overflow = 'visible';
                            if (style.height !== 'auto' && el.scrollHeight > el.offsetHeight) el.style.height = 'auto';
                            if (el.classList.contains('truncate')) { el.style.whiteSpace = 'normal'; el.style.textOverflow = 'clip'; }
                            if (style.display === '-webkit-box' && style.webkitLineClamp !== 'none') { el.style.webkitLineClamp = 'unset'; el.style.display = 'block'; }
                        }
                    }
                }
            });
            
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error("Canvas generation failed");

            const file = new File([blob], `Observation_${obs.id}.png`, { type: 'image/png' });
            const shareData = { 
                files: [file], 
                title: `Observation #${obs.id}`, 
                text: `Observation: ${obs.title}\nStatus: ${obs.status}\nLocation: ${obs.area}` 
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                const whatsappText = encodeURIComponent(`Observation #${obs.id}\n${obs.title}\nStatus: ${obs.status}\nLink: ${window.location.href}`);
                window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
            }
        } catch (err) {
            console.error('Sharing failed:', err);
            if (navigator.share) {
                navigator.share({ title: `Observation #${obs.id}`, text: `${obs.title} - Status: ${obs.status}`, url: window.location.href }).catch(() => {});
            }
        }
    };

    return (
        <div ref={cardRef} data-card-id={obs.id} className="bg-white rounded-2xl shadow-md border border-slate-100 relative w-full overflow-hidden text-left">
            <div className="px-4 pt-4 pb-2 flex justify-between items-start">
                <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex gap-2 flex-wrap">
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${obs.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : obs.status === 'OPEN' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{obs.status}</div>
                        {isReopened && obs.status !== 'RESOLVED' && (
                            <div className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1"><Repeat size={10} /> Reopened</div>
                        )}
                        {obs.breakdownDetails?.isActive && (
                            <div className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-slate-900 text-white flex items-center gap-1"><Wrench size={10} /> Breakdown</div>
                        )}
                        {obs.parentObservationId && onFilterThread && (
                            <button onClick={(e) => { e.stopPropagation(); onFilterThread(obs.parentObservationId!); }} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                                <GitCommit size={10} /> Ref: {obs.parentObservationId.split('-').pop()}
                            </button>
                        )}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 px-0.5">
                        <span>{statusDate}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{obs.duration}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 share-hide-on-capture">
                    <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors active:scale-125" title="Share as Image"><Share2 size={18} /></button>
                    <Star onClick={(e) => { e.stopPropagation(); onAction('toggle-star', obs.id); }} className={`w-5 h-5 cursor-pointer transition-all active:scale-125 ${obs.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`} />
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{obs.id}</span>
                </div>
            </div>

            <div className="px-4 pb-1 text-left">
                <h3 onClick={() => onSelect(obs.id)} className="text-lg font-black text-slate-800 leading-tight mb-2 mt-1 cursor-pointer active:text-blue-600 transition-colors line-clamp-2 uppercase tracking-tight">{obs.title}</h3>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-indigo-700 uppercase"><Building size={10} /> {obs.unitName}</div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-black text-indigo-600 uppercase"><Signal size={10} /> Level {obs.level}</div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-[9px] font-black text-blue-700 uppercase"><History size={10} /> {obs.followUpCount} Follow-Up{obs.followUpCount !== 1 ? 's' : ''}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600 truncate max-w-[150px]">SOP: {obs.sop}</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${obs.severity === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-600' : obs.severity === 'MAJOR' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-yellow-50 border-yellow-100 text-yellow-600'}`}>{obs.severity}</span>
                </div>
            </div>

            <div className="px-4 py-2 grid grid-cols-2 gap-2 overflow-hidden">
                <div onClick={() => onViewImage(obs.thumbnail, 'Initial Evidence')} className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer shadow-sm hover:border-indigo-400 transition-all"><img src={obs.thumbnail} className="w-full h-full object-cover" alt="Before" /><div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Initial</div></div>
                {obs.afterImage && (<div onClick={() => onViewImage(obs.afterImage!, 'Closure Evidence')} className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer shadow-sm hover:border-emerald-400 transition-all"><img src={obs.afterImage} className="w-full h-full object-cover" alt="After" /><div className="absolute bottom-1 left-1 bg-emerald-600/80 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Closure</div></div>)}
            </div>

            <div className="px-4 pb-4 mt-3">
                <div className="flex items-center justify-between gap-3 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer active:bg-slate-100 transition-colors group select-none" onClick={onToggleExpand}>
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 shrink-0"><MapPin size={16} /></div>
                        <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{obs.area}</div>
                            <div className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">{obs.hierarchy}</div>
                        </div>
                    </div>
                    <div className={`p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 transition-all duration-300 shrink-0 share-hide-on-capture ${isExpanded ? 'rotate-180' : 'rotate-0'}`}><ChevronDown size={16} /></div>
                </div>

                {/* This section is now conditionally hidden via class but exists in DOM for clone logic */}
                <div className={`${isExpanded ? 'block' : 'hidden'} animate-in slide-in-from-top-2 duration-300 text-left share-expandable-content`}>
                    <div className="mb-3 flex flex-wrap gap-2 p-2 bg-blue-50/30 rounded-xl border border-blue-100/50">
                        {obs.people.map((p, i) => (<span key={i} className="flex items-center gap-1.5 px-1.5 py-0.5 bg-white border border-blue-100 rounded text-[9px] font-black uppercase text-blue-700"><Users size={10}/> {p.name}</span>))}
                        {obs.assets.map((a, i) => (<span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-orange-100 rounded text-[9px] font-black uppercase text-orange-700"><Wrench size={10}/> {a.name}</span>))}
                    </div>
                    <div className="mb-3 bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-slate-400 uppercase tracking-wider">Reported By</span><span className="font-bold text-slate-700">{obs.reportedBy}</span></div>
                        <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-slate-400 uppercase tracking-wider">Last Update</span><span className="font-bold text-slate-700">{obs.lastUpdate}</span></div>
                        <button onClick={() => onAction('view-log', obs.id)} className="w-full mt-2 py-1.5 bg-white border border-slate-200 rounded text-slate-500 font-bold flex items-center justify-center gap-1.5 text-[10px] shadow-sm hover:text-blue-600 transition-colors share-hide-on-capture"><History size={12} /> View Activity Log</button>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 share-hide-on-capture">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Quick Actions</div>
                    <ActionGrid obs={obs} onAction={onAction} isMobile={true} />
                </div>
            </div>
        </div>
    );
};

// --- ObservationRegistry ---

const ObservationRegistry: React.FC<{ entities: Entity[], currentScope: HierarchyScope, userRootId?: string | null }> = ({ entities, currentScope, userRootId }) => {
    const [observations, setObservations] = useState<ObservationItem[]>(() => generateMockObservations(120, entities));
    const [activeInternalTab, setActiveInternalTab] = useState<'records' | 'analytics'>('records');
    const [searchTerm, setSearchTerm] = useState("");
    const [showFollowUpOnly, setSearchFollowUpOnly] = useState(false);
    const [showBreakdownOnly, setShowBreakdownOnly] = useState(false);
    const [activeModal, setActiveModal] = useState<'LOG' | 'DELETE' | 'CLOSURE' | 'NEW' | 'EDIT' | 'BREAKDOWN' | 'VERIFY_BREAKDOWN' | 'STAFF_ACK' | 'ASSIGN' | 'REOPEN' | 'BULK_UPLOAD' | 'ADVANCED_FILTER' | 'CSV_REVIEW' | null>(null);
    const [breakdownMode, setBreakdownMode] = useState<'initiate' | 'update' | 'history'>('initiate');
    const [selectedObsId, setSelectedObsId] = useState<string | null>(null);
    const selectedObs = useMemo(() => observations.find(o => o.id === selectedObsId), [observations, selectedObsId]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [threadFilter, setThreadFilter] = useState<string | null>(null);
    const [actionFilter, setActionFilter] = useState<string>('');
    const [viewerImage, setViewerImage] = useState<{ url: string, label: string } | null>(null);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [advFilters, setAdvFilters] = useState<AdvancedFilterState>(INITIAL_ADV_FILTERS);
    const [stagedCsvRows, setStagedCsvRows] = useState<any[]>([]);
    const [persistence, setPersistence] = useState({ selections: { location: [] as string[], sop: [] as string[], asset: [] as string[], staff: [] as string[], category: [] as string[], responsibility: [] as string[] }, locks: { location: false, sop: false, asset: false, staff: false, category: false, responsibility: false } });
    const usageFrequencies = useMemo(() => { const freq: Record<string, Record<string, number>> = { location: {}, sop: {}, responsibility: {}, asset: {}, staff: {}, category: {} }; observations.forEach(o => { if (o.area) freq.location[o.area] = (freq.location[o.area] || 0) + 1; if (o.sop) freq.sop[o.sop] = (freq.sop[o.sop] || 0) + 1; if (o.mainKitchen) freq.responsibility[o.mainKitchen] = (freq.responsibility[o.mainKitchen] || 0) + 1; if (o.assets) o.assets.forEach(a => freq.asset[a.name] = (freq.asset[a.name] || 0) + 1); if (o.people) o.people.forEach(p => freq.staff[p.name] = (freq.staff[p.name] || 0) + 1); if (o.categories) o.categories.forEach(c => freq.category[c.name] = (freq.category[c.name] || 0) + 1); }); return freq; }, [observations]);
    const [dashFilter, setDashboardFilter] = useState<{ category: 'sent' | 'received' | 'all', metric: string } | null>(null);
    const [closureComments, setClosureComments] = useState("");
    const [closureSignature, setClosureSignature] = useState("");
    const [breakdownForm, setBreakdownForm] = useState({ equipment: '', cause: '', date: new Date().toISOString().split('T')[0], action: '', cost: '' });
    const [assetSearch, setAssetSearch] = useState("");
    const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
    const [reopenFindings, setReopenFindings] = useState("");
    const [reopenEvidence, setReopenEvidence] = useState<string | null>(null);
    const [signature, setSignature] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);
    const assetDropdownRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<number | 'All'>(10);
    const activeHeaderDropdownRef = useRef<HTMLDivElement>(null);
    const excelDropdownRef = useRef<HTMLDivElement>(null);
    const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<string | null>(null);
    const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);
    useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (activeHeaderDropdownRef.current && !activeHeaderDropdownRef.current.contains(event.target as Node)) setActiveHeaderDropdown(null); if (excelDropdownRef.current && !excelDropdownRef.current.contains(event.target as Node)) setIsExcelDropdownOpen(false); if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target as Node)) setIsAssetDropdownOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
    const filteredAssets = useMemo(() => MOCK_EQUIPMENT_LIST.filter(a => a.toLowerCase().includes(assetSearch.toLowerCase())), [assetSearch]);
    const targetEntity = useMemo(() => { if (!userRootId) return entities.find(e => e.type === 'corporate'); return entities.find(e => e.id === userRootId); }, [entities, userRootId]);
    const targetCorporate = useMemo(() => { let curr = targetEntity; while (curr) { if (curr.type === 'corporate') return curr; curr = entities.find(e => e.id === curr?.parentId); } return entities.find(e => e.id === 'corp-acme') || entities.find(e => e.type === 'corporate'); }, [entities, targetEntity]);
    const availableSops = useMemo(() => { const sops = targetCorporate?.masterSops?.map(s => s.name) || []; return sops.length > 0 ? sops : DUMMY_SOP_LIST; }, [targetCorporate]);
    const availableDepartments = useMemo(() => { const depts = targetCorporate?.masterDepartments || []; return depts.length > 0 ? depts : DUMMY_DEPT_LIST; }, [targetCorporate]);
    const availableLocations = useMemo(() => { if (!targetEntity) return DUMMY_LOCATION_LIST; const locs = Object.values(targetEntity.departmentLocations || {}).flat() as string[]; return locs.length > 0 ? locs : DUMMY_LOCATION_LIST; }, [targetEntity]);
    const isDescendant = (ancestorId: string, potentialDescendantId: string, allEntities: Entity[]) => { let current = allEntities.find(e => e.id === potentialDescendantId); while (current) { if (current.id === ancestorId) return true; current = allEntities.find(parent => parent.id === current?.parentId); } return false; };
    const hierarchicalFilteredReports = useMemo(() => { if (currentScope === 'super-admin') return observations; if (!userRootId) return []; return observations.filter(report => { if (currentScope === 'unit') return report.unitId === userRootId; if (currentScope === 'corporate' || currentScope === 'regional') { if (!report.unitId) return false; return isDescendant(userRootId, report.unitId, entities); } if (currentScope === 'department') return report.departmentName === targetEntity?.name; if (currentScope === 'user') return report.reportedBy === targetEntity?.name; return false; }); }, [observations, currentScope, userRootId, entities, targetEntity]);
    const calculateStats = (items: ObservationItem[]) => { return { open: items.filter(o => o.status === 'OPEN').length, closed: items.filter(o => o.status === 'RESOLVED').length, inProgress: items.filter(o => ['PENDING', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes(o.status)).length, repeated: items.filter(o => !!o.parentObservationId).length, followUps: items.reduce((acc, curr) => acc + curr.followUpCount, 0), breakdowns: items.filter(o => o.breakdownDetails?.isActive).length }; };
    const dashboardStats = useMemo(() => { const sent = hierarchicalFilteredReports.filter(o => o.reportedBy === 'Staff User' || o.reportedBy === 'Chef Alex'); const received = hierarchicalFilteredReports.filter(o => o.reportedBy !== 'Staff User' && o.reportedBy !== 'Chef Alex'); return { sent: calculateStats(sent), received: calculateStats(received), all: calculateStats(hierarchicalFilteredReports) }; }, [hierarchicalFilteredReports]);
    const filteredObservations = useMemo(() => { return hierarchicalFilteredReports.filter(o => { const matchesSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm); if (!matchesSearch) return false; if (threadFilter && o.id !== threadFilter && o.parentObservationId !== threadFilter) return false; if (showFollowUpOnly && !o.isStarred) return false; if (showBreakdownOnly && !o.breakdownDetails?.isActive) return false; if (dashFilter) { const isSent = o.reportedBy === 'Staff User' || o.reportedBy === 'Chef Alex'; if (dashFilter.category === 'sent' && !isSent) return false; if (dashFilter.category === 'received' && isSent) return false; const m = dashFilter.metric; if (m === 'OPEN' && o.status !== 'OPEN') return false; if (m === 'RESOLVED' && o.status !== 'RESOLVED') return false; if (m === 'IN_PROGRESS' && !['PENDING', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes(o.status)) return false; if (m === 'REPEATED' && !o.parentObservationId) return false; if (m === 'FOLLOWUP' && o.followUpCount === 0) return false; if (m === 'BREAKDOWN' && !o.breakdownDetails?.isActive) return false; } if (actionFilter) { if (actionFilter === 'Needs Acknowledgment' && o.status !== 'OPEN') return false; if (actionFilter === 'Needs Resolution' && o.status !== 'IN_PROGRESS' && o.status !== 'OPEN') return false; if (actionFilter === 'Needs Verification' && o.status !== 'PENDING_VERIFICATION') return false; if (actionFilter === 'Breakdown Active' && !o.breakdownDetails?.isActive) return false; if (actionFilter === 'Needs Follow Up' && o.followUpStatus === 'COMPLIANCE') return false; } if (advFilters.sops.length > 0 && !advFilters.sops.includes(o.sop)) return false; if (advFilters.severities.length > 0 && !advFilters.severities.includes(o.severity)) return false; if (advFilters.levels.length > 0 && !advFilters.levels.includes(o.level)) return false; if (advFilters.staff.length > 0 && !o.people.some(p => advFilters.staff.includes(p.name))) return false; if (advFilters.assets.length > 0 && !o.assets.some(a => advFilters.assets.includes(a.name))) return false; if (advFilters.foodCategories.length > 0 && !o.categories.some(c => advFilters.foodCategories.includes(c.name))) return false; if (advFilters.regionals.length > 0 && o.regionalName && !advFilters.regionals.includes(o.regionalName)) return false; if (advFilters.units.length > 0 && o.unitName && !advFilters.units.includes(o.unitName)) return false; if (advFilters.departments.length > 0 && o.departmentName && !advFilters.departments.includes(o.departmentName)) return false; if (advFilters.locations.length > 0 && !advFilters.locations.includes(o.area)) return false; if (advFilters.responsibilities.length > 0 && !advFilters.responsibilities.includes(o.mainKitchen)) return false; const checkDate = (dateStr: string | undefined, from: string, to: string) => { if (!dateStr) return false; const d = new Date(dateStr); if (from && d < new Date(from)) return false; if (to && d > new Date(to)) return false; return true; }; if ((advFilters.createdFrom || advFilters.createdTo) && !checkDate(o.createdDate, advFilters.createdFrom, advFilters.createdTo)) return false; const someTo = advFilters.closureTo; if ((advFilters.closureFrom || advFilters.closureTo) && !checkDate(o.closureDate, advFilters.closureFrom, someTo)) return false; if ((advFilters.inProgressFrom || advFilters.inProgressTo) && !checkDate(o.inProgressDate, advFilters.inProgressFrom, advFilters.inProgressTo)) return false; if ((advFilters.generalFrom || advFilters.generalTo) && !checkDate(o.createdDate, advFilters.generalFrom, advFilters.generalTo)) return false; return true; }); }, [hierarchicalFilteredReports, threadFilter, searchTerm, showFollowUpOnly, showBreakdownOnly, actionFilter, dashFilter, advFilters]);
    const totalPagesCount = rowsPerPage === 'All' ? 1 : Math.ceil(filteredObservations.length / rowsPerPage);
    const paginatedObservations = useMemo(() => { if (rowsPerPage === 'All') return filteredObservations; const start = (currentPage - 1) * rowsPerPage; return filteredObservations.slice(start, start + rowsPerPage); }, [filteredObservations, currentPage, rowsPerPage]);
    const handleBulkUploadSave = async (locationStr: string, files: File[]) => { setIsProcessing(true); const newObservations: ObservationItem[] = []; const now = new Date(); const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); for (let i = 0; i < files.length; i++) { const { url } = await compressImageFile(files[i]); const id = `OBS-BULK-${Date.now()}-${i}`; newObservations.push({ id, title: `Bulk Observation - ${locationStr}`, sop: 'General Inspection', severity: 'MINOR', level: 'L1', mainKitchen: 'General', area: locationStr, hierarchy: targetEntity?.name || 'Local Unit', closureComments: null, status: 'OPEN', duration: 'Just now', followUpStatus: 'NOT DONE', followUpCount: 0, followUpDate: timestamp.split(' ')[0], reportedBy: 'Staff User', lastUpdate: timestamp, createdDate: now.toISOString().split('T')[0], thumbnail: url, isStarred: false, people: [], assets: [], categories: [], tracking: [{ id: `t-bulk-${id}`, label: 'Reported (Bulk)', user: 'Staff User', timestamp, comments: 'Imported via bulk uploader.' }] }); } setObservations(prev => [...newObservations, ...prev]); setIsProcessing(false); setActiveModal(null); };
    const confirmDelete = () => { if (!selectedObsId) return; setIsProcessing(true); setTimeout(() => { setObservations(prev => prev.filter(o => o.id !== selectedObsId)); setIsProcessing(false); setActiveModal(null); setSelectedObsId(null); }, 500); };
    const handleSaveBreakdown = () => { if (!selectedObsId || !breakdownForm.equipment || !breakdownForm.cause) return; const now = new Date(); const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); const historyEntry: BreakdownHistoryEntry = { date: breakdownForm.date, user: 'Staff Operator', action: 'Breakdown Reported', comments: `Equipment: ${breakdownForm.equipment}. Cause: ${breakdownForm.cause}.` }; setObservations(prev => prev.map(o => o.id === selectedObsId ? { ...o, breakdownDetails: { isActive: true, status: 'active', equipment: breakdownForm.equipment, rootCause: breakdownForm.cause, totalCost: 0, history: [historyEntry] }, tracking: [...o.tracking, { id: `t-bd-${Date.now()}`, label: 'Maintenance Logged', user: 'Staff Operator', timestamp, comments: `Asset failure reported for ${breakdownForm.equipment}.` }] } : o)); setActiveModal(null); };
    const handleBreakdownUpdate = (isResolving: boolean) => { if (!selectedObsId || !selectedObs?.breakdownDetails) return; const now = new Date(); const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); const costVal = parseFloat(breakdownForm.cost) || 0; const historyEntry: BreakdownHistoryEntry = { date: breakdownForm.date, user: 'Maintenance Team', action: isResolving ? 'Breakdown Resolved (Pending Verification)' : 'Service Update', comments: breakdownForm.action, cost: costVal }; setObservations(prev => prev.map(o => o.id === selectedObsId ? { ...o, breakdownDetails: { ...o.breakdownDetails!, status: isResolving ? 'pending-verification' : 'active', totalCost: o.breakdownDetails!.totalCost + costVal, history: [...o.breakdownDetails!.history, historyEntry] }, tracking: [...o.tracking, { id: `t-bd-upd-${Date.now()}`, label: isResolving ? 'Maintenance Finished' : 'Maintenance Update', user: 'Maintenance Team', timestamp, comments: `Action: ${breakdownForm.action}. Cost: ₹${costVal}` }] } : o)); setActiveModal(null); };
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => setReopenEvidence(event.target?.result as string); reader.readAsDataURL(file); } };
    const handleReopenSubmit = () => { if (!selectedObsId || !selectedObs || !signature || !reopenFindings) return; const now = new Date(); const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); const newObs: ObservationItem = { ...selectedObs, id: `OBS-RE-${Date.now()}`, title: `FOLLOW UP: ${selectedObs.title}`, status: 'OPEN', createdDate: now.toISOString().split('T')[0], lastUpdate: timestamp, duration: 'Just now', parentObservationId: selectedObs.id, thumbnail: reopenEvidence || selectedObs.thumbnail, tracking: [{ id: 'tr1', label: 'Reopened / New Report', user: 'QA Auditor', timestamp, comments: reopenFindings }], isStarred: true }; setObservations(prev => [newObs, ...prev.map(o => o.id === selectedObsId ? { ...o, linkedObservationId: newObs.id, tracking: [...o.tracking, { id: `t-re-${Date.now()}`, label: 'Non-Compliance Recorded', user: 'QA Auditor', timestamp, comments: 'Marked as persistent issue. New report created.' }] } : o)]); setActiveModal(null); setReopenFindings(""); setReopenEvidence(null); setSignature(""); };
    const handleDownloadBulkSample = async () => { setIsProcessing(true); try { const workbook = new ExcelJS.Workbook(); const worksheet = workbook.addWorksheet('Bulk Import Template'); worksheet.columns = [ { header: "Observation Date", key: "date", width: 15 }, { header: "Observation Title", key: "title", width: 35 }, { header: "SOP Name", key: "sop", width: 25 }, { header: "Evidence Image", key: "evidence", width: 25 }, { header: "Location Name", key: "location", width: 25 }, { header: "Responsibility Hub", key: "responsibility", width: 25 } ]; const headerRow = worksheet.getRow(1); headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; headerRow.alignment = { vertical: 'middle', horizontal: 'center' }; headerRow.height = 30; const rowData = { date: "2025-05-18", title: "HYGIENE DEVIATION AT PREP STATION", sop: "Hygiene Maintenance Protocol", evidence: "", location: "Prep Area", responsibility: "Main Kitchen" }; const row = worksheet.addRow(rowData); row.height = 100; row.alignment = { vertical: 'middle', horizontal: 'left' }; const sampleImageUrl = "https://images.unsplash.com/photo-1584269656462-2334cb2823c1?q=80&w=200"; const buffer = await fetchImage(sampleImageUrl); if (buffer) { const imageId = workbook.addImage({ buffer: buffer, extension: 'jpeg', }); worksheet.addImage(imageId, { tl: { col: 3, row: 1 }, br: { col: 4, row: 2 }, editAs: 'oneCell' }); } const outBuffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([outBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }); const url = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Observation_Bulk_Import_Template.xlsx`; a.click(); window.URL.revokeObjectURL(url); } catch (err) { console.error("Template creation failed", err); } finally { setIsProcessing(false); } };
    const handleApplyAdvancedFilters = (filters: AdvancedFilterState) => { setAdvFilters(filters); setActiveModal(null); setCurrentPage(1); };
    const handleViewImage = (url: string, label: string) => { setViewerImage({ url, label }); };
    const handleAction = (type: string, id: string) => { const now = new Date(); const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); setSelectedObsId(id); switch (type) { case 'toggle-star': setObservations(prev => prev.map(o => o.id === id ? { ...o, isStarred: !o.isStarred } : o)); break; case 'delete': setActiveModal('DELETE'); break; case 'view-log': setActiveModal('LOG'); break; case 'closure': setClosureComments(""); setClosureSignature(""); setActiveModal('CLOSURE'); break; case 'staffAck': setActiveModal('STAFF_ACK'); break; case 'assign': setActiveModal('ASSIGN'); break; case 'not-compliance': setReopenFindings(""); setReopenEvidence(null); setSignature(""); setActiveModal('REOPEN'); break; case 'edit': setActiveModal('EDIT'); break; case 'compliance': setObservations(prev => prev.map(o => o.id === id ? { ...o, followUpStatus: 'COMPLIANCE', lastUpdate: timestamp, tracking: [...o.tracking, { id: `t-${Date.now()}`, label: 'Marked Compliant', user: 'QA Auditor', timestamp, comments: 'Verification complete. Target achieved.' }] } : o)); break; case 'initiate-breakdown': setBreakdownForm({ equipment: '', cause: '', date: new Date().toISOString().split('T')[0], action: '', cost: '' }); setAssetSearch(""); setBreakdownMode('initiate'); setActiveModal('BREAKDOWN'); break; case 'update-breakdown': setBreakdownMode('update'); setBreakdownForm({ equipment: '', cause: '', date: new Date().toISOString().split('T')[0], action: '', cost: '' }); setActiveModal('BREAKDOWN'); break; case 'verify-breakdown': setActiveModal('VERIFY_BREAKDOWN'); break; case 'view-breakdown-history': setBreakdownMode('history'); setActiveModal('BREAKDOWN'); break; case 'reject': case 'hold': { const followUpType = type === 'reject' ? 'Not Done' : type === 'hold' ? 'N/A' : 'COMPLIANCE'; const currentObs = observations.find(o => o.id === id); const currentCount = currentObs?.followUpCount || 0; setObservations(prev => prev.map(o => o.id !== id ? o : { ...o, followUpStatus: followUpType, followUpCount: currentCount + 1, followUpDate: timestamp, lastUpdate: timestamp, tracking: [...o.tracking, { id: `t-${Date.now()}`, label: `Follow Up: ${followUpType}`, user: 'QA Auditor', timestamp, comments: type === 'reject' ? 'Observation persists. Re-attendance required.' : 'Marked not applicable for this cycle.' }] })); break; } default: break; } };
    const handleNewObservationSave = (data: any) => { 
        const now = new Date(); 
        const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
        const createdDate = now.toISOString().split('T')[0]; 
        
        // FIXED: Honor the thumbnail passed back from the modal (the collage)
        let evidenceUrl = data.thumbnail || 'https://images.unsplash.com/photo-1599696840432-8493c0429a34?q=80&w=400';
        
        if (data.id) {
            setObservations(prev => prev.map(o => o.id === data.id ? { 
                ...o, 
                title: data.title, 
                sop: data.sop, 
                mainKitchen: data.responsibility || 'General', 
                area: data.location?.area || 'Unassigned', 
                thumbnail: evidenceUrl, 
                allEvidence: data.allEvidence, // Preserve for re-editing
                lastUpdate: timestamp, 
                people: (data.staffInvolved || []).map((name: string) => ({ name: name.toUpperCase(), impact: 0 })), 
                assets: (data.assetId || []).map((name: string) => ({ name: name.toUpperCase(), impact: 0 })), 
                categories: (data.foodCategory || []).map((name: string) => ({ name: name.toUpperCase(), impact: 0 })), 
                tracking: [...o.tracking, { id: `t-edit-${Date.now()}`, label: 'Updated', user: 'Staff User', timestamp, comments: 'Record updated via editor terminal.' }] 
            } : o)); 
        } else { 
            const id = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${observations.length + 101}`; 
            const newObs: ObservationItem = { 
                id, 
                title: data.title, 
                sop: data.sop, 
                severity: 'MINOR', 
                level: 'L1', 
                mainKitchen: data.responsibility || 'General', 
                area: data.location?.area || 'Unassigned', 
                hierarchy: targetEntity?.name || 'Local Unit', 
                closureComments: null, 
                status: 'OPEN', 
                duration: 'Just now', 
                followUpStatus: 'NOT DONE', 
                followUpCount: 0, 
                followUpDate: timestamp.split(' ')[0], 
                reportedBy: 'Staff User', 
                lastUpdate: timestamp, 
                createdDate: createdDate, 
                thumbnail: evidenceUrl, 
                allEvidence: data.allEvidence, // Preserve for re-editing
                isStarred: false, 
                people: (data.staffInvolved || []).map((name: string) => ({ name: name.toUpperCase(), impact: 0 })), 
                assets: (data.assetId || []).map((name: string) => ({ name: name.toUpperCase(), impact: 0 })), 
                categories: (data.foodCategory || []).map((name: string) => ({ name: name.toUpperCase(), impact: 0 })), 
                tracking: [{ id: 't1', label: 'Reported', user: 'Staff User', timestamp, comments: 'Incident logged via Terminal.' }] 
            }; 
            setObservations(prev => [newObs, ...prev]); 
        } 
        if (data.persistence) setPersistence(data.persistence); 
        setActiveModal(null); 
    };
    const handleCsvCommit = (finalRows: any[]) => { const now = new Date(); const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); const newObs: ObservationItem[] = finalRows.map((row, i) => ({ id: `OBS-CSV-${Date.now()}-${i}`, title: row.title || 'Untitled Observation', sop: row.sop || 'General Inspection', severity: 'MINOR', level: 'L1', mainKitchen: row.responsibility || 'General', area: row.location || 'Unassigned', hierarchy: targetEntity?.name || 'Local Unit', closureComments: null, status: 'OPEN', duration: 'Just now', followUpStatus: 'NOT DONE', followUpCount: 0, followUpDate: timestamp.split(' ')[0], reportedBy: 'CSV Import', lastUpdate: timestamp, createdDate: row.date || now.toISOString().split('T')[0], thumbnail: row.evidence || 'https://images.unsplash.com/photo-1584269656462-2334cb2823c1?q=80&w=400', isStarred: false, people: [], assets: [], categories: [], tracking: [{ id: `t-csv-${Date.now()}-${i}`, label: 'Reported (CSV)', user: 'System', timestamp, comments: 'Record imported via data sync terminal.' }] })); setObservations(prev => [...newObs, ...prev]); setActiveModal(null); setStagedCsvRows([]); };
    const handleExcelBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setIsProcessing(true); const reader = new FileReader(); reader.onload = async (event) => { const buffer = event.target?.result as ArrayBuffer; const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(buffer); const worksheet = workbook.getWorksheet(1); if (!worksheet) { setIsProcessing(false); return; } const images = worksheet.getImages(); const rowImageMap: Record<number, string> = {}; images.forEach(img => { const col = Math.floor(img.range.tl.col); if (col === 3 || col === 4) { const rowIdx = Math.floor(img.range.tl.row); const media = workbook.model.media[img.imageId]; if (media && media.buffer) { const base64 = btoa(new Uint8Array(media.buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')); rowImageMap[rowIdx] = `data:image/${media.extension};base64,${base64}`; } } }); const rows: any[] = []; worksheet.eachRow((row, rowNumber) => { if (rowNumber === 1) return; const isExport = row.getCell(1).value?.toString().startsWith('OBS-'); const dateVal = (isExport ? row.getCell(2).value : row.getCell(1).value)?.toString() || ""; const titleVal = (isExport ? row.getCell(3).value : row.getCell(2).value)?.toString() || ""; if (!dateVal && !titleVal) return; rows.push({ date: dateVal, title: titleVal, sop: (isExport ? row.getCell(7).value : row.getCell(3).value)?.toString() || "", evidence: rowImageMap[row.number - 1] || "", location: (isExport ? row.getCell(9).value : row.getCell(5).value)?.toString() || "", responsibility: (isExport ? row.getCell(8).value : row.getCell(6).value)?.toString() || "" }); }); setStagedCsvRows(rows); setActiveModal('CSV_REVIEW'); setIsProcessing(false); }; reader.readAsArrayBuffer(file); e.target.value = ""; };
    const handleExportExcel = async (format: string) => { setIsProcessing(true); try { let exportData = [...filteredObservations] .filter(Boolean) .filter(obs => obs.title && obs.title.trim() !== ""); if (exportData.length === 0) { alert("No records found for the current filter. Export cancelled."); setIsProcessing(false); return; } const workbook = new ExcelJS.Workbook(); const worksheet = workbook.addWorksheet('Registry Export'); if (format === 'dept') exportData.sort((a, b) => a.mainKitchen.localeCompare(b.mainKitchen)); else if (format === 'area') exportData.sort((a, b) => a.area.localeCompare(b.area)); else if (format === 'sop') exportData.sort((a, b) => a.sop.localeCompare(b.sop)); else if (format === 'employee') exportData.sort((a, b) => a.reportedBy.localeCompare(b.reportedBy)); else if (format === 'level') exportData.sort((a, b) => a.level.localeCompare(b.level)); worksheet.columns = [ { header: "Report ID", key: "id", width: 15 }, { header: "Date", key: "date", width: 12 }, { header: "Title", key: "title", width: 35 }, { header: "Status", key: "status", width: 15 }, { header: "Evidence (Before)", key: "evidence_before", width: 20 }, { header: "Reporter", key: "reportedBy", width: 20 }, { header: "SOP Name", key: "sop", width: 25 }, { header: "Responsibility", key: "dept", width: 25 }, { header: "Location Area", key: "area", width: 20 }, { header: "Severity", key: "severity", width: 12 }, { header: "Level", key: "level", width: 10 }, { header: "Evidence (After)", key: "evidence_after", width: 20 }, { header: "Closure Note", key: "closure", width: 40 } ]; const headerRow = worksheet.getRow(1); headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; headerRow.alignment = { vertical: 'middle', horizontal: 'center' }; headerRow.height = 30; for (let i = 0; i < exportData.length; i++) { const obs = exportData[i]; const row = worksheet.addRow({ id: obs.id, date: obs.createdDate, title: obs.title, status: obs.status, evidence_before: '', reportedBy: obs.reportedBy, sop: obs.sop, dept: obs.mainKitchen, area: obs.area, severity: obs.severity, level: obs.level, evidence_after: '', closure: obs.closureComments || 'N/A' }); row.height = 90; const sheetRowIndex = row.number - 1; if (obs.thumbnail) { const buffer = await fetchImage(obs.thumbnail); if (buffer) { try { const imageId = workbook.addImage({ buffer: buffer, extension: 'jpeg' }); worksheet.addImage(imageId, { tl: { col: 4, row: sheetRowIndex }, br: { col: 5, row: sheetRowIndex + 1 }, editAs: 'oneCell' }); } catch (e) { console.error("Img1 error", e); } } } if (obs.afterImage) { const buffer = await fetchImage(obs.afterImage); if (buffer) { try { const imageId = workbook.addImage({ buffer: buffer, extension: 'jpeg' }); worksheet.addImage(imageId, { tl: { col: 11, row: sheetRowIndex }, br: { col: 12, row: sheetRowIndex + 1 }, editAs: 'oneCell' }); } catch (e) { console.error("Img2 error", e); } } } } const outBuffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([outBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }); const url = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Registry_Export_${format}_${new Date().toISOString().split('T')[0]}.xlsx`; a.click(); window.URL.revokeObjectURL(url); } catch (err) { console.error("Export failed", err); } finally { setIsProcessing(false); setIsExcelDropdownOpen(false); } };
    const handleDashboardFilter = (category: 'sent' | 'received' | 'all', metric: string) => { if (dashFilter?.category === category && dashFilter?.metric === metric) { setDashboardFilter(null); } else { setDashboardFilter({ category, metric }); } setCurrentPage(1); };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700 text-left px-4 md:px-0 relative min-h-[80vh]">
            <div className="flex justify-center mb-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                    <button onClick={() => setActiveInternalTab('records')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeInternalTab === 'records' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}><List size={16}/> Observation Records</button>
                    <button onClick={() => setActiveInternalTab('analytics')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeInternalTab === 'analytics' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}><BarChart3 size={16}/> Analytics Dashboard</button>
                </div>
            </div>

            {activeInternalTab === 'records' ? (
                <>
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 pb-2 items-stretch">
                        <div className="lg:col-span-9 flex overflow-x-auto snap-x hide-scrollbar gap-4 pb-2 md:grid md:grid-cols-3 md:overflow-visible">
                            <StatusConsolidatedCard title="Open Registry" metric="OPEN" icon={AlertCircle} iconBg="bg-rose-500" stats={dashboardStats} activeCategory={dashFilter?.category || null} activeMetric={dashFilter?.metric || null} onFilterClick={handleDashboardFilter} />
                            <StatusConsolidatedCard title="Closed Registry" metric="RESOLVED" icon={CheckCircle2} iconBg="bg-emerald-500" stats={dashboardStats} activeCategory={dashFilter?.category || null} activeMetric={dashFilter?.metric || null} onFilterClick={handleDashboardFilter} />
                            <StatusConsolidatedCard title="Work In Progress" metric="IN_PROGRESS" icon={RefreshCw} iconBg="bg-blue-500" stats={dashboardStats} activeCategory={dashFilter?.category || null} activeMetric={dashFilter?.metric || null} onFilterClick={handleDashboardFilter} />
                        </div>
                        <div className="lg:col-span-3 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col justify-between gap-6 relative overflow-visible z-20 shrink-0 snap-center min-w-[300px] md:min-w-0 text-left">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 rounded-l-[2.5rem]" />
                            <div className="flex flex-wrap items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap lg:whitespace-normal">
                                <div className="relative flex-1 min-w-[140px]" ref={activeHeaderDropdownRef}><button onClick={() => setActiveHeaderDropdown(activeHeaderDropdown === 'actions' ? null : 'actions')} className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${actionFilter ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'}`}><div className="flex items-center gap-2"><Zap className={`w-3.5 h-3.5 ${actionFilter ? 'fill-white text-white' : 'text-indigo-50'}`} /> {actionFilter ? actionFilter.split(' ')[0] : 'Quick Filter'}</div><ChevronDown className={`w-3 h-3 transition-transform ${activeHeaderDropdown === 'actions' ? 'rotate-180' : ''}`} /></button>{activeHeaderDropdown === 'actions' && (<div className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-2xl z-100 overflow-hidden animate-in fade-in slide-in-from-top-1"> {[{ label: 'Needs Acknowledgment', icon: AlertOctagon, color: 'text-red-500' }, { label: 'Needs Resolution', icon: RefreshCw, color: 'text-blue-500' }, { label: 'Needs Verification', icon: ShieldCheck, color: 'text-yellow-600' }, { label: 'Needs Follow Up', icon: History, color: 'text-orange-500' }, { label: 'Breakdown Active', icon: Wrench, color: 'text-slate-700' }, { label: 'Repeat Problem', icon: GitCommit, color: 'text-purple-500' }].map(item => (<button key={item.label} onClick={() => { setActionFilter(actionFilter === item.label ? '' : item.label); setActiveHeaderDropdown(null); }} className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${actionFilter === item.label ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}><span>{item.label}</span></button>))} {actionFilter && (<button onClick={() => { setActionFilter(''); setActiveHeaderDropdown(null); }} className="w-full text-center py-2 text-[10px] font-black uppercase text-red-500 border-t border-slate-100 mt-1 hover:bg-red-50">Clear Action Filter</button>)}</div>)}</div>
                                <button onClick={() => setActiveModal('BULK_UPLOAD')} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 transition-all shadow-sm active:scale-90" title="Bulk Evidence Upload"><Upload size={18} /></button>
                                <button onClick={() => setActiveModal('ADVANCED_FILTER')} className={`p-2.5 rounded-xl border transition-all shadow-sm active:scale-90 ${JSON.stringify(advFilters) !== JSON.stringify(INITIAL_ADV_FILTERS) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600'}`} title="Advanced Global Filter"><SlidersHorizontal size={18} /></button>
                                <div className="flex gap-1" ref={excelDropdownRef}><input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelBulkImport} /><button onClick={() => excelInputRef.current?.click()} className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm active:scale-90" title="Import from Excel"><FileUp size={18} strokeWidth={2.5} /></button><button onClick={() => setIsExcelDropdownOpen(!isExcelDropdownOpen)} className="px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:bg-emerald-700 active:scale-95 flex items-center gap-2"><FileSpreadsheet size={16} /></button>{isExcelDropdownOpen && (<div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-100 overflow-hidden animate-in fade-in slide-in-from-top-2 p-1"><div className="p-1 space-y-0.5">{['general', 'dept', 'area', 'sop', 'employee', 'level'].map((m) => (<button key={m} onClick={() => handleExportExcel(m as any)} className="w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-black uppercase text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">{m} wise format</button>))} <button onClick={handleDownloadBulkSample} className="w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border-t border-slate-100 mt-1 flex items-center gap-2"><FileDown size={12} /> Download Sample</button></div></div>)}</div>
                                <button onClick={() => { setSearchTerm(''); setDashboardFilter(null); setActionFilter(''); setAdvFilters(INITIAL_ADV_FILTERS); }} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:text-rose-600 transition-all active:scale-90 shadow-inner" title="Reset Filters"><RefreshCw size={18} /></button>
                            </div>
                            <div className="flex items-center gap-2"><div className="relative group flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} /><input type="text" placeholder="Universal Record Search..." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 border-slate-50 rounded-xl text-[10px] font-black uppercase focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><button onClick={() => setActiveModal('NEW')} className="hidden md:flex px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest items-center justify-center gap-2 shadow-xl hover:bg-indigo-600 active:scale-95"><Plus size={14} strokeWidth={3} /> Add</button></div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 w-full">
                        <div className="hidden lg:block w-full"><div className="flex flex-col gap-4 w-full">{paginatedObservations.map((obs) => (<ObservationCard key={obs.id} obs={obs} onAction={handleAction} onFilterThread={setThreadFilter} onViewImage={handleViewImage} />))}</div></div>
                        <div className="lg:hidden space-y-4">{paginatedObservations.map((obs) => (<MobileObservationCard key={obs.id} obs={obs} onAction={handleAction} onSelect={(id) => handleAction('view-log', id)} isExpanded={expandedCardId === obs.id} onToggleExpand={() => setExpandedCardId(prev => prev === obs.id ? null : obs.id)} onViewImage={handleViewImage} onFilterThread={setThreadFilter} />))}</div>
                        {paginatedObservations.length === 0 && (<div className="py-40 flex flex-col items-center justify-center text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200 shadow-inner"><Activity size={64} className="text-slate-100 mb-6 opacity-20" /><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Zero Index Matches</h3><p className="text-slate-400 text-xs mt-3 font-medium uppercase tracking-widest max-sm:leading-relaxed text-center px-4">Adjust your organization node filter or search parameters.</p></div>)}
                    </div>

                    <button onClick={() => setActiveModal('NEW')} className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[60] border-4 border-white backdrop-blur-sm" title="Record New Observation"><Plus className="w-8 h-8" strokeWidth={3} /></button>
                    
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between shadow-xl gap-6">
                        <div className="flex items-center gap-4 text-left"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows:</span><select value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }} className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-black rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 cursor-pointer shadow-inner"><option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="All">All</option></select></div>
                        <div className="flex items-center gap-4"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={18} /></button><div className="px-6 flex flex-col items-center"><span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Page {currentPage}</span><span className="text-[8px] font-bold text-slate-400 uppercase">of {totalPagesCount}</span></div><button disabled={currentPage >= totalPagesCount} onClick={() => setCurrentPage(p => Math.min(totalPagesCount, p + 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={18} /></button></div>
                    </div>
                </>
            ) : (
                <div className="animate-in fade-in duration-500">
                    <ObservationAnalytics data={filteredObservations} currentScope={currentScope} />
                </div>
            )}

            {/* SHARED MODALS */}
            {activeModal === 'ADVANCED_FILTER' && (<AdvancedGlobalFilterModal onClose={() => setActiveModal(null)} onApply={handleApplyAdvancedFilters} currentFilters={advFilters} totalRecords={filteredObservations.length} hierarchicalFilteredReports={observations} />)}
            {activeModal === 'NEW' && <ComplaintFormModal availableSops={availableSops} availableDepartments={availableDepartments} availableLocations={availableLocations} usageFrequencies={usageFrequencies} initialPersistence={persistence} onClose={() => setActiveModal(null)} onSave={handleNewObservationSave} onViewImage={handleViewImage} userId={userRootId} />}
            {activeModal === 'EDIT' && selectedObsId && selectedObs && <ComplaintFormModal availableSops={availableSops} availableDepartments={availableDepartments} availableLocations={availableLocations} usageFrequencies={usageFrequencies} initialData={selectedObs} onClose={() => setActiveModal(null)} onSave={handleNewObservationSave} onViewImage={handleViewImage} userId={userRootId} />}
            {activeModal === 'BULK_UPLOAD' && <BulkUploadModal isOpen={true} onClose={() => setActiveModal(null)} onSave={handleBulkUploadSave} availableLocations={availableLocations} />}
            {activeModal === 'CSV_REVIEW' && <ReviewCsvModal stagedData={stagedCsvRows} onCommit={handleCsvCommit} onCancel={() => { setStagedCsvRows([]); setActiveModal(null); }} availableLocations={availableLocations} availableDepartments={availableDepartments} availableSops={availableSops} />}
            
            {/* FORENSIC IMAGE VIEWER (Overlays current state) */}
            {viewerImage && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setViewerImage(null)}>
                    <div className="absolute top-6 right-6 flex items-center gap-4 z-[1010]"><div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-xs font-black uppercase tracking-widest">{viewerImage.label}</div><button onClick={(e) => { e.stopPropagation(); setViewerImage(null); }} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 shadow-2xl"><X size={28} strokeWidth={3} /></button></div>
                    <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}><img src={viewerImage.url} className="max-w-full max-h-full object-contain rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5" alt="Viewer" /><div className="absolute bottom-10 left-1/2 -translate-y-1/2 w-full text-center"><p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">HACCP PRO FORENSIC IMAGE PROTOCOL</p></div></div>
                </div>
            )}

            {activeModal === 'DELETE' && selectedObsId && (
                <DeleteConfirmationModal id={selectedObsId} onClose={() => setActiveModal(null)} onConfirm={confirmDelete} />
            )}
            {activeModal === 'LOG' && selectedObs && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
                        <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg"><div className="flex items-center gap-4"><History size={24} className="text-indigo-400" /><div><h3 className="text-lg font-black uppercase tracking-tight">Observation Audit Trail</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report #{selectedObs.id}</p></div></div><button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24} /></button></div>
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-50/20">
                            <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                {selectedObs.tracking.map((step, idx) => (
                                    <div key={idx} className="relative"><div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shadow-sm" /><div className="flex justify-between items-start mb-2"><span className="text-xs font-black text-slate-800 uppercase tracking-tight">{step.label}</span><span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 uppercase">{step.timestamp}</span></div><div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{step.comments}"</p><div className="mt-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">U</div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{step.user}</span></div></div></div>
                                ))}
                            </div>
                        </div>
                        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end"><button onClick={() => setActiveModal(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Close Log</button></div>
                    </div>
                </div>
            )}
            {activeModal === 'BREAKDOWN' && selectedObs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 text-left">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-lg overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
                        <div className="px-10 py-8 bg-rose-600 text-white flex justify-between items-center shrink-0 shadow-lg"><div className="flex items-center gap-5"><Wrench size={32} /><div><h3 className="text-xl font-black uppercase tracking-tight">{breakdownMode === 'initiate' ? 'Log Maintenance' : breakdownMode === 'update' ? 'Update Service' : 'Service History'}</h3><p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest mt-2">Asset Lifecycle Log</p></div></div><button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white active:scale-90"><X size={28} /></button></div>
                        <div className="p-10 space-y-6 bg-slate-50/20 overflow-y-auto custom-scrollbar flex-1 text-left">{breakdownMode === 'history' ? (<div className="space-y-4">{!selectedObs.breakdownDetails || selectedObs.breakdownDetails.history.length === 0 ? (<div className="text-center text-slate-400 py-10 italic">No history available</div>) : (selectedObs.breakdownDetails.history.map((h, i) => (<div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="flex justify-between items-center mb-2"><span className="text-xs font-black text-slate-700">{h.action}</span><span className="text-[10px] text-slate-400">{h.date}</span></div><p className="text-xs text-slate-600 mb-2">{h.comments}</p><div className="flex justify-between items-center text-[10px] font-bold text-slate-500"><span>User: {h.user}</span>{h.cost !== undefined && <span>Cost: ₹{h.cost}</span>}</div></div>))) }<button onClick={() => setBreakdownMode('update')} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50">Back to Update</button></div>) : (<><div className="space-y-2 relative" ref={assetDropdownRef}><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Identity</label><div onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)} className={`w-full px-5 py-4 bg-white border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${isAssetDropdownOpen ? 'border-rose-500 bg-white ring-4 ring-rose-50 shadow-md' : 'border-slate-100 hover:border-rose-200 shadow-sm'}`}><span className={`text-xs font-black uppercase ${breakdownForm.equipment ? 'text-slate-800' : 'text-slate-300'}`}>{breakdownForm.equipment || "CHOOSE ASSET..."}</span><ChevronDown size={18} className={`text-slate-300 transition-transform ${isAssetDropdownOpen ? 'rotate-180' : ''}`} /></div>{isAssetDropdownOpen && (<div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-[230] shadow-2xl z-[230] overflow-hidden animate-in fade-in slide-in-from-top-2"><div className="p-3 border-b border-slate-100 bg-slate-50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input autoFocus type="text" placeholder="Search asset registry..." className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs font-bold outline-none focus:border-rose-500 uppercase" value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} onClick={(e) => e.stopPropagation()} /></div></div><div className="max-h-48 overflow-y-auto custom-scrollbar p-1">{filteredAssets.map(asset => (<button key={asset} onClick={(e) => { e.stopPropagation(); setBreakdownForm({...breakdownForm, equipment: asset}); setIsAssetDropdownOpen(false); setAssetSearch(""); }} className="w-full text-left px-4 py-3 hover:bg-rose-50 rounded-xl text-xs font-black text-slate-600 uppercase flex justify-between items-center group transition-all">{asset}{breakdownForm.equipment === asset && <Check size={14} className="text-rose-600" strokeWidth={3} />}</button>))}{filteredAssets.length === 0 && (<div className="p-4 text-center text-[10px] text-slate-400 italic font-bold uppercase">No Assets Found</div>)}</div></div>)}</div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{breakdownMode === 'initiate' ? 'Root Failure Cause' : 'Maintenance Status'}</label><textarea className="w-full h-24 p-5 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-rose-500 resize-none shadow-inner transition-all placeholder:text-slate-300" placeholder="Detail the technical status..." value={breakdownMode === 'initiate' ? breakdownForm.cause : breakdownForm.action} onChange={e => breakdownMode === 'initiate' ? setBreakdownForm({...breakdownForm, cause: e.target.value}) : setBreakdownForm({...breakdownForm, action: e.target.value})} /></div>{breakdownMode === 'update' && (<div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Maintenance Cost (₹)</label><input type="number" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-rose-500 outline-none" value={breakdownForm.cost} onChange={e => setBreakdownForm({...breakdownForm, cost: e.target.value})} /></div>)}</>)}</div>
                        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 pb-safe"><button onClick={() => setActiveModal(null)} className="px-8 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest">Cancel</button>{breakdownMode === 'initiate' ? (<button disabled={!breakdownForm.equipment || !breakdownForm.cause} onClick={handleSaveBreakdown} className={`px-12 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${breakdownForm.equipment && breakdownForm.cause ? 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>Confirm Breakdown</button>) : breakdownMode === 'update' ? (<><button onClick={() => handleBreakdownUpdate(false)} className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95">Post Update</button><button onClick={() => handleBreakdownUpdate(true)} className="px-8 py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle2 size={18} strokeWidth={3} /> Resolve Breakdown</button></>) : (<button onClick={() => setActiveModal(null)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Close</button>)}</div>
                    </div>
                </div>
            )}
            {activeModal === 'REOPEN' && selectedObsId && selectedObs && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 max-h-[85vh]">
                        <div className="px-8 py-6 bg-rose-600 text-white flex justify-between items-center shrink-0 shadow-lg">
                            <div className="flex items-center gap-5">
                                <ShieldAlert size={32} />
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Non-Compliance Log</h3>
                                    <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest mt-1">Audit Failure Node Registration</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white active:scale-90"><X size={28} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 text-left custom-scrollbar">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Persistent Findings Narrative <span className="text-red-500">*</span></label>
                                    <textarea autoFocus className="w-full h-32 p-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-700 outline-none focus:border-rose-500 shadow-inner resize-none" placeholder="Detail the persistent findings..." value={reopenFindings} onChange={e => setReopenFindings(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Persistent Issue Evidence</label>
                                    <div className="flex items-center gap-4">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex-1 h-24 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2 transition-all group ${reopenEvidence ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-400 hover:text-rose-500'}`}>
                                            <Camera size={24} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Capture Evidence</span>
                                        </button>
                                        <input type="file" ref={fileInputRef} capture="environment" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                        {reopenEvidence && (
                                            <div onClick={() => handleViewImage(reopenEvidence, 'Persistent Issue Evidence')} className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-indigo-400 shadow-lg relative group cursor-zoom-in">
                                                <img src={reopenEvidence} className="w-full h-full object-cover" alt="reopen-evidence" />
                                                <button onClick={(e) => { e.stopPropagation(); setReopenEvidence(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} strokeWidth={4}/></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <SignaturePad onSave={setSignature} label="QA Verifier Signature" />
                            </div>
                        </div>
                        <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 pb-safe">
                            <button onClick={() => setActiveModal(null)} className="px-10 py-4 text-[10px] font-black uppercase text-slate-400 transition-colors">Discard</button>
                            <button disabled={!reopenFindings.trim() || !signature} onClick={handleReopenSubmit} className={`px-16 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98] ${reopenFindings.trim() && signature ? 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>Commit Non-Compliance</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ObservationRegistry;