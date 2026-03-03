
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  ShieldCheck, 
  LogOut, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Filter, 
  X, 
  Menu, 
  LockKeyhole, 
  User, 
  Settings, 
  Grid3X3,
  Check,
  Building2,
  Globe,
  LayoutGrid
} from 'lucide-react';
import { HierarchyScope, Entity } from '../types';
import { SCOPE_CONFIG } from '../constants';
import Logo from './Logo';

// --- Internal Reusable Searchable Dropdown Component ---

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  options: { id: string; name: string; type?: string }[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ 
  label, 
  placeholder, 
  options, 
  value, 
  onChange, 
  disabled,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      opt.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedName = useMemo(() => {
    return options.find(opt => opt.id === value)?.name || '';
  }, [options, value]);

  return (
    <div className={`space-y-2 w-full ${disabled ? 'opacity-40 grayscale pointer-events-none' : ''}`} ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all text-left
            ${isOpen ? 'bg-white border-indigo-500 ring-4 ring-indigo-50 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-slate-200 shadow-inner'}
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="text-slate-400">{icon}</div>}
            <span className={`text-xs font-bold truncate ${selectedName ? 'text-slate-800' : 'text-slate-300'}`}>
              {selectedName || placeholder}
            </span>
          </div>
          <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[320px]">
            <div className="p-3 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  autoFocus
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400 transition-all shadow-inner uppercase"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl transition-all mb-0.5 flex items-center justify-between group
                      ${value === opt.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}
                    `}
                  >
                    <span className="text-xs font-black uppercase tracking-tight truncate pr-4">{opt.name}</span>
                    {value === opt.id && <Check size={16} className="text-indigo-600 shrink-0" strokeWidth={3} />}
                  </button>
                ))
              ) : (
                <div className="p-10 text-center text-slate-300">
                  <Search size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No results found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Header Component ---

interface HeaderProps {
  currentScope: HierarchyScope;
  onScopeChange: (scope: HierarchyScope) => void;
  onLogout: () => void;
  onEntitySelect?: (entityId: string | null) => void;
  currentEntityId?: string | null;
  entities: Entity[];
  userRootId?: string | null;
  onOpenPermissionManager?: () => void; 
}

const Header: React.FC<HeaderProps> = ({ 
  currentScope, 
  onLogout,
  onEntitySelect,
  currentEntityId,
  entities,
  userRootId,
  onOpenPermissionManager
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHierarchyOpen, setIsHierarchyOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true); 
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Drilldown states for the Hierarchy Navigator
  const [selCorp, setSelCorp] = useState<string | null>(null);
  const [selReg, setSelReg] = useState<string | null>(null);
  const [selUnit, setSelUnit] = useState<string | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const findAncestorIdByType = (entityId: string | null | undefined, type: HierarchyScope, allEntities: Entity[]): string | undefined => {
     if (!entityId) return undefined;
     const entity = allEntities.find(e => e.id === entityId);
     if (!entity) return undefined;
     if (entity.type === type) return entity.id;
     return findAncestorIdByType(entity.parentId, type, allEntities);
  };

  const canSeeCorporate = ['super-admin', 'corporate'].includes(currentScope);
  const canSeeRegional = ['super-admin', 'corporate', 'regional'].includes(currentScope);

  const availableCorporates = useMemo(() => {
    if (currentScope === 'super-admin') return entities.filter(e => e.type === 'corporate');
    if (userRootId && canSeeCorporate) {
       const corpId = findAncestorIdByType(userRootId, 'corporate', entities);
       return entities.filter(e => e.id === corpId);
    }
    return [];
  }, [entities, currentScope, userRootId, canSeeCorporate]);

  const availableRegions = useMemo(() => {
    if (!canSeeRegional) return [];
    if (['super-admin', 'corporate'].includes(currentScope)) {
      if (!selCorp) return [];
      return entities.filter(e => e.type === 'regional' && e.parentId === selCorp);
    }
    if (currentScope === 'regional' && userRootId) {
      const rootRegId = findAncestorIdByType(userRootId, 'regional', entities);
      return entities.filter(e => e.id === rootRegId);
    }
    return [];
  }, [entities, selCorp, currentScope, userRootId, canSeeRegional]);

  const availableUnits = useMemo(() => {
    if (['super-admin', 'corporate', 'regional'].includes(currentScope)) {
      if (!selReg) return [];
      return entities.filter(e => e.type === 'unit' && e.parentId === selReg);
    }
    if (userRootId) {
       const rootUnitId = findAncestorIdByType(userRootId, 'unit', entities);
       return entities.filter(e => e.id === rootUnitId);
    }
    return [];
  }, [entities, selReg, currentScope, userRootId]);

  const handleEntitySelection = (entityId: string | null) => {
    if (entityId === null) {
        setSelCorp(null);
        setSelReg(null);
        setSelUnit(null);
    }
    if (onEntitySelect) onEntitySelect(entityId);
    setIsHierarchyOpen(false);
    setIsMobileDrawerOpen(false);
  };

  const currentEntityName = useMemo(() => {
    if (!currentEntityId) return userRootId ? (entities.find(e => e.id === userRootId)?.name) : 'All Entities';
    return entities.find(e => e.id === currentEntityId)?.name || 'Unknown';
  }, [currentEntityId, entities, userRootId]);

  const loggedInUserName = useMemo(() => {
    if (currentScope === 'super-admin') return 'Super Administrator';
    const entity = entities.find(e => e.id === userRootId);
    return entity?.name || SCOPE_CONFIG[currentScope].label;
  }, [currentScope, userRootId, entities]);

  const canViewHierarchy = ['super-admin', 'corporate', 'regional', 'unit'].includes(currentScope);

  const MobileDrawer = () => (
    <div className="fixed inset-0 z-[200] md:hidden">
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsMobileDrawerOpen(false)} 
      />
      <aside className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-black text-slate-900 text-lg tracking-tight uppercase">System Menu</span>
          </div>
          <button onClick={() => setIsMobileDrawerOpen(false)} className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-inner">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl">
                {(loggedInUserName.split(' ')[0][0] + (loggedInUserName.split(' ')[1]?.[0] || '')).substring(0,2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{loggedInUserName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{currentScope}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full py-3 bg-white border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 transition-all shadow-sm">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {canViewHierarchy && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center justify-between">
                <span>Registry Navigator</span>
                <button onClick={() => handleEntitySelection(null)} className="text-indigo-600">Reset</button>
              </h4>
              <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-5 space-y-5 shadow-inner">
                {canSeeCorporate && (
                  <SearchableDropdown 
                    label="Corporate Node"
                    placeholder="Select Corporate..."
                    options={availableCorporates}
                    value={selCorp}
                    onChange={(id) => { setSelCorp(id); setSelReg(null); setSelUnit(null); }}
                    icon={<Building2 size={16} />}
                  />
                )}
                {canSeeRegional && (
                  <SearchableDropdown 
                    label="Regional Hub"
                    placeholder="Select Region..."
                    options={availableRegions}
                    value={selReg}
                    disabled={!selCorp && canSeeCorporate}
                    onChange={(id) => { setSelReg(id); setSelUnit(null); }}
                    icon={<Globe size={16} />}
                  />
                )}
                <SearchableDropdown 
                  label="Operational Unit"
                  placeholder="Select Unit..."
                  options={availableUnits}
                  value={selUnit}
                  disabled={!selReg && canSeeRegional}
                  onChange={(id) => setSelUnit(id)}
                  icon={<LayoutGrid size={16} />}
                />
                <button 
                  onClick={() => handleEntitySelection(selUnit || selReg || selCorp)} 
                  className="w-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  return (
    <>
      {!isOnline && (
        <div className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.3em] py-2.5 px-6 flex items-center justify-center gap-3 animate-pulse sticky top-0 z-[110] shadow-lg">
          <AlertTriangle className="w-3.5 h-3.5" />
          System Offline — Local Registry Active
        </div>
      )}

      <header className={`bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-20 flex items-center sticky ${!isOnline ? 'top-[40px]' : 'top-0'} z-[100] transition-all duration-300 shadow-sm px-4 md:px-8`}>
        <div className="max-w-[1600px] w-full mx-auto flex items-center gap-6">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-4 pr-6 border-r border-slate-100 shrink-0">
            <div className="p-2 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/10 hover:scale-105 transition-transform duration-300">
              <Logo className="w-8 h-8 md:w-9 md:h-9" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-slate-900 font-black text-xl tracking-tighter leading-none">HACCP <span className="text-indigo-600">PRO</span></span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 opacity-80">Food Safety Intelligence</span>
            </div>
          </div>

          {/* Center Space - Search or Context */}
          <div className="hidden lg:flex flex-1 max-w-sm ml-4">
             <div className="relative group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Global registry search..." 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-bold focus:outline-none focus:bg-white focus:border-indigo-100 transition-all shadow-inner"
                />
             </div>
          </div>

          <div className="flex-1 lg:hidden"></div>

          {/* Navigation Cluster */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* System Connectivity */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 shadow-sm ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              <div className="relative">
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isOnline && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">{isOnline ? 'Core Online' : 'Sync Paused'}</span>
            </div>

            {/* Admin Controls */}
            {currentScope === 'super-admin' && onOpenPermissionManager && (
              <button 
                onClick={onOpenPermissionManager}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all active:scale-95 group"
                title="Global Access Management"
              >
                <LockKeyhole className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[11px] font-black uppercase tracking-tight">Security Center</span>
                </div>
              </button>
            )}

            {/* Hierarchy Navigator Pill */}
            {canViewHierarchy && (
              <div className="relative ml-2">
                <button 
                  onClick={() => setIsHierarchyOpen(!isHierarchyOpen)}
                  className={`
                    flex items-center gap-3 px-5 py-2.5 rounded-2xl shadow-lg transition-all duration-300 group
                    ${isHierarchyOpen ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-900 text-white hover:bg-slate-800'}
                  `}
                >
                  <Grid3X3 className={`w-4 h-4 transition-transform duration-500 ${isHierarchyOpen ? 'rotate-90' : ''}`} />
                  <div className="flex flex-col items-start leading-none pr-1">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${isHierarchyOpen ? 'text-indigo-200' : 'text-slate-400'}`}>Current Node</span>
                    <span className="text-xs font-bold max-w-[140px] truncate">{currentEntityName}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isHierarchyOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isHierarchyOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsHierarchyOpen(false)} />
                    <div className="absolute right-0 mt-3 w-[400px] bg-white border border-slate-200 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 p-8 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Filter size={18} /></div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Entity Selector</h4>
                        </div>
                        <button onClick={() => handleEntitySelection(null)} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Reset Path</button>
                      </div>
                      
                      <div className="space-y-6">
                        {canSeeCorporate && (
                          <SearchableDropdown 
                            label="Corporate Node"
                            placeholder="Select Corporate..."
                            options={availableCorporates}
                            value={selCorp}
                            onChange={(id) => { setSelCorp(id); setSelReg(null); setSelUnit(null); }}
                            icon={<Building2 size={16} />}
                          />
                        )}
                        {canSeeRegional && (
                          <SearchableDropdown 
                            label="Regional Hub"
                            placeholder="Select Region..."
                            options={availableRegions}
                            value={selReg}
                            disabled={!selCorp && canSeeCorporate}
                            onChange={(id) => { setSelReg(id); setSelUnit(null); }}
                            icon={<Globe size={16} />}
                          />
                        )}
                        <SearchableDropdown 
                          label="Operational Unit"
                          placeholder="Select Unit..."
                          options={availableUnits}
                          value={selUnit}
                          disabled={!selReg && canSeeRegional}
                          onChange={(id) => setSelUnit(id)}
                          icon={<LayoutGrid size={16} />}
                        />
                        <div className="pt-4 flex gap-3">
                          <button onClick={() => setIsHierarchyOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                          <button onClick={() => handleEntitySelection(selUnit || selReg || selCorp)} className="flex-[2] bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">Set Registry Path</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Profile Cluster */}
            <div className="flex items-center gap-2 pl-4 ml-4 border-l border-slate-100">
              
              {/* Notifications */}
              <button className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 relative group transition-all">
                <Bell className="w-5 h-5 group-hover:text-indigo-600 transition-colors" />
                <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white ring-4 ring-rose-500/10">3</span>
              </button>

              <div className="relative ml-1">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[1.15rem] flex items-center justify-center border-2 border-white shadow-lg relative group-hover:scale-105 transition-transform">
                    <span className="text-xs font-black text-white uppercase">{(loggedInUserName.split(' ')[0][0] + (loggedInUserName.split(' ')[1]?.[0] || '')).substring(0,2)}</span>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-100 mb-2">
                        <p className="text-sm font-black text-slate-900 truncate uppercase leading-none">{loggedInUserName}</p>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-2 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit">{currentScope}</p>
                      </div>
                      <div className="px-2 space-y-1">
                        <button className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3"><User className="w-4 h-4 opacity-50" /> Account Profile</button>
                        <button className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3"><Settings className="w-4 h-4 opacity-50" /> System Prefs</button>
                        <div className="h-px bg-slate-100 my-1 mx-4" />
                        <button onClick={onLogout} className="w-full text-left px-4 py-4 text-xs font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-3 uppercase tracking-widest"><LogOut className="w-4 h-4" /> Secure Sign Out</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Mobile Menu Trigger */}
          <button className="md:hidden ml-auto p-3 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all shadow-sm active:scale-95" onClick={() => setIsMobileDrawerOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {isMobileDrawerOpen && <MobileDrawer />}
    </>
  );
};

export default Header;
