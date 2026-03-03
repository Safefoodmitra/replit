"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Phone, 
  Mail, 
  User, 
  Clock, 
  ChevronRight,
  Edit2,
  Plus,
  Layout,
  LayoutTemplate,
  LayoutGrid,
  X,
  Trash2,
  Lock,
  Info,
  Users,
  Building2,
  Search,
  CheckCircle2,
  ArrowRight,
  History,
  Link2,
  MessageSquare,
  AlertTriangle,
  Settings2,
  KeyRound,
  MapPin,
  Briefcase,
  UserPlus,
  ChevronDown,
  MoreVertical,
  Check,
  Globe,
  CornerDownRight,
  ExternalLink,
  PlusCircle,
  XCircle
} from 'lucide-react';
import { NavItem, SubNavItem, EscalationLevel, EscalationContact, HierarchyScope, Entity } from '../types';

interface EscalationMatrixProps {
  navItems: NavItem[];
  onUpdateNavConfig?: React.Dispatch<React.SetStateAction<NavItem[]>>;
  currentScope: HierarchyScope;
  entities: Entity[]; 
  userRootId?: string | null;
  onUpdateEntity?: (entity: Entity) => void;
}

const DUMMY_DEPARTMENTS = ["Quality Assurance", "Logistics", "Security", "Procurement", "Administration"];
const DUMMY_LOCATIONS = ["Loading Bay A", "Cold Storage 2", "Front Reception", "Server Room", "Staff Canteen"];

