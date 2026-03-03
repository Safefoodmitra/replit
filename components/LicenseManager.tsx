"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, RefreshCw, FileSpreadsheet, Settings, 
  Filter, ChevronDown, Hotel, Building, 
  CloudUpload, History, PlusCircle, MinusCircle, 
  Trash2, Download, X, Plus, ChevronRight, Save, Edit2, 
  CheckSquare, Square, ListFilter, Table2, FileBarChart, Layers, 
  RefreshCcw, CheckCircle2, Lock, ChevronUp, Power, Eye, AlertTriangle, FileCheck,
  Check
} from 'lucide-react';
import { Entity, HierarchyScope, Category, SubCategory } from '../types';

// --- Utility Functions ---
const clsx = (...args: any[]) => args.filter(Boolean).join(' ');

interface SubSubVariation {
  isApplicable: boolean;
  date: string | null;
  fileName: string | null;
  licenseNumber?: string | null;
}

interface Metric {
  subId: string;
  name: string;
  isApplicable: boolean;
  date?: string | null;
  fileName?: string | null;
  licenseNumber?: string | null;
  isComplex?: boolean;
  variations?: Record<string, SubSubVariation>;
  activeSubSubId?: string;
  staff?: { total: number; valid: number };
  contract?: { total: number; valid: number };
  trainee?: { total: number; valid: number };
  totalHandlers?: number;
  validCerts?: number;
}

interface FilterState {
  corp: string;
  region: string;
  unit: string; 
  status: string;
  topic: string;
  subtopic: string;
  selectedUnitIds: string[]; 
}

// --- Logic Helpers ---

const calculateShelfLife = (mfgStr: string, expStr: string) => {
    if (!mfgStr || !expStr) return { days: 0, percentage: 0 };
    const mfgDateUTC = new Date(mfgStr + 'T00:00:00Z');
    const expDateUTC = new Date(expStr + 'T00:00:00Z');
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    if (isNaN(mfgDateUTC.getTime()) || isNaN(expDateUTC.getTime()) || expDateUTC < mfgDateUTC) return { days: -1, percentage: 0 };
    
    const totalShelfLife = (expDateUTC.getTime() - mfgDateUTC.getTime()) / 864e5;
    if (totalShelfLife <= 0) return { days: 0, percentage: 0 };
    
    const remainingDays = Math.ceil((expDateUTC.getTime() - todayUTC.getTime()) / 864e5);
    const percentage = (remainingDays / totalShelfLife) * 100;
    
    return { days: remainingDays, percentage: Math.max(0, Math.min(100, percentage)) };
};

const isAncestor = (ancestorId: string | undefined | null, descendantId: string | undefined | null, allEntities: Entity[]) => {
    if (!ancestorId || !descendantId) return false;
    let curr = allEntities.find(e => e.id === descendantId);
    while (curr) {
        if (curr.parentId === ancestorId) return true;
        curr = allEntities.find(e => e.id === curr.parentId);
    }
    return false;
};

const canViewConfig = (item: { createdByScope: HierarchyScope, createdByEntityId?: string | null }, currentScope: HierarchyScope, userId: string | undefined | null, entities: Entity[]) => {
    if (item.createdByScope === 'super-admin') return true;
    const scopeOrder: Record<HierarchyScope, number> = { 'super-admin': 0, 'corporate': 1, 'regional': 2, 'unit': 3, 'department': 4, 'user': 5 };
    if (scopeOrder[item.createdByScope] > scopeOrder[currentScope]) return false;
    if (userId && item.createdByEntityId === userId) return true;
    if (userId && item.createdByEntityId && isAncestor(item.createdByEntityId, userId, entities)) return true;
    return false;
};

const canEditConfig = (item: { createdByScope: HierarchyScope, createdByEntityId?: string | null }, currentScope: HierarchyScope, userId: string | undefined | null) => {
    if (item.createdByScope !== currentScope) return false;
    if (item.createdByScope === 'super-admin') return true; 
    return item.createdByEntityId === userId;
};

const findAncestorByType = (u: Entity, type: string, allEntities: Entity[]): Entity | undefined => {
    if (!u.parentId) return undefined;
    const parent = allEntities.find(e => e.id === u.parentId);
    if (!parent) return undefined;
    if (parent.type === type) return parent;
    return findAncestorByType(parent, type, allEntities);
};

const getLicenseInfo = (unitId: string, subId: string, metricObj: any) => {
  if (!metricObj) return { num: 'N/A', expiry: '-', status: 'No Data', cls: 'bg-gray-400 text-white' };
  
  if (metricObj.isApplicable === false) return { num: 'N/A', expiry: '-', status: 'Inactive', cls: 'bg-slate-200 text-slate-500' };

  let data = metricObj;
  
  if (metricObj.isComplex && metricObj.variations) {
    const activeId = metricObj.activeSubSubId || Object.keys(metricObj.variations)[0];
    data = metricObj.variations[activeId];
    if (!data) return { num: 'N/A', expiry: '-', status: 'No Data', cls: 'bg-gray-400' };
    if (data.isApplicable === false) return { num: 'N/A', expiry: '-', status: 'Inactive', cls: 'bg-slate-200 text-slate-500' };
  }

  const licNumDisplay = data.licenseNumber || 'PENDING';

  if (data.fileName && !data.date) return { num: licNumDisplay, expiry: '-', status: 'Pending Date', cls: 'bg-gray-500 text-white' };
  const dateStr = data.date;
  if (!dateStr && !data.fileName) return { num: '-', expiry: '-', status: 'Not Uploaded', cls: 'bg-gray-400 text-white' };
  
  if (!dateStr) return { num: licNumDisplay, expiry: '-', status: 'Missing Date', cls: 'bg-amber-50 text-white' };

  const issue = new Date(dateStr);
  const expiry = new Date(issue); 
  expiry.setFullYear(issue.getFullYear() + 1);
  const now = new Date();
  const daysLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  let status = 'Active', cls = 'bg-green-600 text-white';
  if (daysLeft < 0) { status = 'Expired'; cls = 'bg-red-600 text-white'; }
  else if (daysLeft < 60) { status = 'Expiring'; cls = 'bg-yellow-400 text-gray-900'; }
  
  return { num: licNumDisplay, expiry: expiry.toISOString().split('T')[0], status, cls };
};

const getSpecialStatus = (type: string, data: any) => {
  if (type === 'cat_med') {
    if (!data) return 'ATTENTION';
    const s = data.staff || {valid:0, total:0}, c = data.contract || {valid:0, total:0}, t = data.trainee || {valid:0, total:0};
    if (s.valid >= s.total && c.valid >= c.total && t.valid >= t.total && s.total > 0) return 'COMPLIANCE';
    return 'ATTENTION';
  } else if (type === 'cat_fostac') {
    if (!data || !data.totalHandlers) return 'ATTENTION';
    const mandatory = Math.ceil((data.totalHandlers || 0) / 25);
    if ((data.validCerts || 0) >= mandatory) return 'COMPLIANCE';
    return 'ATTENTION';
  }
  return 'NA';
};

