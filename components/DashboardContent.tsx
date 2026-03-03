
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { getStatsForScope, SCOPE_CONFIG, MOCK_ENTITIES, SUBSCRIPTION_HIERARCHY } from '../constants';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Gavel,
  Droplets,
  Award,
  Heart,
  FileText,
  LucideIcon,
  Lock,
  Search,
  Filter,
  X,
  Package,
  Activity,
  Zap,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Layers,
  CheckCircle2,
  Cpu,
  Globe,
  LayoutGrid,
  History,
  Terminal,
  MousePointer2,
  XCircle,
  SlidersHorizontal
} from 'lucide-react';
import { HierarchyScope, Entity, Category, NavItem, SubNavItem, SubscriptionType, IndustryType, Supplier, StockItem, MandatoryProtocol, DeptStockItem, DeptStockBatch, DeptStockTransaction, CookingRecordEntry, CoolingRecordEntry } from '../types';
import EntityCard from './EntityCard';
import EntityCardSkeleton from './EntityCardSkeleton';
import CorporateManagement from './CorporateManagement';
import LearningManagement from './LearningManagement';
import FollowUpDashboard from './FollowUpDashboard';
import ObservationRegistry from './ObservationRegistry';
import FollowUpAnalytics from './FollowUpAnalytics';
import ChecklistEditor from './ChecklistEditor';
import AuditSchedule from './AuditSchedule';
import AuditReports from './AuditReports';
import AuditorLaunchpad from './AuditorLaunchpad';
import SubscriptionManagement from './SubscriptionManagement';
import BrandManagement from './BrandManagement';
import RawMaterialList from './RawMaterialList';
import SupplierDetails from './SupplierDetails';
import StockRegister from './StockRegister';
import Stock2Register from './Stock2Register';
import DepartmentStock from './DepartmentStock';
import ReceivingRegister from './ReceivingRegister';
import YieldRegister from './YieldRegister';
import ThawingRecord from './ThawingRecord';
import CookingRecord from './CookingRecord';
import CoolingRecord from './CoolingRecord';
import ReheatingRecord from './ReheatingRecord';
import FoodHoldingRecord from './FoodHoldingRecord';
import SanitizationRecord from './SanitizationRecord';
import TraceabilityRegister from './TraceabilityRegister';
import FacilityManagement from './FacilityManagement';
import FoodTempRecord from './FoodTempRecord';
import DocumentSpecifications from './DocumentSpecifications';
import SopManagement from './SopManagement';
import FoodSafetyTeam from './FoodSafetyTeam';
import Nutrilator from './Nutrilator';
import RecipeCalculation from './RecipeCalculation';
import BreakdownHistory from './BreakdownHistory';
import DocumentCreator from './DocumentCreator';

const TREND_DATA = [
  { name: 'Mon', val: 82 },
  { name: 'Tue', val: 85 },
  { name: 'Wed', val: 84 },
  { name: 'Thu', val: 88 },
  { name: 'Fri', val: 92 },
  { name: 'Sat', val: 90 },
  { name: 'Sun', val: 94 },
];

