"use client";

import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Settings,
  Activity,
  History,
  Info,
  MapPin,
  Tag,
  Building,
  ArrowRight,
  ShieldCheck,
  Package,
  Calendar,
  LayoutGrid,
  PenTool,
  Save,
  Download,
  DollarSign,
  ShieldAlert,
  Hash,
  User
} from 'lucide-react';
import { Entity, HierarchyScope } from '../types';

interface MaintenanceEvent {
    id: string;
    date: string;
    action: string;
    technician: string;
    notes: string;
    cost: number;
}

interface AssetBreakdown {
    id: string;
    assetName: string;
    assetId: string;
    location: string;
    unit: string;
    status: 'Operational' | 'Breakdown' | 'Awaiting Verification' | 'Under Maintenance';
    lastFailureDate: string;
    cumulativeFailures: number;
    totalRepairCost: number;
    history: MaintenanceEvent[];
}

const MOCK_DATA: AssetBreakdown[] = [
    {
        id: 'ab-1',
        assetName: 'Walk-in Chiller 01',
        assetId: 'NYC-CH-001',
        location: 'Main Kitchen',
        unit: 'NYC Central Kitchen',
        status: 'Breakdown',
        lastFailureDate: '2025-05-18',
        cumulativeFailures: 4,
        totalRepairCost: 12500,
        history: [
            { id: 'ev-1', date: '2025-05-18', action: 'Failure Reported', technician: 'Admin', notes: 'Temperature spikes to 8°C. Compressor not engaged.', cost: 0 },
            { id: 'ev-2', date: '2025-05-19', action: 'Technician Assigned', technician: 'Robert Eng.', notes: 'Spares ordered: Cooling Relay.', cost: 4500 }
        ]
    },
    {
        id: 'ab-2',
        assetName: 'Combi Oven Pro-9',
        assetId: 'CO-NYC-442',
        location: 'Production Line 1',
        unit: 'NYC Central Kitchen',
        status: 'Operational',
        lastFailureDate: '2025-04-10',
        cumulativeFailures: 2,
        totalRepairCost: 8200,
        history: [
            { id: 'ev-3', date: '2025-04-10', action: 'Resolved', technician: 'Robert Eng.', notes: 'Door gasket replaced.', cost: 2200 },
            { id: 'ev-4', date: '2025-04-09', action: 'Reported', technician: 'Chef Mike', notes: 'Steam leak from front door.', cost: 0 }
        ]
    }
];

const SummaryCard = ({ label, value, color, icon: Icon }: any) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 flex-1 min-w-[240px]">
        <div className={`p-4 ${color} text-white rounded-2xl shadow-lg`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    </div>
);

const BreakdownHistory: React.FC<{ entities: Entity[], currentScope: HierarchyScope, userRootId?: string | null }> = ({ entities, currentScope, userRootId }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const filteredAssets = useMemo(() => {
        return MOCK_DATA.filter(a => 
            a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.assetId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const stats = useMemo(() => ({
        active: MOCK_DATA.filter(a => a.status !== 'Operational').length,
        reliability: Math.round(((MOCK_DATA.length - MOCK_DATA.filter(a => a.status === 'Breakdown').length) / MOCK_DATA.length) * 100),
        totalCost: MOCK_DATA.reduce((acc, curr) => acc + curr.totalRepairCost, 0)
    }), []);

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setExpandedIds(next);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-rose-600" />
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl shadow-inner border border-rose-100">
                        <Wrench size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Maintenance History</h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                           <ShieldAlert size={12} className="text-rose-500" /> Critical Asset Downtime Ledger
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Filter Asset Registry..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none focus:border-rose-400 focus:bg-white transition-all shadow-inner uppercase tracking-wider"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                        <Filter size={20} />
                    </button>
                    <button className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* KPI Banner */}
            <div className="flex overflow-x-auto gap-6 hide-scrollbar pb-2">
                <SummaryCard label="Active Repair Nodes" value={stats.active} color="bg-rose-500" icon={Activity} />
                <SummaryCard label="Node Health Index" value={`${stats.reliability}%`} color="bg-emerald-500" icon={ShieldCheck} />
                <SummaryCard label="Maintenance Capital" value={`₹${stats.totalCost.toLocaleString()}`} color="bg-amber-500" icon={DollarSign} />
                <SummaryCard label="MTTR Performance" value="1.4 Days" color="bg-indigo-600" icon={Clock} />
            </div>

            {/* Main Registry */}
            <div className="flex flex-col gap-6">
                {filteredAssets.map(asset => {
                    const isExpanded = expandedIds.has(asset.id);
                    const isActive = asset.status !== 'Operational';
                    
                    return (
                        <div key={asset.id} className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden ${isExpanded ? 'border-rose-500 shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm hover:border-indigo-400'}`}>
                            <div className="flex flex-col xl:flex-row items-stretch divide-y xl:divide-y-0 xl:divide-x divide-slate-100 min-h-[140px]">
                                
                                {/* Identity Block */}
                                <div className="p-8 xl:w-[25%] flex items-center gap-6 bg-white shrink-0 relative">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${isActive ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'}`} />
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${isActive ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Package size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2 truncate">{asset.assetName}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Hash size={10} className="text-rose-500" /> {asset.assetId}
                                        </p>
                                    </div>
                                </div>

                                {/* Status & Location */}
                                <div className="p-8 xl:w-[25%] flex flex-col justify-center bg-slate-50/20 shrink-0 gap-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Status</span>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider flex items-center gap-2 ${isActive ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                                            {asset.status}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                                            <MapPin size={12} className="text-indigo-500" /> {asset.location}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-5">{asset.unit}</p>
                                    </div>
                                </div>

                                {/* Historical Analytics */}
                                <div className="p-8 xl:w-[35%] flex flex-row items-center gap-10 bg-white shrink-0">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Failure Incidence</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-900 tracking-tighter">{asset.cumulativeFailures}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100" />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repair Investment</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{asset.totalRepairCost.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100" />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Outage</span>
                                        <p className="text-[11px] font-bold text-slate-600 uppercase">{asset.lastFailureDate}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-8 flex-1 flex flex-col justify-center items-center bg-slate-50/10">
                                     <button 
                                        onClick={() => toggleExpand(asset.id)}
                                        className={`w-full py-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isExpanded ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-slate-900 text-white hover:bg-black'}`}
                                     >
                                        {isExpanded ? 'Collapse Log' : 'Maintenance Logbook'} 
                                        <ArrowRight size={18} className={`transition-transform duration-500 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                                     </button>
                                </div>
                            </div>

                            {/* Expanded Detail View */}
                            {isExpanded && (
                                <div className="p-10 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><History size={16} /></div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Technical Event Timeline</h4>
                                    </div>
                                    <div className="relative pl-10 space-y-8 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                        {asset.history.map((event, eidx) => (
                                            <div key={eidx} className="relative group/event animate-in slide-in-from-left-2">
                                                <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow-sm z-10" />
                                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{event.action}</span>
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[9px] font-black uppercase border border-slate-200">{event.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex items-center gap-2">
                                                                <User size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">{event.technician}</span>
                                                            </div>
                                                            {event.cost > 0 && (
                                                                <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black">
                                                                    ₹{event.cost.toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500 leading-relaxed italic">"{event.notes}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredAssets.length === 0 && (
                    <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200 opacity-60">
                         <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity size={48} className="text-slate-200" />
                         </div>
                         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Node Search Empty</h3>
                         <p className="text-slate-400 text-xs mt-3 font-medium uppercase tracking-widest max-w-xs mx-auto">Adjust your hierarchy filter to locate specific equipment maintenance logs.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BreakdownHistory;