"use client";

import React, { useEffect, useMemo } from 'react';
import { Entity, HierarchyScope, NavItem, SubNavItem, SubscriptionType, IndustryType } from '../types';
import { SUBSCRIPTION_HIERARCHY } from '../constants';
import { 
  ChevronRight, 
  LayoutDashboard, 
  Building2, 
  ShieldCheck, 
  Droplets, 
  Calculator, 
  ClipboardCheck, 
  FileText, 
  Users, 
  Truck, 
  Database,
  Map,
  Store,
  GraduationCap,
  CreditCard,
  Warehouse,
  FolderOpen
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="w-5 h-5" />,
  'subscription-mgr': <CreditCard className="w-5 h-5" />,
  corporate: <Building2 className="w-5 h-5" />,
  fssai: <ShieldCheck className="w-5 h-5" />,
  hygiene: <Droplets className="w-5 h-5" />,
  nutrilator: <Calculator className="w-5 h-5" />,
  template: <FileText className="w-5 h-5" />,
  people: <Users className="w-5 h-5" />,
  sqa: <Truck className="w-5 h-5" />,
  record: <Database className="w-5 h-5" />,
  learning: <GraduationCap className="w-5 h-5" />,
  document: <FolderOpen className="w-5 h-5" />,
};

interface SubHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
  selectedEntityId?: string | null;
  entities?: Entity[];
  currentScope: HierarchyScope;
  navItems?: NavItem[];
  userRootId?: string | null; 
}