const EscalationMatrix: React.FC<EscalationMatrixProps> = ({ 
  navItems = [], 
  onUpdateNavConfig,
  currentScope,
  entities = [],
  userRootId,
  onUpdateEntity
}) => {
  const [activeModuleId, setActiveModuleId] = useState<string>(navItems[0]?.id || '');
  const [activeSubModuleId, setActiveSubModuleId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'operational' | 'module'>('operational');
  
  // Security and State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPass, setVerificationPass] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Selector Modals
  const [activeAssignmentModal, setActiveAssignmentModal] = useState<{
      deptRow: string;
      level: number;
      type: 'group' | 'user';
      groupName?: string;
  } | null>(null);
  const [groupTypeTab, setGroupTypeTab] = useState<'location' | 'department'>('location');
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedUserIds, setTempSelectedUserIds] = useState<string[]>([]);

  const canEdit = ['super-admin', 'corporate', 'regional', 'unit'].includes(currentScope);

  const activeNavItem = useMemo(() => 
    navItems.find(item => item.id === activeModuleId),
  [navItems, activeModuleId]);

  const activeSubItem = useMemo(() => 
    activeNavItem?.subItems?.find(sub => sub.id === activeSubModuleId),
  [activeNavItem, activeSubModuleId]);

  // Find the exact entity we are managing (Unit/Region/Corp)
  const targetEntity = useMemo(() => {
    if (!userRootId) return entities.find(e => e.type === 'corporate');
    return entities.find(e => e.id === userRootId);
  }, [entities, userRootId]);

  // Group data context (to show selection options)
  const contextUnit = useMemo(() => {
    if (targetEntity?.type === 'unit') return targetEntity;
    return entities.find(e => e.type === 'unit');
  }, [targetEntity, entities]);

  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    let ptr = targetEntity;
    while(ptr) {
        if (ptr.masterDepartments) ptr.masterDepartments.forEach(d => depts.add(d));
        ptr = entities.find(e => e.id === ptr?.parentId);
    }
    if (depts.size === 0) return DUMMY_DEPARTMENTS;
    return Array.from(depts).sort();
  }, [targetEntity, entities]);

  const handleProtectedAction = (action: () => void) => {
    if (!canEdit) return;
    setPendingAction(() => action);
    setIsVerifying(true);
  };

  const confirmVerification = () => {
    if (verificationPass === '0000') {
      if (pendingAction) pendingAction();
      setIsVerifying(false);
      setVerificationPass('');
      setPendingAction(null);
    } else {
      alert('Invalid Access Key');
    }
  };

  const handleAddGroup = (deptRow: string, level: number, groupName: string) => {
    if (!onUpdateEntity || !targetEntity) return;

    const currentOverrides = targetEntity.escalationMatrixOverrides || {};
    const deptOverrides = currentOverrides[deptRow] || {};
    const levelOverrides = deptOverrides[level] || {};
    
    if (!levelOverrides[groupName]) {
        levelOverrides[groupName] = [];
    }

    onUpdateEntity({
        ...targetEntity,
        escalationMatrixOverrides: {
            ...currentOverrides,
            [deptRow]: {
                ...deptOverrides,
                [level]: levelOverrides
            }
        }
    });

    setActiveAssignmentModal(null);
    setSearchQuery("");
  };

  const handleRemoveGroup = (deptRow: string, level: number, groupName: string) => {
    if (!onUpdateEntity || !targetEntity) return;
    const currentOverrides = { ...targetEntity.escalationMatrixOverrides };
    if (currentOverrides[deptRow]?.[level]) {
        delete currentOverrides[deptRow][level][groupName];
        onUpdateEntity({ ...targetEntity, escalationMatrixOverrides: currentOverrides });
    }
  };

  const handleBatchEnrollUsers = () => {
    if (!onUpdateEntity || !targetEntity || !activeAssignmentModal || !activeAssignmentModal.groupName) return;

    const { deptRow, level, groupName } = activeAssignmentModal;
    const currentOverrides = targetEntity.escalationMatrixOverrides || {};
    const deptOverrides = currentOverrides[deptRow] || {};
    const levelOverrides = deptOverrides[level] || {};
    const groupUsers = levelOverrides[groupName] || [];

    const nextUsers = [...new Set([...groupUsers, ...tempSelectedUserIds])];

    onUpdateEntity({
        ...targetEntity,
        escalationMatrixOverrides: {
            ...currentOverrides,
            [deptRow]: {
                ...deptOverrides,
                [level]: {
                    ...levelOverrides,
                    [groupName]: nextUsers
                }
            }
        }
    });

    setActiveAssignmentModal(null);
    setTempSelectedUserIds([]);
    setSearchQuery("");
  };

  const handleRemoveUserFromGroup = (deptRow: string, level: number, groupName: string, userId: string) => {
    if (!onUpdateEntity || !targetEntity) return;
    const currentOverrides = { ...targetEntity.escalationMatrixOverrides };
    const groupUsers = currentOverrides[deptRow]?.[level]?.[groupName] || [];
    currentOverrides[deptRow][level][groupName] = groupUsers.filter(id => id !== userId);
    onUpdateEntity({ ...targetEntity, escalationMatrixOverrides: currentOverrides });
  };

  // Helper to determine if an entity is a descendant of another
  const isDescendantOf = (ancestorId: string, potentialDescendantId: string) => {
      let curr = entities.find(e => e.id === potentialDescendantId);
      while (curr) {
          if (curr.parentId === ancestorId) return true;
          curr = entities.find(e => e.id === curr.parentId);
      }
      return false;
  };

  // User list for modal - dynamic based on managed context
  const filteredUserOptions = useMemo(() => {
    if (!targetEntity) return [];
    
    return entities
      .filter(e => e.type === 'user')
      .filter(u => {
        // Pool logic: users must be descendants of the target being managed
        // Super admin sees all, others see their subtree
        if (currentScope !== 'super-admin' && targetEntity) {
            const isRelated = u.id === targetEntity.id || u.parentId === targetEntity.id || isDescendantOf(targetEntity.id, u.id);
            if (!isRelated) return false;
        }

        const query = searchQuery.toLowerCase();
        return u.name.toLowerCase().includes(query) || u.entityIdNum?.toLowerCase().includes(query);
      });
  }, [entities, searchQuery, targetEntity, currentScope]);

  // Fix for Error: Type '{ key: number; dept: any; level: number; }' is not assignable to type '{ dept: string; level: number; }'.
  // Explicitly typing MatrixCell as React.FC to allow the key prop from the map call.
  const MatrixCell: React.FC<{ dept: string, level: number }> = ({ dept, level }) => {
    const isGranular = level <= 2;
    
    const cellGroups = useMemo(() => {
        const overrides = targetEntity?.escalationMatrixOverrides || {};
        const groupMap = overrides[dept]?.[level] || {};
        return Object.entries(groupMap).map(([name, users]) => ({
            name,
            users
        }));
    }, [targetEntity, dept, level]);

    return (
      <td className="p-4 border-r border-slate-100 align-top">
        {isGranular ? (
          <div className="flex flex-col gap-3 min-h-[120px]">
            {cellGroups.map((group, gIdx) => (
              <div key={gIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow group/group">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={12} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-700">{group.name}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveGroup(dept, level, group.name)}
                    className="opacity-0 group-hover/group:opacity-100 transition-opacity"
                  >
                    <Trash2 size={10} className="text-slate-300 hover:text-red-500" />
                  </button>
                </div>
                
                <div className="space-y-1.5 mb-2">
                  {group.users.map(uId => {
                    const user = entities.find(e => e.id === uId);
                    if (!user) return null;
                    return (
                      <div key={uId} className="bg-white border border-slate-100 rounded-xl p-2 flex items-center gap-3 relative group/user">
                        <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">
                            {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-800 truncate leading-none uppercase">{user.name}</p>
                          <p className="text-[8px] text-slate-400 truncate mt-0.5 uppercase tracking-tighter">{user.type} node</p>
                        </div>
                        <button 
                            onClick={() => handleRemoveUserFromGroup(dept, level, group.name, uId)}
                            className="opacity-0 group-hover/user:opacity-100 absolute -right-1 -top-1 bg-white shadow-sm border border-red-100 rounded-full p-0.5 text-red-500"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => {
                    setTempSelectedUserIds([]);
                    setSearchQuery("");
                    setActiveAssignmentModal({ deptRow: dept, level, type: 'user', groupName: group.name });
                  }}
                  className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-[8px] font-black uppercase text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-1"
                >
                  <UserPlus size={10} /> Add Node
                </button>
              </div>
            ))}

            <button 
              onClick={() => setActiveAssignmentModal({ deptRow: dept, level, type: 'group' })}
              className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-300 hover:border-indigo-200 hover:text-indigo-400 hover:bg-indigo-50/50 transition-all"
            >
              <Plus size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Add Group</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-slate-50 bg-slate-50 opacity-60">
             <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-6">
                <Globe size={24} strokeWidth={1.5} />
                <span className="text-[9px] font-black uppercase tracking-tighter">HQ Inherited</span>
             </div>
          </div>
        )}
      </td>
    );
  };

  const getHierarchyChain = (user: Entity) => {
    const parent = entities.find(e => e.id === user.parentId);
    if (!parent) return 'Global Base';
    const grandParent = entities.find(e => e.id === parent.parentId);
    return `${grandParent?.name || ''} • ${parent.name}`.replace(/^ • /, '');
  };

  const getCorporateName = (user: Entity) => {
      let curr: Entity | undefined = user;
      while (curr) {
          if (curr.type === 'corporate') return curr.name;
          curr = entities.find(e => e.id === curr?.parentId);
      }
      return 'GLOBAL CORE';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Selector Modal */}
      {activeAssignmentModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 ${activeAssignmentModal.type === 'user' ? 'w-full max-w-xl h-[85vh]' : 'w-full max-w-lg'}`}>
            
            {/* Modal Header */}
            <div className={`px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0 ${activeAssignmentModal.type === 'user' ? 'bg-[#4f46e5] text-white' : 'bg-slate-50'}`}>
               <div className="flex items-center gap-3">
                  {activeAssignmentModal.type === 'user' ? <UserPlus size={20} /> : <PlusCircle size={20} />}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      {activeAssignmentModal.type === 'group' ? 'Select Resource Group' : 'Enroll User to Escalation Node'}
                    </h3>
                  </div>
               </div>
               <button onClick={() => { setActiveAssignmentModal(null); setSearchQuery(""); }} className="p-1.5 hover:bg-black/10 rounded-full transition-colors">
                 <X size={22} strokeWidth={3} />
               </button>
            </div>

            {activeAssignmentModal.type === 'group' ? (
                <>
                    <div className="px-4 pt-4 flex gap-1">
                        <button 
                            onClick={() => setGroupTypeTab('location')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${groupTypeTab === 'location' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <MapPin size={12} /> Locations
                        </button>
                        <button 
                            onClick={() => setGroupTypeTab('department')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${groupTypeTab === 'department' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <Briefcase size={12} /> Departments
                        </button>
                    </div>

                    <div className="p-4 bg-white border-b border-slate-100">
                      <div className="relative group">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text" 
                            autoFocus
                            placeholder={`Search ${groupTypeTab}...`} 
                            className="w-full pl-9 pr-4 py-3 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar p-2">
                        <div className="space-y-1 p-2">
                          {groupTypeTab === 'location' ? (
                              <>
                                <div className="grid grid-cols-1 gap-2">
                                    {(() => {
                                        // Fix for Error: Property 'toLowerCase' does not exist on type 'unknown'.
                                        // Explicitly cast flatMap results to string array to allow toLowerCase and argument passing.
                                        const locations = (contextUnit?.departmentLocations 
                                            ? Object.entries(contextUnit.departmentLocations).flatMap(([, locs]) => locs)
                                            : DUMMY_LOCATIONS) as string[];
                                        
                                        const filtered = locations.filter(l => l.toLowerCase().includes(searchQuery.toLowerCase()));
                                        
                                        if (filtered.length === 0) return <div className="text-center py-10 opacity-30 text-xs font-bold uppercase">No Locations Found</div>;
                                        
                                        return filtered.map(loc => (
                                            // Fix for Error: Argument of type 'unknown' is not assignable to parameter of type 'string'.
                                            // loc is correctly typed as string now.
                                            <button key={loc} onClick={() => handleAddGroup(activeAssignmentModal.deptRow, activeAssignmentModal.level, loc)} className="w-full text-left p-4 bg-slate-50 hover:bg-orange-50 rounded-2xl border border-slate-100 flex items-center justify-between group transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm text-orange-500 group-hover:scale-110 transition-transform">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{loc}</span>
                                                </div>
                                                <Plus size={16} className="text-orange-300 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ));
                                    })()}
                                </div>
                              </>
                          ) : (
                              <>
                                <div className="grid grid-cols-1 gap-2">
                                    {(() => {
                                        const filtered = allDepartments.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
                                        
                                        if (filtered.length === 0) return <div className="text-center py-10 opacity-30 text-xs font-bold uppercase">No Departments Found</div>;

                                        return filtered.map(dept => (
                                            <button key={dept} onClick={() => handleAddGroup(activeAssignmentModal.deptRow, activeAssignmentModal.level, dept)} className="w-full text-left p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 flex items-center justify-between group transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                                                        <Briefcase size={16} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{dept}</span>
                                                </div>
                                                <Plus size={16} className="text-blue-300 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ));
                                    })()}
                                </div>
                              </>
                          )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* User Selection View - Matching Provided High Fidelity Design */}
                    <div className="p-4 border-b border-slate-100 shrink-0">
                        <div className="relative group mb-4">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4f46e5] transition-colors" />
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Search by name or ID..." 
                                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-100 transition-all bg-slate-50 focus:bg-white shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Selected User Tags */}
                        {tempSelectedUserIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-1 max-h-24 overflow-y-auto custom-scrollbar pr-1 pb-1">
                                {tempSelectedUserIds.map(uid => {
                                    const u = entities.find(e => e.id === uid);
                                    if (!u) return null;
                                    return (
                                        <div key={uid} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl group/tag hover:bg-indigo-100 transition-colors cursor-default">
                                            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wide">{u.name}</span>
                                            <button 
                                                onClick={() => setTempSelectedUserIds(prev => prev.filter(i => i !== uid))}
                                                className="text-indigo-300 hover:text-indigo-600 transition-colors"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Scrollable User List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                        {filteredUserOptions.length > 0 ? filteredUserOptions.map(user => {
                            const isSelected = tempSelectedUserIds.includes(user.id);
                            const corpName = getCorporateName(user);
                            const hierarchyChain = getHierarchyChain(user);
                            const deptName = entities.find(e => e.id === user.parentId)?.name || 'General';

                            return (
                                <div 
                                    key={user.id} 
                                    onClick={() => setTempSelectedUserIds(prev => isSelected ? prev.filter(i => i !== user.id) : [...prev, user.id])}
                                    className="p-5 hover:bg-slate-50 transition-colors flex items-start gap-5 cursor-pointer group"
                                >
                                    <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#4f46e5] border-[#4f46e5] shadow-md' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                                        {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <p className="text-base font-black text-slate-800 tracking-tight leading-none mb-1.5 truncate">{user.name}</p>
                                                <p className="text-[10px] font-black text-[#4f46e5] uppercase tracking-wider mb-1 truncate">
                                                    {corpName}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">
                                                    {hierarchyChain}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400 italic truncate">
                                                    {deptName} • Staff Node
                                                </p>
                                            </div>
                                            {user.entityIdNum && (
                                                <div className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black font-mono border border-indigo-100 shrink-0">
                                                    {user.entityIdNum}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-20 text-center text-slate-300">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">No users match your search</p>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={filteredUserOptions.length > 0 && filteredUserOptions.every(u => tempSelectedUserIds.includes(u.id))}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            const allIds = filteredUserOptions.map(u => u.id);
                                            setTempSelectedUserIds(prev => [...new Set([...prev, ...allIds])]);
                                        } else {
                                            const visibleIds = filteredUserOptions.map(u => u.id);
                                            setTempSelectedUserIds(prev => prev.filter(id => !visibleIds.includes(id)));
                                        }
                                    }}
                                />
                                <div className="w-6 h-6 rounded-lg border-2 border-slate-300 peer-checked:bg-[#4f46e5] peer-checked:border-[#4f46e5] flex items-center justify-center transition-all group-hover:border-indigo-400">
                                    <Check size={14} className="text-white opacity-0 peer-checked:opacity-100" strokeWidth={4} />
                                </div>
                            </div>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] group-hover:text-slate-800 transition-colors">Select All</span>
                        </label>

                        <button 
                            disabled={tempSelectedUserIds.length === 0}
                            onClick={handleBatchEnrollUsers}
                            className={`
                                px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all shadow-xl
                                ${tempSelectedUserIds.length > 0 
                                    ? 'bg-[#4f46e5] text-white hover:bg-[#4338ca] shadow-indigo-200 active:scale-[0.98]' 
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}
                            `}
                        >
                            Enroll {tempSelectedUserIds.length} {tempSelectedUserIds.length === 1 ? 'Person' : 'People'}
                        </button>
                    </div>
                </>
            )}
          </div>
        </div>
      )}

      {/* Security Layer */}
      {isVerifying && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-200 animate-in zoom-in-95">
             <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <KeyRound size={32} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Modify Matrix Authority</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Elevated privileges required for escalation path changes</p>
             </div>
             <input 
                type="password"
                placeholder="••••"
                autoFocus
                className="w-full text-center text-3xl tracking-[0.5em] font-black border-2 border-slate-100 rounded-2xl py-4 focus:border-red-500 outline-none transition-all"
                value={verificationPass}
                onChange={(e) => setVerificationPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmVerification()}
             />
             <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={() => setIsVerifying(false)} className="py-4 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl tracking-widest">Cancel</button>
                <button onClick={confirmVerification} className="py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Unlock Edit Mode</button>
             </div>
          </div>
        </div>
      )}

      {/* Header with View Toggle */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-red-50 text-red-600 rounded-3xl shadow-inner border border-red-100">
              <ShieldAlert size={32} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Global Escalation Control</h2>
              <div className="flex items-center gap-3 mt-2">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Integrity Layer</p>
                 <div className="h-3 w-px bg-slate-200" />
                 <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 size={10}/> Sync: Active
                 </span>
              </div>
           </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
           <button 
              onClick={() => setActiveView('operational')}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'operational' ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
           >
              Departmental Grid
           </button>
           <button 
              onClick={() => setActiveView('module')}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'module' ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
           >
              Module Support
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Sidebar - Domain Hub with Sub-item support */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-900/20 flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Domain Hub</h3>
              <Search size={14} className="text-slate-500" />
            </div>
            <div className="p-3 space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
              {navItems.map((item) => {
                const isParentActive = activeModuleId === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <button
                      onClick={() => {
                        setActiveModuleId(item.id);
                        if (item.subItems?.length > 0) {
                          setActiveSubModuleId(item.subItems[0].id);
                        } else {
                          setActiveSubModuleId(null);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${
                        isParentActive && !activeSubModuleId
                          ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="font-black text-[11px] uppercase tracking-wider truncate">{item.label}</span>
                      <ChevronRight size={14} className={isParentActive ? 'text-indigo-600' : 'opacity-0 group-hover:opacity-50'} />
                    </button>
                    
                    {/* Render Sub-items if Parent is Active */}
                    {isParentActive && item.subItems?.length > 0 && (
                      <div className="ml-4 pl-3 border-l border-white/10 space-y-1 mb-2 mt-1 animate-in slide-in-from-top-1 duration-200">
                        {item.subItems.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => setActiveSubModuleId(sub.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                              activeSubModuleId === sub.id 
                                ? 'bg-indigo-600/20 text-indigo-400 font-bold' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <CornerDownRight size={12} className="opacity-40" />
                            <span className="text-[10px] uppercase tracking-wide truncate">{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                <Info size={100} />
             </div>
             <h4 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Info size={14} /> Matrix Logic
             </h4>
             <p className="text-[10px] font-medium leading-relaxed opacity-80 uppercase tracking-tighter">
                Nodes are grouped by physical location or functional sub-departments to ensure rapid response.
             </p>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                     {activeView === 'operational' ? <LayoutGrid size={24} /> : <LayoutTemplate size={24} />}
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">
                        {activeSubItem?.label || activeNavItem?.label} Flow
                     </h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resource Availability Matrix</p>
                  </div>
               </div>
               
               {canEdit && (
                 <button 
                  onClick={() => handleProtectedAction(() => {})} 
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                 >
                    <Plus size={14}/> Define Row Logic
                 </button>
               )}
            </div>

            <div className="overflow-auto custom-scrollbar flex-1">
               <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200">
                     <tr>
                        <th className="p-6 w-[220px] border-r border-slate-200 sticky left-0 bg-slate-50 z-20">Responsibility Node</th>
                        <th className="p-6 text-center border-r border-slate-200 w-[25%]">
                           <div className="flex flex-col gap-1">
                              <span className="text-red-600">Level 1: Action</span>
                              <span className="text-[8px] opacity-60">Grouped by Loc/Dept (0-2h)</span>
                           </div>
                        </th>
                        <th className="p-6 text-center border-r border-slate-200 w-[25%]">
                           <div className="flex flex-col gap-1">
                              <span className="text-orange-600">Level 2: Supervisor</span>
                              <span className="text-[8px] opacity-60">Escalation Group (2-8h)</span>
                           </div>
                        </th>
                        <th className="p-6 text-center border-r border-slate-200">
                           <div className="flex flex-col gap-1">
                              <span className="text-purple-600">Level 3</span>
                              <span className="text-[8px] opacity-60">Unit Management (24h)</span>
                           </div>
                        </th>
                        <th className="p-6 text-center">
                           <div className="flex flex-col gap-1">
                              <span className="text-slate-900">Level 4</span>
                              <span className="text-[8px] opacity-60">Global Oversight</span>
                           </div>
                        </th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {allDepartments.map(dept => (
                        <tr key={dept} className="hover:bg-slate-50 transition-colors group">
                           <td className="p-6 border-r border-slate-100 font-black text-slate-800 text-xs uppercase tracking-tight sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                              <div className="flex items-center gap-3">
                                 <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-sm" />
                                 {dept}
                              </div>
                           </td>
                           
                           {[1, 2, 3, 4].map(level => (
                             <MatrixCell key={level} dept={dept} level={level} />
                           ))}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                   <AlertTriangle className="text-orange-500" size={18} />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                      Handshake Alert: <span className="text-emerald-600">All Levels mapped to active functional areas.</span>
                   </p>
                </div>
                <div className="flex gap-3">
                   <button className="px-8 py-3 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                      Matrix History
                   </button>
                   <button className="px-12 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-95">
                      Sync Node Map
                   </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EscalationMatrix;