const getUnitComplianceStatus = (unit: Entity, schema: Category[]) => {
  if (unit.status !== 'active') return 'CLOSED';
  let unitStatus = 'COMPLIANCE';

  for (const cat of schema) {
    if (!cat.active) continue;
    
    if (cat.id === 'cat_med' || cat.id === 'cat_fostac') {
      if (getSpecialStatus(cat.id, unit.metrics?.[cat.id]) === 'ATTENTION') return 'ATTENTION';
    } else {
      const subs = cat.subs.filter(s => s.active);
      if (subs.length === 0) continue;
      const metrics = unit.metrics?.[cat.id] || [];
      
      let catHasAttention = false;
      let catHasPartial = false;

      subs.forEach(sub => {
        const m = metrics.find((x: Metric) => x.subId === sub.id) || { isApplicable: false };
        if (m.isApplicable) {
          if (m.isComplex && m.variations) {
            Object.values(m.variations).forEach((v: any) => {
               if(v.isApplicable) {
                 if(!v.fileName || !v.date) catHasAttention = true;
                 else {
                   const d = new Date(v.date);
                   const exp = new Date(d); exp.setFullYear(d.getFullYear() + 1);
                   const days = (exp.getTime() - new Date().getTime()) / 86400000;
                   if(days < 0) catHasAttention = true;
                   else if(days < 60) catHasPartial = true;
                 }
               }
            });
          } else {
            if (!m.fileName || !m.date) { catHasAttention = true; }
            else {
              const info = getLicenseInfo(unit.id, sub.id, m);
              if (info.status === 'Expired') catHasAttention = true;
              if (info.status === 'Expiring') catHasPartial = true;
            }
          }
        }
      });

      if (catHasAttention) return 'ATTENTION';
      if (catHasPartial) unitStatus = 'PARTIAL';
    }
  }
  return unitStatus;
};

const formatMedicalString = (data: any) => {
    const status = getSpecialStatus('cat_med', data);
    const s = data?.staff || {valid:0, total:0};
    const c = data?.contract || {valid:0, total:0};
    const t = data?.trainee || {valid:0, total:0};
    return `${status}\nStaff - Valid Report : ${s.valid}/ Total Person : ${s.total}\nContract Valid Report : ${c.valid}/ Total Person : ${c.total}\nTrainee-Valid Report : ${t.valid}/ Total Person : ${t.total}`;
};

const formatFostacString = (data: any) => {
    const status = getSpecialStatus('cat_fostac', data);
    const total = data?.totalHandlers || 0;
    const valid = data?.validCerts || 0;
    const mand = Math.ceil(total/25);
    return `${status}\nTotal Food Handlers: ${total}\nValid Certificate: ${valid}\nMand Certificate: ${mand}`;
};

const formatStandardString = (info: any) => {
    if (info.status === 'Not Uploaded' || info.status === 'No Data') return `Not Uploaded (-)`;
    const num = info.num !== 'N/A' ? info.num : '-';
    return `${info.status} (${num})`;
};

