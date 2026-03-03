
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  CalendarRange, 
  ChevronDown, 
  ChevronUp, 
  Plus,
  Calendar,
  Search,
  ClipboardList,
  X,
  User,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Layers,
  LayoutGrid,
  Check,
  Trash2,
  MoreVertical,
  Users,
  CalendarDays,
  Copy,
  AlertTriangle,
  Download,
  ExternalLink,
  Repeat,
  Play,
  Eye,
  Award,
  FileText,
  RefreshCw,
  Hash,
  FileDigit,
  FileSignature,
  Lock,
  Unlock,
  History,
  Save,
  Gavel,
  Settings2,
  Shield,
  Activity,
  BarChart3,
  PieChart,
  Target,
  ArrowRight,
  FileSpreadsheet,
  File,
  ImageIcon,
  PenTool,
  ShieldCheck,
  Droplets,
  GitCommit,
  Box,
  AlertCircle,
  Globe,
  Settings,
  CalendarClock,
  Zap
} from 'lucide-react';
import { Entity, HierarchyScope, MandatoryProtocol, AuthorityLevel } from '../types';

// --- Types ---

type PeriodFrequency = 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly' | 'Biennial';
type AuditStatus = 'Scheduled' | 'In Progress' | 'Report Drafted' | 'Pending Review' | 'Completed' | 'Closed';
type PeriodStatus = 'DRAFT' | 'PUBLISHED';
type PillarStatus = 'Compliant' | 'Due Soon' | 'Overdue' | 'NA';

interface MandatoryPillar {
    id: string;
    type: 'FSMS' | 'GMP' | 'TRACE' | 'GLASS' | 'OTHER';
    label: string;
    frequency: string;
    lastDate: string;
    nextDue: string;
    status: PillarStatus;
    level: AuthorityLevel;
    effectiveDate: string;
}

interface CrossDeptAudit {
    id: string;
    departments: string[];
    scope: string; 
    startDate: string;
    endDate: string;
    checklist: string;
    auditTeam: string[];
    status: AuditStatus;
    score?: number;
    recurring?: string;
    isUnannounced?: boolean; 
    isFollowUp?: boolean; 
}

interface AuditPeriod {
    id: string;
    protocolId: string; // Linked to the mandate/audit type
    frequency: PeriodFrequency;
    startDate: string;
    endDate: string;
    audits: CrossDeptAudit[];
    isExpanded?: boolean;
    status: PeriodStatus; 
}

interface UnitScheduleData {
    unitId: string;
    unitName: string;
    regionId: string;
    corpId: string;
    region: string;
    periods: AuditPeriod[];
    isExpanded?: boolean;
}

interface AuditScheduleProps {
  entities?: Entity[];
  currentScope?: HierarchyScope;
  userRootId?: string | null;
  protocols: MandatoryProtocol[];
  setProtocols: React.Dispatch<React.SetStateAction<MandatoryProtocol[]>>;
}

// --- Constants ---
const FREQUENCIES: PeriodFrequency[] = ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'Biennial'];
const DEPARTMENTS = ["Main Kitchen", "Housekeeping", "Engineering", "Front Office", "F&B Service", "Security", "Stores", "HR"];
const CHECKLISTS = ["FSSAI Hygiene Rating", "ISO 22000 Internal Audit", "Glass & Plastic Audit", "Pest Control Effectiveness", "Personal Hygiene Check", "CCP Verification"];
const AVAILABLE_AUDITORS = ["Sarah Connor", "Jane Smith", "Mike Ross", "John Doe", "Michael Brown"];

const INITIAL_DATA: UnitScheduleData[] = [
    {
        unitId: "unit-ny-kitchen",
        unitName: "NYC Central Kitchen",
        regionId: "reg-na-catering",
        corpId: "corp-acme",
        region: "North America",
        isExpanded: true,
        periods: [
            {
                id: "p1",
                protocolId: "m1",
                frequency: "Yearly",
                startDate: "2025-01-01",
                endDate: "2025-12-31",
                isExpanded: true,
                status: 'PUBLISHED',
                audits: [
                    {
                        id: "a1",
                        departments: ["Main Kitchen"],
                        scope: "Thawing & Raw Material Storage Processes",
                        startDate: "2025-05-10",
                        endDate: "2025-05-12",
                        checklist: "ISO 22000 Internal Audit",
                        auditTeam: ["Sarah Connor"],
                        status: "Completed",
                        score: 94,
                        isUnannounced: false
                    }
                ]
            },
            {
                id: "p2",
                protocolId: "m2",
                frequency: "Monthly",
                startDate: "2025-05-01",
                endDate: "2025-05-31",
                isExpanded: true,
                status: 'PUBLISHED',
                audits: [
                    {
                        id: "a2",
                        departments: ["Production"],
                        scope: "Chemical Control Failure Point",
                        startDate: "2025-05-14",
                        endDate: "2025-05-15",
                        checklist: "Safety Audit",
                        auditTeam: ["Jane Smith"],
                        status: "Completed",
                        score: 62,
                        isUnannounced: true
                    }
                ]
            }
        ]
    }
];