interface DashboardContentProps {
  currentScope: HierarchyScope;
  selectedEntityId?: string | null;
  onEntityLevelChange?: (entityId: string | null) => void;
  activeTab?: string;
  activeSubTab?: string;
  entities?: Entity[];
  suppliers: Supplier[];
  protocols?: MandatoryProtocol[];
  setProtocols?: React.Dispatch<React.SetStateAction<MandatoryProtocol[]>>;
  onUpdateSupplier: (id: string, updates: Partial<Supplier>) => void;
  onAddSupplier: (newSupplier: Supplier) => void;
  onUpdateEntity?: (entity: Entity) => void;
  onAddEntity?: (entity: Entity) => void;
  userRootId?: string | null;
  licenseSchema: Category[];
  setLicenseSchema: React.Dispatch<React.SetStateAction<Category[]>>;
  navItems: NavItem[]; 
  onOpenPermissions?: (targetId?: string) => void;
  onUpdateNavConfig?: React.Dispatch<React.SetStateAction<NavItem[]>>;
  inventory?: StockItem[];
  setInventory?: React.Dispatch<React.SetStateAction<StockItem[]>>;
  inventory2?: StockItem[];
  setInventory2?: React.Dispatch<React.SetStateAction<StockItem[]>>;
  deptStock?: DeptStockItem[];
  setDeptStock?: React.Dispatch<React.SetStateAction<DeptStockItem[]>>;
  onIssueToDepartment?: (data: any) => void;
  onPullForThawing?: (deptItem: DeptStockItem, pullQty: number, signature: string, details: any[]) => void;
  thawingEntries?: any[];
  setThawingEntries?: React.Dispatch<React.SetStateAction<any[]>>;
  cookingEntries?: CookingRecordEntry[];
  setCookingEntries?: React.Dispatch<React.SetStateAction<CookingRecordEntry[]>>;
  onThawIssueToCooking?: (thawEntry: any, quantity: number, location: string) => void;
  coolingEntries?: CoolingRecordEntry[];
  setCoolingEntries?: React.Dispatch<React.SetStateAction<CoolingRecordEntry[]>>;
  onIssueToCooling?: (cookEntry: CookingRecordEntry, quantity: number) => void;
  reheatingEntries?: ReheatingEntry[];
  setReheatingEntries?: React.Dispatch<React.SetStateAction<ReheatingEntry[]>>;
  onCoolIssueToReheating?: (coolEntry: CoolingRecordEntry, quantity: number) => void;
}

const PILLAR_ICONS: Record<string, LucideIcon> = {
  legal: Gavel,
  hygiene: Droplets,
  competency: Award,
  culture: Heart,
  records: FileText,
};

const PILLAR_COLORS: Record<string, string> = {
  legal: 'text-blue-600 bg-blue-50 border-blue-100',
  hygiene: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  competency: 'text-purple-600 bg-purple-50 border-purple-100',
  culture: 'text-rose-600 bg-rose-50 border-rose-100',
  records: 'text-amber-600 bg-amber-50 border-amber-100',
};