const SubHeader: React.FC<SubHeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  activeSubTab, 
  setActiveSubTab,
  currentScope,
  navItems = [],
  userRootId,
  selectedEntityId,
  entities = []
}) => {
  
  // --- DEEP DIVE PERMISSION CHECKER ---
  const checkEntityAccess = (item: NavItem | SubNavItem, entityId: string | null | undefined): boolean => {
    if (['super-admin', 'corporate', 'regional'].includes(currentScope)) {
        return true;
    }

    let currentEntity: Entity | undefined;
    if (entityId) {
       currentEntity = entities.find(e => e.id === entityId);
    } else if (userRootId) {
       currentEntity = entities.find(e => e.id === userRootId);
    }

    let effectivePlan: SubscriptionType = 'trial';
    let resolvedIndustry: IndustryType | undefined = undefined;
    let isExpired = false;

    let ptr: Entity | undefined = currentEntity;

    while(ptr) {
            if (!resolvedIndustry && ptr.industryType) {
                resolvedIndustry = ptr.industryType;
            }

            if (ptr.subscriptionType) {
                effectivePlan = ptr.subscriptionType;
                if (ptr.subscriptionEndDate) {
                   const today = new Date();
                   today.setHours(0,0,0,0);
                   const end = new Date(ptr.subscriptionEndDate);
                   if (end < today) isExpired = true;
                }
            }
            ptr = entities.find(e => e.id === ptr?.parentId);
    }

    if (isExpired) {
        effectivePlan = 'trial';
    }

    let planAllowed = false;
    if (item.allowedSubscriptions !== undefined) {
        planAllowed = item.allowedSubscriptions.includes(effectivePlan);
    } else if (item.requiredSubscription) {
        planAllowed = (SUBSCRIPTION_HIERARCHY[effectivePlan] >= SUBSCRIPTION_HIERARCHY[item.requiredSubscription]);
    } else {
        planAllowed = true;
    }
    
    let industryAllowed = false;
    if (item.allowedIndustries !== undefined && item.allowedIndustries.length > 0) {
        industryAllowed = !!(resolvedIndustry && item.allowedIndustries.includes(resolvedIndustry));
    } else {
        industryAllowed = true;
    }

    const globalAllowed = planAllowed && industryAllowed;

    if (entityId) {
        let pointer: string | undefined = entityId;
        while (pointer) {
            if (item.deniedEntityIds?.includes(pointer)) return false; 
            const ent = entities.find(e => e.id === pointer);
            pointer = ent?.parentId;
        }
    }

    if (currentEntity && item.allowedEntityIds?.includes(currentEntity.id)) {
        return true; 
    }

    return !!globalAllowed;
  };

  const effectiveEntityId = selectedEntityId || userRootId;

  const visibleNavItems = useMemo(() => {
    return navItems.filter(item => checkEntityAccess(item, effectiveEntityId));
  }, [currentScope, navItems, effectiveEntityId, entities]);

  const activeNavItem = visibleNavItems.find(item => item.id === activeTab);

  const visibleSubItems = useMemo(() => {
    if (!activeNavItem) return [];
    return activeNavItem.subItems.filter(sub => checkEntityAccess(sub, effectiveEntityId));
  }, [activeNavItem, currentScope, effectiveEntityId, entities]);

  useEffect(() => {
    if (visibleNavItems.length > 0 && !visibleNavItems.find(i => i.id === activeTab)) {
      setActiveTab(visibleNavItems[0].id);
    }
  }, [visibleNavItems, activeTab, setActiveTab]);

  useEffect(() => {
    if (visibleSubItems.length > 0) {
      const isCurrentSubTabValid = visibleSubItems.some(s => s.id === activeSubTab);
      if (!isCurrentSubTabValid) {
        setActiveSubTab(visibleSubItems[0].id);
      }
    }
  }, [activeTab, visibleSubItems, activeSubTab, setActiveSubTab]);

  const getDynamicLabel = (item: NavItem) => {
    if (item.id === 'corporate') {
      if (currentScope === 'regional') return 'Regional Management';
      if (['unit', 'department', 'user'].includes(currentScope)) return 'Unit Management';
    }
    return item.label;
  };

  const getDynamicIcon = (itemId: string) => {
    if (itemId === 'corporate') {
      if (currentScope === 'regional') return <Map className="w-5 h-5" />;
      if (['unit', 'department', 'user'].includes(currentScope)) return <Store className="w-5 h-5" />;
    }
    return ICON_MAP[itemId] || <LayoutDashboard className="w-5 h-5" />;
  };

  return (
    <>
      <div className="hidden md:block sticky top-16 z-40 bg-white shadow-sm">
        <nav className="border-b border-gray-100 overflow-x-auto hide-scrollbar">
          <div className="flex items-center min-w-max px-4">
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  px-6 py-4 text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border-b-2
                  ${activeTab === item.id 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'text-slate-500 border-transparent hover:text-red-600 hover:bg-slate-50'}
                `}
              >
                {getDynamicLabel(item)}
              </button>
            ))}
          </div>
        </nav>

        {activeNavItem && visibleSubItems.length > 0 && (
          <nav className="bg-slate-50 border-b border-slate-200 overflow-x-auto hide-scrollbar">
            <div className="flex items-center min-w-max px-4 py-2.5 gap-2">
              <span className="flex text-[9px] font-black text-slate-400 uppercase tracking-widest items-center gap-1.5 mr-2">
                Section <ChevronRight className="w-2.5 h-2.5" />
              </span>
              {visibleSubItems.map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => setActiveSubTab(subItem.id)}
                  className={`
                    px-4 py-1.5 text-[10px] font-bold whitespace-nowrap transition-all rounded-full border
                    ${activeSubTab === subItem.id 
                      ? 'bg-red-500 text-white border-red-500 shadow-sm' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-900'}
                  `}
                >
                  {subItem.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>

      <div className="md:hidden sticky top-16 z-40 bg-white">
        {activeNavItem && visibleSubItems.length > 0 && (
          <nav className="bg-slate-50 border-b border-slate-200 overflow-x-auto hide-scrollbar">
            <div className="flex items-center min-w-max px-4 py-2.5 gap-2">
              {visibleSubItems.map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => setActiveSubTab(subItem.id)}
                  className={`
                    px-4 py-1.5 text-[10px] font-bold whitespace-nowrap transition-all rounded-full border
                    ${activeSubTab === subItem.id 
                      ? 'bg-red-500 text-white border-red-500 shadow-sm' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-900'}
                  `}
                >
                  {subItem.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between overflow-x-auto hide-scrollbar gap-1 py-1">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const label = getDynamicLabel(item);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex flex-col items-center justify-center min-w-[72px] px-2 py-2 gap-1 rounded-xl transition-all
                  ${isActive ? 'text-red-600 bg-red-50/50' : 'text-slate-400 active:bg-slate-100'}
                `}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {getDynamicIcon(item.id)}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-none ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default SubHeader;