const PillarIcon = ({ label, size = 16, className = "", strokeWidth = 2 }: { label: string, size?: number, className?: string, strokeWidth?: number }) => {
    const l = label.toLowerCase();
    if (l.includes('fsms')) return <ShieldCheck size={size} className={className} strokeWidth={strokeWidth} />;
    if (l.includes('gmp') || l.includes('ghp')) return <Droplets size={size} className={className} strokeWidth={strokeWidth} />;
    if (l.includes('trace')) return <GitCommit size={size} className={className} strokeWidth={strokeWidth} />;
    if (l.includes('glass')) return <Box size={size} className={className} strokeWidth={strokeWidth} />;
    return <FileText size={size} className={className} strokeWidth={strokeWidth} />;
};

const getPillarColor = (status: PillarStatus) => {
    switch (status) {
        case 'Compliant': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
        case 'Due Soon': return 'text-amber-500 bg-amber-50 border-amber-100';
        case 'Overdue': return 'text-rose-500 bg-rose-50 border-rose-100';
        case 'NA': return 'text-slate-300 bg-slate-50 border-slate-100';
        default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
};

const MultiSelectDropdown = ({ options, selected, onChange, placeholder = "Select...", renderOptionMeta }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const filteredOptions = options.filter((opt: string) => opt.toLowerCase().includes(search.toLowerCase()));
    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) onChange(selected.filter((s: string) => s !== opt));
        else onChange([...selected, opt]);
    };
    return (
        <div className="relative" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className={`w-full min-h-[48px] px-4 py-2.5 bg-slate-50 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-indigo-400 bg-white ring-4 ring-indigo-50/50' : 'border-slate-100 hover:border-slate-200 shadow-inner'}`}>
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 pr-2">
                    {selected.length > 0 ? selected.map((s: string) => (
                        <span key={s} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                            {s} <button onClick={(e) => { e.stopPropagation(); toggleOption(s); }}><X size={10} /></button>
                        </span>
                    )) : <span className="text-xs font-bold text-slate-300 italic">{placeholder}</span>}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-2 border-b border-slate-50">
                        <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input autoFocus className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-indigo-500" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.map((opt: string) => (
                            <div key={opt} onClick={() => toggleOption(opt)} className={`px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-bold text-slate-700 ${selected.includes(opt) ? 'bg-indigo-50 text-indigo-700' : ''}`}>
                                <div className="flex items-center gap-2">{opt}{renderOptionMeta && renderOptionMeta(opt)}</div>
                                {selected.includes(opt) && <Check size={14} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const AuditSchedule: React.FC<AuditScheduleProps> = ({ entities = [], currentScope = 'super-admin', userRootId, protocols, setProtocols }) => {
    const [units, setUnits] = useState<UnitScheduleData[]>(INITIAL_DATA);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [modalMode, setModalMode] = useState<'PERIOD' | 'AUDIT' | 'VIEW_REPORT' | 'MANAGE_PROTOCOLS' | 'ADD_PROTOCOL' | null>(null);
    const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
    const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
    const [selectedAudit, setSelectedAudit] = useState<CrossDeptAudit | null>(null);

    // Track active Audit Type tab per unit
    const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

    const [periodForm, setPeriodForm] = useState({ frequency: 'Monthly' as PeriodFrequency, startDate: '', endDate: '' });
    const [auditForm, setAuditForm] = useState({ departments: [] as string[], scope: '', startDate: '', endDate: '', checklist: '', auditTeam: [] as string[], recurring: 'None', isUnannounced: false, isFollowUp: false });
    
    // Protocol Form
    const [protocolForm, setProtocolForm] = useState({ 
        name: '', 
        frequency: 'Monthly', 
        level: 'UNIT' as AuthorityLevel, 
        entityId: '', 
        effectiveDate: new Date().toISOString().split('T')[0] 
    });

    // Dynamic Inheritance Logic
    const getUnitMandatoryPillars = (unit: UnitScheduleData): MandatoryPillar[] => {
        const applicable = protocols.filter(p => 
            p.level === 'CORPORATE' || 
            (p.level === 'REGIONAL' && p.entityId === unit.regionId) ||
            (p.level === 'UNIT' && p.entityId === unit.unitId)
        );

        return applicable.map(p => {
            const isDone = unit.periods.some(per => per.protocolId === p.id && per.audits.some(a => a.status === 'Completed'));
            
            return {
                id: p.id,
                type: 'OTHER',
                label: p.name,
                frequency: p.frequency,
                lastDate: isDone ? '2025-04-10' : 'N/A',
                nextDue: isDone ? '2025-06-10' : 'Immediate',
                status: isDone ? 'Compliant' : 'Overdue',
                level: p.level,
                effectiveDate: p.effectiveDate
            };
        });
    };

    const toggleUnitExpand = (unitId: string) => setUnits(prev => prev.map(u => u.unitId === unitId ? { ...u, isExpanded: !u.isExpanded } : u));
    const togglePeriodExpand = (unitId: string, periodId: string) => setUnits(prev => prev.map(u => u.unitId === unitId ? { ...u, periods: u.periods.map(p => p.id === periodId ? { ...p, isExpanded: !p.isExpanded } : p) } : u));
    
    const handleAddPeriod = () => {
        if (!activeUnitId || !periodForm.startDate) return;
        const currentPillarId = activeTabs[activeUnitId];
        if (!currentPillarId) return;

        const newPeriod: AuditPeriod = { 
            id: `P-${Date.now()}`, 
            protocolId: currentPillarId,
            frequency: periodForm.frequency, 
            startDate: periodForm.startDate, 
            endDate: periodForm.endDate, 
            audits: [], 
            isExpanded: true, 
            status: 'DRAFT' 
        };
        setUnits(prev => prev.map(u => u.unitId === activeUnitId ? { ...u, periods: [newPeriod, ...u.periods], isExpanded: true } : u));
        setModalMode(null);
    };

    const handleAddAudit = () => {
        if (!activeUnitId || !activePeriodId || auditForm.departments.length === 0) return;
        const newAudit: CrossDeptAudit = { id: `A-${Date.now()}`, departments: auditForm.departments, scope: auditForm.scope, startDate: auditForm.startDate, endDate: auditForm.endDate, checklist: auditForm.checklist, auditTeam: auditForm.auditTeam, status: 'Scheduled', isUnannounced: auditForm.isUnannounced };
        setUnits(prev => prev.map(u => u.unitId === activeUnitId ? { ...u, periods: u.periods.map(p => p.id === activePeriodId ? { ...p, audits: [...p.audits, newAudit] } : p) } : u));
        setModalMode(null);
    };

    const handleAddProtocol = () => {
        // Updated Validation: Allow Corporate mandates to save without explicit entityId
        if (!protocolForm.name || !protocolForm.effectiveDate) {
            alert("Name and Effective Date are mandatory.");
            return;
        }

        let finalEntityId = protocolForm.entityId;
        if (protocolForm.level === 'CORPORATE' && !finalEntityId) {
            const firstCorp = entities.find(e => e.type === 'corporate');
            finalEntityId = firstCorp ? firstCorp.id : 'corp-acme';
        }

        if (protocolForm.level !== 'CORPORATE' && !finalEntityId) {
            alert("Entity ID is required for Regional and Unit level mandates.");
            return;
        }

        const newP: MandatoryProtocol = {
            id: `p-${Date.now()}`,
            name: protocolForm.name,
            frequency: protocolForm.frequency,
            level: protocolForm.level,
            entityId: finalEntityId,
            effectiveDate: protocolForm.effectiveDate
        };
        
        setProtocols(prev => [...prev, newP]);
        setModalMode('MANAGE_PROTOCOLS');
        setProtocolForm({ name: '', frequency: 'Monthly', level: 'UNIT', entityId: '', effectiveDate: new Date().toISOString().split('T')[0] });
    };

    const handleDeleteProtocol = (id: string) => {
        if(confirm('Delete this mandatory mandate? This will reflect across all linked units.')) {
            setProtocols(prev => prev.filter(p => p.id !== id));
        }
    };

    const openReport = (audit: CrossDeptAudit) => {
        setSelectedAudit(audit);
        setModalMode('VIEW_REPORT');
    };

    const togglePeriodLock = (unitId: string, periodId: string) => {
      setUnits(prev => prev.map(u => {
          if (u.unitId !== unitId) return u;
          return {
              ...u,
              periods: u.periods.map(p => p.id === periodId ? { ...p, status: p.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' } : p)
          };
      }));
    };

    const handleTabChange = (unitId: string, protocolId: string) => {
        setActiveTabs(prev => ({ ...prev, [unitId]: protocolId }));
    };

    const handleInitiateCycleFromPillar = (unitId: string, pillar: MandatoryPillar) => {
        setActiveUnitId(unitId);
        setActiveTabs(prev => ({ ...prev, [unitId]: pillar.id }));
        setPeriodForm({
            ...periodForm,
            frequency: (pillar.frequency.split(' ')[0] as PeriodFrequency) || 'Monthly',
            startDate: new Date().toISOString().split('T')[0]
        });
        setModalMode('PERIOD');
    };

    const canManageGlobalMandates = ['super-admin', 'corporate', 'regional'].includes(currentScope);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            {/* Header / Action Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                <div className="flex items-center gap-5 z-10 w-full md:w-auto">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner border border-indigo-100 shrink-0">
                        <ClipboardList size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Audit Scheduler</h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Operational Oversight & Live Scores</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto justify-end">
                    {canManageGlobalMandates && (
                        <button 
                            onClick={() => setModalMode('MANAGE_PROTOCOLS')}
                            className="px-5 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                        >
                            <Gavel size={16} /> Manage Mandates
                        </button>
                    )}
                    <div className="relative group w-full sm:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input type="text" placeholder="Search units..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none uppercase tracking-wider" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Units List */}
            <div className="flex flex-col gap-6">
                {units.filter(u => u.unitName.toLowerCase().includes(searchTerm.toLowerCase())).map((unit) => {
                    const unitPillars = getUnitMandatoryPillars(unit);
                    const hasOverduePillar = unitPillars.some(p => p.status === 'Overdue');
                    
                    // Initialize tab to first mandate if not set
                    const activeTabId = activeTabs[unit.unitId] || (unitPillars.length > 0 ? unitPillars[0].id : null);
                    const activePillar = unitPillars.find(p => p.id === activeTabId);
                    const activePeriods = unit.periods.filter(p => p.protocolId === activeTabId);
                    
                    return (
                        <div key={unit.unitId} className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden ${unit.isExpanded ? 'border-indigo-500 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
                            <div className="p-6 md:p-8 flex items-center justify-between cursor-pointer" onClick={() => toggleUnitExpand(unit.unitId)}>
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-inner border ${hasOverduePillar ? 'bg-rose-50 text-rose-500 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        <Building2 size={32} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{unit.unitName}</h3>
                                            <div className="flex gap-1">
                                                {unitPillars.map((p, pidx) => (
                                                    <div key={p.id || pidx} title={`${p.label}: ${p.status}`} className={`w-2.5 h-2.5 rounded-full border border-white shadow-sm ${p.status === 'Compliant' ? 'bg-emerald-500' : p.status === 'Due Soon' ? 'bg-amber-500' : p.status === 'Overdue' ? 'bg-rose-500 animate-pulse' : 'bg-slate-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"><MapPin size={10} className="inline text-indigo-500 mr-1" /> {unit.region}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${unit.isExpanded ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300'}`}>
                                        {unit.isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>

                            {unit.isExpanded && (
                                <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-200 space-y-10">
                                    
                                    {/* MANDATORY COMPLIANCE PILLAR MATRIX */}
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <ShieldCheck size={14} className="text-indigo-600" /> Mandatory Compliance Pillars
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                {hasOverduePillar && (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[9px] font-black uppercase animate-pulse">
                                                        <AlertTriangle size={10} /> Critical Gap Detected
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        setActiveUnitId(unit.unitId);
                                                        setProtocolForm({ name: '', frequency: 'Monthly', level: 'UNIT', entityId: unit.unitId, effectiveDate: new Date().toISOString().split('T')[0] });
                                                        setModalMode('ADD_PROTOCOL');
                                                    }}
                                                    className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                                >
                                                    + Add Local Mandate
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                            {unitPillars.map((pillar, pidx) => (
                                                <div key={pillar.id || pidx} className={`bg-white p-5 rounded-3xl border-2 transition-all flex flex-col justify-between h-[185px] group hover:shadow-lg ${pillar.status === 'Overdue' ? 'border-rose-400 shadow-rose-50' : 'border-slate-100 shadow-sm'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2.5 rounded-xl border transition-all group-hover:scale-110 duration-300 ${getPillarColor(pillar.status)}`}>
                                                                <PillarIcon label={pillar.label} size={20} strokeWidth={2.5} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border w-fit ${pillar.level === 'CORPORATE' ? 'bg-indigo-600 text-white border-indigo-600' : pillar.level === 'REGIONAL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-900 text-white border-slate-900'}`}>
                                                                    {pillar.level}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border shadow-xs ${getPillarColor(pillar.status)}`}>
                                                            {pillar.status}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">{pillar.label}</h5>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Freq: {pillar.frequency}</p>
                                                        <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                                                            <CalendarClock size={10} className="text-indigo-500" />
                                                            <span className="text-[8px] font-black text-slate-500 uppercase">Effective: {pillar.effectiveDate}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-end">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">Last Conducted</span>
                                                            <span className={`text-[10px] font-black font-mono leading-none ${pillar.status === 'Overdue' ? 'text-rose-600' : 'text-slate-600'}`}>{pillar.lastDate}</span>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleInitiateCycleFromPillar(unit.unitId, pillar); }}
                                                            className={`p-2 rounded-lg transition-all ${pillar.status === 'Overdue' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                            title={`Schedule ${pillar.label} Cycle`}
                                                        >
                                                            {pillar.status === 'Overdue' ? <AlertCircle size={14} strokeWidth={3} /> : <CalendarRange size={14} strokeWidth={3} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* DYNAMIC AUDIT PERIODS WITH TABS GROUPED BY AUDIT TYPE */}
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <CalendarRange size={14} className="text-indigo-600" /> Operational Audit Cycles
                                            </h4>
                                            
                                            {/* Audit Type Tab Bar */}
                                            <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 shadow-inner w-full md:w-auto overflow-x-auto hide-scrollbar">
                                                {unitPillars.map(pillar => (
                                                    <button
                                                        key={pillar.id}
                                                        onClick={() => handleTabChange(unit.unitId, pillar.id)}
                                                        className={`
                                                            px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2
                                                            ${activeTabId === pillar.id 
                                                                ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
                                                                : 'text-slate-400 hover:text-slate-600'}
                                                        `}
                                                    >
                                                        <PillarIcon label={pillar.label} size={12} strokeWidth={3} />
                                                        {pillar.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            {activePeriods.length > 0 ? activePeriods.map((period) => (
                                                <div key={period.id} className="rounded-[2.5rem] border bg-white border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="p-6 flex flex-col md:flex-row items-center justify-between border-b border-slate-50 gap-4">
                                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                                            <div className={`p-4 rounded-2xl shadow-inner ${period.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                <Clock size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">{period.frequency} cycle Instance</h4>
                                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${period.status === 'PUBLISHED' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                                        {period.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                    Audit Window: {period.startDate} <span className="text-slate-300">→</span> {period.endDate}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                                            <button onClick={() => togglePeriodLock(unit.unitId, period.id)} className={`p-3 rounded-xl transition-all shadow-sm ${period.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`} title={period.status === 'PUBLISHED' ? 'Unlock to Edit' : 'Publish & Lock'}>
                                                                {period.status === 'PUBLISHED' ? <Lock size={18}/> : <Unlock size={18}/>}
                                                            </button>
                                                            <button 
                                                                onClick={() => { setActiveUnitId(unit.unitId); setActivePeriodId(period.id); setModalMode('AUDIT'); }} 
                                                                className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                                                            >
                                                                <Plus size={16} strokeWidth={3} /> Add Entry
                                                            </button>
                                                            <button 
                                                                onClick={() => togglePeriodExpand(unit.unitId, period.id)} 
                                                                className={`p-3 rounded-xl border transition-all ${period.isExpanded ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-white text-slate-400 border-slate-200'}`}
                                                            >
                                                                {period.isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {period.isExpanded && (
                                                        <div className="p-6 space-y-4 bg-slate-50/20">
                                                            {period.audits.length > 0 ? period.audits.map((audit) => (
                                                                <div key={audit.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between group relative overflow-hidden transition-all hover:border-indigo-300 hover:shadow-lg">
                                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${audit.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                                                    
                                                                    <div className="flex-1 min-w-0 w-full md:w-auto">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shadow-xs ${audit.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                                                {audit.status}
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                                                <Calendar size={12} className="text-indigo-400" />
                                                                                <span>{audit.startDate}</span>
                                                                            </div>
                                                                            {audit.isUnannounced && (
                                                                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-black uppercase flex items-center gap-1 animate-pulse">
                                                                                    <Zap size={10} fill="currentColor" /> Unannounced
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <h4 className="text-base font-black text-slate-800 uppercase tracking-tight leading-none mb-3 group-hover:text-indigo-600 transition-colors">{audit.checklist}</h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {audit.departments.map(d => (
                                                                                <span key={d} className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg border border-slate-200">{d}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-8 w-full md:w-auto mt-6 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
                                                                        {audit.status === 'Completed' ? (
                                                                            <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                                                                                <div className={`flex items-baseline gap-2 mb-3 ${audit.score && audit.score < 75 ? 'animate-bounce' : ''}`}>
                                                                                    <span className={`text-3xl font-black tracking-tighter ${audit.score && audit.score < 75 ? 'text-rose-500' : 'text-emerald-600'}`}>{audit.score}%</span>
                                                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Registry Sync</span>
                                                                                </div>
                                                                                <button 
                                                                                    onClick={() => openReport(audit)} 
                                                                                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all active:scale-95 group/btn ${audit.score && audit.score < 75 ? 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'}`}
                                                                                >
                                                                                    <Eye size={16} className="transition-transform group-hover/btn:scale-110" /> 
                                                                                    <span>Review Evidence</span>
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                                                                                <div className="flex -space-x-3 mb-1">
                                                                                    {audit.auditTeam.map((m, i) => (
                                                                                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-900 text-white text-[10px] font-black flex items-center justify-center uppercase shadow-md" title={m}>
                                                                                            {m.charAt(0)}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                     <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-indigo-100 transition-all"><PenTool size={18}/></button>
                                                                                     <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl border border-transparent hover:border-rose-100 transition-all"><Trash2 size={18}/></button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <div className="p-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                                        <History size={32} />
                                                                    </div>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active audits in this cycle</p>
                                                                    <button 
                                                                        onClick={() => { setActiveUnitId(unit.unitId); setActivePeriodId(period.id); setModalMode('AUDIT'); }}
                                                                        className="mt-4 text-indigo-600 font-bold uppercase text-[9px] hover:underline"
                                                                    >
                                                                        + Initialize First Entry
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )) : (
                                                <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 animate-in fade-in">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-slate-50/50">
                                                        <PillarIcon label={activePillar?.label || 'General'} size={40} className="text-slate-200" />
                                                    </div>
                                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">No {activePillar?.label} Records</h4>
                                                    <p className="text-slate-400 text-xs mt-2 font-medium uppercase tracking-widest max-w-sm leading-relaxed px-4">
                                                        The registry is currently empty for this audit type. Click the 'Schedule' button in the matrix above to initialize a new cycle.
                                                    </p>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            if (activePillar) {
                                                                handleInitiateCycleFromPillar(unit.unitId, activePillar as MandatoryPillar);
                                                            }
                                                        }} 
                                                        className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center gap-3"
                                                    >
                                                        <Plus size={18} strokeWidth={3} /> Initialize {activePillar?.label} Cycle
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {modalMode === 'PERIOD' && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase">Schedule Cycle</h3><button onClick={() => setModalMode(null)}><X size={24}/></button></div>
                        <div className="space-y-4 text-left">
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl mb-4">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Mandate</p>
                                <p className="text-sm font-black text-indigo-900 uppercase">
                                    {activeUnitId && activeTabs[activeUnitId] ? protocols.find(p => p.id === activeTabs[activeUnitId!])?.name : 'General'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Frequency</label>
                                <div className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                                    <span className="text-sm font-black text-slate-700 uppercase">{periodForm.frequency}</span>
                                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Fixed via Mandate Policy</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Start</label><input type="date" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold" value={periodForm.startDate} onChange={e => setPeriodForm({...periodForm, startDate: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">End</label><input type="date" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold" value={periodForm.endDate} onChange={e => setPeriodForm({...periodForm, endDate: e.target.value})} /></div></div>
                        </div>
                        <button onClick={handleAddPeriod} className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Create Cycle</button>
                    </div>
                </div>
            )}

            {modalMode === 'AUDIT' && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-lg animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase">Schedule Audit</h3><button onClick={() => setModalMode(null)}><X size={24}/></button></div>
                        <div className="space-y-4">
                            <MultiSelectDropdown options={DEPARTMENTS} selected={auditForm.departments} onChange={(val: string[]) => setAuditForm({...auditForm, departments: val})} placeholder="Target Departments" />
                            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Checklist Template</label><select className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold" value={auditForm.checklist} onChange={e => setAuditForm({...auditForm, checklist: e.target.value})}><option value="">Select...</option>{CHECKLISTS.map(c => <option key={c}>{c}</option>)}</select></div>
                            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Audit Start</label><input type="date" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold" value={auditForm.startDate} onChange={e => setAuditForm({...auditForm, startDate: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Audit End</label><input type="date" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold" value={auditForm.endDate} onChange={e => setAuditForm({...auditForm, endDate: e.target.value})} /></div></div>
                            <MultiSelectDropdown options={AVAILABLE_AUDITORS} selected={auditForm.auditTeam} onChange={(val: string[]) => setAuditForm({...auditForm, auditTeam: val})} placeholder="Select Audit Team" />
                        </div>
                        <button onClick={handleAddAudit} className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Commit Schedule</button>
                    </div>
                </div>
            )}

            {modalMode === 'MANAGE_PROTOCOLS' && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
                        <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <Settings className="text-indigo-400" size={24} />
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Mandate Configuration</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define Hierarchical Mandatory Audits</p>
                                </div>
                            </div>
                            <button onClick={() => setModalMode(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                            <div className="flex justify-between items-center mb-8">
                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Active System Mandates</h4>
                                <button 
                                    onClick={() => {
                                        setProtocolForm({ name: '', frequency: 'Monthly', level: 'CORPORATE', entityId: 'corp-acme', effectiveDate: new Date().toISOString().split('T')[0] }); // Default to corp for manager
                                        setModalMode('ADD_PROTOCOL');
                                    }}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} strokeWidth={3} /> Define New Mandate
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {protocols.map(p => (
                                    <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${p.level === 'CORPORATE' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : p.level === 'REGIONAL' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                                {p.level === 'CORPORATE' ? <Globe size={20}/> : p.level === 'REGIONAL' ? <MapPin size={20}/> : <Building2 size={20}/>}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-800 uppercase">{p.name}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border ${p.level === 'CORPORATE' ? 'bg-indigo-600 text-white border-indigo-600' : p.level === 'REGIONAL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-900 text-white border-slate-900'}`}>
                                                        {p.level}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cycle: {p.frequency}</p>
                                                    <div className="w-px h-3 bg-slate-200" />
                                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1"><CalendarClock size={10}/> Start: {p.effectiveDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteProtocol(p.id)} className="p-2.5 bg-slate-50 text-slate-300 hover:text-rose-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-8 border-t bg-white flex justify-end">
                            <button onClick={() => setModalMode(null)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Close Dashboard</button>
                        </div>
                    </div>
                </div>
            )}

            {modalMode === 'ADD_PROTOCOL' && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg border border-slate-200 animate-in zoom-in-95">
                         <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Define Mandate</h3>
                            <button onClick={() => setModalMode('MANAGE_PROTOCOLS')} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
                         </div>
                         <div className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Authority Level</label>
                                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                                    {(['CORPORATE', 'REGIONAL', 'UNIT'] as AuthorityLevel[]).map(lvl => (
                                        <button 
                                            key={lvl}
                                            onClick={() => setProtocolForm({...protocolForm, level: lvl, entityId: lvl === 'UNIT' ? activeUnitId || '' : ''})}
                                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${protocolForm.level === lvl ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apply To Source Identity (ID)</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-500 outline-none transition-all shadow-inner uppercase"
                                    placeholder={protocolForm.level === 'CORPORATE' ? "e.g. corp-acme (Optional for Corporate)" : "Enter Entity ID (Required)"}
                                    value={protocolForm.entityId}
                                    onChange={e => setProtocolForm({...protocolForm, entityId: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mandate Display Label</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-500 outline-none transition-all shadow-inner uppercase"
                                    placeholder="e.g. INTERNAL FSMS"
                                    value={protocolForm.name}
                                    onChange={e => setProtocolForm({...protocolForm, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enforced Frequency</label>
                                    <select 
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold uppercase focus:border-indigo-500 outline-none shadow-sm cursor-pointer"
                                        value={protocolForm.frequency}
                                        onChange={e => setProtocolForm({...protocolForm, frequency: e.target.value})}
                                    >
                                        {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Effective From Date</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold uppercase focus:border-indigo-500 outline-none shadow-sm cursor-pointer"
                                        value={protocolForm.effectiveDate}
                                        onChange={e => setProtocolForm({...protocolForm, effectiveDate: e.target.value})}
                                    />
                                </div>
                            </div>
                         </div>
                         <div className="flex gap-4 mt-10">
                            <button onClick={() => setModalMode('MANAGE_PROTOCOLS')} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all rounded-2xl hover:bg-slate-50">Cancel</button>
                            <button onClick={handleAddProtocol} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Publish Mandate</button>
                         </div>
                    </div>
                </div>
            )}

            {modalMode === 'VIEW_REPORT' && selectedAudit && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-slate-200">
                        <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg">
                            <div className="flex items-center gap-5">
                                <div className={`p-3 rounded-2xl shadow-lg ${selectedAudit.score && selectedAudit.score < 75 ? 'bg-rose-50 shadow-rose-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}><FileText size={28} /></div>
                                <div><h3 className="text-xl font-black uppercase tracking-tight">Audit Findings Matrix</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Record #{selectedAudit.id}</p></div>
                            </div>
                            <button onClick={() => setModalMode(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={32}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Final score</span>
                                    <span className={`text-4xl font-black ${selectedAudit.score && selectedAudit.score < 75 ? 'text-rose-500' : 'text-emerald-600'}`}>{selectedAudit.score}%</span>
                                    <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${selectedAudit.score && selectedAudit.score < 75 ? 'bg-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{selectedAudit.score && selectedAudit.score < 75 ? 'Grade D' : 'Grade A'}</span>
                                </div>
                                <div className="col-span-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Checklist</p><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedAudit.checklist}</p></div>
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Dates</p><p className="text-sm font-bold text-slate-700 uppercase">{selectedAudit.startDate} <span className="text-slate-300">to</span> {selectedAudit.endDate}</p></div>
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p><p className="text-sm font-black text-emerald-600 uppercase tracking-widest">{selectedAudit.status}</p></div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-1 flex items-center gap-2">
                                    <Target size={14} className="text-rose-500" /> Observation Registry
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-5">
                                         <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 font-black shrink-0">01</div>
                                         <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2"><span className="text-xs font-black text-slate-700 uppercase tracking-tight">Compliance Point: 8.2.4</span><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-100 rounded text-[8px] font-black uppercase tracking-widest">Compliant</span></div>
                                            <p className="text-xs text-slate-500 leading-relaxed italic">"All CCP targets verified. Digital logs synchronized without deviation."</p>
                                         </div>
                                    </div>
                                    {selectedAudit.score && selectedAudit.score < 75 && (
                                      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex gap-5 bg-rose-50/30">
                                         <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-100 flex items-center justify-center text-rose-500 font-black shrink-0">02</div>
                                         <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2"><span className="text-xs font-black text-rose-800 uppercase tracking-tight">Critical Violation: 8.5.2</span><span className="px-2 py-0.5 bg-rose-100 text-rose-700 border-rose-200 rounded text-[8px] font-black uppercase tracking-widest">Major NC</span></div>
                                            <p className="text-xs text-rose-600 leading-relaxed italic">"Failure to maintain temperature trail during peak load. Immediate corrective action required."</p>
                                         </div>
                                      </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg"><User size={16}/></div>
                                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lead Auditor Attestation</p><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedAudit.auditTeam.join(', ')}</p></div>
                                    </div>
                                    <div className="w-full h-24 bg-white rounded-3xl border border-slate-200 p-2 flex items-center justify-center shadow-inner overflow-hidden">
                                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAYCAYAAAA9O98vAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAbUlEQVR4nO3SQRGAQAwEwbV/Z6YCPvSABmRBDpCExL1mZp7OnNnu7p6ZeTpzZru7e2bm6cyZ7e7umZmnM2e2u7tnZp7OnNnu7v4Bq89Xv7O5v28AAAAASUVORK5CYII=" alt="sign" className="max-h-full object-contain mix-blend-multiply opacity-80" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><PenTool size={16}/></div>
                                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Management Acknowledgement</p><p className="text-sm font-black text-slate-800 uppercase tracking-tight">Verified by Unit HOD</p></div>
                                    </div>
                                    <div className="w-full h-24 bg-white rounded-3xl border border-slate-200 p-2 flex items-center justify-center shadow-inner overflow-hidden">
                                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAYCAYAAAA9O98vAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAbUlEQVR4nO3SQRGAQAwEwbV/Z6YCPvSABmRBDpCExL1mZp7OnNnu7p6ZeTpzZru7e2bm6cyZ7e7umZmnM2e2u7tnZp7OnNnu7v4Bq89Xv7O5v28AAAAASUVORK5CYII=" alt="sign" className="max-h-full object-contain mix-blend-multiply opacity-80" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-8 bg-slate-900 border-t border-white/5 flex flex-col md:flex-row justify-between items-center shrink-0 pb-safe gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/10 rounded-xl border border-white/10 shadow-inner"><Lock size={16} className="text-emerald-400" /></div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-relaxed max-w-xs">Document integrity secured via Registry Protocol. ISO 22000 Tamper-evident vault active.</p>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <button className="flex-1 md:flex-none px-12 py-4 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"><Download size={18} /> Download Registry Copy</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditSchedule;
