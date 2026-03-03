"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Camera, 
  AlertTriangle, 
  FileText, 
  Search,
  PenTool,
  Save,
  X,
  History,
  Info,
  MapPin,
  Building2,
  Users,
  Target,
  ArrowRight,
  ClipboardList,
  Zap,
  BarChart3,
  Calendar,
  Layout,
  MoreVertical,
  Archive,
  Eye,
  Award
} from 'lucide-react';
import { HierarchyScope, Entity, AuditTask, AuditQuestion, AuditTaskStatus } from '../types';

interface AuditorLaunchpadProps {
  currentScope: HierarchyScope;
  userRootId?: string | null;
  entities: Entity[];
}

// --- MOCK AUDITS DATA ---
const INITIAL_TASKS: AuditTask[] = [
    {
        id: 'AUD-2025-001',
        title: 'Q2 Hygiene Audit',
        unitId: 'unit-ny-kitchen',
        unitName: 'NYC Central Kitchen',
        department: 'Main Kitchen',
        auditorId: 'super-admin', 
        auditorName: 'Super Administrator',
        scheduledDate: new Date().toISOString().split('T')[0],
        status: 'Scheduled',
        progress: 0,
        checklistId: 'CL-HYG',
        checklistName: 'Standard Hygiene Protocol',
        questions: [
            { id: 'q1', text: 'Floor is clean and free of stagnant water?', clause: '8.2.4', response: undefined },
            { id: 'q2', text: 'Personnel wearing designated PPE?', clause: '8.2.4.c', response: undefined },
            { id: 'q3', text: 'Chiller temperature maintained at 1-4°C?', clause: '8.2.4.2', response: undefined },
            { id: 'q4', text: 'Cross-contamination risks identified?', clause: '8.5.2', response: undefined },
            { id: 'q5', text: 'Chemicals stored away from food prep area?', clause: '8.2.4.b', response: undefined }
        ]
    },
    {
        id: 'AUD-2025-002',
        title: 'Glass & Plastic Audit',
        unitId: 'unit-ny-kitchen',
        unitName: 'NYC Central Kitchen',
        department: 'Cold Storage',
        auditorId: 'super-admin',
        auditorName: 'Super Administrator',
        scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        status: 'Completed',
        progress: 100,
        checklistId: 'CL-GLS',
        checklistName: 'Glass & Brittle Plastic Control',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        questions: []
    },
    {
        id: 'AUD-2025-003',
        title: 'Overdue Compliance Check',
        unitId: 'unit-la-depot',
        unitName: 'LA Logistics Unit',
        department: 'Receiving Bay',
        auditorId: 'super-admin',
        auditorName: 'Super Administrator',
        scheduledDate: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
        status: 'Overdue',
        progress: 0,
        checklistId: 'CL-RCV',
        checklistName: 'Inbound Vehicle Inspection',
        questions: []
    }
];