const ScopeBadge = ({ scope }: { scope: HierarchyScope }) => {
    const config = {
        'super-admin': { label: 'A', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
        'corporate': { label: 'C', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
        'regional': { label: 'R', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
        'unit': { label: 'U', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
        'department': { label: 'D', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
        'user': { label: 'U', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    };
    const style = config[scope] || config['corporate'];
    return (
        <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black border ${style.bg} ${style.text} ${style.border}`} title={`Added by ${scope}`}>
            {style.label}
        </span>
    );
};

// --- Sub-Components ---

const UnitCellContent = ({ unit, corpName, regName, status }: { unit: Entity, corpName: string, regName: string, status: string }) => {
  const isCompliant = status === 'COMPLIANCE';
  const isAttention = status === 'ATTENTION';
  
  return (
    <div className="flex gap-3">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
            <Hotel className="text-blue-600 w-6 h-6" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
            <h4 className="font-bold text-sm text-[#0056b3] truncate leading-tight mb-0.5">{unit.name}</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mb-1">
               <Building size={10} className="text-slate-400" /> 
               <span className="truncate max-w-[140px]">{corpName} | {regName.replace('Division', '').trim()}</span>
            </div>
            <div className="text-[10px] text-slate-400 mb-1.5 font-mono">ID: {unit.id.substring(0,8).toUpperCase()}</div>
            <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${unit.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {unit.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${isCompliant ? 'bg-green-600 text-white' : isAttention ? 'bg-red-600 text-white' : 'bg-amber-50 text-white'}`}>
                    {status}
                </span>
            </div>
        </div>
    </div>
  );
};

const StandardCell = ({ unit, sub, metric, onUpdate, onOpenRenew, onOpenUpload, onOpenHistory }: any) => {
    const isApplicable = metric?.isApplicable !== false;

    if (!isApplicable) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                <Power className="w-4 h-4 text-slate-300 mb-1" />
                <span className="text-[8px] font-black text-slate-400 uppercase">Not Required</span>
                <button onClick={() => onUpdate(undefined, { isApplicable: true })} className="mt-1 text-[8px] text-indigo-500 hover:underline font-bold uppercase">Enable</button>
            </div>
        );
    }

    const renderData = (subSubId?: string) => {
        const info = getLicenseInfo(unit.id, sub.id, subSubId ? { ...metric, activeSubSubId: subSubId } : metric);
        const name = subSubId ? sub.subSubs.find((ss: any) => ss.id === subSubId)?.name : sub.name;
        
        return (
            <div key={subSubId || 'main'} className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-xs hover:shadow-md transition-shadow mb-2 last:mb-0">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[100px]">{name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${info.cls}`}>{info.status}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                        <div className="text-[10px] font-black text-slate-800 truncate">{info.num}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase">Exp: {info.expiry}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                        {info.status === 'Not Uploaded' ? (
                            <button onClick={() => onOpenUpload(subSubId)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Upload"><Plus size={14}/></button>
                        ) : (
                            <button onClick={() => onOpenRenew(subSubId)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="Renew"><RefreshCw size={14}/></button>
                        )}
                        <button onClick={() => onOpenHistory(subSubId)} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-colors" title="History"><History size={14}/></button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            {sub.subSubs && sub.subSubs.length > 0 ? (
                sub.subSubs.map((ss: any) => renderData(ss.id))
            ) : renderData()}
        </div>
    );
};

const MedicalCell = ({ unit, metrics, onClick }: any) => {
    const status = getSpecialStatus('cat_med', metrics);
    const s = metrics?.staff || {valid:0, total:0};
    const c = metrics?.contract || {valid:0, total:0};
    const t = metrics?.trainee || {valid:0, total:0};

    const renderBar = (label: string, valid: number, total: number, color: string) => {
        const pct = total > 0 ? Math.min(100, (valid / total) * 100) : 0;
        return (
            <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                    <span className="text-slate-400">{label}</span>
                    <span className={valid >= total && total > 0 ? 'text-emerald-600' : 'text-slate-600'}>{valid}/{total}</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
            </div>
        );
    };

    return (
        <div onClick={onClick} className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer min-w-[180px]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Medical Certs</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${status === 'COMPLIANCE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-white'}`}>
                    {status === 'COMPLIANCE' ? 'Compliant' : 'Attention'}
                </span>
            </div>
            <div className="space-y-2.5">
                {renderBar('Staff', s.valid, s.total, 'bg-blue-500')}
                {renderBar('Contract', c.valid, c.total, 'bg-purple-500')}
                {renderBar('Trainee', t.valid, t.total, 'bg-indigo-500')}
            </div>
        </div>
    );
};

const FostacCell = ({ unit, metrics, onClick }: any) => {
    const status = getSpecialStatus('cat_fostac', metrics);
    const total = metrics?.totalHandlers || 0;
    const valid = metrics?.validCerts || 0;
    const mandatory = Math.ceil(total / 25);
    const pct = mandatory > 0 ? Math.min(100, (valid / mandatory) * 100) : 0;

    return (
        <div onClick={onClick} className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer min-w-[180px]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Fostac</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${status === 'COMPLIANCE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-white'}`}>
                    {status === 'COMPLIANCE' ? 'Compliant' : 'Attention'}
                </span>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase">
                    <span>Certificates</span>
                    <span className={valid >= mandatory && mandatory > 0 ? 'text-emerald-600' : 'text-slate-400'}>{valid} / {mandatory} Required</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${status === 'COMPLIANCE' ? 'bg-emerald-500' : 'bg-amber-500'} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[8px] font-bold text-slate-400 uppercase italic">Base: {total} Food Handlers</div>
            </div>
        </div>
    );
};

const SummaryCell = ({ unit, catId, subs, metrics }: any) => {
    const totals = { compliant: 0, attention: 0, pending: 0, na: 0 };
    
    subs.forEach((sub: any) => {
        const m = (metrics || []).find((x: Metric) => x.subId === sub.id) || { isApplicable: false };
        if (!m.isApplicable) { totals.na++; return; }
        
        const info = getLicenseInfo(unit.id, sub.id, m);
        if (info.status === 'Active') totals.compliant++;
        else if (info.status === 'Not Uploaded' || info.status === 'Expired') totals.attention++;
        else totals.pending++;
    });

    return (
        <div className="flex flex-col gap-2 min-w-[180px]">
            <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-emerald-50 px-2 py-1 rounded-lg flex justify-between items-center border border-emerald-100">
                    <span className="text-[8px] font-black text-emerald-600 uppercase">Valid</span>
                    <span className="text-[10px] font-black text-emerald-700">{totals.compliant}</span>
                </div>
                <div className="bg-rose-50 px-2 py-1 rounded-lg flex justify-between items-center border border-rose-100">
                    <span className="text-[8px] font-black text-rose-600 uppercase">Issue</span>
                    <span className="text-[10px] font-black text-rose-700">{totals.attention}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <span className="text-[8px] font-black text-slate-400 uppercase">{totals.pending} Pending Upload</span>
                <span className="text-[8px] font-black text-slate-400 uppercase">•</span>
                <span className="text-[8px] font-black text-slate-400 uppercase">{totals.na} N/A</span>
            </div>
        </div>
    );
};

const HierarchyFilter = ({ filters, setFilters, entities, onClose, currentScope, userRootId }: any) => {
    const availableCorps = useMemo(() => entities.filter((e: any) => e.type === 'corporate'), [entities]);
    const availableRegions = useMemo(() => entities.filter((e: any) => e.type === 'regional' && (!filters.corp || e.parentId === filters.corp)), [entities, filters.corp]);
    const availableUnits = useMemo(() => entities.filter((e: any) => e.type === 'unit' && (!filters.region || e.parentId === filters.region)), [entities, filters.region]);

    const toggleUnit = (id: string) => {
        const next = filters.selectedUnitIds.includes(id) 
            ? filters.selectedUnitIds.filter((u: string) => u !== id)
            : [...filters.selectedUnitIds, id];
        setFilters((prev: any) => ({ ...prev, selectedUnitIds: next }));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate</label>
                    <select className="w-full border p-2 rounded-lg text-xs font-bold bg-slate-50" value={filters.corp} onChange={e => setFilters((p: any) => ({ ...p, corp: e.target.value, region: '', selectedUnitIds: [] }))}>
                        <option value="">All Corporations</option>
                        {availableCorps.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</label>
                    <select className="w-full border p-2 rounded-lg text-xs font-bold bg-slate-50" value={filters.region} onChange={e => setFilters((p: any) => ({ ...p, region: e.target.value, selectedUnitIds: [] }))}>
                        <option value="">All Regions</option>
                        {availableRegions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Individual Units ({filters.selectedUnitIds.length})</label>
                    <button onClick={() => setFilters((p: any) => ({ ...p, selectedUnitIds: [] }))} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Clear Selection</button>
                </div>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2 grid grid-cols-2 gap-1 custom-scrollbar">
                    {availableUnits.map((u: any) => {
                        const isSel = filters.selectedUnitIds.includes(u.id);
                        return (
                            <button key={u.id} onClick={() => toggleUnit(u.id)} className={`text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${isSel ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-600 hover:border-indigo-300'}`}>
                                <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${isSel ? 'bg-white border-white' : 'border-slate-300'}`}>
                                    {isSel && <Check size={10} className="text-indigo-600" strokeWidth={4} />}
                                </div>
                                <span className="truncate">{u.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">Apply Hierarchy Map</button>
        </div>
    );
};

// --- Main Component ---

interface LicenseManagerProps {
  entities: Entity[];
  onUpdateEntity: (e: Entity) => void;
  currentScope: HierarchyScope;
  userRootId?: string | null;
  targetCorporateId?: string; 
  schema: Category[];
  setSchema: React.Dispatch<React.SetStateAction<Category[]>>;
}

const LicenseManager: React.FC<LicenseManagerProps> = ({ entities, onUpdateEntity, currentScope, userRootId, targetCorporateId, schema, setSchema }) => {
  const [filters, setFilters] = useState<FilterState>({ corp: '', region: '', unit: '', status: '', topic: '', subtopic: '', selectedUnitIds: [] });
  const [search, setSearch] = useState('');
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const rowsPerPage = 10;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAncestorName = (u: Entity, type: string) => {
    if (!u.parentId) return 'N/A';
    const parent = entities.find(e => e.id === u.parentId);
    if (!parent) return 'N/A';
    if (parent.type === type) return parent.name;
    return getAncestorName(parent, type);
  };

  const filteredUnits = useMemo(() => {
    return entities.filter(u => {
      if(u.type !== 'unit') return false;
      
      // Explicit Hierarchy Scope Filtering
      if (targetCorporateId) {
          const corp = findAncestorByType(u, 'corporate', entities);
          if (corp?.id !== targetCorporateId) return false;
      } else if (currentScope === 'corporate' && userRootId) {
          const corp = findAncestorByType(u, 'corporate', entities);
          if (corp?.id !== userRootId) return false;
      } else if (currentScope === 'regional' && userRootId) {
          if (u.parentId !== userRootId) return false;
      } else if (currentScope === 'unit' && userRootId) {
          if (u.id !== userRootId) return false;
      } else if (currentScope === 'department' && userRootId) {
          const dept = entities.find(e => e.id === userRootId);
          if (dept?.parentId !== u.id) return false;
      } else if (currentScope === 'user' && userRootId) {
           const user = entities.find(e => e.id === userRootId);
           const dept = user?.parentId ? entities.find(e => e.id === user.parentId) : null;
           if (dept?.parentId !== u.id) return false;
      }

      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Internal Hierarchy Filter (filters state)
      if (filters.selectedUnitIds.length > 0) {
        if (!filters.selectedUnitIds.includes(u.id)) return false;
      } else {
        if (filters.corp) {
            const corp = findAncestorByType(u, 'corporate', entities);
            if (corp?.id !== filters.corp) return false;
        }
        if (filters.region) {
            const reg = findAncestorByType(u, 'regional', entities);
            if (reg?.id !== filters.region) return false;
        }
      }

      if (filters.status) {
        const currentStatus = getUnitComplianceStatus(u, schema);
        if (currentStatus !== filters.status) return false;
      }
      return true;
    }).sort((a, b) => (Number(b.status === 'active') - Number(a.status === 'active')));
  }, [entities, search, filters, schema, currentScope, userRootId, targetCorporateId]);

  const pagedUnits = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUnits.slice(start, start + rowsPerPage);
  }, [filteredUnits, currentPage]);

  const totalPages = Math.ceil(filteredUnits.length / rowsPerPage);

  const toggleCol = (id: string) => {
    const newSet = new Set(expandedCols);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedCols(newSet);
  };

  const handleRefresh = () => {
    setFilters({ corp: '', region: '', unit: '', status: '', topic: '', subtopic: '', selectedUnitIds: [] });
    setSearch('');
    setCurrentPage(1);
  };

  const updateMetric = (unitId: string, catId: string, subId: string, newData: Partial<Metric>, subSubId?: string) => {
    const unit = entities.find(u => u.id === unitId);
    if(!unit) return;

    const newMetrics = { ...unit.metrics } || {};
    if (!newMetrics[catId]) newMetrics[catId] = [];

    // Special categories direct update
    if (catId === 'cat_med' || catId === 'cat_fostac') {
        newMetrics[catId] = { ...(newMetrics[catId] || {}), ...newData };
        onUpdateEntity({ ...unit, metrics: newMetrics });
        return;
    }

    let metricIndex = newMetrics[catId].findIndex((m: Metric) => m.subId === subId);
    
    if (metricIndex === -1) {
        const subDef = schema.find(c => c.id === catId)?.subs.find(s => s.id === subId);
        if(!subDef) return;
        
        const newM: Metric = { 
          subId, 
          name: subDef.name, 
          isApplicable: true,
          date: null,
          fileName: null 
        };

        if (subDef.subSubs) {
           newM.isComplex = true;
           newM.variations = {};
           newM.activeSubSubId = subSubId || subDef.subSubs[0].id;
           subDef.subSubs.forEach(ss => {
             if(newM.variations) newM.variations[ss.id] = { isApplicable: true, date: null, fileName: null };
           });
        }
        newMetrics[catId] = [...newMetrics[catId], newM];
        metricIndex = newMetrics[catId].length - 1;
    }

    const metric = { ...newMetrics[catId][metricIndex] };
    
    if (subSubId) {
        if (!metric.variations) {
             metric.variations = {};
             metric.isComplex = true;
        }
        
        if (!metric.variations[subSubId]) {
             metric.variations[subSubId] = { isApplicable: true, date: null, fileName: null };
        }
        
        metric.variations = {
          ...metric.variations,
          [subSubId]: { ...metric.variations[subSubId], ...newData }
        };
        
        if(newData.activeSubSubId) {
            metric.activeSubSubId = subSubId;
        }
    } else {
        Object.assign(metric, newData);
    }
    
    newMetrics[catId][metricIndex] = metric;
    onUpdateEntity({ ...unit, metrics: newMetrics });
  };

  const prepareCommonData = () => {
    if (filteredUnits.length === 0) {
      alert("No data available to export.");
      return null;
    }
    return filteredUnits;
  };

  const handleExportUnitDetail = () => {
    const units = prepareCommonData();
    if (!units) return;
    const exportData = units.map(unit => {
      const corpName = getAncestorName(unit, 'corporate');
      const regionName = getAncestorName(unit, 'regional');
      const complianceStatus = getUnitComplianceStatus(unit, schema);
      const row: Record<string, string | number> = { "Unit ID": unit.id, "Unit Name": unit.name, "Corporate": corpName, "Region": regionName, "Overall Status": complianceStatus };
      const med = unit.metrics?.['cat_med'];
      row["Medical Certificate"] = formatMedicalString(med);
      const fos = unit.metrics?.['cat_fostac'];
      row["Fostac"] = formatFostacString(fos);
      schema.forEach(cat => {
         if (!cat.active || cat.hiddenInConfig) return;
         cat.subs.forEach(sub => {
            const metric = (unit.metrics?.[cat.id] || []).find((x: Metric) => x.subId === sub.id);
            if (!metric || !metric.isApplicable) { row[`${cat.name} - ${sub.name}`] = "N/A"; } else {
               if (metric.isComplex && metric.variations) {
                  Object.entries(metric.variations).forEach(([varKey, varData]: [string, any]) => {
                     const ssInfo = getLicenseInfo(unit.id, sub.id, { ...metric, variations: undefined, ...varData, isComplex: false });
                     const ssName = sub.subSubs?.find(s => s.id === varKey)?.name || varKey;
                     row[`${cat.name} - ${sub.name} - ${ssName}`] = formatStandardString(ssInfo);
                  });
               } else {
                  const info = getLicenseInfo(unit.id, sub.id, metric);
                  row[`${cat.name} - ${sub.name}`] = formatStandardString(info);
               }
            }
         });
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unit Details");
    XLSX.writeFile(workbook, `Unit_Detail_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportMenuOpen(false);
  };

  const handleExportTopicSummary = () => {
    const units = prepareCommonData();
    if (!units) return;
    const summaryData = schema.map(cat => {
        if (!cat.active) return null;
        let totalUnits = 0; let compliantCount = 0; let attentionCount = 0; let naCount = 0;
        units.forEach(u => {
            if (u.status !== 'active') return;
            totalUnits++;
            let catStatus = 'COMPLIANCE';
            if (cat.id === 'cat_med' || cat.id === 'cat_fostac') { catStatus = getSpecialStatus(cat.id, u.metrics?.[cat.id]); } else {
                const metrics = u.metrics?.[cat.id] || [];
                const hasAttention = metrics.some((m:Metric) => {
                    if(!m.isApplicable) return false;
                    const info = getLicenseInfo(u.id, m.subId, m);
                    return info.status === 'Expired' || info.status === 'Not Uploaded';
                });
                if (hasAttention) catStatus = 'ATTENTION';
            }
            if (catStatus === 'COMPLIANCE') compliantCount++; else if (catStatus === 'ATTENTION') attentionCount++; else naCount++;
        });
        return { "Topic Name": cat.name, "Total Active Units": totalUnits, "Compliant": compliantCount, "Attention Required": attentionCount, "Compliance %": totalUnits > 0 ? `${Math.round((compliantCount / totalUnits) * 100)}%` : '0%' };
    }).filter(Boolean);
    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Topic Summary");
    XLSX.writeFile(workbook, `Topic_Summary_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportMenuOpen(false);
  };

  const handleExportTopicMultiSheet = () => {
    const units = prepareCommonData();
    if (!units) return;
    const workbook = XLSX.utils.book_new();
    schema.forEach(cat => {
        if (!cat.active) return;
        const sheetData = units.map(unit => {
            const row: Record<string, any> = { "Unit ID": unit.id, "Unit Name": unit.name, "Region": getAncestorName(unit, 'regional'), "Overall Status": unit.status === 'active' ? getUnitComplianceStatus(unit, schema) : 'CLOSED' };
            if (cat.id === 'cat_med') { const m = unit.metrics?.[cat.id]; row[cat.name] = formatMedicalString(m); } else if (cat.id === 'cat_fostac') { const m = unit.metrics?.[cat.id]; row[cat.name] = formatFostacString(m); } else {
                cat.subs.forEach(sub => {
                    const metric = (unit.metrics?.[cat.id] || []).find((x: Metric) => x.subId === sub.id);
                    if (!metric || !metric.isApplicable) { row[`${sub.name}`] = "N/A"; } else {
                        if (metric.isComplex && metric.variations) {
                            Object.entries(metric.variations).forEach(([varKey, varData]: [string, any]) => {
                               const ssInfo = getLicenseInfo(unit.id, sub.id, { ...metric, variations: undefined, ...varData, isComplex: false });
                               const ssName = sub.subSubs?.find(s => s.id === varKey)?.name || varKey;
                               row[`${sub.name} - ${ssName}`] = formatStandardString(ssInfo);
                            });
                        } else { const info = getLicenseInfo(unit.id, sub.id, metric); row[`${sub.name}`] = formatStandardString(info); }
                    }
                });
            }
            return row;
        });
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        const sheetName = cat.name.replace(/[\[\]\*\/\\\?]/g, '').substring(0, 31); 
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    XLSX.writeFile(workbook, `Topic_Wise_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportMenuOpen(false);
  };

  const getEditingItemData = () => {
    if (!editingItem) return {};
    const unit = entities.find(u => u.id === editingItem.unitId);
    const metricList = unit?.metrics?.[editingItem.catId] || [];
    const metric = metricList.find((m: any) => m.subId === editingItem.subId);
    
    let currentData = metric;
    if (editingItem.subSubId) {
        if (metric?.variations && metric.variations[editingItem.subSubId]) {
            currentData = metric.variations[editingItem.subSubId];
        } else if (metric && !metric.isComplex) {
            currentData = metric; 
        }
    }
    return currentData || {};
  };

  return (
    <div className="font-sans text-slate-800 space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          
          {/* Mobile Row 1: Action Buttons (Scrollable) */}
          <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 hide-scrollbar w-full md:w-auto">
            <button onClick={() => setActiveModal('schema')} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0">
              <Settings size={14} /> Config
            </button>
            
            <button onClick={() => setActiveModal('hierarchy')} className={clsx("flex items-center gap-2 border px-3 py-2 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0", filters.selectedUnitIds.length > 0 || filters.corp || filters.region ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
              <Filter size={14} /> Hierarchy Filter 
              {filters.selectedUnitIds.length > 0 && (
                  <span className="bg-blue-600 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full ml-1 shadow-sm">{filters.selectedUnitIds.length}</span>
              )}
            </button>

            <button onClick={() => setActiveModal('topic')} className={clsx("flex items-center gap-2 border px-3 py-2 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0", filters.topic ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
               <ListFilter size={14} /> Topics <span className={`w-2 h-2 rounded-full bg-blue-500 ${filters.topic ? 'block' : 'hidden'}`}></span>
            </button>
          </div>

          <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

          {/* Mobile Rows 2 & 3: Search and Actions */}
          <div className="flex flex-col md:flex-row items-center gap-3 flex-1 justify-end w-full md:w-auto">
            
            {/* Search Bar - Full width on mobile */}
            <div className="relative group w-full md:w-48 lg:w-64">
              <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Quick Unit Search..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status, Refresh, Export - Flex row on mobile */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select 
                className="flex-1 md:flex-none md:w-32 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold bg-white outline-none cursor-pointer hover:border-slate-300 transition-colors"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="PARTIAL">Partial</option>
                <option value="ATTENTION">Attention</option>
                <option value="CLOSED">Closed</option>
              </select>

              <button onClick={handleRefresh} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold transition shrink-0" title="Reset Filters">
                <RefreshCw size={14} />
              </button>

              <div className="relative shrink-0" ref={dropdownRef}>
                <button 
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0b5c30] text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition shadow-md active:translate-y-0.5"
                >
                  <FileSpreadsheet size={14} /> <span className="hidden sm:inline">Export</span> <ChevronDown size={12} className={clsx("transition-transform", exportMenuOpen && "rotate-180")} />
                </button>
                {exportMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 p-1">
                        <div className="py-1">
                            <button onClick={handleExportUnitDetail} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 group transition-colors">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded group-hover:bg-blue-100"><Table2 size={16}/></div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-700">Unit Detail Report</span>
                                    <span className="block text-[9px] font-medium text-slate-400">Full detailed list</span>
                                </div>
                            </button>
                            <button onClick={handleExportTopicSummary} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 group transition-colors border-t border-slate-50">
                                <div className="p-1.5 bg-purple-50 text-purple-600 rounded group-hover:bg-purple-100"><FileBarChart size={16}/></div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-700">Topic Summary Report</span>
                                    <span className="block text-[9px] font-medium text-slate-400">High-level stats</span>
                                </div>
                            </button>
                            <button onClick={handleExportTopicMultiSheet} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 group transition-colors border-t border-slate-50">
                                <div className="p-1.5 bg-orange-50 text-orange-600 rounded group-hover:bg-orange-100"><Layers size={16}/></div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-700">Topic-wise (Multi-Sheet)</span>
                                    <span className="block text-[9px] font-medium text-slate-400">One sheet per topic</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[60vh] custom-scrollbar">
        <div className="overflow-auto relative">
          <table className="w-full border-collapse">
            <thead className="bg-[#1e293b] text-white sticky top-0 z-20">
              <tr>
                <th rowSpan={2} className="sticky left-0 z-30 bg-[#1e293b] border-r border-slate-600 text-left p-2.5 w-[220px] min-w-[220px] text-xs font-black uppercase tracking-wider shadow-[4px_0_8px_rgba(0,0,0,0.15)]">Unit Details</th>
                {schema.map(cat => {
                   if(!cat.active) return null;
                   if(!canViewConfig(cat, currentScope, userRootId, entities)) return null;

                   if(filters.topic && cat.id !== filters.topic) return null;
                   const hasSubs = cat.subs.length > 0;
                   if(!hasSubs && !cat.hiddenInConfig) return null; 
                   const isExpanded = expandedCols.has(cat.id) || !!filters.topic || !!filters.subtopic;
                   const activeSubs = cat.subs.filter(s => s.active && (!filters.subtopic || s.id === filters.subtopic) && canViewConfig(s, currentScope, userRootId, entities));
                   if (cat.hiddenInConfig) return <th key={cat.id} rowSpan={2} className="border-r border-slate-600 p-3 whitespace-nowrap text-xs font-black uppercase tracking-wider min-w-[150px] text-center">{cat.name}</th>;
                   return (
                     <th key={cat.id} colSpan={isExpanded ? Math.max(1, activeSubs.length) : 1} onClick={() => toggleCol(cat.id)} className="cursor-pointer select-none bg-[#334155] hover:bg-[#475569] border-r border-slate-600 p-3 text-center whitespace-nowrap transition-colors text-xs font-black uppercase tracking-wider">
                       <div className="flex items-center justify-center gap-2">
                           <ScopeBadge scope={cat.createdByScope} />
                           {cat.name} {isExpanded ? <MinusCircle size={12}/> : <PlusCircle size={12}/>}
                       </div>
                     </th>
                   );
                })}
              </tr>
              <tr>
                 {schema.map(cat => {
                    if(!cat.active || cat.hiddenInConfig) return null;
                    if(!canViewConfig(cat, currentScope, userRootId, entities)) return null;

                    if(filters.topic && cat.id !== filters.topic) return null;
                    const isExpanded = expandedCols.has(cat.id) || !!filters.topic || !!filters.subtopic;
                    const activeSubs = cat.subs.filter(s => s.active && (!filters.subtopic || s.id === filters.subtopic) && canViewConfig(s, currentScope, userRootId, entities));
                    if(!isExpanded) return <th key={`${cat.id}-summ`} className="bg-[#f1f5f9] text-slate-600 border-r border-slate-300 p-2 text-[10px] font-bold uppercase min-w-[200px]">Summary</th>;
                    if(activeSubs.length === 0) return <th key={`${cat.id}-empty`} className="bg-[#1e293b] border-r border-slate-600 p-2 text-[10px] italic font-bold uppercase min-w-[160px] text-slate-400">No Sub-Topics</th>;
                    return activeSubs.map(sub => (
                        <th key={sub.id} className="bg-[#1e293b] border-r border-slate-600 p-2 text-[10px] font-bold uppercase min-w-[160px]">
                            <div className="flex items-center justify-center gap-1.5">
                                <ScopeBadge scope={sub.createdByScope} />
                                {sub.name}
                            </div>
                        </th>
                    ));
                 })}
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map(u => {
                const status = getUnitComplianceStatus(u, schema);
                const corpName = getAncestorName(u, 'corporate');
                const regName = getAncestorName(u, 'regional');

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-200 p-2.5 shadow-[2px_0_5px_rgba(0,0,0,0.05)] align-top group-hover:bg-slate-50/80">
                      <UnitCellContent unit={u} corpName={corpName} regName={regName} status={status} />
                    </td>
                    {schema.map(cat => {
                        if(!cat.active) return null;
                        if(!canViewConfig(cat, currentScope, userRootId, entities)) return null;

                        if(filters.topic && cat.id !== filters.topic) return null;
                        if(cat.id === 'cat_med') return <td key={cat.id} className="border-b border-r border-slate-200 p-2 align-top bg-white group-hover:bg-slate-50/50"><MedicalCell unit={u} metrics={u.metrics?.[cat.id]} onClick={() => { setEditingItem({unitId: u.id, catId: cat.id}); setActiveModal('special'); }} /></td>;
                        if(cat.id === 'cat_fostac') return <td key={cat.id} className="border-b border-r border-slate-200 p-2 align-top bg-white group-hover:bg-slate-50/50"><FostacCell unit={u} metrics={u.metrics?.[cat.id]} onClick={() => { setEditingItem({unitId: u.id, catId: cat.id}); setActiveModal('special'); }}/></td>;
                        
                        const activeSubs = cat.subs.filter(s => s.active && (!filters.subtopic || s.id === filters.subtopic) && canViewConfig(s, currentScope, userRootId, entities));
                        if(activeSubs.length === 0 && !cat.hiddenInConfig) return null;
                        const isExpanded = expandedCols.has(cat.id) || !!filters.topic || !!filters.subtopic;
                        
                        if (!isExpanded) {
                           return <td key={cat.id} className="border-b border-r border-slate-200 p-2 bg-[#f8fbff] align-top"><SummaryCell unit={u} catId={cat.id} subs={activeSubs} metrics={u.metrics?.[cat.id]} /></td>;
                        }
                        return activeSubs.map(sub => {
                           const m = (u.metrics?.[cat.id] || []).find((x: Metric) => x.subId === sub.id);
                           return (
                             <td key={sub.id} className="border-b border-r border-slate-200 p-2 align-top min-w-[200px] bg-white group-hover:bg-slate-50/50">
                               <StandardCell 
                                  unit={u} 
                                  sub={sub} 
                                  metric={m} 
                                  onUpdate={(subSubId: string, data: any) => updateMetric(u.id, cat.id, sub.id, data, subSubId)}
                                  onOpenRenew={(subSubId: string) => { setEditingItem({unitId: u.id, catId: cat.id, subId: sub.id, subSubId, mode: 'renew'}); setActiveModal('renew'); }}
                                  onOpenUpload={(subSubId: string) => { setEditingItem({unitId: u.id, catId: cat.id, subId: sub.id, subSubId, mode: 'upload'}); setActiveModal('renew'); }}
                                  onOpenHistory={(subSubId: string) => { setEditingItem({unitId: u.id, catId: cat.id, subId: sub.id, subSubId, mode: 'history'}); setActiveModal('history'); }}
                               />
                             </td>
                           );
                        });
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className={`bg-white rounded-2xl shadow-2xl w-full ${activeModal === 'history' || activeModal === 'hierarchy' ? 'max-w-4xl' : 'max-w-xl'} overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]`}>
               <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                       {activeModal === 'schema' ? 'License Configuration' : activeModal === 'renew' ? 'Update License' : activeModal === 'special' ? 'Update Counts' : activeModal === 'hierarchy' ? 'Hierarchy Filter' : activeModal === 'history' ? 'History' : 'Details'}
                   </h3>
                   <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={16} className="text-slate-400"/></button>
               </div>
               <div className="p-6 overflow-y-auto">
                   {activeModal === 'schema' && <SchemaEditor schema={schema} setSchema={setSchema} currentScope={currentScope} userId={userRootId} entities={entities} />}
                   {activeModal === 'hierarchy' && <HierarchyFilter filters={filters} setFilters={setFilters} entities={entities} onClose={() => setActiveModal(null)} currentScope={currentScope} userRootId={userRootId} />}
                   {activeModal === 'topic' && (
                       <div className="space-y-4">
                           <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Topic</label>
                           <select className="w-full border p-2 rounded-lg text-sm font-bold bg-slate-50" value={filters.topic} onChange={e=>setFilters(p=>({...p, topic: e.target.value, subtopic:''}))}>
                               <option value="">All Topics</option>
                               {schema.filter(c => canViewConfig(c, currentScope, userRootId, entities)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select></div>
                           <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Sub-Topic</label>
                           <select className="w-full border p-2 rounded-lg text-sm font-bold bg-slate-50" disabled={!filters.topic} value={filters.subtopic} onChange={e=>setFilters(p=>({...p, subtopic: e.target.value}))}>
                               <option value="">All Sub-Topics</option>
                               {schema.find(c=>c.id===filters.topic)?.subs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                           </select></div>
                       </div>
                   )}
                   {activeModal === 'renew' && (
                       <div className="space-y-4">
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-bold text-slate-600">Unit: {entities.find(u=>u.id===editingItem.unitId)?.name}</div>
                           <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">License Number</label><input type="text" id="renew-lic-num" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold" defaultValue={getEditingItemData()?.licenseNumber || ''} placeholder="Enter License Number" /></div>
                           <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New Expiry Date</label><input type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold" id="renew-date-input" defaultValue={getEditingItemData()?.date?.split('T')[0] || new Date().toISOString().split('T')[0]} /></div>
                           <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upload File</label><input type="file" id="renew-file-input" className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50" /></div>
                           <button onClick={() => {
                               const licNum = (document.getElementById('renew-lic-num') as HTMLInputElement).value;
                               const date = (document.getElementById('renew-date-input') as HTMLInputElement).value;
                               const fileInput = document.getElementById('renew-file-input') as HTMLInputElement;
                               const file = fileInput?.files?.[0];
                               const updates: any = { date: date || new Date().toISOString(), licenseNumber: licNum };
                               if(file) updates.fileName = file.name; else if(editingItem.mode === 'upload' && !file) updates.fileName = "manual-upload.pdf"; 
                               updateMetric(editingItem.unitId, editingItem.catId, editingItem.subId, updates, editingItem.subSubId);
                               setActiveModal(null);
                           }} className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase shadow-lg hover:bg-slate-800">Save Update</button>
                       </div>
                   )}
                   {activeModal === 'history' && (
                       <div className="overflow-hidden rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs font-bold">
                                <thead className="bg-[#1e293b] text-white uppercase tracking-wider text-[11px]"><tr><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Lic #</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">File</th><th className="px-4 py-3">Notes</th></tr></thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {(() => {
                                        const current = getEditingItemData();
                                        const expiryDate = current.date ? new Date(new Date(current.date).setFullYear(new Date(current.date).getFullYear() + 1)).toISOString().split('T')[0] : '-';
                                        return (
                                            <tr className="hover:bg-slate-50"><td className="px-4 py-3 text-slate-700">{new Date().toLocaleDateString()}</td><td className="px-4 py-3 text-slate-900 font-black">{current.licenseNumber || 'N/A'}</td><td className="px-4 py-3 text-slate-700">{expiryDate}</td><td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] uppercase">Active</span></td><td className="px-4 py-3 text-blue-600 underline cursor-pointer">{current.fileName || 'No File'}</td><td className="px-4 py-3 text-slate-500">Current Version</td></tr>
                                        );
                                    })()}
                                    <tr className="hover:bg-slate-50 opacity-60"><td className="px-4 py-3 text-slate-700">2023-01-15</td><td className="px-4 py-3 text-slate-900 font-black">LIC-OLD-001</td><td className="px-4 py-3 text-slate-700">2024-01-15</td><td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] uppercase">Expired</span></td><td className="px-4 py-3 text-blue-600 underline cursor-pointer">scan_2023.pdf</td><td className="px-4 py-3 text-slate-500">Previous Cycle</td></tr>
                                </tbody>
                            </table>
                       </div>
                   )}
                   {activeModal === 'special' && (
                       <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4"><input type="number" id="spec-v1" placeholder="Total / Handlers" className="border p-2 rounded-lg text-sm font-bold" /><input type="number" id="spec-v2" placeholder="Valid / Certs" className="border p-2 rounded-lg text-sm font-bold" /></div>
                           <button onClick={() => { const v1 = +(document.getElementById('spec-v1') as HTMLInputElement).value; const v2 = +(document.getElementById('spec-v2') as HTMLInputElement).value; if(editingItem.catId === 'cat_med') updateMetric(editingItem.unitId, editingItem.catId, '', { staff: { total: v1, valid: v2 }}); else updateMetric(editingItem.unitId, editingItem.catId, '', { totalHandlers: v1, validCerts: v2 }); setActiveModal(null); }} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase shadow-lg hover:bg-emerald-700">Update Records</button>
                       </div>
                   )}
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Components Implementation ---

function SchemaEditor({ schema, setSchema, currentScope, userId, entities }: { schema: Category[], setSchema: React.Dispatch<React.SetStateAction<Category[]>>, currentScope: HierarchyScope, userId: string | undefined | null, entities: Entity[] }) {
    const [newTopic, setNewTopic] = useState('');
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
    const [editState, setEditState] = useState<{ type: 'topic' | 'sub' | 'subsub', id: string, parentIds: string[], value: string } | null>(null);
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    const updateInput = (key: string, val: string) => { setInputValues(prev => ({ ...prev, [key]: val })); };
    const getInputValue = (key: string) => inputValues[key] || '';
    
    const addTopic = () => { 
        if(!newTopic.trim()) return; 
        const newTopicId = `cat-${Date.now()}`; 
        const newSubId = `sub-${Date.now()}`; 
        setSchema(prev => [...prev, { 
            id: newTopicId, 
            name: newTopic.trim(), 
            active: true, 
            createdByScope: currentScope,
            createdByEntityId: userId,
            subs: [{ 
                id: newSubId, 
                name: 'Overview', 
                active: true, 
                subSubs: [],
                createdByScope: currentScope,
                createdByEntityId: userId
            }] 
        }]); 
        setNewTopic(''); 
    };

    const addSubTopic = (catId: string, name: string) => { 
        if(!name.trim()) return; 
        const newId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`; 
        setSchema(prev => prev.map(cat => { 
            if (cat.id !== catId) return cat; 
            return { 
                ...cat, 
                subs: [...cat.subs, { 
                    id: newId, 
                    name: name.trim(), 
                    active: true, 
                    subSubs: [],
                    createdByScope: currentScope,
                    createdByEntityId: userId
                }] 
            }; 
        })); 
    };
    
    const addSubSubTopic = (catId: string, subId: string, name: string) => { 
        if(!name.trim()) return; 
        const newId = `ss-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`; 
        setSchema(prev => prev.map(cat => { 
            if (cat.id !== catId) return cat; 
            return { 
                ...cat, 
                subs: cat.subs.map(sub => { 
                    if (sub.id !== subId) return sub; 
                    return { ...sub, subSubs: [...(sub.subSubs || []), { id: newId, name: name.trim() }] }; 
                }) 
            }; 
        })); 
    };
    
    const handleAddSubTopic = (catId: string) => { const key = `sub-${catId}`; const val = getInputValue(key); if(!val || !val.trim()) return; addSubTopic(catId, val); updateInput(key, ''); };
    const handleAddSubSubTopic = (catId: string, subId: string) => { const key = `ss-${subId}`; const val = getInputValue(key); if(!val || !val.trim()) return; addSubSubTopic(catId, subId, val); updateInput(key, ''); };
    const deleteTopic = (catId: string) => { setSchema(prev => prev.filter(c => c.id !== catId)); };
    const deleteSubTopic = (catId: string, subId: string) => { setSchema(prev => prev.map(cat => { if (cat.id !== catId) return cat; return { ...cat, subs: cat.subs.filter(s => s.id !== subId) }; })); };
    const deleteSubSubTopic = (catId: string, subId: string, ssId: string) => { setSchema(prev => prev.map(cat => { if (cat.id !== catId) return cat; return { ...cat, subs: cat.subs.map(sub => { if (sub.id !== subId) return sub; return { ...sub, subSubs: (sub.subSubs || []).filter(ss => ss.id !== ssId) }; }) }; })); };
    const startEditing = (type: 'topic' | 'sub' | 'subsub', id: string, value: string, parentIds: string[] = []) => { setEditState({ type, id, value, parentIds }); };
    
    const saveEdit = () => { 
        if(!editState || !editState.value.trim()) return; 
        setSchema(prev => { 
            if(editState.type === 'topic') { return prev.map(c => c.id === editState.id ? { ...c, name: editState.value } : c); } 
            if(editState.type === 'sub') { const catId = editState.parentIds[0]; return prev.map(c => { if(c.id !== catId) return c; return { ...c, subs: c.subs.map(s => s.id === editState.id ? { ...s, name: editState.value } : s) }; }); } 
            if(editState.type === 'subsub') { const catId = editState.parentIds[0]; const subId = editState.parentIds[1]; return prev.map(c => { if(c.id !== catId) return c; return { ...c, subs: c.subs.map(s => { if(s.id !== subId) return s; return { ...s, subSubs: (s.subSubs || []).map(ss => ss.id === editState.id ? { ...ss, name: editState.value } : ss) }; }) }; }); } 
            return prev; 
        }); 
        setEditState(null); 
    };

    const visibleSchema = schema.filter(c => !c.hiddenInConfig && canViewConfig(c, currentScope, userId, entities));

    return (
        <div className="space-y-4">
            <div className="flex gap-2 mb-6">
                <input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="New Root Topic..." className="flex-1 border p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20" onKeyDown={e => e.key === 'Enter' && addTopic()}/>
                <button onClick={addTopic} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase shadow-lg">+ Add</button>
            </div>
            
            {visibleSchema.map((cat) => {
                const canEditCat = canEditConfig(cat, currentScope, userId);
                return (
                    <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => setExpandedTopic(expandedTopic === cat.id ? null : cat.id)}>
                            <div className="flex items-center gap-2 flex-1">
                                <ScopeBadge scope={cat.createdByScope} />
                                {editState?.id === cat.id ? (
                                    <input autoFocus value={editState.value} onChange={e => setEditState({...editState, value: e.target.value})} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="border px-1 py-0.5 rounded text-sm font-bold"/>
                                ) : (
                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{cat.name}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                {canEditCat && (
                                    <>
                                        <button onClick={() => startEditing('topic', cat.id, cat.name)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 size={14}/></button>
                                        <button onClick={() => deleteTopic(cat.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    </>
                                )}
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedTopic === cat.id ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        {expandedTopic === cat.id && (
                            <div className="p-4 space-y-3 bg-white">
                                {cat.subs.map(sub => {
                                    const canEditSub = canEditConfig(sub, currentScope, userId);
                                    return (
                                        <div key={sub.id} className="border-l-2 border-slate-100 pl-4 space-y-2">
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-2">
                                                    <ScopeBadge scope={sub.createdByScope} />
                                                    {editState?.id === sub.id ? (
                                                        <input autoFocus value={editState.value} onChange={e => setEditState({...editState, value: e.target.value})} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="border px-1 py-0.5 rounded text-xs font-bold"/>
                                                    ) : (
                                                        <span className="text-xs font-black text-slate-700 uppercase">{sub.name}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    {canEditSub && (
                                                        <>
                                                            <button onClick={() => startEditing('sub', sub.id, sub.name, [cat.id])} className="p-1 text-slate-300 hover:text-blue-500"><Edit2 size={12}/></button>
                                                            <button onClick={() => deleteSubTopic(cat.id, sub.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="pl-6 space-y-1.5">
                                                {(sub.subSubs || []).map(ss => (
                                                    <div key={ss.id} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg">
                                                        {editState?.id === ss.id ? (
                                                            <input autoFocus value={editState.value} onChange={e => setEditState({...editState, value: e.target.value})} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="border px-1 py-0.5 rounded text-[10px] font-bold"/>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{ss.name}</span>
                                                        )}
                                                        <div className="flex gap-1">
                                                            {canEditSub && (
                                                                <>
                                                                    <button onClick={() => startEditing('subsub', ss.id, ss.name, [cat.id, sub.id])} className="p-0.5 text-slate-300 hover:text-blue-500"><Edit2 size={10}/></button>
                                                                    <button onClick={() => deleteSubSubTopic(cat.id, sub.id, ss.id)} className="p-0.5 text-slate-300 hover:text-red-500"><Trash2 size={10}/></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {canEditSub && (
                                                    <div className="flex gap-2 pt-1">
                                                        <input value={getInputValue(`ss-${sub.id}`)} onChange={e => updateInput(`ss-${sub.id}`, e.target.value)} placeholder="New Variation..." className="flex-1 text-[10px] border border-dashed p-1 rounded bg-transparent" onKeyDown={e => e.key === 'Enter' && handleAddSubSubTopic(cat.id, sub.id)}/>
                                                        <button onClick={() => handleAddSubSubTopic(cat.id, sub.id)} className="text-blue-600 font-bold text-[10px] uppercase">Add</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {canEditCat && (
                                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                                        <input value={getInputValue(`sub-${cat.id}`)} onChange={e => updateInput(`sub-${cat.id}`, e.target.value)} placeholder="New Sub-Topic..." className="flex-1 text-xs border p-2 rounded-lg bg-slate-50" onKeyDown={e => e.key === 'Enter' && handleAddSubTopic(cat.id)}/>
                                        <button onClick={() => handleAddSubTopic(cat.id)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">Add Sub</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default LicenseManager;