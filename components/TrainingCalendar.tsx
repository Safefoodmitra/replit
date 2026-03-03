"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, Clock, Users, FileSpreadsheet, 
  Plus, RefreshCw, Search, Trash2, Edit, 
  X, Save, QrCode, UserCheck, ShieldCheck, Layers, CheckCircle2,
  ChevronDown, Check, Eye, MoreVertical,
  MapPin, Globe, ArrowRight, User as UserIcon,
  FileText, Activity, AlertCircle, Timer,
  FileUp, Layout, CalendarClock, Hash,
  Mail, Phone, User, IdCard, History,
  ChevronUp,
  UserPlus,
  UserMinus,
  Circle,
  Zap,
  RotateCcw,
  Lock,
  Unlock,
  FilterX,
  FilePlus,
  FileMinus,
  Building2,
  ListChecks,
  PieChart,
  ChevronRight,
  Loader2,
  Download,
  Briefcase,
  FileDown,
  Upload,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import { HierarchyScope, Entity } from '../types';
import { EmployeeRecord } from './LearningManagement';

// --- Types & Interfaces ---

interface ParticipantData {
  employeeId: string;
  status: 'present' | 'absent' | 'neutral';
  addedAt: number;
}

interface Training {
  id: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  mode: 'Classroom' | 'Online' | 'Recorded';
  topic: string;
  topicRemark?: string;
  subTopic: string;
  trainer: string;
  trainerScope: string;
  externalCompany?: string; 
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  participantsPresent: number;
  participantsAbsent: number;
  participantsNeutral: number;
  participantList: ParticipantData[]; 
  hasSheet: boolean;
  sheetUrl?: string; 
  uploadedDate?: string;
  isLocked: boolean;
  createdByEntityId: string;
  assignedUnits: string[]; 
}

interface TrainingCalendarProps {
  currentScope: HierarchyScope;
  userRootId?: string | null;
  entities: Entity[];
  trainers: EmployeeRecord[];
  allEmployees: EmployeeRecord[];
}

const DUMMY_PDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const INITIAL_TRAININGS: Training[] = [
  { 
    id: 'T-489', 
    status: 'Completed', 
    mode: 'Classroom', 
    topic: 'Standard Food Handling', 
    subTopic: 'Personal Hygiene', 
    trainer: 'James Smith', 
    trainerScope: 'Within Unit',
    date: '2025-03-31', 
    startTime: '2025-03-31T15:00', 
    endTime: '2025-03-31T16:00', 
    participantsPresent: 3, 
    participantsAbsent: 1, 
    participantsNeutral: 1,
    participantList: [
        { employeeId: 'uuid-0', status: 'present', addedAt: Date.now() - 1000 },
        { employeeId: 'uuid-1', status: 'present', addedAt: Date.now() - 2000 },
        { employeeId: 'uuid-2', status: 'absent', addedAt: Date.now() - 3000 },
        { employeeId: 'uuid-3', status: 'neutral', addedAt: Date.now() - 4000 },
        { employeeId: 'uuid-4', status: 'present', addedAt: Date.now() - 5000 }
    ],
    hasSheet: true,
    sheetUrl: DUMMY_PDF,
    uploadedDate: 'Apr 5, 2025',
    location: 'Main Training Room',
    isLocked: false,
    createdByEntityId: 'unit-ny-kitchen',
    assignedUnits: ['unit-ny-kitchen']
  }
];

// --- Sub-Components ---