const AuditorLaunchpad: React.FC<AuditorLaunchpadProps> = ({ currentScope, userRootId, entities }) => {
    const [tasks, setTasks] = useState<AuditTask[]>(INITIAL_TASKS);
    const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Derived State
    const activeAudit = useMemo(() => 
        tasks.find(t => t.id === activeAuditId), 
    [tasks, activeAuditId]);

    const myTasks = useMemo(() => {
        return tasks.filter(t => t.auditorId === userRootId || userRootId === 'super-admin');
    }, [tasks, userRootId]);

    const filteredTasks = useMemo(() => {
        return myTasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 t.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 t.checklistName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const isFinished = t.status === 'Completed' || t.status === 'Under Review';
            const matchesToggle = showHistory ? isFinished : !isFinished;
            
            return matchesSearch && matchesToggle;
        });
    }, [myTasks, searchTerm, showHistory]);

    // Handlers
    const launchAudit = (taskId: string) => {
        setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, status: 'In Progress', startTime: t.startTime || new Date().toISOString() } : t
        ));
        setActiveAuditId(taskId);
        setActiveQuestionIdx(0);
    };

    const handleResponse = (questionId: string, response: 'Yes' | 'No' | 'NA') => {
        if (!activeAuditId) return;
        setTasks(prev => prev.map(t => {
            if (t.id !== activeAuditId) return t;
            const updatedQuestions = t.questions.map(q => 
                q.id === questionId ? { ...q, response } : q
            );
            const answeredCount = updatedQuestions.filter(q => q.response).length;
            const progress = Math.round((answeredCount / updatedQuestions.length) * 100);
            return { ...t, questions: updatedQuestions, progress };
        }));

        if (activeQuestionIdx < (activeAudit?.questions.length || 0) - 1) {
            setTimeout(() => setActiveQuestionIdx(prev => prev + 1), 300);
        }
    };

    const submitAudit = () => {
        if (!activeAuditId) return;
        setTasks(prev => prev.map(t => 
            t.id === activeAuditId ? { ...t, status: 'Completed', endTime: new Date().toISOString(), progress: 100 } : t
        ));
        setActiveAuditId(null);
        setShowSummaryModal(false);
        alert("Audit Record Synchronized with Master Registry.");
    };

    if (activeAudit) {
        const currentQ = activeAudit.questions[activeQuestionIdx];
        const progress = activeAudit.progress;

        return (
            <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in fade-in duration-300">
                <div className="px-8 py-6 bg-slate-900 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{activeAudit.checklistName}</h3>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Executing: {activeAudit.unitName} • {activeAudit.department}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Elapsed</span>
                            <span className="text-sm font-black text-white font-mono">
                                {activeAudit.startTime ? Math.floor((Date.now() - new Date(activeAudit.startTime).getTime()) / 60000) : 0}m
                            </span>
                        </div>
                        <button 
                            onClick={() => setActiveAuditId(null)}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-400"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="h-1.5 w-full bg-white/5 overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-12 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
                    <div className="w-full max-w-3xl space-y-12">
                        
                        <div className="flex justify-between items-center">
                            <button 
                                disabled={activeQuestionIdx === 0}
                                onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                            >
                                <ChevronRight size={24} className="rotate-180" />
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Question {activeQuestionIdx + 1} of {activeAudit.questions.length}</span>
                                <div className="flex gap-1.5">
                                    {activeAudit.questions.map((_, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => setActiveQuestionIdx(i)}
                                            className={`w-2.5 h-1.5 rounded-full transition-all cursor-pointer ${i === activeQuestionIdx ? 'w-8 bg-indigo-500 shadow-[0_0_8px_indigo]' : activeAudit.questions[i].response ? 'bg-indigo-900' : 'bg-white/10'}`} 
                                        />
                                    ))}
                                </div>
                            </div>
                            <button 
                                disabled={activeQuestionIdx === activeAudit.questions.length - 1}
                                onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ClipboardList size={140} />
                            </div>
                            
                            <div className="relative z-10 space-y-8">
                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    ISO Clause {currentQ.clause}
                                </span>
                                
                                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight">
                                    {currentQ.text}
                                </h2>

                                <div className="grid grid-cols-3 gap-4 pt-6">
                                    {[
                                        { id: 'Yes' as const, label: 'Compliant', color: 'bg-emerald-600', icon: CheckCircle2 },
                                        { id: 'No' as const, label: 'Non-Comp', color: 'bg-rose-600', icon: AlertTriangle },
                                        { id: 'NA' as const, label: 'N/A', color: 'bg-slate-700', icon: Info },
                                    ].map((btn) => (
                                        <button
                                            key={btn.id}
                                            onClick={() => handleResponse(currentQ.id, btn.id)}
                                            className={`
                                                p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3
                                                ${currentQ.response === btn.id 
                                                    ? `${btn.color} border-white/20 shadow-2xl scale-105 text-white` 
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}
                                            `}
                                        >
                                            <btn.icon size={28} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-[2rem] text-slate-300 hover:bg-white/10 hover:text-white transition-all group">
                                <Camera size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Attach Photo</span>
                            </button>
                            <button className="flex items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-[2rem] text-slate-300 hover:bg-white/10 hover:text-white transition-all group">
                                <FileText size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Add Finding Note</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-900 border-t border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4 text-slate-500">
                        <Users size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Audit Team: {activeAudit.auditorName}</span>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            className="px-10 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10"
                        >
                            Save for later
                        </button>
                        <button 
                            onClick={() => setShowSummaryModal(true)}
                            className="px-14 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
                        >
                            Submit Findings
                        </button>
                    </div>
                </div>

                {showSummaryModal && (
                    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                            <div className="p-10 text-center space-y-6">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Review & Certify</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    By submitting this report, you certify that all observations have been accurately recorded in accordance with the FSMS Internal Audit Protocol.
                                </p>
                                
                                <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-slate-900">{activeAudit.questions.filter(q => q.response === 'Yes').length}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Compliant</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-rose-600">{activeAudit.questions.filter(q => q.response === 'No').length}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NC Identified</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-slate-900">{activeAudit.questions.filter(q => q.response === 'NA').length}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Not Applicable</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left ml-2 mb-2">Final Attestation (Digital Signature)</label>
                                    <div className="w-full h-32 bg-slate-50 border-2 border-slate-100 border-dashed rounded-3xl flex items-center justify-center text-slate-300">
                                        <PenTool size={32} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setShowSummaryModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest">Back to Checklist</button>
                                <button onClick={submitAudit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95">Commit Registry Sync</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Header Terminal */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                <div className="flex items-center gap-4 md:gap-6 z-10">
                    <div className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner border border-indigo-100">
                        <Zap size={28} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Internal Audit <span className="text-indigo-600">Launchpad</span></h2>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ShieldCheck size={12} className="text-emerald-500" /> Authorized Mission Queue
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto">
                    {/* History Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                        <button 
                            onClick={() => setShowHistory(false)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showHistory ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-400'}`}
                        >
                            Active Tasks
                        </button>
                        <button 
                            onClick={() => setShowHistory(true)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-400'}`}
                        >
                            History
                        </button>
                    </div>

                    <div className="relative group w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Filter registry..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-wider focus:outline-none focus:border-indigo-400 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Task List: Responsive Layout */}
            <div className="flex flex-col gap-6">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => {
                    const isOverdue = task.status === 'Overdue';
                    const isInProgress = task.status === 'In Progress';
                    const isCompleted = task.status === 'Completed';
                    
                    return (
                        <div key={task.id} className={`bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden group shadow-sm hover:shadow-2xl ${isCompleted ? 'bg-emerald-50/10 border-emerald-200' : isInProgress ? 'border-amber-400' : isOverdue ? 'border-rose-300' : 'border-slate-100 hover:border-indigo-200'}`}>
                            
                            {/* DESKTOP: SINGLE ROW (MD+) */}
                            <div className="hidden md:flex flex-row items-stretch divide-x divide-slate-100">
                                
                                {/* Identity (30%) */}
                                <div className="p-8 w-[30%] flex items-start gap-6 relative shrink-0">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-500 ${isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-amber-500' : isOverdue ? 'bg-rose-500' : 'bg-blue-600'}`} />
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isInProgress ? 'bg-amber-100 text-amber-600' : isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <ClipboardList size={32} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isInProgress ? 'bg-amber-50 text-amber-700 border-amber-100' : isOverdue ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                    {task.status}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-slate-300">#{task.id}</span>
                                            </div>
                                            {isCompleted && <button className="p-2 text-slate-200 hover:text-slate-400" title="Archive"><Archive size={14}/></button>}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight truncate mb-1.5 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                            <FileText size={14} className="text-indigo-500" />
                                            {task.checklistName}
                                        </div>
                                    </div>
                                </div>

                                {/* Logistics (45%) */}
                                <div className="p-8 w-[45%] flex flex-row gap-8 bg-slate-50/20 shrink-0">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 shadow-sm group-hover:text-indigo-600 transition-colors"><Building2 size={20} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Mission Node</p>
                                            <p className="text-xs font-black text-slate-800 uppercase leading-snug">{task.unitName}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 italic">{task.department}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 shadow-sm group-hover:text-indigo-600 transition-colors"><Clock size={20} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled Window</p>
                                            <p className="text-sm font-black text-slate-800 uppercase">
                                                {new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions (25%) */}
                                <div className="p-8 flex-1 flex flex-col justify-center items-center bg-white">
                                    {isCompleted ? (
                                        <div className="w-full flex flex-col items-center gap-3">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-emerald-600 tracking-tighter">94%</span>
                                                <span className="text-[10px] font-black text-slate-300 uppercase">Final Grade A</span>
                                            </div>
                                            <button 
                                                className="w-full xl:w-auto px-10 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Eye size={14} /> View Final Summary
                                            </button>
                                        </div>
                                    ) : isInProgress ? (
                                        <div className="w-full space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Progress</span>
                                                    <span className="text-2xl font-black text-indigo-600 tracking-tighter">{task.progress}%</span>
                                                </div>
                                                <button 
                                                    onClick={() => setActiveAuditId(task.id)}
                                                    className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Resume <ChevronRight size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${task.progress}%` }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => launchAudit(task.id)}
                                            className="w-full px-12 py-5 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-4 group"
                                        >
                                            <Play size={20} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" /> 
                                            <span>Launch Mission</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* MOBILE: NATIVE APP STYLE CARD (<MD) */}
                            <div className="md:hidden flex flex-col relative">
                                {isCompleted && (
                                    <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center overflow-hidden">
                                        <ShieldCheck size={140} className="rotate-12" />
                                    </div>
                                )}
                                <div className="p-5 flex justify-between items-start border-b border-slate-50 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isInProgress ? 'bg-amber-100 text-amber-600' : isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <ClipboardList size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-mono font-bold text-slate-300">#{task.id}</span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isInProgress ? 'bg-amber-50 text-amber-700 border-amber-100' : isOverdue ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight truncate leading-none">{task.title}</h3>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-xl text-slate-300 relative z-20">
                                        <MoreVertical size={16} />
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50/30 space-y-4 relative z-10">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Form Logic</p>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase">
                                                <FileText size={12} className="text-indigo-500" /> {task.checklistName.split(' ')[0]}...
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheduled</p>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase">
                                                <Calendar size={12} className="text-indigo-500" /> {new Date(task.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Registry Context</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-slate-800 uppercase truncate leading-none mb-1">{task.unitName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{task.department}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {isCompleted ? (
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-inner flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-emerald-700">
                                                <Award size={20} />
                                                <span className="text-xs font-black uppercase tracking-widest">Registry Result</span>
                                            </div>
                                            <span className="text-2xl font-black text-emerald-600">94%</span>
                                        </div>
                                    ) : isInProgress && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black px-1">
                                                <span className="text-slate-400 uppercase tracking-widest">Progress</span>
                                                <span className="text-indigo-600">{task.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600" style={{ width: `${task.progress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Primary Action Bar */}
                                <div className="p-5 border-t border-slate-100 bg-white relative z-10">
                                    <button 
                                        onClick={() => isCompleted ? null : isInProgress ? setActiveAuditId(task.id) : launchAudit(task.id)}
                                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all ${isCompleted ? 'bg-emerald-600 text-white shadow-emerald-100' : isInProgress ? 'bg-indigo-600 text-white shadow-indigo-100' : isOverdue ? 'bg-rose-600 text-white shadow-rose-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
                                    >
                                        {isCompleted ? (
                                            <><Eye size={16} /> View Final Summary</>
                                        ) : isInProgress ? (
                                            <>Resume Registry Audit <ChevronRight size={16} strokeWidth={3}/></>
                                        ) : (
                                            <>Launch Audit Mission <Play size={16} fill="currentColor" strokeWidth={3}/></>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </div>
                    );
                }) : (
                    <div className="col-span-full py-40 text-center flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200 shadow-inner ring-8 ring-slate-50/50">
                            <Target size={48} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Registry Node Empty</h3>
                        <p className="text-slate-400 text-xs mt-3 font-bold uppercase tracking-[0.3em] max-w-sm leading-relaxed">
                            No assignments identified for this filter state.
                        </p>
                        <button onClick={() => setShowHistory(false)} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Back to Active Assignments</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditorLaunchpad;