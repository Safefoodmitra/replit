"use client";

import React, { useState, useMemo, useRef } from "react";
import * as XLSX from 'xlsx';
import {
  Building2,
  Globe,
  Plus,
  Pencil,
  Upload,
  User,
  Mail,
  MapPin,
  Phone,
  Ban,
  RefreshCcw,
  RefreshCw,
  Zap,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  Image as ImageIcon,
  ShieldCheck,
  Briefcase,
  Users,
  LayoutGrid,
  LayoutDashboard,
  ShieldAlert,
  Lock,
  Trash,
  FileSpreadsheet,
  KeyRound,
  Bot,
  MessageCircle,
  Send,
  CalendarClock,
  Terminal,
  Play,
  Shield,
  CreditCard,
  Crown,
  Clock,
  Factory,
  IdCard,
  UserPlus,
  UserMinus,
  Search,
  ArrowRight,
  Settings,
  Component
} from "lucide-react";
import { HierarchyScope, Entity, SubscriptionType, Category, IndustryType, EntityContact, NavItem, Employee } from "../types";
import { INDUSTRY_CONFIGS, SCOPE_CONFIG } from "../constants";
import LicenseManager from "./LicenseManager";
import EmployeeManagement from "./EmployeeManagement";
import EscalationMatrix from "./EscalationMatrix";
import DepartmentControl from "./DepartmentControl";

// --- 1. UTILS ---

const SUBSCRIPTION_DURATIONS: Record<SubscriptionType, number> = {
  trial: 7,
  basic: 30,
  advance: 180,
  pro: 365,
};

