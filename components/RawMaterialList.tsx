"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Trash2, Plus, Edit, History, Search, 
  AlertCircle, Building2, ShieldCheck, 
  Clock, Package, ChevronDown, ChevronRight, ArrowRight, 
  Eye, FileUp, X, Loader2, 
  CheckCircle2, FlaskConical, Boxes,
  Layers,
  Tag,
  Check,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hash,
  ClipboardList,
  Edit3,
  Settings2,
  Lock,
  PlusCircle,
  Globe,
  Truck,
  Flame,
  Wheat,
  Beef,
  Droplet,
  Timer,
  Power,
  Camera,
  FileCheck,
  Calendar,
  ShieldAlert,
  Warehouse,
  ListPlus,
  Download,
  CheckCheck,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  MapPin,
  Upload,
  Settings as SettingsIcon,
  XCircle as RemoveIcon,
  FileSearch as ViewIcon,
  Merge,
  Calculator,
  FileText,
  Anchor,
  Ban,
  Sparkles,
  ZapOff,
  MoreVertical,
  MousePointer2,
  FileBadge,
  Shield,
  Thermometer,
  FileDigit,
  Filter,
  User,
  Activity,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownToLine,
  ArrowDownRight,
  SlidersHorizontal,
  Eraser,
  Info,
  Image as ImageIcon,
  FileSpreadsheet,
  RefreshCw,
  Cpu,
  BrainCircuit,
  Save,
  ArrowLeftRight,
  FileWarning
} from 'lucide-react';
import { RawMaterial, MaterialBrand, CoaRecord, Entity, Brand, HierarchyScope, SupplierLink } from '../types';
import ExcelJS from 'exceljs';
import { GoogleGenAI } from "@google/genai";

// --- Dashboard Component mirroring the image ---

const AnalyticItem = ({ 
    label, 
    value, 
    colorClass = "text-slate-900", 
    onClick, 
    isActive 
}: { 
    label: string, 
    value: string, 
    colorClass?: string, 
    onClick?: () => void, 
    isActive?: boolean 
}) => (
    <div 
        onClick={onClick}
        className={`flex flex-col gap-1 cursor-pointer transition-all hover:opacity-80 active:scale-95 group ${isActive ? 'relative' : ''}`}
    >
        <span className={`text-[10px] font-black uppercase tracking-wider leading-none transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            {label}
        </span>
        <span className={`text-xl font-black tracking-tight transition-transform group-hover:translate-x-0.5 ${colorClass}`}>
            {value}
        </span>
        {isActive && (
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-full animate-in slide-in-from-left-1" />
        )}
    </div>
);

const ImageDashCard = ({ title, icon: Icon, iconBg, children }: { title: string, icon: any, iconBg: string, children?: React.ReactNode }) => (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col gap-6 min-w-[280px] md:min-w-0 shrink-0 snap-center">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${iconBg} text-white flex items-center justify-center shadow-lg`}>
                    <Icon size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.1em]">{title}</h3>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {children}
        </div>
    </div>
);

// --- Options Constants ---

const MOCK_GLOBAL_VENDORS = ["DAIRY PURE", "GLOBAL MEATS", "FARM FRESH", "OCEAN DELIGHT", "VITAL FOODS"];

const STORAGE_OPTIONS = [
  "Vegetarian food hot (≥ 65°C)",
  "Non-vegetarian food hot (≥ 70°C)",
  "Chilled Storage (≤ 5°C)",
  "Chilled & Frozen Combo (≤ 5°C / ≤ -18°C)",
  "Deep Frozen (≤ -18°C)",
  "Ambient; Refrigerate after opening",
  "Ambient Temperature",
  "Dual Chilled/Frozen Choice"
];

const SPECIAL_STORAGE_OPTIONS = [
  "None",
  "Store under refrigerator once open",
  "Protect from direct sunlight",
  "Store in airtight container",
  "Avoid moisture contact",
  "Keep away from strong odors"
];

const HANDLING_INSTRUCTIONS = [
  "Thawing & Cooking",
  "Thawing & RTE/RTS",
  "Thawing & Cold processing",
  "Others (Yes/No/NA)"
];

const ALLERGEN_OPTIONS = [
  "Gluten (Cereals)", "Crustaceans", "Eggs", "Fish", "Peanuts", 
  "Soybeans", "Milk/Lactose", "Tree Nuts", "Celery", "Mustard", 
  "Sesame", "Lupin", "Molluscs", "Sulphites"
];

const SPECIFICATION_CATALOG = [
  "Grade A Quality", "Organic Certified", "ISO 22000", "Non-GMO Project Verified", 
  "Gluten Free", "Halal Certified", "Kosher Certified", "Zero Trans Fat", 
  "HACCP Compliant", "FDA Approved", "EU Standard", "Low Sodium", 
  "No Artificial Colors", "Preservative Free", "High Protein Content"
];

const COA_STATUS_OPTIONS = ["Valid", "Expired", "Expiry Soon", "Not Attached"];

// --- Utility: Jaro-Winkler Fuzzy Matching ---
function jaroWinkler(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  let m = 0;
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1.length === 0 || str2.length === 0) return 0;
  if (str1 === str2) return 1;
  let r = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  let rOrder = Math.max(str1.length, str2.length);
  let s1M = new Array(str1.length).fill(false);
  let s2M = new Array(str2.length).fill(false);
  for (let i = 0; i < str1.length; i++) {
    let low = i >= r ? i - r : 0;
    let high = i + r <= str2.length ? i + r : str2.length - 1;
    for (let j = low; j <= high; j++) {
      if (!s2M[j] && str1[i] === str2[j]) {
        s1M[i] = true;
        s2M[j] = true;
        m++;
        break;
      }
    }
  }
  if (m === 0) return 0;
  let k = 0, t = 0;
  for (let i = 0; i < str1.length; i++) {
    if (s1M[i]) {
      while (!s2M[k]) k++;
      if (str1[i] !== s2[k]) t++;
      k++;
    }
  }
  t /= 2;
  let jaro = (m / str1.length + m / str2.length + (m - t) / m) / 3;
  let p = 0.1, l = 0;
  if (jaro > 0.7) {
    while (str1[l] === str2[l] && l < 4) l++;
    jaro = jaro + l * p * (1 - jaro);
  }
  return jaro;
}