const CsvReviewModal = ({ 
    stagedData, 
    allEmployees,
    onConfirm, 
    onCancel 
}: { 
    stagedData: any[], 
    allEmployees: EmployeeRecord[],
    onConfirm: (employees: EmployeeRecord[]) => void, 
    onCancel: () => void 
}) => {
    const [rows, setRows] = useState(stagedData);

    const processedRows = useMemo(() => {
        return rows.map(row => {
            const idMatch = allEmployees.find(e => e.ID === row['ID Number']);
            const nameMatch = allEmployees.find(e => e.Name.toLowerCase() === row['Name']?.toLowerCase());
            const match = idMatch || nameMatch;
            return {
                ...row,
                match,
                status: match ? 'Valid' : 'Identity Gap'
            };
        });
    }, [rows, allEmployees]);

    const validMatches = processedRows.filter(r => r.match).map(r => r.match!);

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-slate-200 animate-in zoom-in-95 overflow-hidden text-left">
                <div className="px-10 py-8 bg-[#1e293b] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <FileUp size={24} className="text-indigo-400" />
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">CSV Registry Review</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Cross-referencing {rows.length} records with Master Roster</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={28} strokeWidth={3} /></button>
                </div>

                <div className="flex-1 overflow-auto p-8 bg-slate-50 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                        {processedRows.map((row, idx) => (
                            <div key={idx} className={`bg-white rounded-2xl border-2 p-5 flex items-center justify-between transition-all ${row.match ? 'border-slate-100 hover:border-indigo-200' : 'border-rose-100 bg-rose-50/30'}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${row.match ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate leading-none mb-1">{row['Name'] || 'UNKNOWN'}</p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>ID: {row['ID Number'] || 'N/A'}</span>
                                            <span className="text-slate-200">•</span>
                                            <span>Dept: {row['Department'] || 'N/A'}</span>
                                            <span className="text-slate-200">•</span>
                                            <span className="text-indigo-600">Unit: {row['Unit Name'] || 'UNSPECIFIED'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {row.match ? (
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">Master Match</span>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">{row.match.Unit}</p>
                                        </div>
                                    ) : (
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 uppercase tracking-widest">Orphan Node</span>
                                            <p className="text-[10px] font-bold text-rose-400 mt-1 uppercase italic">Not in roster</p>
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-10 py-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 text-slate-400">
                        <Info size={18} className="text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Identified <span className="text-slate-900">{validMatches.length} valid nodes</span> to enroll</span>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button onClick={onCancel} className="flex-1 sm:flex-none px-10 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest">Discard</button>
                        <button 
                            disabled={validMatches.length === 0}
                            onClick={() => onConfirm(validMatches)}
                            className="flex-1 sm:flex-none px-16 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                        >
                            Enroll Validated List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SearchableSelect = ({ label, options, value, onChange, placeholder, required }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const filtered = options.filter((opt: string) => opt.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-1 text-left" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full h-12 bg-white border-2 border-slate-100 rounded-2xl px-4 py-2 text-xs font-black uppercase flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-md' : 'hover:border-slate-300'} shadow-inner`}
                >
                    <span className={value ? "text-slate-800" : "text-slate-300"}>{value || placeholder}</span>
                    <ChevronDown size={14} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-64">
                        <div className="p-3 border-b border-slate-100 bg-slate-50/80 sticky top-0">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    autoFocus
                                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-400 shadow-inner" 
                                    placeholder={`Search ${label}...`}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto p-1 custom-scrollbar">
                            {filtered.length > 0 ? (
                                filtered.map((opt: string) => (
                                    <button 
                                        key={opt}
                                        type="button"
                                        onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                                        className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors mb-0.5 hover:bg-indigo-50 ${value === opt ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
                                    >
                                        {opt}
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-[10px] text-slate-400 italic font-bold">No results found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MultiUnitSelector = ({ entities, selected, onChange, rootId, scope }: { entities: Entity[], selected: string[], onChange: (ids: string[]) => void, rootId: string, scope: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const hierarchy = useMemo(() => {
        let relevantRegions: Entity[] = [];
        if (scope === 'super-admin' || scope === 'corporate') {
            const corpId = scope === 'corporate' ? rootId : (entities.find(e => e.type === 'corporate')?.id || '');
            relevantRegions = entities.filter(e => e.type === 'regional' && e.parentId === corpId);
        } else if (scope === 'regional') {
            relevantRegions = entities.filter(e => e.id === rootId);
        }

        return relevantRegions.map(reg => ({
            ...reg,
            units: entities.filter(e => e.type === 'unit' && e.parentId === reg.id)
        })).filter(reg => reg.units.length > 0);
    }, [entities, rootId, scope]);

    const toggleUnit = (id: string) => {
        if (selected.includes(id)) onChange(selected.filter(i => i !== id));
        else onChange([...selected, id]);
    };

    const toggleRegion = (regionUnits: Entity[]) => {
        const regionIds = regionUnits.map(u => u.id);
        const allSelected = regionIds.every(id => selected.includes(id));
        if (allSelected) {
            onChange(selected.filter(id => !regionIds.includes(id)));
        } else {
            onChange([...new Set([...selected, ...regionIds])]);
        }
    };

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const selectedCount = selected.length;

    return (
        <div className="flex flex-col gap-1 w-full text-left" ref={containerRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">
                Target Entities (Multi-Unit Assignment) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`min-h-[56px] w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-md' : 'hover:border-slate-300'} shadow-inner`}
                >
                    <div className="flex flex-wrap gap-1.5 flex-1 pr-2">
                        {selectedCount > 0 ? (
                            <>
                                <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm animate-in zoom-in">
                                    <Globe size={10} /> {selectedCount} Units Selected
                                </span>
                                {selectedCount <= 3 && selected.map(id => (
                                    <span key={id} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[9px] font-bold uppercase truncate max-w-[120px]">
                                        {entities.find(u => u.id === id)?.name}
                                    </span>
                                ))}
                            </>
                        ) : <span className="text-slate-300 text-sm font-bold italic">Select destination units across regions...</span>}
                    </div>
                    <ChevronDown size={18} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 flex flex-col max-h-[400px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Organizational Node Explorer</span>
                            <button onClick={() => onChange([])} className="text-[9px] font-black uppercase text-rose-500 hover:underline">Clear All</button>
                        </div>
                        <div className="overflow-y-auto p-4 custom-scrollbar space-y-6 text-left">
                            {hierarchy.map(reg => {
                                const regionUnitIds = reg.units.map(u => u.id);
                                const isRegionFull = regionUnitIds.every(id => selected.includes(id));
                                const isRegionPartial = !isRegionFull && regionUnitIds.some(id => selected.includes(id));

                                return (
                                    <div key={reg.id} className="space-y-3">
                                        <div 
                                            onClick={() => toggleRegion(reg.units)}
                                            className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isRegionFull ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                                    {isRegionFull ? <Check size={12} strokeWidth={4} className="text-white" /> : isRegionPartial ? <div className="w-2 h-0.5 bg-indigo-400" /> : null}
                                                </div>
                                                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{reg.name}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{reg.units.length} Units</span>
                                        </div>
                                        <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {reg.units.map(unit => {
                                                const isSel = selected.includes(unit.id);
                                                return (
                                                    <div 
                                                        key={unit.id}
                                                        onClick={() => toggleUnit(unit.id)}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${isSel ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent bg-slate-50 hover:border-slate-200'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                                                            {isSel && <Check size={10} strokeWidth={4} className="text-white" />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase truncate ${isSel ? 'text-indigo-900' : 'text-slate-600'}`}>{unit.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                             <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Confirm Selection</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StaffSelectorDropdown = ({ employees, onAdd, existingIds }: { 
    employees: EmployeeRecord[], 
    onAdd: (selected: EmployeeRecord[]) => void,
    existingIds: string[]
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = useMemo(() => {
        return employees
            .filter(e => !existingIds.includes(e.id))
            .filter(e => e.Name.toLowerCase().includes(search.toLowerCase()) || e.ID.toLowerCase().includes(search.toLowerCase()));
    }, [employees, search, existingIds]);

    const handleToggle = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleCommit = () => {
        const toAdd = employees.filter(e => selected.includes(e.id));
        onAdd(toAdd);
        setSelected([]);
        setSearch("");
        setIsOpen(false);
    };

    const selectedNames = useMemo(() => {
        return employees.filter(e => selected.includes(e.id)).map(e => e.Name);
    }, [selected, employees]);

    return (
        <div className="flex flex-col xl:flex-row items-center gap-4 w-full md:w-auto text-left" ref={containerRef}>
            <div className="relative w-full md:w-auto">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-12 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-between gap-4 text-xs font-black uppercase tracking-widest min-w-[280px] hover:border-indigo-400 transition-all shadow-inner"
                >
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" />
                        <span className={selected.length > 0 ? 'text-slate-900' : 'text-slate-400'}>
                            {selected.length > 0 ? `${selected.length} Selected` : 'Select Personnel...'}
                        </span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                        <div className="p-3 border-b border-slate-50 bg-slate-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                <input 
                                    autoFocus
                                    className="w-full pl-9 pr-4 py-2 border rounded-xl text-[10px] font-black outline-none focus:border-indigo-500 uppercase"
                                    placeholder="Search Name or ID..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 text-left">
                            {filtered.length > 0 ? filtered.map(emp => {
                                const isSel = selected.includes(emp.id);
                                return (
                                    <div 
                                        key={emp.id} 
                                        onClick={() => handleToggle(emp.id)}
                                        className={`px-4 py-3 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors ${isSel ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{emp.Name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">{emp.ID} • {emp.Department}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                                            {isSel && <Check size={12} strokeWidth={4} />}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-10 text-center text-slate-300 text-[10px] font-black uppercase">Zero Candidates</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {selected.length > 0 && (
                <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 animate-in slide-in-from-left-2">
                    <div className="flex -space-x-2">
                        {selected.slice(0, 3).map((uid) => (
                             <div key={uid} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white uppercase shadow-sm">
                                {employees.find(e => e.id === uid)?.Name.charAt(0)}
                             </div>
                        ))}
                    </div>
                    <div className="min-w-0">
                         <p className="text-[9px] font-black text-indigo-400 uppercase leading-none mb-1">Live Selection</p>
                         <p className="text-[11px] font-black text-indigo-800 truncate max-w-[150px]">
                            {selectedNames.join(", ")}
                         </p>
                    </div>
                    <button 
                        onClick={handleCommit}
                        className="ml-2 h-9 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                    >
                        Enroll {selected.length}
                    </button>
                </div>
            )}
        </div>
    );
};

const StaffMemberRow: React.FC<{ 
    employee: EmployeeRecord, 
    status: 'present' | 'absent' | 'neutral',
    onStatusChange: (status: 'present' | 'absent' | 'neutral') => void,
    onRemove?: () => void 
}> = ({ employee, status, onStatusChange, onRemove }) => {
    const initials = employee.Name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    return (
        <div className="flex flex-col xl:flex-row items-center gap-8 p-6 xl:p-8 border-b border-slate-100 last:border-0 hover:bg-indigo-50/20 transition-all group/row text-left">
            <div className="w-full xl:w-48 shrink-0">
                <h4 className="text-[13px] font-black text-slate-900 tracking-tight leading-none mb-1.5 uppercase">{employee.Corporate}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] leading-none mb-1">{employee.Regional}</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none truncate">{employee.Unit}</p>
            </div>

            <div className="w-16 h-16 rounded-full bg-[#dbeafe] border-2 border-white shadow-md flex items-center justify-center text-[#2563eb] font-black text-lg shrink-0 group-hover/row:scale-105 transition-transform">
                {initials}
            </div>

            <div className="flex-1 min-w-0 w-full">
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-2.5">{employee.Name}</h4>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                    <span className="flex items-center gap-1.5"><IdCard size={14} className="text-slate-300"/> ID: {employee.ID}</span>
                    <span className="flex items-center gap-1.5"><Users size={14} className="text-slate-300"/> {employee.Gender}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-300"/> Joined: {employee.JoinedDate}</span>
                </div>
            </div>

            <div className="w-full xl:w-56 space-y-2 shrink-0">
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 group/link cursor-pointer">
                    <div className="p-1.5 bg-white border border-slate-100 rounded-lg group-hover/link:border-indigo-200 group-hover/link:bg-indigo-50 transition-all">
                        <Mail size={12} className="text-slate-400 group-hover/link:text-indigo-600" />
                    </div>
                    <span className="truncate group-hover/link:text-indigo-600 transition-colors">{employee.Email}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 group/link cursor-pointer">
                    <div className="p-1.5 bg-white border border-slate-100 rounded-lg group-hover/link:border-indigo-200 group-hover/link:bg-indigo-50 transition-all">
                        <Phone size={12} className="text-slate-400 group-hover/link:text-indigo-600" />
                    </div>
                    <span className="group-hover/link:text-indigo-600 transition-colors">{employee.Phone}</span>
                </div>
            </div>

            <div className="w-full xl:w-48 shrink-0 space-y-3">
                <div>
                    <h5 className="text-[12px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{employee.Department}</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{employee.Role}</p>
                </div>
            </div>

            <div className="w-full xl:w-64 shrink-0 flex items-center justify-between xl:flex-col xl:items-start xl:gap-4">
                <div className="space-y-2 w-full">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attendance Matrix</h5>
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner w-full overflow-hidden">
                        {[
                            { id: 'present', label: 'Present', color: 'bg-emerald-600' },
                            { id: 'neutral', label: 'Neutral', color: 'bg-slate-600' },
                            { id: 'absent', label: 'Absent', color: 'bg-rose-600' }
                        ].map((btn) => (
                            <button 
                                key={btn.id}
                                onClick={() => onStatusChange(btn.id as any)}
                                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${status === btn.id ? `${btn.color} text-white shadow-lg` : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
                {onRemove && (
                    <button 
                        onClick={onRemove}
                        className="p-3 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover/row:opacity-100"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

interface SessionCardProps {
    training: Training;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    isManaged: boolean;
    onManageToggle: () => void;
    allEmployees: EmployeeRecord[];
    onUpdateParticipants: (id: string, participants: ParticipantData[]) => void;
    onUploadSheet: (id: string, url: string) => void;
    onRemoveSheet: (id: string) => void;
    currentUserEntityId: string | null;
}

const SessionCard: React.FC<SessionCardProps> = ({ training, index, onEdit, onDelete, isManaged, onManageToggle, allEmployees, onUpdateParticipants, onUploadSheet, onRemoveSheet, currentUserEntityId }) => {
    const [participantFilter, setParticipantFilter] = useState<'all' | 'present' | 'absent' | 'neutral'>('all');
    const [stagedCsvData, setStagedCsvData] = useState<any[] | null>(null);
    const [isCsvImporting, setIsCsvImporting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);
    
    const isCompleted = training.status === 'Completed';
    const isOngoing = training.status === 'Ongoing';
    const canModify = training.createdByEntityId === currentUserEntityId;

    const statusStyles = {
        'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'Ongoing': 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse',
        'Upcoming': 'bg-amber-50 text-amber-700 border-amber-100'
    };

    const qrPayload = `TRAINING_AUTH_LOG\nID:${training.id}\nTOPIC:${training.topic}\nDATE:${training.date}\nTRAINER:${training.trainer}`;

    const sessionParticipants = useMemo(() => {
        const statusPriority: Record<string, number> = { 'neutral': 0, 'present': 1, 'absent': 2 };

        return training.participantList
            .map(p => ({
                employee: allEmployees.find(emp => emp.id === p.employeeId),
                status: p.status,
                addedAt: p.addedAt
            }))
            .filter(item => {
                const isValid = !!item.employee;
                if (!isValid) return false;
                if (participantFilter === 'all') return true;
                return item.status === participantFilter;
            })
            .sort((a, b) => {
                const priorityA = statusPriority[a.status];
                const priorityB = statusPriority[b.status];
                if (priorityA !== priorityB) return priorityA - priorityB;
                return b.addedAt - a.addedAt;
            });
    }, [allEmployees, training.participantList, participantFilter]);

    const handleAddParticipants = (newStaff: EmployeeRecord[]) => {
        const timestamp = Date.now();
        const nextList = [
            ...newStaff.map(s => ({ employeeId: s.id, status: 'neutral' as const, addedAt: timestamp })),
            ...training.participantList
        ];
        onUpdateParticipants(training.id, nextList);
    };

    const handleRemoveParticipant = (empId: string) => {
        if(confirm("Remove this staff member from the training session registry?")) {
            const nextList = training.participantList.filter(p => p.employeeId !== empId);
            onUpdateParticipants(training.id, nextList);
        }
    };

    const handleStatusUpdate = (empId: string, nextStatus: 'present' | 'absent' | 'neutral') => {
        const nextList = training.participantList.map(p => 
            p.employeeId === empId ? { ...p, status: nextStatus } : p
        );
        onUpdateParticipants(training.id, nextList);
    };

    const bulkMarkStatus = (targetStatus: 'present' | 'absent' | 'neutral') => {
        const nextList = training.participantList.map(p => ({ ...p, status: targetStatus }));
        onUpdateParticipants(training.id, nextList);
    };

    const handleFilterAnalytics = (status: 'present' | 'absent' | 'neutral') => {
        if (participantFilter === status) {
            setParticipantFilter('all');
        } else {
            setParticipantFilter(status);
            if (!isManaged) onManageToggle();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = DUMMY_PDF;
            onUploadSheet(training.id, url);
        }
    };

    // --- CSV Actions ---
    const downloadCsvTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([{
            'Name': 'James Smith',
            'Department': 'Kitchen',
            'ID Number': 'EMP1001',
            'Unit Name': 'NYC Central Kitchen'
        }]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "Participant_Import_Template.xlsx");
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCsvImporting(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const buffer = evt.target?.result as ArrayBuffer;
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            setStagedCsvData(data);
            setIsCsvImporting(false);
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    return (
        <div className={`group relative bg-white rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 text-left ${isCompleted ? 'border-slate-100 hover:border-emerald-400' : 'border-slate-100 hover:border-indigo-400'} ${isManaged ? 'ring-4 ring-indigo-50 border-indigo-500' : ''}`}>
            
            <div className="flex flex-col lg:flex-row items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-100 w-full min-h-[140px]">
                
                <div className="p-6 lg:p-8 lg:w-[25%] flex flex-col justify-center bg-white shrink-0 relative group/col1">
                    <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-500 ${isCompleted ? 'bg-emerald-600' : isOngoing ? 'bg-blue-600' : 'bg-slate-900'}`} />
                    <div className="flex items-start gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0 ${isCompleted ? 'bg-emerald-600' : isOngoing ? 'bg-blue-600' : 'bg-slate-900'}`}>
                            {index.toString().padStart(2, '0')}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase text-[9px] border shadow-sm ${statusStyles[training.status]}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isOngoing ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                    {training.status}
                                </span>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">#{training.id}</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors truncate mb-1">{training.topic}</h3>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <Layers size={14} className="text-indigo-500 shrink-0" />
                                <span className="truncate">{training.subTopic}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 lg:w-[22%] flex flex-col justify-center bg-slate-50/20 shrink-0">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 group/item">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover/item:text-indigo-600 transition-all border border-slate-100"><UserCheck size={20} /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Assigned Trainer</p>
                                <p className="text-sm font-black text-slate-800 uppercase truncate leading-tight">{training.trainer}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{training.trainerScope === 'External' ? training.externalCompany : training.trainerScope}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group/item">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover/item:text-purple-600 transition-all border border-slate-100"><MapPin size={20} /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Deployment Venue</p>
                                <p className="text-sm font-black text-slate-800 uppercase truncate leading-tight">{training.mode} • {training.location || 'Central Node'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 lg:w-[22%] flex flex-col justify-center bg-white shrink-0">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 group/item">
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 group-hover/item:text-orange-500 transition-all"><Calendar size={20} /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Cycle Date</p>
                                <p className="text-lg font-black text-slate-900 tracking-tighter uppercase">{new Date(training.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group/item">
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 group-hover/item:text-blue-500 transition-all"><Clock size={20} /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Operational Window</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-700">{new Date(training.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    <ArrowRight size={12} className="text-slate-300" />
                                    <span className="text-sm font-black text-slate-700">{new Date(training.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 lg:w-[16%] flex flex-col justify-center bg-slate-50/20 shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center leading-none">Registry Analytics</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => handleFilterAnalytics('present')}
                            className={`flex flex-col items-center p-3 rounded-2xl border transition-all group/metric ${participantFilter === 'present' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'}`}
                        >
                             <span className={`text-[14px] font-black mb-1 group-hover/metric:scale-110 transition-transform ${participantFilter === 'present' ? 'text-white' : 'text-emerald-600'}`}>{training.participantsPresent}</span>
                             <span className={`text-[8px] font-black uppercase tracking-tighter ${participantFilter === 'present' ? 'text-emerald-100' : 'text-slate-300'}`}>Present</span>
                        </button>
                        <button 
                            onClick={() => handleFilterAnalytics('absent')}
                            className={`flex flex-col items-center p-3 rounded-2xl border transition-all group/metric ${participantFilter === 'absent' ? 'bg-rose-600 border-rose-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 shadow-sm hover:border-rose-200'}`}
                        >
                             <span className={`text-[14px] font-black mb-1 group-hover/metric:scale-110 transition-transform ${participantFilter === 'absent' ? 'text-white' : 'text-rose-600'}`}>{training.participantsAbsent}</span>
                             <span className={`text-[8px] font-black uppercase tracking-tighter ${participantFilter === 'absent' ? 'text-rose-100' : 'text-slate-300'}`}>Absent</span>
                        </button>
                        <button 
                            onClick={() => handleFilterAnalytics('neutral')}
                            className={`flex flex-col items-center p-3 rounded-2xl border transition-all group/metric ${participantFilter === 'neutral' ? 'bg-amber-500 border-amber-500 text-white shadow-lg scale-105' : 'bg-white border-slate-100 shadow-sm hover:border-amber-200'}`}
                        >
                             <span className={`text-[14px] font-black mb-1 group-hover/metric:scale-110 transition-transform ${participantFilter === 'neutral' ? 'text-white' : 'text-amber-500'}`}>{training.participantsNeutral}</span>
                             <span className={`text-[8px] font-black uppercase tracking-tighter ${participantFilter === 'neutral' ? 'text-amber-100' : 'text-slate-300'}`}>Wait</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 lg:p-8 flex-1 flex flex-col justify-center items-center gap-4 bg-white relative">
                    <div className="flex items-center gap-4 w-full">
                        <div className="relative group/qr p-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner cursor-pointer hover:border-indigo-400 transition-all shrink-0">
                            <div className="bg-white p-1.5 rounded-xl shadow-sm">
                                <QRCodeSVG value={qrPayload} size={48} level="H" includeMargin={false} />
                            </div>
                            <div className="absolute -top-1.5 -right-1.5 p-1.5 bg-white rounded-full shadow-md scale-0 group-hover/qr:scale-100 transition-transform border border-slate-100"><QrCode size={12} className="text-indigo-600"/></div>
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter truncate">Ref: {training.uploadedDate || 'Sync Pending'}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <button 
                                    onClick={() => training.sheetUrl ? window.open(training.sheetUrl, '_blank') : null}
                                    disabled={!training.sheetUrl}
                                    className={`text-[10px] font-black uppercase flex items-center gap-1.5 transition-all ${training.sheetUrl ? 'text-indigo-600 hover:underline' : 'text-slate-300 cursor-not-allowed'}`}
                                >
                                    <Eye size={14}/> View PDF
                                </button>
                                {canModify && training.sheetUrl && (
                                    <button 
                                        onClick={() => onRemoveSheet(training.id)}
                                        className="p-1 text-rose-300 hover:text-rose-600 transition-colors"
                                        title="Remove PDF"
                                    >
                                        <FileMinus size={12} />
                                    </button>
                                )}
                                {canModify && !training.sheetUrl && (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                                        title="Upload PDF"
                                    >
                                        <FilePlus size={12} />
                                    </button>
                                )}
                                <input 
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {canModify && <button onClick={onEdit} className="p-2.5 bg-slate-50 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-xs active:scale-90 border border-transparent hover:border-indigo-100"><Edit size={18}/></button>}
                            {canModify && <button onClick={onDelete} className="p-2.5 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-xs active:scale-90 border border-transparent hover:border-rose-100"><Trash2 size={18}/></button>}
                        </div>
                    </div>
                    
                    <button 
                        onClick={onManageToggle}
                        className={`w-full py-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isManaged ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                    >
                        {isManaged ? 'Close Terminal' : 'Manage Node'} 
                        <ArrowRight size={18} className={`transition-transform duration-500 ${isManaged ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {isManaged && (
                <div className="w-full bg-white border-t-2 border-indigo-100 animate-in slide-in-from-top-6 duration-700">
                    <div className="px-10 py-8 bg-slate-50/80 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><Users size={28} /></div>
                            <div className="min-w-0">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">Participant Registry Ledger</h4>
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Synchronization Node • Latest First Sort Enabled</p>
                                    {participantFilter !== 'all' && (
                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase animate-in zoom-in">
                                            <span>Filtering by: {participantFilter}</span>
                                            <button onClick={() => setParticipantFilter('all')} className="hover:text-red-300">
                                                <X size={10} strokeWidth={4} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                         
                         <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto text-left">
                            <StaffSelectorDropdown 
                                employees={allEmployees} 
                                onAdd={handleAddParticipants}
                                existingIds={training.participantList.map(p => p.employeeId)}
                            />

                            <div className="h-10 w-px bg-slate-200 hidden md:block mx-2" />
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => csvInputRef.current?.click()}
                                    className="px-4 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                                >
                                    {isCsvImporting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />} 
                                    Import CSV
                                </button>
                                <input 
                                    type="file" 
                                    ref={csvInputRef} 
                                    className="hidden" 
                                    accept=".csv, .xlsx" 
                                    onChange={handleCsvUpload} 
                                />
                                <button 
                                    onClick={downloadCsvTemplate}
                                    className="p-3 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl hover:text-indigo-600 hover:bg-white transition-all shadow-xs"
                                    title="Download CSV Template"
                                >
                                    <Download size={18} />
                                </button>
                            </div>

                            <div className="h-10 w-px bg-slate-200 hidden md:block mx-2" />
                            
                            <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 shadow-inner">
                                <button 
                                    onClick={() => bulkMarkStatus('present')}
                                    className="px-3 py-2 bg-white rounded-xl text-[9px] font-black uppercase text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                    title="Mark All Present"
                                >
                                    <Zap size={12} fill="currentColor" /> All Pres.
                                </button>
                                <button 
                                    onClick={() => bulkMarkStatus('absent')}
                                    className="px-3 py-2 bg-white rounded-xl text-[9px] font-black uppercase text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 mx-1"
                                    title="Mark All Absent"
                                >
                                    <X size={12} strokeWidth={3} /> All Abs.
                                </button>
                                <button 
                                    onClick={() => bulkMarkStatus('neutral')}
                                    className="px-3 py-2 bg-white rounded-xl text-[9px] font-black uppercase text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                    title="Reset to Neutral"
                                >
                                    <RotateCcw size={12} strokeWidth={3} /> Reset
                                </button>
                            </div>
                         </div>
                    </div>
                    
                    <div className="flex flex-col bg-white">
                        {sessionParticipants.length > 0 ? sessionParticipants.map(item => (
                            <StaffMemberRow 
                                key={item.employee!.id} 
                                employee={item.employee!} 
                                status={item.status as any}
                                onStatusChange={(st) => handleStatusUpdate(item.employee!.id, st)}
                                onRemove={() => handleRemoveParticipant(item.employee!.id)}
                            />
                        )) : (
                            <div className="py-32 text-center flex flex-col items-center">
                                {participantFilter !== 'all' ? (
                                    <>
                                        <FilterX size={72} className="mb-8 text-slate-200 opacity-20" />
                                        <p className="text-lg font-black uppercase text-slate-300 tracking-[0.3em]">No {participantFilter} Nodes</p>
                                        <button 
                                            onClick={() => setParticipantFilter('all')}
                                            className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all"
                                        >
                                            Clear Result Filter
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Users size={72} className="mb-8 text-slate-200 opacity-20" />
                                        <p className="text-lg font-black uppercase text-slate-300 tracking-[0.3em]">Zero Active Nodes</p>
                                        <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold italic">Initialize registry by enrolling personnel from the catalog.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="px-10 py-10 bg-slate-50 border-t border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner border border-emerald-100"><ShieldCheck size={32} /></div>
                            <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.15em] max-w-lg leading-relaxed text-left">
                                <span className="text-slate-900">Digital Assurance:</span> All participant identities are verified nodes against the <span className="text-indigo-600">Enterprise Asset Vault</span>. Immutable digital trail active for this session.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full lg:w-auto">
                            <button className="flex-1 lg:flex-none px-12 py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">
                                Batch Archive
                            </button>
                            <button 
                                className="flex-1 lg:flex-none px-20 py-4 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                            >
                               <Save size={20} strokeWidth={2.5} /> Commit Attendance
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Review Modal */}
            {stagedCsvData && (
                <CsvReviewModal 
                    stagedData={stagedCsvData}
                    allEmployees={allEmployees}
                    onConfirm={(matches) => {
                        handleAddParticipants(matches);
                        setStagedCsvData(null);
                    }}
                    onCancel={() => setStagedCsvData(null)}
                />
            )}
        </div>
    );
};

// --- Main Calendar Component ---

export default function TrainingCalendar({ 
  currentScope = 'unit', 
  userRootId, 
  entities = [],
  trainers = [],
  allEmployees = []
}: TrainingCalendarProps) {
  const [trainings, setTrainings] = useState<Training[]>(INITIAL_TRAININGS);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [managedSessionId, setManagedSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  
  const canEdit = currentScope !== 'user';

  const findEntityById = (id: string | null | undefined) => entities.find(e => e.id === id);

  const isAncestorOf = (ancestorId: string | null | undefined, descendantId: string | null | undefined): boolean => {
    if (!ancestorId || !descendantId) return false;
    let current = findEntityById(descendantId);
    while (current) {
      if (current.parentId === ancestorId) return true;
      current = findEntityById(current.parentId);
    }
    return false;
  };

  const contextIds = useMemo(() => {
    const ids = { unitId: '', regionId: '', corpId: '' };
    if (!userRootId) return ids;

    let current = findEntityById(userRootId);
    while (current) {
      if (current.type === 'unit') ids.unitId = current.id;
      if (current.type === 'regional') ids.regionId = current.id;
      if (current.type === 'corporate') ids.corpId = current.id;
      current = findEntityById(current.parentId);
    }
    return ids;
  }, [entities, userRootId]);

  const targetCorporate = useMemo(() => {
    if (currentScope === 'super-admin') return entities.find(e => e.type === 'corporate');
    return entities.find(e => e.id === contextIds.corpId);
  }, [entities, currentScope, contextIds.corpId]);

  const sopTopicsData = useMemo(() => {
    if (!targetCorporate?.masterSops) return {};
    const data: Record<string, string[]> = {};
    targetCorporate.masterSops.forEach(sop => {
      data[sop.name] = sop.subTopics;
    });
    return data;
  }, [targetCorporate]);

  const visibleTrainings = useMemo(() => {
    return trainings.filter(t => {
      if (currentScope === 'super-admin') return true;
      if (t.createdByEntityId === userRootId) return true;
      if (t.assignedUnits.includes(userRootId || '')) return true;
      return t.assignedUnits.some(uId => isAncestorOf(userRootId, uId));
    });
  }, [trainings, userRootId, currentScope]);

  const subTopicSummary = useMemo(() => {
    const summary: Record<string, { topic: string, upcoming: number, ongoing: number, completed: number, total: number, participants: number }> = {};
    
    if (targetCorporate?.masterSops) {
        targetCorporate.masterSops.forEach(sop => {
            sop.subTopics.forEach(st => {
                summary[st] = { topic: sop.name, upcoming: 0, ongoing: 0, completed: 0, total: 0, participants: 0 };
            });
        });
    }

    visibleTrainings.forEach(t => {
        if (!summary[t.subTopic]) {
            summary[t.subTopic] = { topic: t.topic, upcoming: 0, ongoing: 0, completed: 0, total: 0, participants: 0 };
        }
        summary[t.subTopic].total++;
        if (t.status === 'Upcoming') summary[t.subTopic].upcoming++;
        if (t.status === 'Ongoing') summary[t.subTopic].ongoing++;
        if (t.status === 'Completed') summary[t.subTopic].completed++;
        summary[t.subTopic].participants += t.participantsPresent;
    });

    return Object.entries(summary)
        .filter(([, data]) => data.total > 0)
        .sort((a, b) => b[1].total - a[1].total);
  }, [visibleTrainings, targetCorporate]);

  const metrics = useMemo(() => ({
    total: visibleTrainings.length,
    upcoming: visibleTrainings.filter(t => t.status === 'Upcoming').length,
    ongoing: visibleTrainings.filter(t => t.status === 'Ongoing').length,
    completed: visibleTrainings.filter(t => t.status === 'Completed').length,
    participants: visibleTrainings.reduce((acc, curr) => acc + curr.participantsPresent, 0),
  }), [visibleTrainings]);

  const exportToExcel = () => {
    const data = visibleTrainings.map((t, idx) => ({
      "S.No": idx + 1,
      "Status": t.status,
      "Mode": t.mode,
      "Topic": t.topic,
      "Sub Topic": t.subTopic || 'General',
      "Trainer": t.trainer,
      "Trainer Scope": t.trainerScope,
      "Date": t.date,
      "Time": `${new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(t.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Training Sessions");
    XLSX.writeFile(workbook, `Training_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setTrainings(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSave = (payload: Training) => {
    setTrainings(prev => {
      const exists = prev.some(t => t.id === payload.id);
      if (exists) {
        return prev.map(t => t.id === payload.id ? payload : t);
      }
      return [payload, ...prev];
    });
    setActiveModal(null);
    setEditingTraining(null);
  };

  const handleUpdateParticipants = (id: string, participants: ParticipantData[]) => {
      setTrainings(prev => prev.map(t => {
          if (t.id !== id) return t;
          return {
              ...t,
              participantList: participants,
              participantsNeutral: participants.filter(p => p.status === 'neutral').length,
              participantsPresent: participants.filter(p => p.status === 'present').length,
              participantsAbsent: participants.filter(p => p.status === 'absent').length,
          };
      }));
  };

  const handleUploadSheet = (id: string, url: string) => {
    setTrainings(prev => prev.map(t => t.id === id ? { ...t, sheetUrl: url, hasSheet: true, uploadedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } : t));
  };

  const handleRemoveSheet = (id: string) => {
    if(confirm("Permanently remove the digital training card for this session?")) {
        setTrainings(prev => prev.map(t => t.id === id ? { ...t, sheetUrl: undefined, hasSheet: false, uploadedDate: undefined } : t));
    }
  };

  const TrainingFormModal = () => {
    const [formData, setFormData] = useState({
      topic: editingTraining?.topic || '',
      subTopic: editingTraining?.subTopic || '',
      mode: editingTraining?.mode || '',
      topicRemark: editingTraining?.topicRemark || '',
      trainerScope: editingTraining?.trainerScope || 'Within Unit',
      trainer: editingTraining?.trainer || '',
      externalCompany: editingTraining?.externalCompany || '',
      startTime: editingTraining?.startTime || '',
      endTime: editingTraining?.endTime || '',
      location: editingTraining?.location || '',
      description: editingTraining?.description || '',
      assignedUnits: editingTraining?.assignedUnits || (currentScope === 'unit' ? [userRootId || ''] : [])
    });

    const subTopicsList = useMemo(() => 
      formData.topic ? (sopTopicsData[formData.topic] || []) : [],
      [formData.topic, sopTopicsData]
    );

    const filteredTrainerNames = useMemo(() => {
      const { unitId, regionId, corpId } = contextIds;
      const scope = formData.trainerScope;
      let filtered = trainers;

      if (scope === 'Within Unit') {
        if (unitId) {
          const uName = findEntityById(unitId)?.name;
          filtered = filtered.filter(t => t.Unit === uName);
        }
      } else if (scope === 'Regional') {
        if (regionId) {
          const rName = findEntityById(regionId)?.name;
          filtered = filtered.filter(t => t.Regional === rName);
        }
      } else if (scope === 'Corporate') {
        if (corpId) {
          const cName = findEntityById(corpId)?.name;
          filtered = filtered.filter(t => t.Corporate === cName);
        }
      }
      return filtered.map(t => t.Name).sort();
    }, [formData.trainerScope, contextIds, trainers]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if ((currentScope === 'corporate' || currentScope === 'regional') && formData.assignedUnits.length === 0) {
        alert("Please select at least one target unit.");
        return;
      }
      const payload: Training = {
        id: editingTraining?.id || `T-${Date.now()}`,
        status: editingTraining?.status || 'Upcoming',
        topic: formData.topic,
        subTopic: formData.subTopic,
        mode: formData.mode as any,
        topicRemark: formData.topicRemark,
        trainerScope: formData.trainerScope,
        trainer: formData.trainer,
        externalCompany: formData.trainerScope === 'External' ? formData.externalCompany : undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        description: formData.description,
        date: formData.startTime.split('T')[0] || new Date().toISOString().split('T')[0],
        participantsPresent: editingTraining?.participantsPresent || 0,
        participantsAbsent: editingTraining?.participantsAbsent || 0,
        participantsNeutral: editingTraining?.participantsNeutral || 0,
        participantList: editingTraining?.participantList || [],
        hasSheet: editingTraining?.hasSheet || false,
        sheetUrl: editingTraining?.sheetUrl,
        uploadedDate: editingTraining?.uploadedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isLocked: editingTraining?.isLocked || false,
        createdByEntityId: editingTraining?.createdByEntityId || userRootId || 'system',
        assignedUnits: formData.assignedUnits
      };
      handleSave(payload);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[95vh] border border-slate-200 overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-[#0f172a] text-white shrink-0 shadow-lg text-left">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><CalendarClock size={24}/></div>
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-none">
                    {editingTraining ? 'Edit Session Profile' : 'Schedule New Training'}
                    </h3>
                    <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-1.5">Operational Resource Mapping</p>
                </div>
            </div>
            <button 
              onClick={() => { setActiveModal(null); setEditingTraining(null); }} 
              className="p-2 hover:bg-white/10 rounded-full transition-all text-white active:scale-90"
            >
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          <form onSubmit={handleSubmit} id="training-form" className="p-10 overflow-y-auto custom-scrollbar flex-1 space-y-10 bg-slate-50/20 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              {(currentScope === 'corporate' || currentScope === 'regional') && (
                <div className="col-span-1 md:col-span-2 animate-in slide-in-from-top-2">
                   <MultiUnitSelector 
                      entities={entities} 
                      selected={formData.assignedUnits}
                      onChange={(ids) => setFormData({...formData, assignedUnits: ids})}
                      rootId={userRootId || ''}
                      scope={currentScope}
                   />
                </div>
              )}
              <SearchableSelect label="Domain / SOP Master" required placeholder="Select Master Topic" options={Object.keys(sopTopicsData)} value={formData.topic} onChange={(val: string) => setFormData({ ...formData, topic: val, subTopic: '' })} />
              <div className="flex flex-col gap-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Delivery Mode <span className="text-red-500">*</span></label><div className="relative"><select required className="w-full h-12 bg-white border-2 border-slate-100 rounded-2xl px-4 text-xs font-black uppercase outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 shadow-inner transition-all" value={formData.mode} onChange={(e) => setFormData({ ...formData, mode: e.target.value })}><option value="">Select Mode...</option><option value="Classroom">Classroom</option><option value="Online">Online</option><option value="Recorded">Recorded</option></select><ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div></div>
              {formData.topic && subTopicsList.length > 0 && (<div className="col-span-1 md:col-span-2 animate-in slide-in-from-top-2 duration-300"><SearchableSelect label="Specific Module" required placeholder="Select Specific Module" options={subTopicsList} value={formData.subTopic} onChange={(val: string) => setFormData({ ...formData, subTopic: val })} /></div>)}
              <div className="flex flex-col gap-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Trainer Hierarchy <span className="text-red-500">*</span></label><div className="relative"><select required className="w-full h-12 bg-white border-2 border-slate-100 rounded-2xl px-4 text-xs font-black uppercase outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 shadow-inner transition-all" value={formData.trainerScope} onChange={(e) => setFormData({ ...formData, trainerScope: e.target.value, trainer: '', externalCompany: '' })}><option value="Within Unit">Within Unit</option><option value="Regional">Regional Office</option><option value="Corporate">Corporate HQ</option><option value="External">External Specialist</option></select><ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div></div>
              {formData.trainerScope === 'External' ? (<><div className="flex flex-col gap-1 animate-in zoom-in-95"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">External Trainer Name <span className="text-red-500">*</span></label><div className="relative group"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} /><input type="text" required className="w-full h-12 bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-xs font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-inner transition-all uppercase" value={formData.trainer} onChange={(e) => setFormData({ ...formData, trainer: e.target.value })} placeholder="Enter Trainer Name..." /></div></div><div className="flex flex-col gap-1 animate-in zoom-in-95"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">External Company Name <span className="text-red-500">*</span></label><div className="relative group"><Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} /><input type="text" required className="w-full h-12 bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-xs font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-inner transition-all uppercase" value={formData.externalCompany} onChange={(e) => setFormData({ ...formData, externalCompany: e.target.value })} placeholder="Enter Company Name..." /></div></div></>) : (<SearchableSelect label="Assigned Lead Trainer" required placeholder="Search Dynamic Roster" options={filteredTrainerNames} value={formData.trainer} onChange={(val: string) => setFormData({ ...formData, trainer: val })} />)}
              <div className="flex flex-col gap-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Cycle Start <span className="text-red-500">*</span></label><input type="datetime-local" required className="w-full h-12 bg-white border-2 border-slate-100 rounded-2xl px-4 text-xs font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-inner transition-all" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Cycle End <span className="text-red-500">*</span></label><input type="datetime-local" required className="w-full h-12 bg-white border-2 border-slate-100 rounded-2xl px-4 text-xs font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-inner transition-all" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} /></div>
              <div className="col-span-1 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Logistics Node / Meeting URL</label><div className="relative group"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} /><input type="text" className="w-full h-12 bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-xs font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-inner transition-all" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="E.G. ROOM 1 OR TEAMS URL..." /></div></div>
              <div className="col-span-1 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Technical Curriculum Summary</label><textarea rows={4} className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-inner transition-all resize-none placeholder:text-slate-300" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detail the agenda, objectives, and prerequisites..." /></div>
            </div>
          </form>

          <div className="px-10 py-8 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3 pb-safe">
            <button type="button" onClick={() => { setActiveModal(null); setEditingTraining(null); }} className="px-10 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest">Discard</button>
            <button type="submit" form="training-form" className="px-16 py-4 bg-[#0f172a] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"><Save size={18} /> {editingTraining ? 'Finalize Changes' : 'Register Session'}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-6 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden relative text-left">
         <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
         <div className="flex items-center gap-6">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-inner border border-indigo-100 ring-4 ring-white">
               <Calendar size={32} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">Session Registry</h2>
               <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck size={12} className="text-emerald-500"/> Resource Allocation & Integrity Hub
               </p>
            </div>
         </div>

         <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="relative group w-full md:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search registry index..." 
                 className="pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black w-full focus:outline-none focus:ring-4 focus:ring-indigo-50/10 focus:border-indigo-400 transition-all placeholder:text-slate-300 shadow-inner uppercase tracking-wider"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <button 
                onClick={() => setShowSummary(!showSummary)}
                className={`p-4 border-2 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center gap-2 ${showSummary ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100'}`}
                title="Curriculum Summary"
            >
                <ListChecks size={22} />
            </button>
            <button onClick={exportToExcel} className="p-4 border-2 border-slate-100 text-slate-400 bg-white rounded-2xl hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm active:scale-95">
               <FileSpreadsheet size={22} strokeWidth={2.5} />
            </button>
            {canEdit && (
              <button 
                onClick={() => { setEditingTraining(null); setActiveModal('trainingForm'); }}
                className="px-8 py-3.5 bg-[#0f172a] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} strokeWidth={3} /> Schedule New
              </button>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
         {[
           { label: 'Total Sessions', val: metrics.total, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'Upcoming Hub', val: metrics.upcoming, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
           { label: 'Ongoing Flow', val: metrics.ongoing, icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Completed', val: metrics.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Participants', val: metrics.participants, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
         ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-xl transition-all group text-left">
               <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform shrink-0`}>
                  <stat.icon size={24} />
               </div>
               <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5 truncate">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
               </div>
            </div>
         ))}
      </div>

      {showSummary && (
          <div className="bg-white p-8 rounded-[3rem] border border-indigo-100 shadow-xl animate-in slide-in-from-top-4 duration-500 text-left">
              <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><PieChart size={24}/></div>
                  <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Curriculum Analytics Summary</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aggregate Training Footprint by Sub-Topic</p>
                  </div>
                  <button onClick={() => setShowSummary(false)} className="ml-auto p-2 hover:bg-slate-100 rounded-full text-slate-300"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subTopicSummary.map(([st, data]) => (
                      <div key={st} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:border-indigo-300 transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-bl-[3rem]" />
                          <div className="flex justify-between items-start mb-4">
                              <div className="min-w-0">
                                  <h4 className="text-sm font-black text-slate-800 uppercase truncate leading-none mb-1.5">{st}</h4>
                                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{data.topic}</p>
                              </div>
                              <div className="text-right">
                                  <span className="text-xl font-black text-slate-900">{data.total}</span>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Sessions</p>
                              </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                              <div className="text-center">
                                  <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Upcoming</p>
                                  <p className="text-xs font-black text-amber-600">{data.upcoming}</p>
                              </div>
                              <div className="text-center border-x border-slate-200">
                                  <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Ongoing</p>
                                  <p className="text-xs font-black text-blue-600">{data.ongoing}</p>
                              </div>
                              <div className="text-center">
                                  <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Comp.</p>
                                  <p className="text-xs font-black text-emerald-600">{data.completed}</p>
                              </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                  <Users size={12} className="text-purple-500" />
                                  <span className="text-[10px] font-black text-slate-700">{data.participants} <span className="text-slate-400 font-bold">Total</span></span>
                              </div>
                              <button className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-300 group-hover:text-indigo-600 transition-colors shadow-sm">
                                  <ArrowRight size={14} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto overflow-visible">
        {visibleTrainings.filter(t => t.topic.toLowerCase().includes(search.toLowerCase()) || t.trainer.toLowerCase().includes(search.toLowerCase())).map((t, idx) => (
            <SessionCard 
                key={t.id} 
                training={t} 
                index={idx + 1}
                onEdit={() => { setEditingTraining(t); setActiveModal('trainingForm'); }}
                onDelete={() => handleDelete(t.id)}
                isManaged={managedSessionId === t.id}
                onManageToggle={() => setManagedSessionId(managedSessionId === t.id ? null : t.id)}
                allEmployees={allEmployees}
                onUpdateParticipants={handleUpdateParticipants}
                onUploadSheet={handleUploadSheet}
                onRemoveSheet={handleRemoveSheet}
                currentUserEntityId={userRootId || null}
            />
        ))}
      </div>

      {activeModal === 'trainingForm' && <TrainingFormModal />}
    </div>
  );
}