const PLANS: Record<SubscriptionType, { label: string; color: string; icon: React.ReactNode; price: string }> = {
  trial: { label: 'Free Trial', color: 'bg-slate-100 text-slate-600', icon: <Clock className="w-4 h-4"/>, price: '$0' },
  basic: { label: 'Basic', color: 'bg-blue-100 text-blue-700', icon: <Shield className="w-4 h-4"/>, price: '$99/mo' },
  advance: { label: 'Advance', color: 'bg-purple-100 text-purple-700', icon: <Zap className="w-4 h-4"/>, price: '$199/mo' },
  pro: { label: 'Pro', color: 'bg-emerald-100 text-emerald-700', icon: <Crown className="w-4 h-4"/>, price: '$399/mo' },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const calculateDaysLeft = (endDateString?: string) => {
  if (!endDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateString);
  endDate.setHours(23, 59, 59, 999);
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getEffectiveStatus = (unit: any) => {
  if (unit.status === "pending-approval") return "pending";
  if (unit.status === "inactive") return "inactive";
  const daysLeft = calculateDaysLeft(unit.subscriptionEndDate);
  if (daysLeft === null) return "active"; 
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 7) return "expiry-soon";
  return "active";
};

const getStatusText = (unit: any) => {
  const daysLeft = calculateDaysLeft(unit.subscriptionEndDate);
  const eff = getEffectiveStatus(unit);
  if (eff === "expired") return `Expired (${Math.abs(daysLeft || 0)} days ago)`;
  if (eff === "expiry-soon") return `${daysLeft} days left (Expires Soon!)`;
  if (eff === "pending") return "Awaiting Approval";
  if (eff === "inactive") return "Deactivated";
  return `${daysLeft} days left`;
};

// --- 2. GLOBAL STABLE SUB-COMPONENTS ---

const StatusBadge = ({ label, count }: { label: string; count: number }) => (
  <div className="px-2 py-1.5 border border-white/30 rounded text-[9px] font-black uppercase tracking-tighter bg-white/5 flex items-center gap-1.5 whitespace-nowrap">
    {label}: <span className="bg-white/10 px-1 rounded">{count}</span>
  </div>
);

const ManagementHeader = ({ title, subtitle, icon: Icon, color = "bg-blue-600" }: any) => (
  <div className="flex items-center gap-3 mb-6 relative z-10">
    <div className={`p-2.5 ${color} text-white rounded-xl shadow-lg shadow-blue-500/20`}><Icon size={20} /></div>
    <div>
      <h4 className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{title}</h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
    </div>
  </div>
);

const ScopeIdentityBadge = ({ scope }: { scope: HierarchyScope }) => {
  const labels: Record<string, string> = {
    'super-admin': 'SA',
    'corporate': 'C',
    'regional': 'R',
    'unit': 'U'
  };
  const colors: Record<string, string> = {
    'super-admin': 'bg-purple-100 text-purple-700 border-purple-200',
    'corporate': 'bg-blue-100 text-blue-700 border-blue-200',
    'regional': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'unit': 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };
  return (
    <span className={`w-4 h-4 flex items-center justify-center rounded text-[8px] font-black border ${colors[scope] || 'bg-slate-100 text-slate-500'}`} title={`Added by ${SCOPE_CONFIG[scope]?.label || scope}`}>
      {labels[scope] || '?'}
    </span>
  );
};

const ContactInfoGrid = ({ contacts = [], title, onEdit, isSuperAdmin, entity }: { 
  contacts?: EntityContact[], 
  title: string, 
  onEdit?: (entity: any) => void,
  isSuperAdmin?: boolean,
  entity?: any
}) => {
  const displayContacts = (contacts && contacts.length > 0) 
    ? contacts 
    : [{
        name: entity?.contactPerson || 'N/A',
        role: 'Primary Contact',
        email: entity?.email || 'N/A',
        phone: entity?.phone || 'N/A'
    }];

  return (
    <div className="space-y-3">
      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <Users size={14} className="text-indigo-500" /> {title}
      </h5>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {displayContacts.map((contact, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="md:col-span-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Name & Role</span>
              <p className="text-xs font-black text-slate-800 flex items-center gap-2 truncate">
                <User size={14} className="text-indigo-400 shrink-0" />
                {contact.name}
              </p>
              <p className="text-[9px] font-bold text-slate-400 ml-5 truncate">{contact.role || 'Access Node'}</p>
            </div>
            <div className="md:col-span-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Direct Line</span>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-2 truncate">
                <Phone size={14} className="text-indigo-400 shrink-0" />
                {contact.phone}
              </p>
            </div>
            <div className="md:col-span-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Official Email</span>
              <p className="text-xs font-bold text-blue-600 flex items-center gap-2 truncate">
                <Mail size={14} className="text-blue-400 shrink-0" />
                {contact.email}
              </p>
            </div>
            <div className="md:col-span-1 flex justify-end items-center gap-2">
               <span className="text-[8px] font-black px-2 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 uppercase">Contact #{idx + 1}</span>
               {isSuperAdmin && onEdit && (
                 <button onClick={() => onEdit(entity)} className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Pencil size={14} />
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AutomationPanel = ({ entities, onClose }: { entities: Entity[], onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'license' | 'subscription'>('license');
  const [logs, setLogs] = useState<Array<{time: string, type: string, msg: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (type: 'info' | 'email' | 'whatsapp' | 'success', msg: string) => {
    const time = new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'});
    setLogs(prev => [...prev, { time, type, msg }]);
    setTimeout(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, 10);
  };

  const runLicenseAutomation = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLogs([]);
    addLog("info", "Starting monthly license compliance check...");
    let step = 0;
    const interval = setInterval(() => {
      if (step === 0) {
          const corps = entities.filter(e => e.type === 'corporate');
          addLog("info", `Found ${corps.length} Corporate Entities.`);
          corps.forEach(c => {
              addLog("email", `[CORP] Report generated for ${c.name}. Sending to ${c.email || 'N/A'}`);
              if (c.phone) addLog("whatsapp", `[CORP] WhatsApp summary sent to ${c.phone}`);
          });
      } else if (step === 1) {
          const regions = entities.filter(e => e.type === 'regional');
          addLog("info", `Processing ${regions.length} Regional Offices...`);
          regions.forEach(r => {
              addLog("email", `[REGIONAL] Dashboard sent to ${r.name} (${r.email || 'N/A'})`);
              if (r.phone) addLog("whatsapp", `[REGIONAL] Alert sent to ${r.phone}`);
          });
      } else if (step === 2) {
          const units = entities.filter(e => e.type === 'unit');
          addLog("info", `Analyzing ${units.length} Units for compliance...`);
          units.forEach(u => {
              if (u.status === 'active') {
                  addLog("email", `[UNIT] Monthly Compliance Report sent to ${u.name} (${u.email})`);
              }
          });
      } else {
          addLog("success", "Batch processing complete. All notifications queued.");
          setIsProcessing(false);
          clearInterval(interval);
      }
      step++;
    }, 1000);
  };

  const runSubscriptionCheck = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLogs([]);
    addLog("info", "Scanning unit subscriptions for expiry...");

    setTimeout(() => {
        const units = entities.filter(e => e.type === 'unit');
        let alertCount = 0;
        units.forEach(u => {
            const daysLeft = calculateDaysLeft(u.subscriptionEndDate);
            if (daysLeft !== null && daysLeft <= 30) {
                alertCount++;
                const status = daysLeft < 0 ? "EXPIRED" : "EXPIRING SOON";
                addLog("email", `[ALERT] ${u.name}: Subscription ${status} (${Math.abs(daysLeft)} days). Emailing ${u.email}`);
                if (daysLeft <= 7 && u.phone) {
                    addLog("whatsapp", `[URGENT] WhatsApp sent to ${u.phone} regarding immediate renewal.`);
                }
            }
        });
        if (alertCount === 0) {
            addLog("success", "No units are currently near expiry.");
        } else {
            addLog("success", `Scan complete. Sent ${alertCount} renewal alerts.`);
        }
        setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50/20 rounded-lg border border-blue-500/30">
                <Bot className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Automation Control Center</h3>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Scheduled Tasks & Notifications</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
            <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col p-4 gap-2 shrink-0">
                <button 
                    onClick={() => setActiveTab('license')}
                    className={`text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-3 transition-all ${activeTab === 'license' ? 'bg-white border-slate-200 shadow-sm text-blue-600 border' : 'text-slate-50 hover:bg-slate-100'}`}
                >
                    <FileSpreadsheet size={16} /> License Reports
                </button>
                <button 
                    onClick={() => setActiveTab('subscription')}
                    className={`text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-3 transition-all ${activeTab === 'subscription' ? 'bg-white border-slate-200 shadow-sm text-orange-600 border' : 'text-slate-50 hover:bg-slate-100'}`}
                >
                    <ShieldAlert size={16} /> Subscription Watch
                </button>
            </div>
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="mb-6 bg-white border border-slate-100 rounded-xl p-5 shadow-sm shrink-0">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                        {activeTab === 'license' ? <CalendarClock size={16} className="text-blue-500"/> : <CalendarClock size={16} className="text-orange-500"/>}
                        {activeTab === 'license' ? 'Monthly Schedule: 1st of Month' : 'Daily Schedule: 09:00 AM'}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {activeTab === 'license' 
                            ? "Automatically generates compliance PDF dashboards for all entities. Sends summary emails to Unit Heads and detailed breakdown reports to Regional/Corporate managers via Email & WhatsApp."
                            : "Scans all Unit subscriptions. Triggers warning emails for accounts expiring within 30 days and critical alerts via WhatsApp for those expiring within 7 days."
                        }
                    </p>
                    <button 
                        onClick={activeTab === 'license' ? runLicenseAutomation : runSubscriptionCheck}
                        disabled={isProcessing}
                        className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : activeTab === 'license' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                    >
                        {isProcessing ? <RefreshCcw className="w-3.5 h-3.5 animate-spin"/> : <Play className="w-3.5 h-3.5 fill-current"/>}
                        {isProcessing ? 'Running Task...' : 'Run Automation Now'}
                    </button>
                </div>
                <div className="flex-1 flex flex-col bg-[#1e1e1e] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                    <div className="px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center gap-2">
                        <Terminal size={12} className="text-slate-400"/>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">System Logs</span>
                    </div>
                    <div ref={logContainerRef} className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-1.5 custom-scrollbar">
                        {logs.length === 0 ? (
                            <span className="text-slate-600 italic opacity-50">Waiting for trigger command...</span>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                                    <span className={`${
                                        log.type === 'email' ? 'text-blue-400' :
                                        log.type === 'whatsapp' ? 'text-green-400' :
                                        log.type === 'success' ? 'text-emerald-400 font-bold' :
                                        'text-slate-300'
                                    }`}>
                                        {log.type === 'email' && <Mail size={10} className="inline mr-1.5"/>}
                                        {log.type === 'whatsapp' && <MessageCircle size={10} className="inline mr-1.5"/>}
                                        {log.msg}
                                    </span>
                                </div>
                            ))
                        )}
                        {isProcessing && (
                            <div className="flex gap-2 items-center text-slate-500 mt-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Processing...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

interface UnitCardProps {
  unit: any;
  onEdit: (u: any) => void;
  onToggleStatus: (id: string) => void;
  onApprove?: (u: any) => void;
  onOpenPermissions?: (id: string) => void;
  onOpenDeptControl?: () => void;
  isSuperAdmin: boolean;
}

const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  onEdit,
  onToggleStatus,
  onApprove,
  onOpenPermissions,
  onOpenDeptControl,
  isSuperAdmin
}) => {
  const eff = getEffectiveStatus(unit);
  let cardBg = "bg-white";
  let accentColor = "border-slate-200";
  let titleColor = "text-slate-800";
  let statusColor = "text-slate-600";
  if (eff === "expired" || unit.status === 'inactive') {
    cardBg = "bg-[#fff5f5]";
    accentColor = "border-[#ffa8a8]";
    titleColor = "text-[#e03131]";
    statusColor = "text-[#f03e3e]";
  } else if (eff === "expiry-soon") {
    cardBg = "bg-[#fff9db]";
    accentColor = "border-[#ffd43b]";
    titleColor = "text-[#f08c00]";
    statusColor = "text-[#f59f00]";
  } else if (eff === "pending") {
    cardBg = "bg-[#f8f9fa]";
    accentColor = "border-[#dee2e6]";
    titleColor = "text-[#495057]";
  }
  const badges: Record<string, string> = {
    pro: "bg-[#20c997] text-white",
    basic: "bg-[#4dabf7] text-white",
    trial: "bg-[#7950f2] text-white",
    pending: "bg-[#868e96] text-white"
  };
  const contacts = unit.additionalContacts && unit.additionalContacts.length > 0 
    ? unit.additionalContacts 
    : [{ name: unit.contactPerson || 'N/A', role: 'Primary Contact', email: unit.email || '', phone: unit.phone || '' }];
  return (
    <div className={`p-4 rounded-lg shadow-sm border-t-2 border-x border-b ${accentColor} ${cardBg} transition-all hover:shadow-md flex flex-col h-full relative group`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <h5 className={`font-black text-[13px] tracking-tight ${titleColor}`}>{unit.name}</h5>
          {unit.entityIdNum && <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">{unit.entityIdNum}</span>}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); if (onOpenDeptControl) onOpenDeptControl(); }}
            className="px-2 py-1 border border-blue-200 rounded text-[9px] font-black uppercase text-blue-600 hover:bg-blue-50 flex items-center gap-1 transition-colors" title="Department Control"
          >
            <Component size={10} />
          </button>
          {isSuperAdmin && (
            <>
              {onOpenPermissions && (
                <button onClick={() => onOpenPermissions(unit.id)} className="px-2 py-1 border border-indigo-200 rounded text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 transition-colors" title="Manage Permissions">
                  <Shield size={10} />
                </button>
              )}
              {eff !== 'pending' ? (
                <button onClick={() => onToggleStatus(unit.id)} className="px-2 py-1 border border-red-300 rounded text-[9px] font-black uppercase text-red-500 hover:bg-red-50 flex items-center gap-1 transition-colors">
                  <Ban size={10} />
                </button>
              ) : (
                <button onClick={() => onApprove?.(unit)} className="px-2 py-1 border border-green-500 rounded text-[9px] font-black uppercase text-green-600 hover:bg-green-50 flex items-center gap-1 transition-colors">
                  <Check size={10} />
                </button>
              )}
              <button onClick={() => onEdit(unit)} className="px-2 py-1 border border-orange-300 rounded text-[9px] font-black uppercase text-orange-500 hover:bg-orange-50 flex items-center gap-1 transition-colors">
                <Pencil size={10} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-3 mb-4">
        <div className="flex justify-between items-center mb-1">
           <div className="flex gap-2">
               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${badges[eff === 'pending' ? 'pending' : (unit.subscriptionType || 'basic')]}`}>
                {eff === 'pending' ? 'PENDING' : unit.subscriptionType?.toUpperCase() || 'BASIC'}
               </span>
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                  <Factory size={8} className="text-slate-400" />
                  {INDUSTRY_CONFIGS[unit.industryType as IndustryType]?.label || 'General'}
               </span>
           </div>
        </div>
        {eff !== 'pending' && (
          <div className="text-[10px] space-y-1.5 pb-3 border-b border-dotted border-slate-300">
            <p className="font-bold text-slate-400">Expires: <span className="text-slate-800">{formatDate(unit.subscriptionEndDate)}</span></p>
            <p className="font-bold text-slate-400">Status: <span className={`font-black ${statusColor}`}>{getStatusText(unit)}</span></p>
          </div>
        )}
        <div className="space-y-3 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1">
            <Users size={10} /> Node Access Contacts ({contacts.length})
          </p>
          {contacts.map((c, i) => (
            <div key={i} className="space-y-1 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-700">
                <IdCard size={12} className="text-indigo-400 shrink-0" />
                <span className="truncate">{c.name}</span>
                <span className="text-[8px] text-slate-400 font-bold ml-auto">{c.role || 'User'}</span>
              </div>
              {c.email && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                  <Phone size={11} className="shrink-0 text-slate-400" />
                  <span>{c.phone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {isSuperAdmin && (
        <div className="mt-auto pt-3 border-t border-slate-200 flex gap-1.5">
          {eff === 'expired' ? (
            <button onClick={() => onEdit(unit)} className="flex-1 py-1.5 bg-white border border-blue-400 rounded text-[9px] font-black uppercase text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 transition-colors">
              <RefreshCw size={10} /> Renew Expired
            </button>
          ) : eff !== 'pending' ? (
            <>
              <button onClick={() => onEdit(unit)} className="flex-1 py-1.5 bg-white border border-blue-400 rounded text-[9px] font-black uppercase text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 transition-colors">
                <RefreshCcw size={10} /> Renew
              </button>
              <button onClick={() => onEdit(unit)} className="flex-1 py-1.5 bg-white border border-purple-400 rounded text-[9px] font-black uppercase text-purple-600 hover:bg-purple-50 flex items-center justify-center gap-1 transition-colors">
                <Zap size={10} /> Upgrade
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

interface MasterItem {
  value: string;
  source: HierarchyScope;
}

interface MasterDataSectionProps {
  entity: Entity;
  entities: Entity[];
  title: string;
  color: string;
  icon: any;
  canEdit: boolean;
  newDept: string;
  setNewDept: (v: string) => void;
  newRole: string;
  setNewRole: (v: string) => void;
  onAdd: (id: string, type: 'department' | 'role') => void;
  onRemove: (id: string, type: 'department' | 'role', val: string) => void;
  onRename: (config: any) => void;
}

const MasterDataSection = ({ 
  entity, entities, title, color, icon: Icon, canEdit, 
  newDept, setNewDept, newRole, setNewRole, 
  onAdd, onRemove, onRename 
}: MasterDataSectionProps) => {
  const getInheritedItems = (entId: string | undefined, type: 'dept' | 'role'): MasterItem[] => {
    if (!entId) return [];
    const ent = entities.find(e => e.id === entId);
    if (!ent) return [];
    const parentItems = getInheritedItems(ent.parentId, type);
    const key = type === 'dept' ? 'masterDepartments' : 'masterRoles';
    const localItems: MasterItem[] = (ent[key] || []).map((v: string) => ({ value: v, source: ent.type }));
    return [...parentItems, ...localItems];
  };
  const allDepartments = useMemo(() => getInheritedItems(entity.id, 'dept'), [entity, entities]);
  const allRoles = useMemo(() => getInheritedItems(entity.id, 'role'), [entity, entities]);
  const renderItemPill = (item: MasterItem, type: 'department' | 'role') => {
    const isLocal = item.source === entity.type;
    return (
      <span key={`${item.source}-${item.value}`} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase shadow-sm transition-all ${isLocal ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-100 text-slate-400 italic border-slate-200 opacity-80'}`}>
        {!isLocal && <Lock size={10} className="text-slate-400" />}
        <ScopeIdentityBadge scope={item.source} />
        <span className="max-w-[120px] truncate">{item.value}</span>
        {isLocal && canEdit && (
          <div className="flex gap-1.5 ml-1 border-l border-slate-100 pl-1.5">
            <button onClick={() => onRename({ isOpen: true, type, entityId: entity.id, oldValue: item.value })} className="text-slate-300 hover:text-blue-500"><Pencil size={12} /></button>
            <button onClick={() => onRemove(entity.id, type, item.value)} className="text-slate-300 hover:text-red-500"><X size={12} /></button>
          </div>
        )}
      </span>
    );
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative mb-6">
      <ManagementHeader title={title} subtitle="Organizational Structure Definitions" icon={Icon} color={color} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Users size={14} className="text-blue-500" /> Departments</h5>
            {canEdit && (
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Add Dept" 
                  className="flex-1 px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" 
                  value={newDept} onChange={e => setNewDept(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && onAdd(entity.id, 'department')}
                />
                <button onClick={() => onAdd(entity.id, 'department')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase active:scale-95 transition-all">Add</button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 min-h-[60px]">
              {allDepartments.map(item => renderItemPill(item, 'department'))}
              {allDepartments.length === 0 && <p className="text-[10px] text-slate-400 italic m-auto">No departments defined.</p>}
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Briefcase size={14} className="text-purple-500" /> Roles</h5>
            {canEdit && (
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Add Role" 
                  className="flex-1 px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-purple-500/20 outline-none" 
                  value={newRole} onChange={e => setNewRole(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && onAdd(entity.id, 'role')}
                />
                <button onClick={() => onAdd(entity.id, 'role')} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-black uppercase active:scale-95 transition-all">Add</button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 min-h-[60px]">
              {allRoles.map(item => renderItemPill(item, 'role'))}
              {allRoles.length === 0 && <p className="text-[10px] text-slate-400 italic m-auto">No roles defined.</p>}
            </div>
          </div>
      </div>
    </div>
  );
};

const LicenseDashboardWrapper = ({ entities, onUpdateEntity, currentScope, userRootId, licenseSchema, setLicenseSchema }: any) => (
  <div className="mt-12 pt-8 border-t border-slate-200 relative isolate" id="compliance-dashboard-safe-zone">
    <div className="bg-slate-50 rounded-3xl p-1 border border-slate-200 shadow-inner">
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm overflow-hidden">
          <ManagementHeader title="License Compliance Dashboard" subtitle="Regulatory Status & Matrix Renewals" icon={LayoutDashboard} color="bg-emerald-600" />
          <div className="overflow-x-auto custom-scrollbar">
             <LicenseManager entities={entities} onUpdateEntity={onUpdateEntity} currentScope={currentScope} userRootId={userRootId} schema={licenseSchema} setSchema={setLicenseSchema} />
          </div>
      </div>
    </div>
  </div>
);

interface CorporateManagementProps {
  entities: Entity[];
  onEntityClick: (id: string) => void;
  onUpdateEntity: (entity: Entity) => void;
  onAddEntity: (entity: Entity) => void;
  currentScope: HierarchyScope;
  activeSubTab?: string;
  userRootId?: string | null;
  licenseSchema: Category[];
  setLicenseSchema: React.Dispatch<React.SetStateAction<Category[]>>;
  onOpenPermissions?: (targetId?: string) => void;
  navItems: NavItem[];
  onUpdateNavConfig?: React.Dispatch<React.SetStateAction<NavItem[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

const CorporateManagement: React.FC<CorporateManagementProps> = ({ 
  entities, 
  onUpdateEntity, 
  onAddEntity,
  currentScope,
  activeSubTab,
  userRootId,
  licenseSchema,
  setLicenseSchema,
  onOpenPermissions,
  navItems,
  onUpdateNavConfig,
  employees,
  setEmployees
}) => {
  if (activeSubTab === 'corp-users') {
    // Fixed: Type cast to any to allow passing employees and setEmployees props as EmployeeManagementProps is missing them in the truncated source.
    const EmpMgmt = EmployeeManagement as any;
    return <EmpMgmt employees={employees} setEmployees={setEmployees} entities={entities} currentScope={currentScope} userRootId={userRootId} />;
  }
  if (activeSubTab === 'corp-matrix') {
    return <EscalationMatrix navItems={navItems} onUpdateNavConfig={onUpdateNavConfig} currentScope={currentScope} entities={entities} onUpdateEntity={onUpdateEntity} userRootId={userRootId} />;
  }

  const isSuperAdmin = currentScope === 'super-admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutomationOpen, setIsAutomationOpen] = useState(false);
  const [isDeptControlOpen, setIsDeptControlOpen] = useState(false);
  const [deptControlUnit, setDeptControlUnit] = useState<string>("");

  const [modalType, setModalType] = useState<any>(null);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [uploadContext, setUploadContext] = useState<{ type: 'regional' | 'unit', parentId: string } | null>(null);
  const [formContacts, setFormContacts] = useState<EntityContact[]>([]);
  const [expandedCorpId, setExpandedCorpId] = useState<string | null>(null);
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);
  const [newDept, setNewDept] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [activeDeptForLocation, setActiveDeptForLocation] = useState<string | null>(null);
  const [activeAreaForPersonnel, setActiveAreaForPersonnel] = useState<string | null>(null);
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [renameState, setRenameState] = useState<{
    isOpen: boolean;
    type: 'department' | 'role' | 'location';
    entityId: string;
    oldValue: string;
    groupKey?: string; 
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const findAncestorIdByType = (entityId: string | null | undefined, type: HierarchyScope, allEntities: Entity[]): string | undefined => {
     if (!entityId) return undefined;
     const entity = allEntities.find(e => e.id === entityId);
     if (!entity) return undefined;
     if (entity.type === type) return entity.id;
     return findAncestorIdByType(entity.parentId, type, allEntities);
  };

  const nestedData = useMemo(() => {
    if (['regional', 'unit', 'department', 'user'].includes(currentScope)) return [];
    let allowedCorpIds: string[] = [];
    if (currentScope === 'super-admin') {
      allowedCorpIds = entities.filter(e => e.type === 'corporate').map(e => e.id);
    } else if (userRootId) {
       const corpId = findAncestorIdByType(userRootId, 'corporate', entities);
       if (corpId) allowedCorpIds = [corpId];
    }
    return entities
      .filter(e => e.type === 'corporate' && allowedCorpIds.includes(e.id))
      .map(corp => {
        const regionals = entities
          .filter(e => e.type === 'regional' && e.parentId === corp.id)
          .map(reg => ({
            ...reg,
            units: entities.filter(u => u.type === 'unit' && u.parentId === reg.id)
          }));
        return { ...corp, regionals };
      });
  }, [entities, currentScope, userRootId]);

  const activeRegion = useMemo(() => {
    if (currentScope !== 'regional' || !userRootId) return null;
    const region = entities.find(e => e.id === userRootId);
    if (!region) return null;
    const units = entities.filter(e => e.type === 'unit' && e.parentId === region.id);
    return { ...region, units };
  }, [entities, currentScope, userRootId]);

  const activeUnit = useMemo(() => {
    if (!['unit', 'department', 'user'].includes(currentScope) || !userRootId) return null;
    const unitId = findAncestorIdByType(userRootId, 'unit', entities);
    const unit = entities.find(e => e.id === unitId);
    return unit || null;
  }, [entities, currentScope, userRootId]);

  const getStats = (items: any[]) => {
    const s = { pending: 0, active: 0, expirySoon: 0, expired: 0 };
    items.forEach(u => {
      const eff = getEffectiveStatus(u);
      if (eff === 'pending') s.pending++;
      else if (eff === 'active') s.active++;
      else if (eff === 'expiry-soon') s.expirySoon++;
      else if (eff === 'expired' || u.status === 'inactive') s.expired++;
    });
    return s;
  };

  const unitEmployees = useMemo(() => {
    if (!activeUnit) return [];
    return employees.filter(e => e.Unit === activeUnit.name);
  }, [employees, activeUnit]);

  const filteredPersonnelOptions = useMemo(() => {
    if (!personnelSearch.trim()) return [];
    return unitEmployees.filter(emp => 
        emp.Name.toLowerCase().includes(personnelSearch.toLowerCase()) ||
        emp.Email?.toLowerCase().includes(personnelSearch.toLowerCase())
    ).slice(0, 5);
  }, [unitEmployees, personnelSearch]);

  const handleOpenModal = (type: any, parentId: string | null = null, entity: any = null) => {
    setModalType(type);
    setTargetParentId(parentId);
    setEditingEntity(entity);
    setLogoPreview(entity?.logoSrc || null);
    if (entity && entity.additionalContacts && entity.additionalContacts.length > 0) {
      setFormContacts([...entity.additionalContacts]);
    } else if (entity) {
      setFormContacts([{
        name: entity.contactPerson || '',
        role: 'Primary Contact',
        email: entity.email || '',
        phone: entity.phone || '',
        password: '' 
      }]);
    } else {
      setFormContacts([{ name: '', role: '', email: '', phone: '', password: '' }]);
    }
    setIsModalOpen(true);
  };

  const openDeptControl = (unitName: string) => {
    setDeptControlUnit(unitName);
    setIsDeptControlOpen(true);
  };

  const handleExportData = () => {};
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;
    const activeParentId = editingEntity ? editingEntity.parentId : (targetParentId || data.regionalId);
    const validContacts = formContacts.filter(c => c.name.trim() !== '');
    let subscriptionEndDate = undefined;
    if (data.subscribedDate && data.subscriptionType) {
        const duration = SUBSCRIPTION_DURATIONS[data.subscriptionType as SubscriptionType] || 365;
        const startDate = new Date(data.subscribedDate);
        startDate.setDate(startDate.getDate() + duration);
        subscriptionEndDate = startDate.toISOString().split('T')[0];
    } else if (data.subscribedDate) {
        const startDate = new Date(data.subscribedDate);
        startDate.setFullYear(startDate.getFullYear() + 1);
        subscriptionEndDate = startDate.toISOString().split('T')[0];
    }
    const payload: any = {
      ...editingEntity,
      id: editingEntity?.id || `ent-${Date.now()}`,
      entityIdNum: data.entityIdNum,
      name: data.name,
      type: modalType,
      address: data.address,
      contactPerson: validContacts[0]?.name || '',
      email: validContacts[0]?.email || '',
      phone: validContacts[0]?.phone || '',
      additionalContacts: validContacts,
      description: data.description,
      status: editingEntity?.status || (modalType === 'unit' ? 'pending-approval' : 'active'),
      parentId: activeParentId,
      logoSrc: logoPreview,
      subscriptionType: data.subscriptionType,
      subscribedDate: data.subscribedDate,
      subscriptionEndDate: subscriptionEndDate,
      autoRenewal: data.autoRenewal === 'on', 
      industryType: data.industryType
    };
    if (editingEntity) onUpdateEntity(payload);
    else onAddEntity(payload);
    setIsModalOpen(false);
    setLogoPreview(null);
  };
  const handleAddMasterData = (entityId: string, type: 'department' | 'role') => {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const val = type === 'department' ? newDept.trim() : newRole.trim();
    if (!val) return;
    const key = type === 'department' ? 'masterDepartments' : 'masterRoles';
    const currentList = ent[key] || [];
    if (currentList.includes(val)) {
        alert('Item already exists in this scope.');
        return;
    }
    onUpdateEntity({ ...ent, [key]: [...currentList, val] });
    if (type === 'department') setNewDept("");
    else setNewRole("");
  };
  const handleRemoveMasterData = (entityId: string, type: 'department' | 'role', value: string) => {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const key = type === 'department' ? 'masterDepartments' : 'masterRoles';
    const currentList = ent[key] || [];
    onUpdateEntity({ ...ent, [key]: currentList.filter((v: string) => v !== value) });
  };
  const handleAddLocation = (unitId: string, deptName: string) => {
    const unit = entities.find(u => u.id === unitId);
    if (!unit || !newLocation.trim()) return;
    const locs = unit.departmentLocations || {};
    const currentList = locs[deptName] || [];
    if (currentList.includes(newLocation.trim())) return;
    onUpdateEntity({ ...unit, departmentLocations: { ...locs, [deptName]: [...currentList, newLocation.trim()] } });
    setNewLocation("");
  };
  const handleRemoveLocation = (unitId: string, deptName: string, loc: string) => {
      const unit = entities.find(u => u.id === unitId);
      if (!unit) return;
      const locs = unit.departmentLocations || {};
      const currentList = locs[deptName] || [];
      onUpdateEntity({ ...unit, departmentLocations: { ...locs, [deptName]: currentList.filter(l => l !== loc) } });
  };

  const handleAssignPersonnel = (unitId: string, deptName: string, areaName: string, employeeId: string) => {
    const unit = entities.find(u => u.id === unitId);
    if (!unit) return;
    const assignments = unit.locationAssignments || {};
    const deptAssignments = assignments[deptName] || {};
    const areaPersonnel = deptAssignments[areaName] || [];
    if (areaPersonnel.includes(employeeId)) return;
    onUpdateEntity({ 
        ...unit, 
        locationAssignments: { 
            ...assignments, 
            [deptName]: { 
                ...deptAssignments, 
                [areaName]: [...areaPersonnel, employeeId] 
            } 
        } 
    });
    setPersonnelSearch("");
  };

  const handleUnassignPersonnel = (unitId: string, deptName: string, areaName: string, employeeId: string) => {
      const unit = entities.find(u => u.id === unitId);
      if (!unit) return;
      const assignments = unit.locationAssignments || {};
      const deptAssignments = assignments[deptName] || {};
      const areaPersonnel = deptAssignments[areaName] || [];
      onUpdateEntity({ 
          ...unit, 
          locationAssignments: { 
              ...assignments, 
              [deptName]: { 
                  ...deptAssignments, 
                  [areaName]: areaPersonnel.filter(id => id !== employeeId) 
              } 
          } 
      });
  };

  const handleRenameSave = () => {
    if (!renameState || !renameValue.trim()) return;
    const ent = entities.find(e => e.id === renameState.entityId);
    if (!ent) return;
    if (renameState.type === 'location' && renameState.groupKey) {
        const locs = ent.departmentLocations || {};
        const list = locs[renameState.groupKey] || [];
        onUpdateEntity({ ...ent, departmentLocations: { ...locs, [renameState.groupKey]: list.map(l => l === renameState.oldValue ? renameValue.trim() : l) } });
    } else {
        const key = renameState.type === 'department' ? 'masterDepartments' : 'masterRoles';
        const list = ent[key] || [];
        onUpdateEntity({ ...ent, [key]: list.map((v: string) => v === renameState.oldValue ? renameValue.trim() : v) });
    }
    setRenameState(null);
    setRenameValue("");
  };
  const renderRenameModal = () => {
    if (!renameState) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-sm:max-w-sm">
          <h4 className="text-sm font-black uppercase text-slate-800 mb-4">Rename {renameState.type}</h4>
          <input autoFocus className="w-full border p-2 rounded-lg mb-4 text-sm font-bold" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRenameSave()} />
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 text-xs font-bold text-slate-500" onClick={() => setRenameState(null)}>Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase" onClick={handleRenameSave}>Update</button>
          </div>
        </div>
      </div>
    );
  };
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) alert(`Mock: Parsing ${f.name}`);
    e.target.value = '';
  };
  const renderModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            {editingEntity ? `Edit ${modalType === 'corporate' ? 'Corporate' : modalType === 'regional' ? 'Regional' : 'Unit'}` : `Add New ${modalType === 'corporate' ? 'Corporate' : modalType === 'regional' ? 'Regional' : 'Unit'}`}
          </h3>
          <button onClick={() => { setIsModalOpen(false); setLogoPreview(null); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form id="entityForm" onSubmit={handleSave} className="space-y-6">
            {modalType === 'corporate' && (
               <div className="flex justify-center mb-4">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                      {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" /> : <ImageIcon className="text-slate-400" />}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { const r = new FileReader(); r.onload = () => setLogoPreview(r.result as string); r.readAsDataURL(f); }
                    }} />
                  </div>
               </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ID Number</label>
                  <input name="entityIdNum" placeholder="e.g. C-001" defaultValue={editingEntity?.entityIdNum} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Entity Name</label>
                  <input required name="name" defaultValue={editingEntity?.name} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              {modalType === 'corporate' && (
                <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Industry</label><select name="industryType" defaultValue={editingEntity?.industryType || 'general'} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-bold">{Object.entries(INDUSTRY_CONFIGS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              )}
              <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Address</label><input name="address" defaultValue={editingEntity?.address} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-bold" /></div>
            </div>
            {modalType === 'unit' && isSuperAdmin && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <CreditCard size={14} className="text-emerald-600" /> Subscription & Billing
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Plan Tier</label>
                            <div className="relative">
                                <select name="subscriptionType" defaultValue={editingEntity?.subscriptionType || 'basic'} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none appearance-none">
                                    {Object.entries(PLANS).map(([k, v]) => (<option key={k} value={k}>{v.label} ({v.price})</option>))}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Crown size={14} /></div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Industry Sector</label>
                            <select name="industryType" defaultValue={editingEntity?.industryType || 'general'} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none">
                                {Object.entries(INDUSTRY_CONFIGS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                            <input type="date" name="subscribedDate" defaultValue={editingEntity?.subscribedDate} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 w-full hover:border-emerald-200 transition-colors">
                                <input type="checkbox" name="autoRenewal" defaultChecked={editingEntity?.autoRenewal} className="accent-emerald-600 w-4 h-4" />
                                <span className="text-xs font-bold text-slate-700">Auto-Renewal Enabled</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-2">
                     <Users size={14} className="text-blue-500" /> Key Contacts & Access
                  </h4>
                  <button type="button" onClick={() => setFormContacts([...formContacts, { name: '', role: '', email: '', phone: '', password: '' }])} className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                     + Add Contact
                  </button>
               </div>
               <div className="space-y-3">
                  {formContacts.map((contact, idx) => (
                     <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                        <button type="button" onClick={() => setFormContacts(formContacts.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><X size={14} /></button>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                           <input placeholder="Name" value={contact.name} onChange={e => { const n = [...formContacts]; n[idx].name = e.target.value; setFormContacts(n); }} className="w-full px-2 py-1.5 bg-slate-50 border rounded text-xs font-bold" />
                           <input placeholder="Role / Designation" value={contact.role} onChange={e => { const n = [...formContacts]; n[idx].role = e.target.value; setFormContacts(n); }} className="w-full px-2 py-1.5 bg-slate-50 border rounded text-xs" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                           <input placeholder="Email" value={contact.email} onChange={e => { const n = [...formContacts]; n[idx].email = e.target.value; setFormContacts(n); }} className="w-full px-2 py-1.5 bg-slate-50 border rounded text-xs" />
                           <input placeholder="Mobile" value={contact.phone} onChange={e => { const n = [...formContacts]; n[idx].phone = e.target.value; setFormContacts(n); }} className="w-full px-2 py-1.5 bg-slate-50 border rounded text-xs" />
                           <div className="relative">
                              <KeyRound size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input type="text" placeholder="Password" value={contact.password || ''} onChange={e => { const n = [...formContacts]; n[idx].password = e.target.value; setFormContacts(n); }} className="w-full pl-6 px-2 py-1.5 bg-slate-50 border rounded text-xs text-slate-600" />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={() => { setIsModalOpen(false); setLogoPreview(null); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase hover:bg-slate-100 transition-colors">Cancel</button>
          <button form="entityForm" type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase shadow-lg hover:bg-slate-800 transition-colors active:scale-95">Save Details</button>
        </div>
      </div>
    </div>
  );
  const canEditMasterData = isSuperAdmin || currentScope === 'corporate' || currentScope === 'regional' || currentScope === 'unit';
  const getAllVisibleDepartments = (entity: Entity) => {
    const getAggregated = (entId: string | undefined): string[] => {
      if(!entId) return [];
      const ent = entities.find(e => e.id === entId);
      if(!ent) return [];
      return [...getAggregated(ent.parentId), ...(ent.masterDepartments || [])];
    };
    return [...new Set(getAggregated(entity.id))];
  };

  if (activeUnit) {
      return (
         <div className="space-y-6 pb-20 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
             {isModalOpen && renderModal()}
             {renderRenameModal()}
             {isAutomationOpen && <AutomationPanel entities={entities} onClose={() => setIsAutomationOpen(false)} />}
             {isDeptControlOpen && <DepartmentControl navItems={navItems} onClose={() => setIsDeptControlOpen(false)} unitName={activeUnit.name} />}
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><LayoutGrid className="text-blue-600" /> {activeUnit.name}</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{activeUnit.location}</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => openDeptControl(activeUnit.name)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Component size={16} /> Department Control
                  </button>
                  <UnitCard unit={activeUnit} onEdit={u => handleOpenModal('unit', null, u)} onToggleStatus={id => onUpdateEntity({...activeUnit, status: activeUnit.status === 'active' ? 'inactive' : 'active'})} isSuperAdmin={isSuperAdmin} onOpenPermissions={onOpenPermissions} onOpenDeptControl={() => openDeptControl(activeUnit.name)} />
                </div>
             </div>
             <MasterDataSection entity={activeUnit} entities={entities} title="Unit Local Definitions" color="bg-emerald-600" icon={ShieldAlert} canEdit={canEditMasterData} newDept={newDept} setNewDept={setNewDept} newRole={newRole} setNewRole={setNewRole} onAdd={handleAddMasterData} onRemove={handleRemoveMasterData} onRename={setRenameState} />
             
             {/* 3-Column Robust Location Management with Personnel Assignment */}
             <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <ManagementHeader title="Precision Resource Mapping" subtitle="Departmental Area Personnel Allocation" icon={MapPin} color="bg-orange-500" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-100 rounded-2xl overflow-hidden flex-1">
                   {/* Column 1: Department Selection */}
                   <div className="bg-slate-50/50 border-r border-slate-100 flex flex-col h-full overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-100/30">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                           <Users size={12}/> Select Functional Dept
                        </label>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                         {getAllVisibleDepartments(activeUnit).map((dept: string) => (
                            <button 
                               key={dept} 
                               onClick={() => { setActiveDeptForLocation(dept); setActiveAreaForPersonnel(null); }} 
                               className={`w-full text-left px-5 py-4 text-xs font-black uppercase tracking-tight rounded-xl transition-all flex items-center justify-between group ${activeDeptForLocation === dept ? 'bg-indigo-600 text-white shadow-xl ring-4 ring-indigo-50 shadow-indigo-100' : 'hover:bg-white text-slate-600'}`}
                            >
                               {dept}
                               {activeDeptForLocation === dept && <ChevronRight size={14} />}
                            </button>
                         ))}
                      </div>
                   </div>

                   {/* Column 2: Area / Location Management */}
                   <div className="border-r border-slate-100 flex flex-col h-full bg-white overflow-hidden">
                      {activeDeptForLocation ? (
                         <>
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <MapPin size={12}/> {activeDeptForLocation} Areas
                                </label>
                            </div>
                            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                               <div className="flex gap-2 bg-white p-1 rounded-xl border-2 border-slate-100 focus-within:border-orange-400 transition-all shadow-sm">
                                  <input 
                                    type="text" 
                                    placeholder="Add Area (e.g. Table 1)" 
                                    className="flex-1 px-3 py-1.5 bg-transparent text-xs font-bold outline-none" 
                                    value={newLocation} 
                                    onChange={e => setNewLocation(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleAddLocation(activeUnit.id, activeDeptForLocation)} 
                                  />
                                  <button onClick={() => handleAddLocation(activeUnit.id, activeDeptForLocation)} className="p-1.5 bg-orange-500 text-white rounded-lg active:scale-95 transition-all"><Plus size={16}/></button>
                               </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                               {(activeUnit.departmentLocations?.[activeDeptForLocation] || []).map((loc: string) => {
                                  const staffCount = (activeUnit.locationAssignments?.[activeDeptForLocation!]?.[loc] || []).length;
                                  return (
                                    <button 
                                      key={loc}
                                      onClick={() => setActiveAreaForPersonnel(loc)}
                                      className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all flex items-center justify-between group ${activeAreaForPersonnel === loc ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm' : 'border-transparent bg-slate-50 text-slate-700 hover:border-slate-200'}`}
                                    >
                                       <div className="min-w-0">
                                          <div className="text-xs font-bold uppercase truncate">{loc}</div>
                                          <div className="flex items-center gap-2 mt-1">
                                             <span className={`text-[9px] font-black uppercase ${staffCount > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                                                {staffCount} Personnel Assigned
                                             </span>
                                          </div>
                                       </div>
                                       <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                          <button onClick={() => setRenameState({ isOpen: true, type: 'location', entityId: activeUnit.id, oldValue: loc, groupKey: activeDeptForLocation! })} className="p-1.5 text-slate-300 hover:text-blue-500"><Pencil size={12}/></button>
                                          <button onClick={() => handleRemoveLocation(activeUnit.id, activeDeptForLocation!, loc)} className="p-1.5 text-slate-300 hover:text-red-500"><X size={12}/></button>
                                       </div>
                                    </button>
                                  );
                               })}
                               {(activeUnit.departmentLocations?.[activeDeptForLocation] || []).length === 0 && (
                                  <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
                                     <MapPin size={32} className="text-slate-300 mb-2"/>
                                     <p className="text-[10px] font-bold uppercase text-slate-400">Define operational areas</p>
                                  </div>
                               )}
                            </div>
                         </>
                      ) : <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-[11px] p-10 bg-slate-50/50 uppercase font-black tracking-widest text-center">Step 1:<br/>Select Department</div>}
                   </div>

                   {/* Column 3: Personnel Assignment */}
                   <div className="flex flex-col h-full bg-slate-50/30 overflow-hidden">
                      {activeAreaForPersonnel ? (
                         <>
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <UserPlus size={12}/> Assigned to {activeAreaForPersonnel}
                                </label>
                            </div>
                            <div className="p-4 bg-white border-b border-slate-100 relative">
                               <div className="relative group">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-indigo-600" />
                                  <input 
                                    type="text" 
                                    placeholder="Search Unit Staff..." 
                                    className="w-full pl-9 pr-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all shadow-inner" 
                                    value={personnelSearch}
                                    onChange={e => setPersonnelSearch(e.target.value)}
                                  />
                               </div>

                               {/* Search Suggestions Popup */}
                               {filteredPersonnelOptions.length > 0 && (
                                  <div className="absolute top-full left-4 right-4 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                     {filteredPersonnelOptions.map(emp => (
                                        <button 
                                          key={emp.id}
                                          onClick={() => handleAssignPersonnel(activeUnit.id, activeDeptForLocation!, activeAreaForPersonnel!, emp.id)}
                                          className="w-full text-left p-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 flex items-center gap-3 group transition-colors"
                                        >
                                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] border border-indigo-100 group-hover:bg-white transition-colors">{emp.Name.charAt(0)}</div>
                                           <div className="min-w-0">
                                              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{emp.Name}</p>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {emp.ID || emp.id.substring(0,6)}</p>
                                           </div>
                                           <UserPlus size={14} className="ml-auto text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                        </button>
                                     ))}
                                  </div>
                               )}
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                               {(() => {
                                  const assignedIds = activeUnit.locationAssignments?.[activeDeptForLocation!]?.[activeAreaForPersonnel!] || [];
                                  if (assignedIds.length === 0) {
                                     return (
                                        <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
                                           <Users size={32} className="text-slate-300 mb-2"/>
                                           <p className="text-[10px] font-bold uppercase text-slate-400">No personnel pinned to this area</p>
                                        </div>
                                     );
                                  }
                                  return assignedIds.map(id => {
                                     const emp = employees.find(e => e.id === id);
                                     if (!emp) return null;
                                     return (
                                        <div key={id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:shadow-md transition-all">
                                           <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs border border-white/20 shadow-md ring-2 ring-slate-100">{emp.Name.charAt(0)}</div>
                                           <div className="min-w-0 flex-1">
                                              <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{emp.Name}</p>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{emp.Email || 'Staff Node'}</p>
                                           </div>
                                           <button 
                                              onClick={() => handleUnassignPersonnel(activeUnit.id, activeDeptForLocation!, activeAreaForPersonnel!, id)}
                                              className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                           >
                                              <UserMinus size={16}/>
                                           </button>
                                        </div>
                                     );
                                  });
                               })()}
                            </div>
                         </>
                      ) : <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-[11px] p-10 uppercase font-black tracking-widest text-center">Step 2:<br/>Select Area To<br/>Assign Staff</div>}
                   </div>
                </div>
             </div>

             <LicenseDashboardWrapper entities={entities} onUpdateEntity={onUpdateEntity} currentScope={currentScope} userRootId={userRootId} licenseSchema={licenseSchema} setLicenseSchema={setLicenseSchema} />
         </div>
      );
  }
  if (activeRegion) {
      const regStats = getStats(activeRegion.units);
      return (
        <div className="space-y-6 pb-20 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
           {isModalOpen && renderModal()}
           {renderRenameModal()}
           {isAutomationOpen && <AutomationPanel entities={entities} onClose={() => setIsAutomationOpen(false)} />}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div>
                 <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Globe className="text-indigo-600" /> {activeRegion.name}</h2>
                    {activeRegion.entityIdNum && <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{activeRegion.entityIdNum}</span>}
                 </div>
                 <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{activeRegion.address}</p>
              </div>
              <div className="flex gap-2 items-center">
                 <div className="flex gap-1.5 mr-4 bg-slate-50 p-2 rounded-xl border">
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-white border rounded text-slate-600">Units: {activeRegion.units.length}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-blue-600 text-white rounded">Active: {regStats.active}</span>
                 </div>
                 {isSuperAdmin && <button onClick={() => handleOpenModal('unit', activeRegion.id)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all">+ Add Unit</button>}
              </div>
           </div>
           <ContactInfoGrid title="Regional Office Management Contacts" contacts={activeRegion.additionalContacts} entity={activeRegion} onEdit={(e) => handleOpenModal('regional', null, e)} isSuperAdmin={isSuperAdmin} />
           <MasterDataSection entity={activeRegion} entities={entities} title="Regional Definitions" color="bg-indigo-600" icon={ShieldAlert} canEdit={canEditMasterData} newDept={newDept} setNewDept={setNewDept} newRole={newRole} setNewRole={setNewRole} onAdd={handleAddMasterData} onRemove={handleRemoveMasterData} onRename={setRenameState} />
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mt-8">
              {activeRegion.units.map((unit: any) => <UnitCard key={unit.id} unit={unit} onEdit={u => handleOpenModal('unit', null, u)} onToggleStatus={id => onUpdateEntity({...unit, status: unit.status === 'active' ? 'inactive' : 'active'})} isSuperAdmin={isSuperAdmin} onOpenPermissions={onOpenPermissions} onOpenDeptControl={() => openDeptControl(unit.name)} />)}
           </div>
           <LicenseDashboardWrapper entities={entities} onUpdateEntity={onUpdateEntity} currentScope={currentScope} userRootId={userRootId} licenseSchema={licenseSchema} setLicenseSchema={setLicenseSchema} />
        </div>
      );
  }
  return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 p-4 md:p-6 lg:p-8">
        <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCsvFileChange} className="hidden" />
        {isModalOpen && renderModal()}
        {renderRenameModal()}
        {isAutomationOpen && <AutomationPanel entities={entities} onClose={() => setIsAutomationOpen(false)} />}
        {isDeptControlOpen && <DepartmentControl navItems={navItems} onClose={() => setIsDeptControlOpen(false)} unitName={deptControlUnit} />}
        
        {isSuperAdmin && (
          <div className="flex justify-between items-center mb-4">
             <div className="flex gap-2">
                <button onClick={handleExportData} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"><FileSpreadsheet size={16} /> Export Data</button>
                <button onClick={() => setIsAutomationOpen(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><Bot size={16} /> Automation</button>
             </div>
             <button onClick={() => handleOpenModal('corporate')} className="px-6 py-3 bg-[#0077b6] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95">+ Add Global Corporate</button>
          </div>
        )}
        <div className="space-y-6">
          {nestedData.map(corp => {
            const corpStats = getStats(corp.regionals.flatMap((r:any) => r.units));
            const isCorpExpanded = expandedCorpId === corp.id;
            return (
              <details key={corp.id} open={isCorpExpanded} className="group bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all">
                <summary onClick={(e) => { e.preventDefault(); setExpandedCorpId(isCorpExpanded ? null : corp.id); setExpandedRegId(null); }} className="flex items-center justify-between list-none cursor-pointer bg-[#0077b6] text-white px-6 py-4 shadow-inner select-none">
                  <div className="flex items-center gap-4">
                    {corp.logoSrc ? <img src={corp.logoSrc} className="w-10 h-10 object-contain bg-white p-1 rounded border border-white/20" alt="Logo" /> : <Building2 size={24} />}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="font-black text-xl tracking-tight leading-none">{corp.name}</span>
                           {corp.entityIdNum && <span className="text-[10px] font-mono bg-white/20 px-1.5 rounded">{corp.entityIdNum}</span>}
                        </div>
                        <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1 opacity-90">{INDUSTRY_CONFIGS[corp.industryType as IndustryType]?.label || 'Standard'} Focus</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden lg:flex gap-2 mr-4">
                      <StatusBadge label="Regions" count={corp.regionals.length} />
                      <StatusBadge label="Units" count={corpStats.active} />
                    </div>
                    {isSuperAdmin && (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleOpenModal('corporate', null, corp)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20"><Pencil size={14} /></button>
                        <button onClick={() => handleOpenModal('regional', corp.id)} className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px] font-black uppercase hover:bg-white/20">+ Regional</button>
                      </div>
                    )}
                    <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isCorpExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </summary>
                <div className="p-6 bg-[#fcfdfe] border-t border-slate-100 space-y-8 animate-in slide-in-from-top-2">
                  <ContactInfoGrid title="Global Headquarters Management Contacts" contacts={corp.additionalContacts} entity={corp} onEdit={(e) => handleOpenModal('corporate', null, e)} isSuperAdmin={isSuperAdmin} />
                  <MasterDataSection entity={corp} entities={entities} title="Global Master Definitions" color="bg-blue-600" icon={ShieldCheck} canEdit={canEditMasterData} newDept={newDept} setNewDept={setNewDept} newRole={newRole} setNewRole={setNewRole} onAdd={handleAddMasterData} onRemove={handleRemoveMasterData} onRename={setRenameState} />
                  <div className="space-y-4">
                    {corp.regionals.map((reg:any) => {
                      const regStats = getStats(reg.units);
                      const isRegExpanded = expandedRegId === reg.id;
                      return (
                        <details key={reg.id} open={isRegExpanded} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                          <summary onClick={(e) => { e.preventDefault(); setExpandedRegId(isRegExpanded ? null : reg.id); }} className="flex items-center justify-between list-none cursor-pointer bg-[#457b9d] text-white px-5 py-3 select-none">
                            <div className="flex items-center gap-3"><Globe size={18} /> <span className="font-bold text-sm">{reg.name}</span>{reg.entityIdNum && <span className="text-[9px] font-mono bg-white/20 px-1.5 rounded">{reg.entityIdNum}</span>}</div>
                            <div className="flex items-center gap-2"><StatusBadge label="Units" count={reg.units.length} /><ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isRegExpanded ? 'rotate-180' : ''}`} /></div>
                          </summary>
                          <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6">
                             <ContactInfoGrid title="Regional Office Access Contacts" contacts={reg.additionalContacts} entity={reg} onEdit={(e) => handleOpenModal('regional', null, e)} isSuperAdmin={isSuperAdmin} />
                             <div className="flex justify-end items-center gap-2">
                                {isSuperAdmin && (
                                  <>
                                      <button onClick={() => { setUploadContext({ type: 'unit', parentId: reg.id }); csvInputRef.current?.click(); }} className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-black uppercase hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"><Upload size={14}/> Bulk Upload Units</button>
                                      <button onClick={() => handleOpenModal('unit', reg.id)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase shadow-md transition-all active:scale-95">+ Add Unit</button>
                                  </>
                                )}
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                                {reg.units.map((unit:any) => <UnitCard key={unit.id} unit={unit} onEdit={u => handleOpenModal('unit', null, u)} onToggleStatus={id => onUpdateEntity({...unit, status: unit.status === 'active' ? 'inactive' : 'active'})} isSuperAdmin={isSuperAdmin} onOpenPermissions={onOpenPermissions} onOpenDeptControl={() => openDeptControl(unit.name)} />)}
                             </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
        <LicenseDashboardWrapper entities={entities} onUpdateEntity={onUpdateEntity} currentScope={currentScope} userRootId={userRootId} licenseSchema={licenseSchema} setLicenseSchema={setLicenseSchema} />
      </div>
  );
};
export default CorporateManagement;