const getRiskStyles = (risk: string) => {
  switch (risk) {
    case 'High': return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-100';
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-100';
    case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-100';
    case 'NA': return 'bg-slate-50 text-slate-400 border-slate-200 focus:ring-slate-100';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getCoaColor = (status: string) => {
  switch (status) {
    case 'Valid':
    case 'Compliant': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Expired':
    case 'Non-Compliant': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Pending':
    case 'Provisional': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

interface RawMaterialExtended extends RawMaterial {
  isActive?: boolean;
  specifications?: string[]; 
}

interface RawMaterialListProps {
  suppliers: any[];
  entities: Entity[];
  onUpdateEntity: (e: Entity) => void;
  userRootId?: string | null;
  currentScope: HierarchyScope;
}

export const MOCK_MATERIALS: RawMaterialExtended[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `RM-${100 + i}`,
  name: i === 0 ? 'WHOLE MILK' : `MATERIAL BATCH ${String.fromCharCode(65 + (i % 26))}${i}`,
  organization: i % 2 === 0 ? 'NYC Central Kitchen' : 'LA Logistics Unit', 
  updatedOn: '2024-03-01',
  uploadedBy: 'System',
  accepted: i % 5 !== 0,
  risk: i % 4 === 0 ? 'High' : i % 4 === 1 ? 'Medium' : i % 4 === 2 ? 'Low' : 'NA',
  riskActive: true,
  yield: true,
  stockable: true,
  vendors: ['DAIRY PURE'],
  specifications: i % 3 === 0 ? ["Grade A Quality", "ISO 22000"] : ["Gluten Free"],
  brands: [
    {
      id: `B-${1000 + i}`,
      name: i % 3 === 0 ? 'DairyPure Gold' : `Brand ${i}`, 
      status: 'Active',
      allergens: i % 3 === 0 ? 'Milk/Lactose' : i % 3 === 1 ? 'Soybeans, Gluten (Cereals)' : 'None',
      storage: 'Chilled Storage (≤ 5°C)',
      shelfLife: i % 2 === 0 ? '7 Days' : '6 Months',
      specialHandling: 'Thawing & Cooking',
      testingDate: '2024-02-15',
      coaStatus: i % 4 === 0 ? 'Expired' : 'Valid',
      coaRecords: [
        {
          id: `coa-${i}`,
          fileName: `coa_batch_${100 + i}.pdf`,
          batchNumber: `BN-992${i}`,
          manufacturingDate: '2024-01-01',
          testingDate: '2024-02-15',
          expiryDate: i % 4 === 0 ? '2023-01-01' : '2025-08-15', 
          uploadedBy: 'John Chef',
          uploadedAt: '2024-02-16'
        }
      ],
      lastReceived: '2024-02-28',
      vendor: 'DAIRY PURE',
      linkedSuppliers: [{ name: 'DAIRY PURE', status: 'Active' }],
      qtyAccRej: '100/0',
      formE: `E-${100 + i}`,
      reviewedOn: '2024-03-01',
      complianceStatus: 'Compliant',
      nextReview: '2024-04-01',
      openPoints: 0,
      auditTrail: [],
      dietaryType: i % 2 === 0 ? 'Veg' : 'Non-Veg',
      energy: i % 2 === 0 ? '45' : '0',
      image: i % 2 === 0 ? 'https://images.unsplash.com/photo-1628191010210-a59de33e5941?q=80&w=200' : undefined
    }
  ],
  isActive: true,
  createdByEntityId: i % 2 === 0 ? 'unit-ny-kitchen' : 'unit-la-depot',
  createdByScope: 'unit'
}));

const DietaryLogo = ({ type, size = "md" }: { type?: 'Veg' | 'Non-Veg', size?: 'sm' | 'md' | 'lg' }) => {
  if (!type) return null;
  const dims = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  if (type === 'Non-Veg') {
    return (
      <div className={`${dims} border-2 border-amber-900 bg-white flex items-center justify-center p-0.5 rounded-sm shadow-sm`} title="Non-Veg">
        <svg viewBox="0 0 100 100" className={size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} fill="#78350f">
          <polygon points="50,15 90,85 10,85" />
        </svg>
      </div>
    );
  }
  const dotDims = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2';
  return (
    <div className={`${dims} border-2 border-emerald-600 bg-white flex items-center justify-center p-0.5 rounded-sm shadow-sm`} title="Veg">
      <div className={`${dotDims} rounded-full bg-emerald-600`} />
    </div>
  );
};

const MultiSelect = ({ label, options, selected, onToggle, placeholder = "Select...", disabled = false, brandMetadata = {} }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const multiSelectRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (multiSelectRef.current && !multiSelectRef.current.contains(event.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const filtered = options.filter((opt: string) => opt.toLowerCase().includes(search.toLowerCase()));
    const toggle = (val: string) => { if (disabled) return; if (selected.includes(val)) onToggle(selected.filter((i: string) => i !== val)); else onToggle([...selected, val]); };
    return (
        <div ref={multiSelectRef} className={`relative w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">{label}</label>
            <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`w-full min-h-[48px] bg-slate-50 border-2 rounded-2xl px-4 py-2 flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-indigo-400 bg-white ring-4 ring-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200 shadow-inner'}`}>
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 pr-2">{selected.length > 0 ? selected.map((s: string) => (<span key={s} className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 shadow-sm animate-in zoom-in-50 whitespace-nowrap">{s} {!disabled && <button onClick={(e) => { e.stopPropagation(); toggle(s); }}><X size={10} strokeWidth={4} /></button>}</span>)) : <span className="text-xs font-bold text-slate-300 italic">{placeholder}</span>}</div>
                {!disabled && <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </div>
            {isOpen && !disabled && (
                <div className="absolute z-[110] top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                    <div className="p-3 border-b border-slate-100 bg-white"><div className="relative group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 w-4 h-4" /><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter list..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-[1.5rem] text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all" /></div></div>
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                        {filtered.map((opt: string) => { 
                            const isSel = selected.includes(opt); 
                            const meta = brandMetadata[opt];
                            return (
                                <button key={opt} type="button" onClick={() => toggle(opt)} className={`w-full text-left px-5 py-4 rounded-xl flex items-center justify-between group transition-all ${isSel ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                                    <div className="min-w-0">
                                        <div className="font-black text-slate-800 text-[12px] uppercase tracking-tight pr-4">{opt}</div>
                                        {meta && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border uppercase ${meta.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {meta.status === 'Active' ? 'Master' : 'Unit request'}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">By: {meta.unitName}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>{isSel && <Check size={14} strokeWidth={4} />}</div>
                                </button>
                            ); 
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Advanced Filtering Types and Components
interface AdvancedFilterState {
    productName: string;
    risk: string;
    vendorName: string;
    brandName: string;
    specification: string;
    
    // New Fields
    allergens: string[];
    storage: string[];
    handling: string[];
    shelfLifeMin: string;
    shelfLifeMax: string;
    hasNutrition: string; // 'yes' | 'no' | ''
    coaStatus: string[];
    hasImage: string; // 'yes' | 'no' | ''
}

const INITIAL_ADV_FILTERS: AdvancedFilterState = {
    productName: "",
    risk: "",
    vendorName: "",
    brandName: "",
    specification: "",
    allergens: [],
    storage: [],
    handling: [],
    shelfLifeMin: "",
    shelfLifeMax: "",
    hasNutrition: "",
    coaStatus: [],
    hasImage: ""
};

const AdvancedGlobalFilterModal = ({ 
    onClose, 
    onApply, 
    currentFilters, 
    totalRecords,
    brandMetadata 
}: { 
    onClose: () => void, 
    onApply: (filters: AdvancedFilterState) => void, 
    currentFilters: AdvancedFilterState, 
    totalRecords: number,
    brandMetadata?: any
}) => {
    const [localFilters, setLocalFilters] = useState<AdvancedFilterState>(currentFilters);

    const handleApply = () => {
        onApply(localFilters);
    };

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 h-[90vh] md:h-auto">
                <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <SlidersHorizontal size={24} />
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Global Registry Filter</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Cross-node parameter optimization</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24}/></button>
                </div>
                
                <div className="p-10 space-y-8 bg-white overflow-y-auto max-h-[60vh] custom-scrollbar flex-1">
                    
                    {/* SECTION 1: Core Identity */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Core Identity</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black uppercase focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                                    value={localFilters.productName}
                                    onChange={e => setLocalFilters({...localFilters, productName: e.target.value})}
                                    placeholder="Enter keyword..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Risk Profile</label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase focus:outline-none focus:border-indigo-500 transition-all shadow-inner appearance-none cursor-pointer"
                                    value={localFilters.risk}
                                    onChange={e => setLocalFilters({...localFilters, risk: e.target.value})}
                                >
                                    <option value="">ANY RISK</option>
                                    <option value="High">HIGH RISK</option>
                                    <option value="Medium">MEDIUM RISK</option>
                                    <option value="Low">LOW RISK</option>
                                    <option value="NA">NOT IDENTIFIED</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Vendor</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                                    value={localFilters.vendorName}
                                    onChange={e => setLocalFilters({...localFilters, vendorName: e.target.value})}
                                    placeholder="Search vendors..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Identity</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                                    value={localFilters.brandName}
                                    onChange={e => setLocalFilters({...localFilters, brandName: e.target.value})}
                                    placeholder="Search brands..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Technical Attributes */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Technical Attributes</h4>
                        
                        <div className="grid grid-cols-1 gap-6">
                             <MultiSelect 
                                label="Allergens" 
                                options={ALLERGEN_OPTIONS} 
                                selected={localFilters.allergens} 
                                onToggle={(vals: string[]) => setLocalFilters({...localFilters, allergens: vals})} 
                                placeholder="Select Allergens..."
                             />
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <MultiSelect 
                                    label="Storage Condition" 
                                    options={STORAGE_OPTIONS} 
                                    selected={localFilters.storage} 
                                    onToggle={(vals: string[]) => setLocalFilters({...localFilters, storage: vals})} 
                                    placeholder="Select Storage..."
                                />
                                <MultiSelect 
                                    label="Handling Instructions" 
                                    options={HANDLING_INSTRUCTIONS} 
                                    selected={localFilters.handling} 
                                    onToggle={(vals: string[]) => setLocalFilters({...localFilters, handling: vals})} 
                                    placeholder="Select Instructions..."
                                />
                             </div>

                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shelf Life (Days)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number"
                                            placeholder="Min"
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                                            value={localFilters.shelfLifeMin}
                                            onChange={e => setLocalFilters({...localFilters, shelfLifeMin: e.target.value})}
                                        />
                                        <input 
                                            type="number"
                                            placeholder="Max"
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                                            value={localFilters.shelfLifeMax}
                                            onChange={e => setLocalFilters({...localFilters, shelfLifeMax: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Spec</label>
                                    <input 
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                                        value={localFilters.specification}
                                        onChange={e => setLocalFilters({...localFilters, specification: e.target.value})}
                                        placeholder="Search requirements..."
                                    />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* SECTION 3: Status & Compliance */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Status & Compliance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MultiSelect 
                                label="COA Status" 
                                options={COA_STATUS_OPTIONS} 
                                selected={localFilters.coaStatus} 
                                onToggle={(vals: string[]) => setLocalFilters({...localFilters, coaStatus: vals})} 
                                placeholder="Any Status..."
                            />
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nutritional Data</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer"
                                    value={localFilters.hasNutrition}
                                    onChange={e => setLocalFilters({...localFilters, hasNutrition: e.target.value})}
                                >
                                    <option value="">Any</option>
                                    <option value="yes">Available (Yes)</option>
                                    <option value="no">Missing (No)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Image</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer"
                                    value={localFilters.hasImage}
                                    onChange={e => setLocalFilters({...localFilters, hasImage: e.target.value})}
                                >
                                    <option value="">Any</option>
                                    <option value="yes">Attached</option>
                                    <option value="no">Not Attached</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-sm"><Info size={16}/></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Active results: <span className="text-slate-900">{totalRecords} Nodes</span></span>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setLocalFilters(INITIAL_ADV_FILTERS)} className="px-6 py-3 text-xs font-black uppercase text-slate-400 hover:text-rose-500 transition-all tracking-widest">Clear Criteria</button>
                        <button type="button" onClick={handleApply} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                            <CheckCheck size={18} /> Apply Matrix
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW MODAL COMPONENTS ---

const CreateMaterialModal = ({ onClose, onSave, initialMaterial }: { onClose: () => void, onSave: (data: any) => void, initialMaterial?: any, existingMaterials?: any, currentScope?: any, userRootId?: any }) => {
    const [form, setForm] = useState(initialMaterial || { name: '', risk: 'Low', stockable: true, yield: false });
    
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{initialMaterial ? 'Edit Material' : 'New Material'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                        <input className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Risk</label>
                        <select className="w-full border p-2 rounded" value={form.risk} onChange={e => setForm({...form, risk: e.target.value})}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>
                     <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.stockable} onChange={e => setForm({...form, stockable: e.target.checked})} /> Stockable</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.yield} onChange={e => setForm({...form, yield: e.target.checked})} /> Yield Management</label>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                    <button onClick={() => onSave(form)} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold">Save</button>
                </div>
            </div>
        </div>
    );
};

interface BulkImportRow {
    id: string;
    originalName: string;
    suggestedName: string;
    status: 'clean' | 'conflict' | 'error';
    conflictWith?: RawMaterialExtended;
    resolution: 'none' | 'skip' | 'merge' | 'new';
    reason?: string;
    details: Record<string, string>;
}

const BulkUploadModal = ({ onClose, onSave, materials }: { onClose: () => void, onSave: (names: string[]) => void, materials: RawMaterialExtended[] }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<'upload' | 'review'>('upload');
    const [reviewRows, setReviewRows] = useState<BulkImportRow[]>([]);
    const [activeTab, setActiveTab] = useState<'clean' | 'conflict' | 'error'>('clean');
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                // Skip header (Product Name)
                const data = lines.slice(1);
                processIncomingData(data);
            };
            reader.readAsText(selected);
        }
    };

    const processIncomingData = (names: string[]) => {
        const rows: BulkImportRow[] = names.map((name, idx) => {
            const id = `import-${idx}`;
            const trimmedName = name.trim().toUpperCase();
            
            // 1. Multi-Vector Conflict Detection
            let conflictWith: RawMaterialExtended | undefined;
            let status: BulkImportRow['status'] = 'clean';
            let reason = '';

            // Vector 1: Direct Name Match
            conflictWith = materials.find(m => m.name.toUpperCase() === trimmedName);
            
            // Vector 2: Phonetic/Similarity Match (Jaro-Winkler > 0.9)
            if (!conflictWith) {
                const bestMatch = materials.reduce((best, curr) => {
                    const score = jaroWinkler(curr.name, trimmedName);
                    return score > best.score ? { score, item: curr } : best;
                }, { score: 0, item: null as any });

                if (bestMatch.score > 0.92) {
                    conflictWith = bestMatch.item;
                    reason = `Phonetic match (${Math.round(bestMatch.score * 100)}%)`;
                }
            } else {
                reason = 'Exact name collision';
            }

            if (conflictWith) {
                status = 'conflict';
            } else if (!trimmedName) {
                status = 'error';
                reason = 'Missing mandatory name field';
            }

            return {
                id,
                originalName: name,
                suggestedName: trimmedName,
                status,
                conflictWith,
                resolution: status === 'clean' ? 'new' : 'none',
                reason,
                details: { 'Raw Material Name': trimmedName }
            };
        });

        setReviewRows(rows);
        setStep('review');
        if (rows.some(r => r.status === 'conflict')) setActiveTab('conflict');
        else if (rows.some(r => r.status === 'clean')) setActiveTab('clean');
        else setActiveTab('error');
    };

    const handleResolution = (rowId: string, resolution: BulkImportRow['resolution']) => {
        setReviewRows(prev => prev.map(r => r.id === rowId ? { ...r, resolution } : r));
    };

    const runAiStandardization = async () => {
        setIsAiProcessing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Standardize the following list of raw material names for an industrial kitchen. 
            Identify conceptual duplicates (e.g. 'Whole Milk 5L' and 'Milk Whole 5000ml'). 
            Return a JSON array of objects: { original: string, standardized: string, category: string }.
            
            Names: ${reviewRows.map(r => r.suggestedName).join(', ')}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction: "You are a master food safety and supply chain data hygiene specialist. You standardize technical names for ISO 22000 registries.",
                    responseMimeType: "application/json"
                }
            });

            const results = JSON.parse(response.text || '[]');
            setReviewRows(prev => prev.map(row => {
                const match = results.find((res: any) => res.original.toUpperCase() === row.suggestedName);
                if (match) {
                    return { ...row, suggestedName: match.standardized.toUpperCase() };
                }
                return row;
            }));
        } catch (error) {
            console.error("AI Analysis failed", error);
        } finally {
            setIsAiProcessing(false);
        }
    };

    const handleImportCommit = () => {
        const toImport = reviewRows
            .filter(r => (r.resolution === 'new' || r.resolution === 'merge') && r.status !== 'error')
            .map(r => r.suggestedName);
        
        onSave(toImport);
        onClose();
    };

    const counts = {
        clean: reviewRows.filter(r => r.status === 'clean').length,
        conflict: reviewRows.filter(r => r.status === 'conflict').length,
        error: reviewRows.filter(r => r.status === 'error').length
    };

    return (
         <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 ${step === 'upload' ? 'w-full max-w-lg' : 'w-[95vw] h-[90vh]'}`}>
                {step === 'upload' ? (
                    <div className="p-10">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                                    <Upload size={24} />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Bulk Import</h3>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20}/></button>
                        </div>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="group border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300 rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                        >
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileUp size={32} className="text-indigo-500" />
                            </div>
                            <p className="text-sm font-black text-slate-600 uppercase tracking-tight group-hover:text-indigo-700">Click to select CSV</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Parses 'Product Name' column</p>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Review Header */}
                        <div className="px-10 py-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center shrink-0 shadow-2xl relative">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20">
                                    <ClipboardList size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Registry Import Review</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Multi-Vector Deduplication Engine</p>
                                        <div className="h-3 w-px bg-white/10" />
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={12}/> Pre-Validated</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={runAiStandardization}
                                    disabled={isAiProcessing}
                                    className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/20 transition-all disabled:opacity-50"
                                >
                                    {isAiProcessing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} className="text-indigo-400"/>}
                                    Gemini AI Analysis
                                </button>
                                <button onClick={() => setStep('upload')} className="px-6 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Back to Upload</button>
                                <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/50"><X size={24} /></button>
                            </div>
                        </div>

                        {/* Review Tabs */}
                        <div className="px-10 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 overflow-x-auto hide-scrollbar">
                            <div className="flex gap-1">
                                {[
                                    { id: 'clean', label: 'Clean', count: counts.clean, color: 'text-emerald-600 border-emerald-600', icon: CheckCircle2 },
                                    { id: 'conflict', label: 'Conflicts', count: counts.conflict, color: 'text-amber-600 border-amber-600', icon: AlertTriangle },
                                    { id: 'error', label: 'Errors', count: counts.error, color: 'text-rose-600 border-rose-600', icon: FileWarning }
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-3 ${activeTab === tab.id ? tab.color : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.id ? 'bg-slate-100' : 'bg-slate-50'}`}>{tab.count}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 pr-4">
                                <Info size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Resolving conflicts creates a Deduplication Audit Trail</span>
                            </div>
                        </div>

                        {/* Review Content */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
                            {reviewRows.filter(r => r.status === activeTab).length > 0 ? (
                                <div className="p-10 space-y-4">
                                    {reviewRows.filter(r => r.status === activeTab).map(row => (
                                        <div key={row.id} className={`bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden ${row.resolution === 'none' ? 'border-slate-100' : row.resolution === 'skip' ? 'border-rose-200 grayscale opacity-60' : 'border-indigo-400'}`}>
                                            <div className="flex flex-col xl:flex-row items-stretch">
                                                
                                                {/* Left Column: Incoming Data */}
                                                <div className="p-6 xl:w-[35%] flex items-start gap-5 border-b xl:border-b-0 xl:border-r border-slate-100">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${row.status === 'clean' ? 'bg-emerald-50 text-emerald-600' : row.status === 'conflict' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        <FileUp size={24} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Incoming Identity</p>
                                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-2">{row.originalName}</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {row.suggestedName !== row.originalName && (
                                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase border border-indigo-200 flex items-center gap-1 animate-in zoom-in">
                                                                    <Sparkles size={10} /> AI Standardized: {row.suggestedName}
                                                                </span>
                                                            )}
                                                            {row.reason && (
                                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${row.status === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                                    {row.reason}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle Column: Diff / Registry Match */}
                                                <div className="p-6 flex-1 bg-slate-50/20 flex flex-col justify-center border-b xl:border-b-0 xl:border-r border-slate-100">
                                                    {row.status === 'conflict' && row.conflictWith ? (
                                                        <div className="flex items-center gap-8 px-4">
                                                            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                                                                <div className="absolute top-2 right-2 text-slate-200 group-hover:text-indigo-500 transition-colors"><Info size={12}/></div>
                                                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Registry Identity Match</p>
                                                                <p className="text-sm font-black text-slate-800 uppercase truncate">{row.conflictWith.name}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border">ID: {row.conflictWith.id}</span>
                                                                    <span className="text-[9px] font-bold text-indigo-500 uppercase">{row.conflictWith.organization}</span>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 flex items-center justify-center p-3 bg-white rounded-full shadow-md border border-slate-100 z-10">
                                                                <ArrowLeftRight size={20} className="text-indigo-600" />
                                                            </div>
                                                            <div className="flex-1 bg-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-sm">
                                                                <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Incoming Node</p>
                                                                <p className="text-sm font-black text-indigo-900 uppercase truncate">{row.suggestedName}</p>
                                                                <p className="text-[9px] font-bold text-indigo-500 mt-2 flex items-center gap-1"><Plus size={10}/> Cross-Unit Mapping Request</p>
                                                            </div>
                                                        </div>
                                                    ) : row.status === 'error' ? (
                                                        <div className="flex flex-col items-center justify-center py-4 gap-3 text-rose-500 bg-rose-50/50 rounded-2xl border border-rose-100">
                                                            <FileWarning size={32} strokeWidth={2.5}/>
                                                            <p className="text-xs font-black uppercase tracking-widest">{row.reason}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-4 gap-3 text-emerald-500 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                                                            <CheckCircle2 size={32} strokeWidth={2.5}/>
                                                            <p className="text-xs font-black uppercase tracking-widest">Identified as Unique Registry Node</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Column: Resolution HUB */}
                                                <div className="p-6 xl:w-[250px] bg-white flex flex-col justify-center gap-3">
                                                    {row.status === 'conflict' ? (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button 
                                                                onClick={() => handleResolution(row.id, 'skip')}
                                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${row.resolution === 'skip' ? 'bg-rose-600 text-white border-rose-600 shadow-lg' : 'border-slate-100 text-slate-400 hover:border-rose-400'}`}
                                                            >
                                                                Skip
                                                            </button>
                                                            <button 
                                                                onClick={() => handleResolution(row.id, 'merge')}
                                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${row.resolution === 'merge' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'border-slate-100 text-slate-400 hover:border-indigo-400'}`}
                                                            >
                                                                Merge
                                                            </button>
                                                            <button 
                                                                onClick={() => handleResolution(row.id, 'new')}
                                                                className={`col-span-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${row.resolution === 'new' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'border-slate-100 text-slate-400 hover:border-slate-900'}`}
                                                            >
                                                                Import as New SKU
                                                            </button>
                                                        </div>
                                                    ) : row.status === 'error' ? (
                                                        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Action Restricted</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
                                                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Decision</span>
                                                                <span className="text-[10px] font-black text-emerald-800">ADD NEW</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleResolution(row.id, 'skip')}
                                                                className="text-[9px] font-black text-slate-300 uppercase hover:text-rose-500 transition-colors"
                                                            >
                                                                Ignore Item
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-40 flex flex-col items-center justify-center opacity-30 grayscale gap-4 text-slate-300">
                                    <Hash size={80} />
                                    <p className="text-2xl font-black uppercase tracking-[0.3em]">No items in queue</p>
                                </div>
                            )}
                        </div>

                        {/* Review Footer */}
                        <div className="px-10 py-8 bg-white border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-900 text-white flex items-center justify-center text-[10px] font-black uppercase shadow-lg">
                                            {i === 1 ? <Target size={16}/> : i === 2 ? <Cpu size={16}/> : <ShieldCheck size={16}/>}
                                        </div>
                                    ))}
                                </div>
                                <div className="max-w-md">
                                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.15em] leading-relaxed">
                                        Summary: <span className="text-slate-900">{reviewRows.filter(r => r.resolution === 'new' || r.resolution === 'merge').length} items</span> staged for commit. All actions will be logged to the <span className="text-indigo-600">Enterprise Audit Log</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setStep('upload')} className="px-10 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest transition-all">Discard All</button>
                                <button 
                                    onClick={handleImportCommit}
                                    className="px-20 py-4 bg-indigo-600 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                                >
                                    <Save size={20} strokeWidth={2.5} /> Commit Verified Roster
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const BulkSinkModal = ({ onClose, onExecute, selectedItems }: { onClose: () => void, onExecute: (targetId: string | null, newName?: string) => void, selectedItems?: any, allItems?: any }) => {
    const [newName, setNewName] = useState("");
    return (
         <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Consolidate Materials</h3>
                <p className="text-sm text-slate-500 mb-4">Merging {selectedItems?.length} selected records.</p>
                <input className="w-full border p-2 rounded mb-4" placeholder="New Master Name (Optional)" value={newName} onChange={e => setNewName(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                    <button onClick={() => onExecute(null, newName)} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold">Merge</button>
                </div>
            </div>
        </div>
    );
};

const BrandOnboardModal = ({ onClose, onFinalize, availableBrands }: { onClose: () => void, onFinalize: (brands: any[]) => void, availableBrands: any[], brandMetadata?: any, initialCommittedBrand?: any }) => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
         <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-bold mb-4">Onboard Brands</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                    {availableBrands.map((b: any) => (
                        <label key={b.id} className="flex items-center gap-2 text-sm p-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input type="checkbox" checked={selected.includes(b.id)} onChange={e => {
                                if(e.target.checked) setSelected([...selected, b.id]);
                                else setSelected(selected.filter(id => id !== b.id));
                            }} />
                            {b.name}
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                    <button onClick={() => {
                        const brandsToAdd = availableBrands.filter((b: any) => selected.includes(b.id));
                        onFinalize(brandsToAdd);
                        onClose();
                    }} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold">Add Selected</button>
                </div>
            </div>
        </div>
    );
};

const CoaManagementModal = ({ onClose }: { onClose: () => void, material?: any, materials?: any, onUpdateBrands?: any }) => {
    return (
         <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-bold mb-4">COA Management</h3>
                <p className="text-sm text-slate-500 mb-4">COA upload functionality placeholder.</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">Close</button>
                </div>
            </div>
        </div>
    );
};

const VendorAssignmentModal = ({ onClose, onAssign, existingSuppliers }: { onClose: () => void, onAssign: (name: string) => void, existingSuppliers: string[] }) => {
     return (
         <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Assign Vendor</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                    {existingSuppliers.map(s => (
                        <button key={s} onClick={() => { onAssign(s); onClose(); }} className="w-full text-left p-2 hover:bg-slate-50 rounded text-sm font-bold">{s}</button>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const RawMaterialList: React.FC<RawMaterialListProps> = ({ suppliers, entities, onUpdateEntity, userRootId, currentScope }) => {
  const [materials, setMaterials] = useState<RawMaterialExtended[]>(MOCK_MATERIALS);
  const [search, setSearch] = useState(''); // Variable is 'search', setter is 'setSearch'
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['RM-101']));
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(10);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterialExtended | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkSinkModalOpen, setIsBulkSinkModalOpen] = useState(false);
  const [activeOnboardMaterialId, setActiveOnboardMaterialId] = useState<string | null>(null);
  const [editingCommittedBrand, setEditingCommittedBrand] = useState<{ materialId: string, brand: MaterialBrand } | null>(null);
  const [coaTarget, setCoaTarget] = useState<{ materialId: string } | null>(null);
  const [vendorTarget, setVendorTarget] = useState<{ materialId: string, brandId: string } | null>(null);
  const [isCreatingNewMaster, setIsCreatingNewMaster] = useState(false);
  const [isAdvFilterOpen, setIsAdvFilterOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState<AdvancedFilterState>(INITIAL_ADV_FILTERS);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  
  // Dashboard Filter State
  const [dashFilter, setDashFilter] = useState<{ cat: string, val: string } | null>(null);

  const corporateEntity = useMemo(() => {
    let curr = entities.find(e => e.id === userRootId);
    while (curr) { if (curr.type === 'corporate') return curr; curr = entities.find(e => e.id === curr?.parentId); }
    return entities.find(e => e.type === 'corporate');
  }, [entities, userRootId]);

  const masterBrands = useMemo(() => corporateEntity?.masterBrands || [], [corporateEntity]);

  const contextAwareBrands = useMemo(() => {
    return masterBrands.filter(b => b.status === 'Active' || b.addedByUnitId === userRootId);
  }, [masterBrands, userRootId]);

  const brandMetadata = useMemo(() => {
    const meta: Record<string, { status: string, unitName: string }> = {};
    contextAwareBrands.forEach(b => {
        meta[b.name] = { status: b.status, unitName: b.addedByUnitName };
    });
    return meta;
  }, [contextAwareBrands]);

  const unitSuppliers = useMemo(() => {
    return suppliers.filter(s => s.status === 'Active');
  }, [suppliers]);

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedRows(newSet);
  };

  const toggleSelectItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedItems(newSet);
  };

  const updateMaterial = (id: string, updates: Partial<RawMaterialExtended>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const toggleBrandStatus = (materialId: string, brandId: string) => {
    setMaterials(prev => prev.map(m => {
      if (m.id !== materialId) return m;
      return { ...m, brands: m.brands.map(b => b.id !== brandId ? b : { ...b, status: b.status === 'Active' ? 'Inactive' : 'Active' as any }) };
    }));
  };

  const toggleSupplierStatus = (materialId: string, brandId: string, supplierName: string) => {
    setMaterials(prev => prev.map(m => {
      if (m.id !== materialId) return m;
      return { ...m, brands: m.brands.map(b => b.id !== brandId ? b : { ...b, linkedSuppliers: b.linkedSuppliers.map(s => s.name !== supplierName ? s : { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' as any }) }) };
    }));
  };

  const handleVendorLink = (materialId: string, brandId: string, vendorName: string) => {
    setMaterials(prev => prev.map(m => {
        if (m.id !== materialId) return m;
        return { ...m, brands: m.brands.map(b => b.id !== brandId ? b : { ...b, linkedSuppliers: [...b.linkedSuppliers.filter(s => s.name !== vendorName), { name: vendorName, status: 'Active' as const }] }) };
    }));
    setVendorTarget(null);
  };

  const handleUpdateMaterial = (data: any) => {
    if (editingMaterial?.id) {
      setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? { ...m, ...data, updatedOn: new Date().toISOString().split('T')[0] } : m));
    } else {
        const newRM: RawMaterialExtended = { id: `RM-${Date.now()}`, ...data, organization: entities.find(e => e.id === userRootId)?.name || 'Central', updatedOn: new Date().toISOString().split('T')[0], uploadedBy: 'Current User', riskActive: true, yield: true, stockable: true, vendors: [], brands: [], isActive: true, createdByEntityId: userRootId || 'system', createdByScope: currentScope, specifications: [] };
        setMaterials(prev => [newRM, ...prev]);
    }
    setEditingMaterial(null);
  };

  const handleBulkUploadCommit = (names: string[]) => {
    const newRMs: RawMaterialExtended[] = names.map((name, index) => ({
        id: `RM-${Date.now()}-${index}`, 
        name: name.toUpperCase(), 
        organization: entities.find(e => e.id === userRootId)?.name || 'Central', 
        updatedOn: new Date().toISOString().split('T')[0], 
        uploadedBy: 'Bulk Loader', 
        accepted: true, 
        risk: 'NA', 
        riskActive: true, 
        yield: true, 
        stockable: true, 
        vendors: [], 
        brands: [], 
        isActive: true, 
        createdByEntityId: userRootId || 'system', 
        createdByScope: currentScope, 
        specifications: []
    }));
    setMaterials(prev => [...newRMs, ...prev]);
    setIsBulkModalOpen(false);
  };

  const handleAddNewBrandToMaterial = (queuedMappings: any[]) => {
    if (!activeOnboardMaterialId && !editingCommittedBrand) return;
    
    const matId = activeOnboardMaterialId || editingCommittedBrand?.materialId;
    if (!matId) return;

    if (editingCommittedBrand) {
        // Edit Mode
        const updatedBrandData = queuedMappings[0];
        setMaterials(prev => prev.map(m => {
            if (m.id !== matId) return m;
            return {
                ...m,
                brands: m.brands.map(b => b.id === editingCommittedBrand.brand.id ? { ...b, ...updatedBrandData } : b)
            };
        }));
        setEditingCommittedBrand(null);
    } else {
        // Add Mode
        const newBrands: MaterialBrand[] = queuedMappings.map(m => ({ id: `B-${Date.now()}-${Math.random().toString(36).substr(2,5)}`, ...m, status: 'Active' as const, specialHandling: m.specialHandling || '-', testingDate: new Date().toISOString().split('T')[0], coaStatus: 'Pending', lastReceived: '-', vendor: 'UNASSIGNED', linkedSuppliers: [], qtyAccRej: '0/0', formE: '-', reviewedOn: '-', complianceStatus: 'Pending' as const, nextReview: '-', openPoints: 0, auditTrail: [] }));
        setMaterials(prev => prev.map(m => m.id === matId ? { ...m, brands: [...newBrands, ...m.brands] } : m));
        setActiveOnboardMaterialId(null);
    }
  };

  const handleBulkSinkExecute = (targetId: string | null, newName?: string) => {
    const selectedList = materials.filter(m => selectedItems.has(m.id));
    if (selectedList.length === 0) return;

    // Logic Aggregation
    const riskPriority: Record<string, number> = { 'High': 4, 'Medium': 3, 'Low': 2, 'NA': 1 };
    let finalRisk: 'High' | 'Medium' | 'Low' | 'NA' = 'NA';
    let finalStockable = false;
    const allBrands: MaterialBrand[] = [];
    const allSpecs = new Set<string>();
    const allVendors = new Set<string>();

    selectedList.forEach(m => {
        if (riskPriority[m.risk] > riskPriority[finalRisk]) finalRisk = m.risk;
        if (m.stockable) finalStockable = true;
        
        m.brands.forEach(b => {
            if (!allBrands.some(existing => existing.name === b.name)) {
                allBrands.push(b);
            }
        });
        
        (m.specifications || []).forEach(s => allSpecs.add(s));
        (m.vendors || []).forEach(v => allVendors.add(v));
    });

    const now = new Date().toISOString().split('T')[0];

    setMaterials(prev => {
        // Step 1: Remove all items selected for the sink from the primary list
        const remainingItems = prev.filter(m => !selectedItems.has(m.id));
        
        let consolidatedItem: RawMaterialExtended;

        if (targetId) {
            // Sinking into an existing record
            const targetBase = selectedList.find(m => m.id === targetId) || prev.find(m => m.id === targetId);
            if (!targetBase) return prev; // Safety fallback
            
            consolidatedItem = {
                ...targetBase,
                risk: finalRisk,
                stockable: finalStockable,
                brands: allBrands,
                specifications: Array.from(allSpecs),
                vendors: Array.from(allVendors),
                updatedOn: now,
                uploadedBy: 'Data Sync Hub'
            };
        } else if (newName) {
            // Sinking into a new master name
            const template = selectedList[0];
            consolidatedItem = {
                ...template,
                id: `RM-MASTER-${Date.now()}`,
                name: newName.toUpperCase(),
                organization: entities.find(e => e.id === userRootId)?.name || 'Corporate Registry',
                updatedOn: now,
                uploadedBy: 'Registry Consolidation',
                accepted: true,
                risk: finalRisk,
                riskActive: true,
                yield: true,
                stockable: finalStockable,
                vendors: Array.from(allVendors),
                brands: allBrands,
                specifications: Array.from(allSpecs),
                isActive: true,
                createdByEntityId: userRootId || 'system',
                createdByScope: 'corporate'
            };
        } else {
            return prev;
        }

        // Return the list with all source items removed and the single consolidated item added back
        return [consolidatedItem, ...remainingItems];
    });

    setIsBulkSinkModalOpen(false);
    setSelectedItems(new Set());
    alert("Registry Synchronized: Selected SKU identities have been consolidated into the master profile.");
  };

  const filteredMaterials = useMemo(() => {
    const searchLower = search.toLowerCase();
    return materials.filter(m => {
        // Search Filter
        const matchesSearch = m.name.toLowerCase().includes(searchLower) || m.id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;

        // Dashboard Filter
        if (dashFilter) {
            if (dashFilter.cat === 'coa') {
                const someValid = m.brands.some(b => b.coaStatus === 'Valid');
                const somePending = m.brands.some(b => b.coaStatus === 'Pending');
                const someExpired = m.brands.some(b => (b.coaRecords || []).some(r => new Date(r.expiryDate) < new Date()));
                if (dashFilter.val === 'Valid' && !someValid) return false;
                if (dashFilter.val === 'Pending' && !somePending) return false;
                if (dashFilter.val === 'Expired' && !someExpired) return false;
                if (dashFilter.val === 'Not Attached' && m.brands.every(b => !b.coaRecords || b.coaRecords.length === 0)) return false;
            }
            if (dashFilter.cat === 'risk') {
                if (m.risk !== dashFilter.val) return false;
            }
            if (dashFilter.cat === 'mapping') {
                if (dashFilter.val === 'Mapped' && m.brands.length === 0) return false;
                if (dashFilter.val === 'Not Mapped' && m.brands.length > 0) return false;
                if (dashFilter.val === 'No Visuals' && m.brands.every(b => !b.image)) return false;
            }
            if (dashFilter.cat === 'allergen') {
                const hasAllergens = m.brands.some(b => b.allergens && b.allergens !== 'None');
                if (dashFilter.val === 'Known' && !hasAllergens) return false;
                if (dashFilter.val === 'Zero' && hasAllergens) return false;
            }
        }

        // Advanced Global Filter
        if (advFilters.productName && !m.name.toLowerCase().includes(advFilters.productName.toLowerCase())) return false;
        if (advFilters.risk && !m.risk.toLowerCase().includes(advFilters.risk.toLowerCase())) return false;
        if (advFilters.vendorName && !m.vendors.some(v => v.toLowerCase().includes(advFilters.vendorName.toLowerCase()))) return false;
        if (advFilters.brandName && !m.brands.some(b => b.name.toLowerCase().includes(advFilters.brandName.toLowerCase()))) return false;
        if (advFilters.specification && !m.specifications?.some(s => s.toLowerCase().includes(advFilters.specification.toLowerCase()))) return false;

        // New Advanced Filters Logic
        if (advFilters.allergens.length > 0) {
            const hasAllergen = m.brands.some(b => 
                advFilters.allergens.some(a => b.allergens.toLowerCase().includes(a.toLowerCase()))
            );
            if (!hasAllergen) return false;
        }

        if (advFilters.storage.length > 0) {
            const hasStorage = m.brands.some(b => 
                advFilters.storage.some(s => b.storage.toLowerCase().includes(s.toLowerCase()))
            );
            if (!hasStorage) return false;
        }

        if (advFilters.handling.length > 0) {
            const hasHandling = m.brands.some(b => 
                advFilters.handling.some(h => b.specialHandling.toLowerCase().includes(h.toLowerCase()))
            );
            if (!hasHandling) return false;
        }

        if (advFilters.coaStatus.length > 0) {
            const hasCoaStatus = m.brands.some(b => {
                 // Map UI status to logical check
                 if (advFilters.coaStatus.includes('Valid') && b.coaStatus === 'Valid') return true;
                 if (advFilters.coaStatus.includes('Pending') && b.coaStatus === 'Pending') return true;
                 if (advFilters.coaStatus.includes('Expired') && (b.coaRecords || []).some(r => new Date(r.expiryDate) < new Date())) return true;
                 if (advFilters.coaStatus.includes('Not Attached') && (!b.coaRecords || b.coaRecords.length === 0)) return true;
                 return false;
            });
            if (!hasCoaStatus) return false;
        }

        if (advFilters.hasNutrition) {
             const hasNutri = m.brands.some(b => {
                 const hasData = (b.energy && parseFloat(b.energy) > 0) || (b.protein && parseFloat(b.protein) > 0);
                 return hasData;
             });
             if (advFilters.hasNutrition === 'yes' && !hasNutri) return false;
             if (advFilters.hasNutrition === 'no' && hasNutri) return false;
        }

        if (advFilters.hasImage) {
             const hasImg = m.brands.some(b => !!b.image);
             if (advFilters.hasImage === 'yes' && !hasImg) return false;
             if (advFilters.hasImage === 'no' && hasImg) return false;
        }

        if (advFilters.shelfLifeMin || advFilters.shelfLifeMax) {
            const min = advFilters.shelfLifeMin ? parseInt(advFilters.shelfLifeMin) : 0;
            const max = advFilters.shelfLifeMax ? parseInt(advFilters.shelfLifeMax) : Infinity;
            
            // Helper to parse shelf life days
            const getDays = (sl: string | undefined) => {
                if (!sl || sl === '-') return 0;
                const match = sl.match(/(\d+)\s*Days/i);
                return match ? parseInt(match[1]) : 0;
            };

            const inRange = m.brands.some(b => {
                const days = getDays(b.shelfLife);
                return days >= min && days <= max;
            });
            if (!inRange) return false;
        }

        return true;
    });
  }, [materials, search, dashFilter, advFilters]);

  // Dynamic Dashboard Counts
  const dashCounts = useMemo(() => {
    const counts = {
        coa: { valid: 0, expired: 0, pending: 0, missing: 0 },
        risk: { high: 0, medium: 0, low: 0, na: 0 },
        mapping: { mapped: 0, unmapped: 0, visuals: 0, noVisuals: 0 },
        allergen: { known: 0, zero: 0 }
    };
    
    materials.forEach(m => {
        // COA
        if (m.brands.some(b => b.coaStatus === 'Valid')) counts.coa.valid++;
        if (m.brands.some(b => (b.coaRecords || []).some(r => new Date(r.expiryDate) < new Date()))) counts.coa.expired++;
        if (m.brands.some(b => b.coaStatus === 'Pending')) counts.coa.pending++;
        if (m.brands.every(b => !b.coaRecords || b.coaRecords.length === 0)) counts.coa.missing++;

        // Risk
        if (m.risk === 'High') counts.risk.high++;
        else if (m.risk === 'Medium') counts.risk.medium++;
        else if (m.risk === 'Low') counts.risk.low++;
        else counts.risk.na++;

        // Mapping
        if (m.brands.length > 0) counts.mapping.mapped++; else counts.mapping.unmapped++;
        if (m.brands.some(b => b.image)) counts.mapping.visuals++; else counts.mapping.noVisuals++;

        // Allergen
        if (m.brands.some(b => b.allergens && b.allergens !== 'None')) counts.allergen.known++;
        else counts.allergen.zero++;
    });

    return counts;
  }, [materials]);

  const perPageNum = itemsPerPage === 'All' ? filteredMaterials.length : itemsPerPage;

  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * perPageNum;
    return filteredMaterials.slice(start, start + perPageNum);
  }, [filteredMaterials, currentPage, perPageNum]);

  const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(filteredMaterials.length / itemsPerPage);

  const toggleDashFilter = (cat: string, val: string) => {
    if (dashFilter?.cat === cat && dashFilter?.val === val) setDashFilter(null);
    else setDashFilter({ cat, val });
    setCurrentPage(1);
  };

  const hasActiveAdvFilters = useMemo(() => {
    return JSON.stringify(advFilters) !== JSON.stringify(INITIAL_ADV_FILTERS);
  }, [advFilters]);

  // --- EXCEL EXPORT LOGIC ---

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

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Raw Materials Registry");

        // Set columns for the excel sheet
        worksheet.columns = [
            { header: "Sl no", key: "sl_no", width: 8 },
            { header: "Dietary Type", key: "dietaryType", width: 12 },
            { header: "Raw material name", key: "name", width: 30 },
            { header: "Raw material image", key: "image", width: 25 },
            { header: "Brand name", key: "brand", width: 25 },
            { header: "Supplier Name", key: "vendor", width: 25 },
            { header: "COA status", key: "coaStatus", width: 15 },
            { header: "Allergen Information", key: "allergens", width: 30 },
            { header: "Storage Information", key: "storage", width: 30 },
            { header: "Risk category", key: "risk", width: 15 },
            { header: "Stockable status", key: "stockable", width: 15 },
            { header: "Yield status", key: "yield", width: 15 },
            { header: "Specification pdf link", key: "spec", width: 40 },
            { header: "Shelf life", key: "shelfLife", width: 15 },
            { header: "Special instruction", key: "instruction", width: 30 },
            { header: "Nutritional information", key: "nutri", width: 40 },
            { header: "Status", key: "status", width: 15 }
        ];

        // Format header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 30;

        let rowCounter = 2;
        let slNo = 1;

        for (const item of filteredMaterials) {
            if (item.brands.length === 0) {
                const rowData = {
                    sl_no: slNo++,
                    dietaryType: 'N/A',
                    name: item.name,
                    image: '',
                    brand: 'NOT MAPPED',
                    vendor: 'UNASSIGNED',
                    coaStatus: 'N/A',
                    allergens: 'None',
                    storage: 'N/A',
                    risk: item.risk,
                    stockable: item.stockable ? 'Yes' : 'No',
                    yield: item.yield ? 'Yes' : 'No',
                    spec: item.specifications?.join(', ') || 'None',
                    shelfLife: '-',
                    instruction: '-',
                    nutri: '-',
                    status: item.isActive ? 'Active' : 'Inactive'
                };
                const row = worksheet.addRow(rowData);
                row.height = 100;
                row.alignment = { vertical: 'middle' };
                rowCounter++;
            } else {
                for (const brand of item.brands) {
                    const nutriInfo = `Energy: ${brand.energy || 0} cal, Carbs: ${brand.carb || 0}g, Protein: ${brand.protein || 0}g, Fat: ${brand.fat || 0}g`;
                    const rowData = {
                        sl_no: slNo++,
                        dietaryType: brand.dietaryType || 'N/A',
                        name: item.name,
                        image: '',
                        brand: brand.name,
                        vendor: brand.vendor || 'UNASSIGNED',
                        coaStatus: brand.coaStatus,
                        allergens: brand.allergens || 'None',
                        storage: brand.storage || 'N/A',
                        risk: item.risk,
                        stockable: item.stockable ? 'Yes' : 'No',
                        yield: item.yield ? 'Yes' : 'No',
                        spec: item.specifications?.join(', ') || 'None',
                        shelfLife: brand.shelfLife || '-',
                        instruction: brand.specialHandling || '-',
                        nutri: nutriInfo,
                        status: brand.status
                    };

                    const row = worksheet.addRow(rowData);
                    row.height = 100;
                    row.alignment = { vertical: 'middle' };

                    if (brand.image) {
                        const buffer = await fetchImage(brand.image);
                        if (buffer) {
                            try {
                                const imageId = workbook.addImage({ buffer: buffer, extension: 'jpeg' });
                                worksheet.addImage(imageId, {
                                    tl: { col: 3, row: rowCounter - 1 },
                                    br: { col: 4, row: rowCounter },
                                    editAs: 'oneCell'
                                });
                            } catch (e) {
                                console.error("Image embedding failed", e);
                            }
                        }
                    }
                    rowCounter++;
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `Raw_Material_Master_Registry_${new Date().toISOString().split('T')[0]}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Excel export failed", err);
    } finally {
        setIsExportingExcel(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const headers = "Product Name\n";
    const sampleRows = "WHOLE MILK\nFROZEN CHICKEN BREAST\nBEEF NUGGETS\nORGANIC TOMATOES";
    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'raw_material_import_sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-20 px-2 sm:px-4 md:px-0 w-full overflow-hidden">
      
      {/* Dynamic Filter Dashboard */}
      <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-4 pb-4 md:pb-0 snap-x snap-mandatory scroll-smooth hide-scrollbar">
        <ImageDashCard title="COA Status Analytics" icon={FileBadge} iconBg="bg-[#3b82f6]">
            <AnalyticItem 
                onClick={() => toggleDashFilter('coa', 'Valid')}
                isActive={dashFilter?.cat === 'coa' && dashFilter?.val === 'Valid'}
                label="Valid Registry" 
                value={`${dashCounts.coa.valid}/${materials.length}`} 
                colorClass="text-emerald-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('coa', 'Expired')}
                isActive={dashFilter?.cat === 'coa' && dashFilter?.val === 'Expired'}
                label="Cycle Expired" 
                value={`${dashCounts.coa.expired}/${materials.length}`} 
                colorClass="text-rose-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('coa', 'Pending')}
                isActive={dashFilter?.cat === 'coa' && dashFilter?.val === 'Pending'}
                label="Renewal Due" 
                value={`${dashCounts.coa.pending}/${materials.length}`} 
                colorClass="text-amber-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('coa', 'Not Attached')}
                isActive={dashFilter?.cat === 'coa' && dashFilter?.val === 'Not Attached'}
                label="Not Attached" 
                value={`${dashCounts.coa.missing}/${materials.length}`} 
                colorClass="text-slate-400" 
            />
        </ImageDashCard>

        <ImageDashCard title="Risk Profile Distribution" icon={Shield} iconBg="bg-[#ef4444]">
            <AnalyticItem 
                onClick={() => toggleDashFilter('risk', 'High')}
                isActive={dashFilter?.cat === 'risk' && dashFilter?.val === 'High'}
                label="High Priority" 
                value={`${dashCounts.risk.high}/${materials.length}`} 
                colorClass="text-rose-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('risk', 'Medium')}
                isActive={dashFilter?.cat === 'risk' && dashFilter?.val === 'Medium'}
                label="Moderate Risk" 
                value={`${dashCounts.risk.medium}/${materials.length}`} 
                colorClass="text-amber-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('risk', 'Low')}
                isActive={dashFilter?.cat === 'risk' && dashFilter?.val === 'Low'}
                label="Low Profile" 
                value={`${dashCounts.risk.low}/${materials.length}`} 
                colorClass="text-emerald-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('risk', 'NA')}
                isActive={dashFilter?.cat === 'risk' && dashFilter?.val === 'NA'}
                label="Not Identified" 
                value={`${dashCounts.risk.na}/${materials.length}`} 
                colorClass="text-slate-400" 
            />
        </ImageDashCard>

        <ImageDashCard title="Digital Registry Mapping" icon={Layers} iconBg="bg-[#6366f1]">
            <AnalyticItem 
                onClick={() => toggleDashFilter('mapping', 'Mapped')}
                isActive={dashFilter?.cat === 'mapping' && dashFilter?.val === 'Mapped'}
                label="Brands Mapped" 
                value={`${dashCounts.mapping.mapped}/${materials.length}`} 
                colorClass="text-indigo-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('mapping', 'Visuals')}
                isActive={dashFilter?.cat === 'mapping' && dashFilter?.val === 'Visuals'}
                label="Visual Archive" 
                value={`${dashCounts.mapping.visuals}/${materials.length}`} 
                colorClass="text-blue-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('mapping', 'Not Mapped')}
                isActive={dashFilter?.cat === 'mapping' && dashFilter?.val === 'Not Mapped'}
                label="Not Mapped" 
                value={`${dashCounts.mapping.unmapped}/${materials.length}`} 
                colorClass="text-slate-400" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('mapping', 'No Visuals')}
                isActive={dashFilter?.cat === 'mapping' && dashFilter?.val === 'No Visuals'}
                label="No Visuals" 
                value={`${dashCounts.mapping.noVisuals}/${materials.length}`} 
                colorClass="text-slate-400" 
            />
        </ImageDashCard>

        <ImageDashCard title="Allergen Classification" icon={FlaskConical} iconBg="bg-[#f97316]">
            <AnalyticItem 
                onClick={() => toggleDashFilter('allergen', 'Known')}
                isActive={dashFilter?.cat === 'allergen' && dashFilter?.val === 'Known'}
                label="Known Allergen" 
                value={`${dashCounts.allergen.known}/${materials.length}`} 
                colorClass="text-rose-600" 
            />
            <AnalyticItem 
                onClick={() => toggleDashFilter('allergen', 'Zero')}
                isActive={dashFilter?.cat === 'allergen' && dashFilter?.val === 'Zero'}
                label="Zero Allergen" 
                value={`${dashCounts.allergen.zero}/${materials.length}`} 
                colorClass="text-emerald-600" 
            />
        </ImageDashCard>

        <ImageDashCard title="Registry Tools" icon={SettingsIcon} iconBg="bg-[#0f172a]">
            <div className="col-span-2">
                <button 
                    onClick={() => { setDashFilter(null); setAdvFilters(INITIAL_ADV_FILTERS); }}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl group transition-all ${(dashFilter || hasActiveAdvFilters) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}
                >
                    <span className={`text-xs font-black uppercase tracking-widest ${(dashFilter || hasActiveAdvFilters) ? 'text-white' : 'text-slate-800'}`}>
                        {(dashFilter || hasActiveAdvFilters) ? 'Clear All Filters' : 'Filter Terminal'}
                    </span>
                    {(dashFilter || hasActiveAdvFilters) ? <X size={18} /> : <Filter size={18} />}
                </button>
            </div>
        </ImageDashCard>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
         <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto">
            <div className="p-3 lg:p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner border border-indigo-100 shrink-0">
               <Boxes size={32} className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <div className="min-w-0">
               <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase truncate">Material Catalog</h2>
               <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2 truncate">
                  <ShieldCheck size={12} className="text-indigo-500 shrink-0"/> {(dashFilter || hasActiveAdvFilters) ? `Filtering Results` : 'Centralized SKU Registry'}
               </p>
            </div>
         </div>

         <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
            {selectedItems.size > 1 && (
                <button 
                  onClick={() => setIsBulkSinkModalOpen(true)}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 animate-in zoom-in-95"
                >
                   <Merge size={16} strokeWidth={3} /> Bulk Sink
                </button>
            )}
            <div className="relative group w-full lg:w-80">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
               <input 
                 type="text" 
                 placeholder="Search SKU..." 
                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-indigo-400 transition-all placeholder:text-slate-300 shadow-inner uppercase tracking-wider"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto hide-scrollbar">
              <button 
                onClick={handleDownloadSampleCsv}
                className="px-4 lg:px-5 py-3 border border-slate-200 text-slate-600 bg-white rounded-2xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 whitespace-nowrap"
              >
                 <Download size={16} /> Sample CSV
              </button>
              <button 
                onClick={() => setIsAdvFilterOpen(true)}
                className={`p-3 border-2 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 ${hasActiveAdvFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200'}`}
                title="Advanced Global Filter"
              >
                 <SlidersHorizontal size={20} strokeWidth={2.5} />
              </button>
              
              <button 
                onClick={handleExportExcel} 
                disabled={isExportingExcel}
                className="p-3 border-2 border-slate-100 text-slate-400 bg-white rounded-2xl hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center justify-center disabled:opacity-50"
                title="Download Excel Report"
              >
                 {isExportingExcel ? <Loader2 size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
              </button>

              <button onClick={() => setIsBulkModalOpen(true)} className="flex-1 lg:flex-none px-4 lg:px-5 py-3 border border-slate-200 text-indigo-600 bg-white rounded-2xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 whitespace-nowrap">
                 <FileUp size={16} /> Bulk Import
              </button>
              <button 
                onClick={() => setIsCreatingNewMaster(true)}
                className="flex-1 lg:flex-none px-4 lg:px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} /> Add SKU
              </button>
            </div>
         </div>
      </div>

      <div className="space-y-4">
        {paginatedMaterials.map((item, idx) => (
          <MaterialRow 
            key={item.id}
            item={item}
            serialNumber={idx + 1 + (currentPage - 1) * (itemsPerPage === 'All' ? 0 : (itemsPerPage as number))}
            isExpanded={expandedRows.has(item.id)}
            onToggle={() => toggleRow(item.id)}
            isSelected={selectedItems.has(item.id)}
            onSelectToggle={() => toggleSelectItem(item.id)}
            onUpdate={updateMaterial}
            onEdit={() => setEditingMaterial(item)}
            onCoa={() => setCoaTarget({ materialId: item.id })}
            onOnboard={() => setActiveOnboardMaterialId(item.id)}
            onMerge={() => { setSelectedItems(new Set([item.id])); setIsBulkSinkModalOpen(true); }}
            onEditBrand={(brand) => setEditingCommittedBrand({ materialId: item.id, brand })}
            onAudit={() => {}}
            onToggleBrand={(bid) => toggleBrandStatus(item.id, bid)}
            onDeleteBrand={() => {}}
            onAddVendor={(bid) => setVendorTarget({ materialId: item.id, brandId: bid })}
            onToggleSupplier={(bid, sname) => toggleSupplierStatus(item.id, bid, sname)}
            onDeleteSupplier={() => {}}
          />
        ))}
        {paginatedMaterials.length === 0 && (
            <div className="py-20 text-center text-slate-300 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <Search size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">No registry nodes match your criteria</p>
                <button onClick={() => { setSearch(''); setDashFilter(null); setAdvFilters(INITIAL_ADV_FILTERS); }} className="mt-4 text-indigo-600 font-bold uppercase text-[10px] hover:underline">Reset All Filters</button>
            </div>
        )}

        {/* Mobile Floating Action Button (FAB) */}
        <div className="md:hidden fixed bottom-24 right-6 z-50">
            <button 
                onClick={() => setIsCreatingNewMaster(true)}
                className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white"
            >
                <Plus size={32} strokeWidth={3} />
            </button>
        </div>
      </div>

      {isCreatingNewMaster && <CreateMaterialModal onClose={() => setIsCreatingNewMaster(false)} onSave={handleUpdateMaterial} existingMaterials={materials} currentScope={currentScope} userRootId={userRootId} />}
      {editingMaterial && <CreateMaterialModal initialMaterial={editingMaterial} onClose={() => setEditingMaterial(null)} onSave={handleUpdateMaterial} existingMaterials={materials} currentScope={currentScope} userRootId={userRootId} />}
      
      {isBulkModalOpen && (
          <BulkUploadModal 
            onClose={() => setIsBulkModalOpen(false)} 
            onSave={handleBulkUploadCommit} 
            materials={materials}
          />
      )}

      {isBulkSinkModalOpen && <BulkSinkModal selectedItems={materials.filter(m => selectedItems.has(m.id))} allItems={materials} onClose={() => setIsBulkSinkModalOpen(false)} onExecute={handleBulkSinkExecute} />}
      {activeOnboardMaterialId && <BrandOnboardModal availableBrands={contextAwareBrands} onClose={() => setActiveOnboardMaterialId(null)} onFinalize={handleAddNewBrandToMaterial} brandMetadata={brandMetadata} />}
      {editingCommittedBrand && <BrandOnboardModal initialCommittedBrand={editingCommittedBrand.brand} availableBrands={contextAwareBrands} onClose={() => setEditingCommittedBrand(null)} onFinalize={handleAddNewBrandToMaterial} brandMetadata={brandMetadata} />}
      {coaTarget && <CoaManagementModal material={materials.find(m => m.id === coaTarget.materialId)!} materials={materials} onClose={() => setCoaTarget(null)} onUpdateBrands={(brands) => updateMaterial(coaTarget.materialId, { brands })} />}
      {vendorTarget && <VendorAssignmentModal existingSuppliers={unitSuppliers.map(s => s.name)} onClose={() => setVendorTarget(null)} onAssign={(name) => handleVendorLink(vendorTarget.materialId, vendorTarget.brandId, name)} />}
      
      {isAdvFilterOpen && (
          <AdvancedGlobalFilterModal 
            onClose={() => setIsAdvFilterOpen(false)}
            onApply={(f) => { setAdvFilters(f); setIsAdvFilterOpen(false); }}
            currentFilters={advFilters}
            totalRecords={filteredMaterials.length}
            brandMetadata={brandMetadata}
          />
      )}
      
      {filteredMaterials.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 lg:px-8 py-6 bg-white border border-slate-200 rounded-[2.5rem] mt-8 shadow-sm gap-4">
          <div className="flex items-center gap-4 text-slate-600 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rows:</span>
            <select value={itemsPerPage} onChange={(e) => { const val = e.target.value === 'All' ? 'All' : Number(e.target.value); setItemsPerPage(val); setCurrentPage(1); }} className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-black rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"><option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="All">All</option></select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronsLeft size={16} /></button>
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={16} /></button>
             
             <div className="px-6">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tighter whitespace-nowrap">Page {currentPage} of {totalPages}</span>
             </div>

             <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={16} /></button>
             <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronsRight size={16} /></button>
          </div>
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block">
            Found {filteredMaterials.length} SKU Records
          </div>
        </div>
      )}
    </div>
  );
};

interface MaterialRowProps {
    item: RawMaterialExtended;
    serialNumber: number;
    isExpanded: boolean;
    onToggle: () => void;
    onUpdate: (id: string, updates: Partial<RawMaterialExtended>) => void;
    onEdit: () => void;
    onCoa: () => void;
    onOnboard: () => void;
    onMerge: () => void;
    onEditBrand: (brand: MaterialBrand) => void;
    onAudit: (brand: MaterialBrand) => void;
    onToggleBrand: (brandId: string) => void;
    onDeleteBrand: (brandId: string) => void;
    onAddVendor: (brandId: string) => void;
    onToggleSupplier: (brandId: string, supplierName: string) => void;
    onDeleteSupplier: (brandId: string, supplierName: string) => void;
    isSelected: boolean;
    onSelectToggle: () => void;
}

const MaterialRow: React.FC<MaterialRowProps> = ({ 
  item, isExpanded, onToggle, onUpdate, onEdit, onCoa, onOnboard, onMerge,
  onEditBrand, onAudit, onToggleBrand, onDeleteBrand, 
  onAddVendor, onToggleSupplier, onDeleteSupplier,
  isSelected, onSelectToggle, serialNumber
}) => {
  const isActuallyActive = item.isActive !== false;
  const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);
  const [specSearch, setSpecSearch] = useState("");
  const specRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (specRef.current && !specRef.current.contains(event.target as Node)) setIsSpecDropdownOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSpecOptions = useMemo(() => {
      const currentSpecs = item.specifications || [];
      return SPECIFICATION_CATALOG.filter(s => 
          s.toLowerCase().includes(specSearch.toLowerCase()) && 
          !currentSpecs.includes(s)
      );
  }, [specSearch, item.specifications]);

  const consolidatedAllergens = useMemo(() => {
    const all = new Set<string>();
    item.brands.forEach(b => {
      if (b.allergens && b.allergens !== 'None') {
        b.allergens.split(', ').forEach(a => {
          const trimmed = a.trim();
          if (trimmed) all.add(trimmed);
        });
      }
    });
    return Array.from(all).sort().join(', ') || 'None';
  }, [item.brands]);

  const handleAddSpec = (spec: string) => {
      const currentSpecs = item.specifications || [];
      onUpdate(item.id, { specifications: [...currentSpecs, spec] });
      setIsSpecDropdownOpen(false);
      setSpecSearch("");
  };

  const handleRemoveSpec = (spec: string) => {
      const currentSpecs = item.specifications || [];
      onUpdate(item.id, { specifications: currentSpecs.filter(s => s !== spec) });
  };

  const handleViewSpec = (spec: string) => {
      window.open(`https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf#name=${encodeURIComponent(spec)}`, '_blank');
  };

  const brandDietary = (brandId: string) => {
    return item.brands.find(b => b.id === brandId)?.dietaryType;
  };

  return (
    <div key={item.id} className={`bg-white rounded-[2rem] border-2 transition-all duration-300 ${isExpanded ? 'border-indigo-500 shadow-2xl' : isSelected ? 'border-indigo-600 bg-indigo-50/10 shadow-lg' : 'border-slate-100 shadow-sm hover:border-indigo-200'} ${!isActuallyActive ? 'bg-slate-50 border-slate-200 shadow-none' : ''}`}>
      
      {/* DESKTOP ROW LAYOUT (MD+) */}
      <div className={`hidden md:flex flex-row items-center gap-4 xl:gap-8 p-4 lg:p-6 ${!isActuallyActive ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-start gap-3 shrink-0">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-inner shrink-0">
                {serialNumber}
              </div>
              <button 
                onClick={onSelectToggle}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 hover:border-indigo-400'}`}
              >
                {isSelected && <Check size={14} strokeWidth={4} />}
              </button>
          </div>
          
          <div className="flex items-center gap-2">
              <button 
                onClick={onToggle} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-90 shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                <ChevronRight size={20} />
              </button>
          </div>
        </div>

        <div className="flex items-center gap-4 min-w-[200px] w-[220px]">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border shrink-0 ${isActuallyActive ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-200 text-slate-400 border-slate-300'}`}>
            <Package size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight truncate leading-none mb-2">{item.name}</h3>
              {isActuallyActive && (
                <button onClick={onEdit} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors shrink-0">
                  <Edit3 size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate inline-flex items-center" title={item.organization}>
                  <MapPin size={8} className="mr-1" /> {item.organization}
               </span>
               <select 
                  value={item.risk}
                  onChange={(e) => onUpdate(item.id, { risk: e.target.value as any })}
                  className={`appearance-none px-1.5 py-0.5 rounded text-[8px] font-black uppercase border outline-none cursor-pointer transition-all ${getRiskStyles(item.risk)}`}
               >
                  <option value="NA">NA</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
               </select>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <Layers size={11} className="text-indigo-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand Mappings & Allergens</span>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px] overflow-hidden">
              {item.brands.map(b => (
                <div key={b.id} className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-all shadow-sm ${b.status === 'Inactive' ? 'bg-slate-50 border-slate-200 opacity-40 grayscale' : 'bg-white border-slate-100 hover:border-indigo-400'}`}>
                  <div className="relative shrink-0 cursor-pointer" onClick={() => onEditBrand(b)}>
                    {b.image ? <img src={b.image} className="w-5 h-5 rounded-lg object-cover ring-1 ring-slate-100" alt="Brand" /> : <div className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center text-[8px] font-black text-slate-400">?</div>}
                    <div className="absolute -top-1.5 -right-1.5"><DietaryLogo type={brandDietary(b.id)} size="sm" /></div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tight truncate max-w-[100px] ${b.status === 'Inactive' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {b.name}
                  </span>
                </div>
              ))}
              {item.brands.length === 0 && <span className="text-[10px] text-slate-300 italic uppercase">No identities mapped</span>}
            </div>
            {item.brands.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-rose-100 flex items-center gap-1">
                  <FlaskConical size={10} /> Consolidated Allergens: {consolidatedAllergens}
                </div>
              </div>
            )}
        </div>

        <div className="hidden xl:flex items-center gap-6 border-l border-slate-100 pl-6 shrink-0">
            <div className="flex flex-col gap-1.5 items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stockable</span>
                <button 
                    disabled={!isActuallyActive}
                    onClick={() => onUpdate(item.id, { stockable: !item.stockable })} 
                    className={`w-11 h-6 rounded-full relative transition-all border-2 flex items-center ${item.stockable ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-200 border-slate-200'} ${!isActuallyActive ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${item.stockable ? 'ml-6' : 'ml-0.5'}`} />
                </button>
            </div>
        </div>

        <div className="hidden lg:flex flex-1 min-w-0 flex-col gap-2 relative border-l border-slate-100 pl-6" ref={specRef}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <SettingsIcon size={11} className="text-blue-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Specifications</span>
                </div>
                <button onClick={() => setIsSpecDropdownOpen(!isSpecDropdownOpen)} className="text-[9px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1"><Plus size={10}/> Add</button>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[32px] content-start">
              {(item.specifications || []).map(spec => (
                <div key={spec} className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-[9px] font-black uppercase shadow-sm group/spec transition-all">
                  <span className="truncate max-w-[80px]" title={spec}>{spec}</span>
                  <div className="flex items-center gap-1 ml-1 pl-1 border-l border-blue-200">
                    <button onClick={() => handleViewSpec(spec)} className="hover:text-blue-900 transition-colors" title="View PDF">
                        <ViewIcon size={11} />
                    </button>
                    <button onClick={() => handleRemoveSpec(spec)} className="hover:text-red-500 transition-colors" title="Remove">
                        <RemoveIcon size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {(item.specifications || []).length === 0 && <span className="text-[10px] text-slate-300 italic uppercase mt-1">No specs defined</span>}

              {isSpecDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search Spec Library..." 
                                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-400 transition-all shadow-inner"
                                value={specSearch}
                                onChange={(e) => setSpecSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {filteredSpecOptions.length > 0 ? filteredSpecOptions.map(opt => (
                            <button 
                                key={opt}
                                onClick={() => handleAddSpec(opt)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 text-[11px] font-bold text-slate-700 uppercase tracking-tight rounded-xl transition-all flex items-center justify-between group"
                            >
                                {opt}
                                <Plus size={14} className="text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100" />
                            </button>
                        )) : (
                            <div className="p-4 text-center text-[10px] text-slate-400 italic">No matches</div>
                        )}
                    </div>
                </div>
              )}
            </div>
        </div>

        <div className="flex items-center justify-end gap-3 pl-6 border-l border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Accept</span>
                 <button 
                    disabled={!isActuallyActive}
                    onClick={() => onUpdate(item.id, { accepted: !item.accepted })} 
                    className={`w-10 h-5 rounded-full relative transition-all border ${item.accepted ? 'bg-emerald-50 border-emerald-600' : 'bg-slate-200 border-slate-300'} ${!isActuallyActive ? 'cursor-not-allowed opacity-50' : ''}`}
                 >
                    <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-md transition-all ${item.accepted ? 'right-0.5' : 'left-0.5'}`} />
                 </button>
              </div>
              <div className="h-8 w-px bg-slate-100 mx-1" />
              <div className="flex items-center gap-1.5">
                  <button disabled={!isActuallyActive} onClick={onMerge} className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0 active:scale-95" title="Sink identities"><Anchor size={18} /></button>
                  <button onClick={() => onUpdate(item.id, { isActive: !isActuallyActive })} className={`p-2.5 rounded-xl transition-all shadow-lg border shrink-0 ${isActuallyActive ? 'bg-white text-slate-400 border-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50' : 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-100'}`} title={isActuallyActive ? 'Deactivate' : 'Activate'}><Power size={18} /></button>
                  <button disabled={!isActuallyActive} onClick={onCoa} className={`p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0 ${!isActuallyActive ? 'cursor-not-allowed opacity-30' : ''}`} title="COA Certificates"><FileCheck size={18}/></button>
                  <button disabled={!isActuallyActive} onClick={onOnboard} className={`p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95 shrink-0 ${!isActuallyActive ? 'cursor-not-allowed opacity-30' : ''}`} title="Onboard Brand"><Plus size={18} strokeWidth={3} /></button>
              </div>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT (MD:HIDDEN) */}
      <div className="md:hidden p-5 flex flex-col gap-5 relative bg-white">
         <div className="flex justify-between items-start">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-inner">
                    {serialNumber}
                 </div>
                 <button 
                    onClick={onSelectToggle}
                    className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 hover:border-indigo-400'}`}
                 >
                    {isSelected && <Check size={16} strokeWidth={4} />}
                 </button>
             </div>
             <div className="flex items-center gap-2">
                 <button onClick={() => onUpdate(item.id, { isActive: !isActuallyActive })} className={`p-2 rounded-xl border shadow-sm ${isActuallyActive ? 'bg-white border-slate-200 text-slate-400' : 'bg-emerald-500 text-white border-emerald-600'}`}>
                    <Power size={16}/>
                 </button>
                 <button onClick={onToggle} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${isExpanded ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                    <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}/>
                 </button>
             </div>
         </div>

         <div className="flex gap-4">
             <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border bg-slate-50 text-indigo-500 border-slate-100 shrink-0">
                <Package size={28} />
             </div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-slate-900 uppercase leading-none break-words">{item.name}</h3>
                    {isActuallyActive && <button onClick={onEdit} className="text-slate-300 active:text-indigo-600"><Edit3 size={16}/></button>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1 max-w-[140px] truncate">
                        <MapPin size={10} className="text-indigo-500"/> {item.organization}
                    </span>
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${getRiskStyles(item.risk)}`}>
                        {item.risk} Risk
                    </div>
                </div>
             </div>
         </div>

         <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
             <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Layers size={12}/> Brands ({item.brands.length})</span>
                 {item.brands.length > 0 && <span className="text-[9px] font-bold text-rose-500 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-100 shadow-sm"><FlaskConical size={10}/> Allergens</span>}
             </div>
             <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                 {item.brands.length > 0 ? item.brands.map(b => (
                     <span key={b.id} onClick={() => onEditBrand(b)} className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 shadow-sm flex items-center gap-1.5 cursor-pointer hover:border-indigo-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {b.name}
                     </span>
                 )) : <span className="text-[10px] text-slate-400 italic pl-1">No mappings active</span>}
             </div>
         </div>

         <div className="grid grid-cols-4 gap-3 pt-2 border-t border-slate-100">
             <button disabled={!isActuallyActive} onClick={() => onUpdate(item.id, { accepted: !item.accepted })} className={`col-span-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${item.accepted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'} ${!isActuallyActive ? 'opacity-50' : ''}`}>
                 <Check size={18} strokeWidth={3} />
                 <span className="text-[8px] font-black uppercase">Accept</span>
             </button>
             <button disabled={!isActuallyActive} onClick={onCoa} className="col-span-1 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 hover:bg-blue-100 disabled:opacity-50">
                 <FileCheck size={18} />
                 <span className="text-[8px] font-black uppercase">COA</span>
             </button>
             <button disabled={!isActuallyActive} onClick={onMerge} className="col-span-1 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 hover:border-indigo-300 disabled:opacity-50">
                 <Anchor size={18} />
                 <span className="text-[8px] font-black uppercase">Sink</span>
             </button>
             <button disabled={!isActuallyActive} onClick={onOnboard} className="col-span-1 py-3 bg-slate-900 text-white rounded-xl shadow-lg flex flex-col items-center justify-center gap-1 transition-all active:scale-95 hover:bg-slate-800 disabled:opacity-50">
                 <Plus size={18} />
                 <span className="text-[8px] font-black uppercase">Add</span>
             </button>
         </div>
      </div>

      {isExpanded && (
        <div className={`px-4 lg:px-6 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300 ${!isActuallyActive ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden shadow-inner">
            <div className="hidden lg:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 sticky left-0 bg-[#1e293b] z-10">Brand Identity</th>
                    <th className="px-6 py-4">Technical Specs</th>
                    <th className="px-6 py-4">Nutritional</th>
                    <th className="px-6 py-4">Linked Vendors</th>
                    <th className="px-6 py-4">Status & Compliance</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/60 backdrop-blur-sm">
                  {item.brands.map((brand) => (
                    <tr key={brand.id} className={`hover:bg-white transition-colors group/row ${brand.status === 'Inactive' ? 'opacity-50 grayscale bg-slate-50/50' : ''}`}>
                      <td className="px-6 py-5 sticky left-0 bg-white group-hover/row:bg-white z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden group/img cursor-pointer" onClick={() => onEditBrand(brand)}>
                            {brand.image ? <img src={brand.image} alt="" className="w-full h-full object-cover"/> : <Building2 className="text-slate-300" size={24} />}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <Edit3 size={16} className="text-white" />
                            </div>
                            <div className="absolute top-1 right-1"><DietaryLogo type={brandDietary(brand.id)} size="sm" /></div>
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-sm font-black uppercase tracking-tight leading-none truncate ${brand.status === 'Inactive' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{brand.name}</h4>
                            <div className="mt-1.5 flex items-center gap-2">
                               <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${brand.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{brand.status}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">{brand.shelfLife}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1.5 text-[10px] whitespace-nowrap">
                          <div className="flex items-center gap-1.5"><Clock size={12} className="text-indigo-400"/><span className="text-slate-500 font-bold uppercase tracking-widest">Life:</span><span className="text-slate-700 font-black">{brand.shelfLife || '-'}</span></div>
                          <div className="flex items-center gap-1.5"><Boxes size={12} className="text-indigo-400"/><span className="text-slate-500 font-bold uppercase tracking-widest">Store:</span><span className="text-slate-700 font-black truncate max-w-[120px]" title={brand.storage}>{brand.storage}</span></div>
                          <div className="flex items-center gap-1.5"><FlaskConical size={12} className="text-rose-400"/><span className="text-slate-500 font-bold uppercase tracking-widest">Allergen:</span><span className="text-rose-700 font-black truncate max-w-[120px]" title={brand.allergens}>{brand.allergens}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] whitespace-nowrap">
                          <div className="text-slate-400 font-bold">CAL: <span className="text-orange-600 font-black">{brand.energy || 0}</span></div>
                          <div className="text-slate-400 font-bold">PRO: <span className="text-emerald-600 font-black">{brand.protein || 0}</span></div>
                          <div className="text-slate-400 font-bold">FAT: <span className="text-rose-600 font-black">{brand.fat || 0}</span></div>
                          <div className="text-slate-400 font-bold">CRB: <span className="text-blue-600 font-black">{brand.carb || 0}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2 max-w-[220px]">
                          {brand.linkedSuppliers.map((s, i) => (
                            <div key={i} className={`flex items-center gap-2 pl-2 pr-1 py-1 border rounded-xl text-[9px] font-black uppercase shadow-sm transition-all group/sup ${s.status === 'Inactive' ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 grayscale' : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300'}`}>
                              <Warehouse size={10} />
                              <span className={s.status === 'Inactive' ? 'line-through' : ''}>{s.name}</span>
                              <div className="flex items-center gap-1 border-l border-slate-100 pl-1 opacity-0 group-hover/sup:opacity-100 transition-opacity">
                                <button onClick={() => onToggleSupplier(brand.id, s.name)} className={`p-0.5 rounded ${s.status === 'Inactive' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-rose-500 hover:bg-rose-50'}`}>{s.status === 'Inactive' ? <Power size={10}/> : <ZapOff size={10}/>}</button>
                                <button onClick={() => onDeleteSupplier(brand.id, s.name)} className="p-0.5 rounded text-slate-300 hover:text-rose-600"><X size={10}/></button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => onAddVendor(brand.id)} className="px-3 py-1 bg-white border border-dashed border-indigo-300 text-indigo-500 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-50 hover:border-indigo-500 transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"><Plus size={12}/> Add Vendor</button>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm w-fit ${getCoaColor(brand.coaStatus)}`}>COA: {brand.coaStatus}</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase"><Calendar size={12}/> Exp: <span className="text-slate-600 font-black">{brand.testingDate}</span></div>
                          </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onEditBrand(brand)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm" title="Edit Specs"><Settings2 size={16}/></button>
                          <button onClick={() => onAudit(brand)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><History size={16}/></button>
                          <button onClick={() => onToggleBrand(brand.id)} className={`p-2.5 rounded-xl transition-all shadow-sm border ${brand.status === 'Inactive' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{brand.status === 'Inactive' ? <Power size={16}/> : <ZapOff size={16}/>}</button>
                          <button onClick={() => onDeleteBrand(brand.id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Brand Cards */}
            <div className="lg:hidden p-4 space-y-4">
               {item.brands.map((brand) => (
                 <div key={brand.id} className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5 transition-all ${brand.status === 'Inactive' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0 cursor-pointer" onClick={() => onEditBrand(brand)}>
                                {brand.image ? <img src={brand.image} alt="" className="w-full h-full object-cover" /> : <Building2 className="text-slate-300" size={24} />}
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Edit3 size={14} className="text-white" />
                                </div>
                                <div className="absolute top-1 right-1"><DietaryLogo type={brand.dietaryType} size="sm" /></div>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{brand.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${brand.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{brand.status}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">{brand.shelfLife}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onEditBrand(brand)} className="p-2 text-slate-400 active:text-indigo-600"><Settings2 size={18}/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Specs</span>
                            <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase"><Clock size={10} className="text-indigo-500" /> Life: <span className="font-black text-slate-800">{brand.shelfLife}</span></div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase"><Boxes size={10} className="text-indigo-500" /> Store: <span className="font-black text-slate-800 truncate">{brand.storage.split(' ')[0]}...</span></div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase"><FlaskConical size={10} className="text-rose-400" /> Allg: <span className="font-black text-rose-700 truncate">{brand.allergens.split(',')[0]}...</span></div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nutritional / 100g</span>
                            <div className="bg-indigo-900/5 rounded-xl p-3 grid grid-cols-2 gap-x-2 gap-y-1">
                                <div className="text-[9px] font-bold text-slate-400">CAL: <span className="font-black text-orange-600">{brand.energy}</span></div>
                                <div className="text-[9px] font-bold text-slate-400">PRO: <span className="font-black text-emerald-600">{brand.protein}</span></div>
                                <div className="text-[9px] font-bold text-slate-400">FAT: <span className="font-black text-rose-600">{brand.fat}</span></div>
                                <div className="text-[9px] font-bold text-slate-400">CRB: <span className="font-black text-blue-600">{brand.carb}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Linked Ecosystem</span>
                        <div className="flex flex-wrap gap-2">
                            {brand.linkedSuppliers.map((s, i) => (
                                <div key={i} className={`flex items-center gap-1.5 px-2 py-1 bg-white border rounded-lg text-[8px] font-black uppercase shadow-xs ${s.status === 'Inactive' ? 'text-slate-300' : 'text-indigo-600'}`}>
                                    <Warehouse size={10}/> {s.name}
                                </div>
                            ))}
                            <button onClick={() => onAddVendor(brand.id)} className="px-2 py-1 bg-white border border-dashed border-indigo-200 text-indigo-500 rounded-lg text-[8px] font-black uppercase">+ Vendor</button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${getCoaColor(brand.coaStatus)}`}>COA: {brand.coaStatus}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onAudit(brand)} className="p-2 text-slate-400 active:bg-slate-50 rounded-lg"><History size={16}/></button>
                            <button onClick={() => onToggleBrand(brand.id)} className={`p-2 rounded-lg ${brand.status === 'Inactive' ? 'text-emerald-50' : 'text-rose-500'}`}>{brand.status === 'Inactive' ? <Power size={18}/> : <ZapOff size={18}/>}</button>
                            <button onClick={() => onDeleteBrand(brand.id)} className="p-2 text-slate-300 active:text-rose-600"><Trash2 size={16}/></button>
                        </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterialList;