const DashboardContent: React.FC<DashboardContentProps> = ({ 
  currentScope,
  selectedEntityId,
  onEntityLevelChange,
  activeTab = 'dashboard',
  activeSubTab = 'db-summary',
  entities = MOCK_ENTITIES,
  suppliers,
  protocols = [],
  setProtocols = () => {},
  onUpdateSupplier,
  onAddSupplier,
  onUpdateEntity,
  onAddEntity,
  userRootId,
  licenseSchema,
  setLicenseSchema,
  navItems,
  onOpenPermissions,
  onUpdateNavConfig,
  inventory = [],
  setInventory = () => {},
  inventory2 = [],
  setInventory2 = () => {},
  deptStock = [],
  setDeptStock = () => {},
  onIssueToDepartment,
  onPullForThawing,
  thawingEntries = [],
  setThawingEntries = () => {},
  cookingEntries = [],
  setCookingEntries = () => {},
  onThawIssueToCooking,
  coolingEntries = [],
  setCoolingEntries = () => {},
  onIssueToCooling
}) => {
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [localSearch, setLocalSearch] = useState('');

  const effectiveEntityId = selectedEntityId || userRootId;

  const checkEntityAccess = (item: NavItem | SubNavItem, entityId: string | null | undefined): boolean => {
    if (['super-admin', 'corporate', 'regional'].includes(currentScope)) return true;
    let currentEntity = entities.find(e => e.id === (entityId || userRootId));
    let effectivePlan: SubscriptionType = 'trial';
    let industry: IndustryType | undefined = currentEntity?.industryType;
    let isExpired = false;
    let ptr = currentEntity;
    while(ptr) {
        if (ptr.subscriptionType) {
            effectivePlan = ptr.subscriptionType;
            if (ptr.subscriptionEndDate) {
              const today = new Date();
              today.setHours(0,0,0,0);
              const end = new Date(ptr.subscriptionEndDate);
              if (end < today) isExpired = true;
            }
            break;
        }
        if (!industry && ptr.industryType) industry = ptr.industryType;
        ptr = entities.find(e => e.id === ptr?.parentId);
    }
    if (isExpired) effectivePlan = 'trial';
    const planAllowed = item.allowedSubscriptions ? item.allowedSubscriptions.includes(effectivePlan) : (item.requiredSubscription ? SUBSCRIPTION_HIERARCHY[effectivePlan] >= SUBSCRIPTION_HIERARCHY[item.requiredSubscription] : true);
    const industryAllowed = item.allowedIndustries && item.allowedIndustries.length > 0 ? !!(industry && item.allowedIndustries.includes(industry)) : true;
    if (entityId) {
        let p: string | undefined = entityId;
        while (p) {
            if (item.deniedEntityIds?.includes(p)) return false; 
            p = entities.find(e => e.id === p)?.parentId;
        }
    }
    return !!(planAllowed && industryAllowed) || !!(currentEntity && item.allowedEntityIds?.includes(currentEntity.id));
  };

  const isAccessAllowed = useMemo(() => {
    if (['super-admin', 'corporate', 'regional'].includes(currentScope)) return true;
    const navItemsList = navItems || [];
    const navItem = navItemsList.find(item => item.id === activeTab);
    if (!navItem || !checkEntityAccess(navItem, effectiveEntityId)) return false;
    if (activeSubTab && activeSubTab !== 'db-summary') {
      const subItem = navItem.subItems.find(sub => sub.id === activeSubTab);
      if (subItem && !checkEntityAccess(subItem, effectiveEntityId)) return false;
    }
    return true;
  }, [activeTab, activeSubTab, currentScope, navItems, effectiveEntityId, entities]);

  useEffect(() => {
    const timer = setTimeout(() => setIsTransitioning(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 600);
    return () => clearTimeout(timer);
  }, [selectedEntityId, activeTab, activeSubTab]);

  const activeEntity = useMemo(() => entities.find(e => e.id === selectedEntityId), [selectedEntityId, entities]);
  const rootContextEntity = useMemo(() => entities.find(e => e.id === userRootId), [userRootId, entities]);

  const visibleEntities = useMemo(() => {
    let base = [];
    if (selectedEntityId) base = entities.filter(e => e.parentId === selectedEntityId);
    else if (currentScope === 'super-admin') base = entities.filter(e => e.type === 'corporate');
    else if (userRootId) base = entities.filter(e => e.parentId === userRootId);
    
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      return base.filter(e => e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
    }
    return base;
  }, [currentScope, selectedEntityId, entities, userRootId, localSearch]);

  const stats = getStatsForScope(activeEntity?.type || currentScope, activeEntity?.industryType || rootContextEntity?.industryType);
  const displayTitle = activeEntity?.name || rootContextEntity?.name || SCOPE_CONFIG[currentScope].label;

  if (!isAccessAllowed) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-xl rounded-[4rem] border-2 border-dashed border-slate-200">
        <div className="bg-rose-50 p-12 rounded-[3rem] mb-8 animate-pulse border border-rose-100 shadow-2xl shadow-rose-200/50">
          <Lock className="w-16 h-16 text-rose-400" />
        </div>
        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">Access Protocol Violation</h3>
        <p className="text-sm font-bold text-slate-400 max-w-sm text-center uppercase tracking-widest leading-relaxed">
          The requested node terminal is restricted based on your current hierarchy path or subscription tier.
        </p>
        <button onClick={() => window.location.reload()} className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">Re-Authorize Session</button>
      </div>
    );
  }

  return (
    <main className={`w-full dashboard-gradient min-h-screen ${activeTab === 'corporate' ? 'p-4 md:p-6' : 'p-4 md:p-8 xl:p-12'} animate-in fade-in duration-1000`}>
      {activeTab === 'dashboard' ? (
        <div className="flex flex-col gap-12">
          
          {/* Dashboard Glass Hero Section */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-[4rem] border border-white shadow-[0_30px_100px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
            
            {/* Header / Search Strip */}
            <div className="px-12 pt-16 pb-12 border-b border-slate-100/50 flex flex-col xl:flex-row xl:items-end justify-between gap-10 relative">
              <div className="absolute top-0 left-0 w-3 h-full bg-indigo-600" />
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-50/5 rounded-full blur-[120px] pointer-events-none" />
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-3 text-indigo-600 mb-2">
                  <Cpu size={24} strokeWidth={3} className="animate-pulse" />
                  <span className="text-[12px] font-black uppercase tracking-[0.5em] leading-none">Operational Command Terminal</span>
                </div>
                <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                  {displayTitle} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Intelligence</span>
                </h2>
                <div className="flex items-center gap-6 pt-4">
                   <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                     <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" /> Cloud Sync Active
                   </div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.25em]">
                     Mapping <span className="text-slate-900">{visibleEntities.length} active nodes</span>
                   </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-10 w-full xl:w-auto">
                 <div className="relative group w-full md:w-[450px]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24} />
                    <input 
                      type="text" 
                      placeholder="Filter node registry..."
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      className="w-full pl-16 pr-8 py-6 bg-slate-100/50 border-2 border-transparent rounded-[2.5rem] text-sm font-black focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner uppercase tracking-wider placeholder:text-slate-300" 
                    />
                    {localSearch && (
                      <button onClick={() => setLocalSearch('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors">
                        <XCircle size={24} />
                      </button>
                    )}
                 </div>
                 <button className="p-6 bg-white border-2 border-slate-100 text-slate-400 rounded-[2rem] hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-md active:scale-95">
                    <SlidersHorizontal size={24} />
                 </button>
              </div>
            </div>

            {/* Visual KPI & Chart Section */}
            <div className="px-12 py-16 bg-slate-50/30 border-b border-slate-100/50">
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                  
                  {/* Performance Chart Card */}
                  <div className="xl:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                       <TrendingUp size={280} />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                          <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-200 group-hover:rotate-3 transition-transform">
                            <Activity size={32} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Compliance Momentum</h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-2 italic">Real-time aggregate performance distribution</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                           <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full uppercase mb-2 border border-emerald-100 shadow-sm">+4.2% Gain</span>
                           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Global Sync Status</span>
                        </div>
                    </div>
                    <div className="h-[350px] w-full mt-auto relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={TREND_DATA}>
                            <defs>
                              <linearGradient id="colorVal" x1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#94a3b8'}} dy={15} />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip 
                                contentStyle={{ borderRadius: '28px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.12)', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', padding: '16px' }}
                                cursor={{ stroke: '#4f46e5', strokeWidth: 3, strokeDasharray: '6 6' }}
                            />
                            <Area type="monotone" dataKey="val" stroke="#4f46e5" strokeWidth={6} fillOpacity={1} fill="url(#colorVal)" animationDuration={2500} />
                          </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Vertical Pillar Cards */}
                  <div className="xl:col-span-4 grid grid-cols-1 gap-6">
                    {stats.slice(0, 3).map((stat, i) => {
                      const Icon = PILLAR_ICONS[stat.pillar];
                      return (
                        <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all group flex items-center gap-8 cursor-pointer overflow-hidden relative">
                          <div className={`p-6 rounded-[2rem] border-2 transition-all group-hover:scale-110 shadow-xl group-hover:rotate-6 ${PILLAR_COLORS[stat.pillar]}`}>
                            <Icon size={36} strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.35em] mb-3 leading-none">{stat.title}</h3>
                            <div className="flex items-end justify-between mb-4">
                              <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</span>
                              {stat.change !== 0 && (
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black shadow-sm ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                                  {stat.trend === 'up' ? <ArrowUpRight size={16} strokeWidth={3} /> : <ArrowDownRight size={16} strokeWidth={3} />}
                                  {Math.abs(stat.change)}%
                                </div>
                              )}
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                               <div className={`h-full transition-all duration-2000 ease-out shadow-sm ${stat.trend === 'up' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: stat.value }} />
                            </div>
                          </div>
                          <div className="absolute -bottom-2 -right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white rounded-tl-2xl">
                             <MousePointer2 size={16} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>

            {/* Registry Node Grid */}
            <div className="px-12 py-20 relative">
              <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 px-4">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl ring-8 ring-slate-100">
                    <Layers size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Entity Registry</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 italic">Active organizational hierarchy distribution</p>
                  </div>
                </div>
                <div className="flex items-center bg-slate-100/80 p-2 rounded-[2.5rem] gap-2 border border-slate-200/50 shadow-inner backdrop-blur-md">
                   <button className="px-8 py-3 bg-white rounded-3xl shadow-xl text-[11px] font-black uppercase tracking-widest text-indigo-600 ring-1 ring-black/5">Grid View</button>
                   <button className="px-8 py-3 rounded-3xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors">List Explorer</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10">
                {isTransitioning ? (
                  Array.from({ length: 8 }).map((_, i) => <EntityCardSkeleton key={i} />)
                ) : visibleEntities.length > 0 ? (
                  visibleEntities.map((entity) => (
                    <EntityCard 
                      key={entity.id} 
                      entity={entity} 
                      onClick={() => onEntityLevelChange && onEntityLevelChange(entity.id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-48 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-[5rem] border-4 border-dashed border-slate-200/50 shadow-inner animate-in zoom-in-95">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-10 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.06)] scale-110 ring-1 ring-slate-100">
                        <Search size={64} strokeWidth={1} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Zero Node Matches</h3>
                    <p className="text-slate-400 text-sm mt-6 font-bold uppercase tracking-[0.3em] max-sm:leading-loose max-w-sm leading-loose opacity-70 px-4">Adjust your hierarchy filters or search parameters to locate specific enterprise nodes.</p>
                    <button onClick={() => setLocalSearch('')} className="mt-12 px-12 py-5 bg-slate-900 text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.25em] hover:bg-indigo-600 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95">Reset System Search</button>
                  </div>
                )}
              </div>
            </div>

            {/* System Health Footer */}
            <div className="p-12 bg-[#0f172a] text-white flex flex-col xl:flex-row justify-between items-center gap-10 border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="flex items-center gap-10 relative z-10">
                  <div className="p-5 bg-white/5 rounded-[2.5rem] border border-slate-100 shadow-inner group cursor-pointer hover:bg-white/10 transition-all">
                    <History size={36} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-lg font-black uppercase tracking-[0.4em] leading-none">System Integrity Protocol</h5>
                    <div className="flex flex-wrap items-center gap-6 mt-3">
                        <span className="flex items-center gap-2.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                           <Globe size={14} className="text-emerald-400" /> Global regions operational
                        </span>
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full hidden md:block" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Zap size={14} className="text-amber-400" /> Latency: 14ms
                        </span>
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full hidden md:block" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                           Last Sync: 12:42:04 PM
                        </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 relative z-10 w-full xl:w-auto">
                  <button className="flex-1 xl:flex-none px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 active:scale-95">
                    <Terminal size={18} /> Command Log
                  </button>
                  <button className="flex-1 xl:flex-none px-14 py-5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center justify-center gap-4">
                    Synchronize Fleet <CheckCircle2 size={22} strokeWidth={3} />
                  </button>
                </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'nutrilator' ? (
        <Nutrilator />
      ) : activeTab === 'recipe-calculation' ? (
        <RecipeCalculation />
      ) : activeTab === 'subscription-mgr' ? (
        <SubscriptionManagement currentScope={currentScope} entities={entities} onUpdateEntity={(e) => onUpdateEntity && onUpdateEntity(e)} navItems={navItems} onUpdateNavConfig={onUpdateNavConfig} />
      ) : activeTab === 'corporate' ? (
        <CorporateManagement entities={entities} onEntityClick={(id) => onEntityLevelChange && onEntityLevelChange(id)} onUpdateEntity={(e) => onUpdateEntity && onUpdateEntity(e)} onAddEntity={(e) => onAddEntity && onAddEntity(e)} currentScope={currentScope} activeSubTab={activeSubTab} userRootId={userRootId} licenseSchema={licenseSchema} setLicenseSchema={setLicenseSchema} onOpenPermissions={onOpenPermissions} navItems={navItems} onUpdateNavConfig={onUpdateNavConfig} employees={[]} setEmployees={() => {}} />
      ) : activeTab === 'learning' ? (
        <LearningManagement activeSubTab={activeSubTab || 'learning-overview'} currentScope={currentScope} userRootId={userRootId} entities={entities} />
      ) : activeTab === 'document' ? (
        activeSubTab === 'corp-sops' ? (
          <SopManagement entities={entities} onUpdateEntity={(e) => onUpdateEntity && onUpdateEntity(e)} currentScope={currentScope} userRootId={userRootId} />
        ) : activeSubTab === 'corp-food-safety-team' ? (
          <FoodSafetyTeam entities={entities} currentScope={currentScope} userRootId={userRootId} />
        ) : activeSubTab === 'ins-schedule' ? (
          <AuditSchedule 
            entities={entities} 
            currentScope={currentScope} 
            userRootId={effectiveEntityId}
            protocols={protocols}
            setProtocols={setProtocols}
          />
        ) : activeSubTab === 'ins-checklists' ? (
          <ChecklistEditor protocols={protocols} />
        ) : activeSubTab === 'ins-nc' ? (
          <div className="p-24 text-center text-slate-400 bg-white/70 backdrop-blur-2xl rounded-[4rem] border-2 border-dashed border-slate-200 animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><Activity size={40} className="opacity-30" /></div>
            <p className="text-2xl font-black uppercase tracking-[0.3em] text-slate-300">NC Tracker Terminal</p>
            <p className="text-xs mt-4 uppercase font-black tracking-[0.2em] text-slate-400 opacity-60">Non-compliance registry is under synchronization.</p>
          </div>
        ) : activeSubTab === 'ins-reports' ? (
          <AuditReports />
        ) : activeSubTab === 'fac-equipment' ? (
          <FacilityManagement activeSubTab={activeSubTab} />
        ) : activeSubTab === 'doc-creator' ? (
          <DocumentCreator entities={entities} currentScope={currentScope} userRootId={userRootId} />
        ) : (
          <DocumentSpecifications activeSubTab={activeSubTab || 'doc-specifications'} currentScope={currentScope} />
        )
      ) : activeTab === 'stock' && activeSubTab === 'ins-my-audits' ? (
        <AuditorLaunchpad currentScope={currentScope} userRootId={userRootId} entities={entities} />
      ) : activeTab === 'stock' && activeSubTab === 'ins-observations' ? (
        <ObservationRegistry currentScope={currentScope} userRootId={userRootId} entities={entities} />
      ) : activeTab === 'stock' && activeSubTab === 'rec-followup' ? (
        <FollowUpDashboard availableSops={activeEntity?.masterSops?.map(s => s.name) || []} availableDepartments={activeEntity?.masterDepartments || []} availableLocations={Object.values(activeEntity?.departmentLocations || {}).flat() || []} currentScope={currentScope} userRootId={userRootId} entities={entities} />
      ) : activeTab === 'stock' && activeSubTab === 'rec-breakdown-history' ? (
        <BreakdownHistory entities={entities} currentScope={currentScope} userRootId={userRootId} />
      ) : activeTab === 'stock' && activeSubTab === 'stock-register' ? (
        <StockRegister 
          inventory={inventory} 
          setInventory={setInventory} 
          onIssue={onIssueToDepartment} 
          currentEntity={activeEntity || rootContextEntity}
        />
      ) : activeTab === 'stock' && activeSubTab === 'stock-register2' ? (
        <Stock2Register 
          inventory={inventory2} 
          setInventory={setInventory2} 
          onIssue={onIssueToDepartment} 
          currentEntity={activeEntity || rootContextEntity}
        />
      ) : activeTab === 'stock' && activeSubTab === 'stock-dept' ? (
        <DepartmentStock 
            deptStock={deptStock} 
            setDeptStock={setDeptStock} 
            onPullForThawing={onPullForThawing}
        />
      ) : activeTab === 'stock' && activeSubTab === 'stock-brands' ? (
        <BrandManagement entities={entities} onUpdateEntity={(e) => onUpdateEntity && onUpdateEntity(e)} currentScope={currentScope} userRootId={userRootId} />
      ) : activeTab === 'stock' && activeSubTab === 'stock-raw' ? (
        <RawMaterialList suppliers={suppliers} entities={entities} onUpdateEntity={(e) => onUpdateEntity && onUpdateEntity(e)} userRootId={userRootId} currentScope={currentScope} />
      ) : activeTab === 'stock' && activeSubTab === 'stock-suppliers' ? (
        <SupplierDetails suppliers={suppliers} onUpdateSupplier={onUpdateSupplier} onAddSupplier={onAddSupplier} currentScope={currentScope} userRootId={userRootId} entities={entities} />
      ) : activeTab === 'stock' && activeSubTab === 'stock-receiving' ? (
        <ReceivingRegister rawMaterials={[]} suppliers={suppliers} />
      ) : activeTab === 'stock' && activeSubTab === 'stock-yield' ? (
        <YieldRegister />
      ) : activeTab === 'stock' && activeSubTab === 'stock-thawing' ? (
        <ThawingRecord entries={thawingEntries} setEntries={setThawingEntries} onIssueToCooking={onThawIssueToCooking} />
      ) : activeTab === 'stock' && activeSubTab === 'stock-cooking' ? (
        <CookingRecord entries={cookingEntries} setEntries={setCookingEntries} onIssueToCooling={onIssueToCooling} />
      ) : activeTab === 'stock' && activeSubTab === 'stock-cooling' ? (
        <CoolingRecord entries={coolingEntries} setEntries={setCoolingEntries} />
      ) : activeTab === 'stock' && activeSubTab === 'stock-reheating' ? (
        <ReheatingRecord />
      ) : activeTab === 'stock' && activeSubTab === 'stock-holding' ? (
        <FoodHoldingRecord />
      ) : activeTab === 'stock' && activeSubTab === 'stock-temp-record' ? (
        <FoodTempRecord />
      ) : activeTab === 'stock' && activeSubTab === 'stock-sanitization' ? (
        <SanitizationRecord />
      ) : activeTab === 'stock' && activeSubTab === 'stock-traceability' ? (
        <TraceabilityRegister />
      ) : activeTab === 'stock' && (activeSubTab === 'fac-cleaning' || activeSubTab === 'fac-maintenance' || activeSubTab === 'fac-calibration' || activeSubTab === 'fac-pest') ? (
        <FacilityManagement activeSubTab={activeSubTab} />
      ) : activeTab === 'stock' ? (
        <div className="p-24 text-center text-slate-400 bg-white/70 backdrop-blur-2xl rounded-[4rem] border-2 border-dashed border-slate-200 animate-in zoom-in-95 duration-700">
           <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><Package size={40} className="opacity-30" /></div>
          <p className="text-2xl font-black uppercase tracking-[0.3em] text-slate-300">Inventory Module Initializing</p>
          <p className="text-xs mt-4 uppercase font-black tracking-[0.2em] text-slate-400 opacity-60">Global supply chain nodes are being cached for your current scope.</p>
        </div>
      ) : (
        <div className="p-24 text-center text-slate-400 bg-white/70 backdrop-blur-2xl rounded-[4rem] border-2 border-dashed border-slate-200 animate-in zoom-in-95 duration-700">
           <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><FileText size={40} className="opacity-30" /></div>
          <p className="text-2xl font-black uppercase tracking-[0.3em] text-slate-300">Module Terminal Offline</p>
          <p className="text-xs mt-4 uppercase font-black tracking-[0.2em] text-slate-400 opacity-60">Interface component construction in progress for active node registry.</p>
        </div>
      )}
    </main>
  );
};

export default DashboardContent;
