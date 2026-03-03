"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Play, 
  Edit, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Trash2,
  Save,
  X,
  Calendar,
  BarChart3,
  ArrowRight,
  Copy,
  GripVertical,
  Link2,
  Check,
  PlusCircle,
  FileDown,
  MoreHorizontal,
  FileSpreadsheet,
  Download,
  MapPin,
  Type,
  CheckSquare,
  ImageIcon,
  SlidersHorizontal,
  PenTool,
  Pencil,
  GripHorizontal,
  Eye,
  Monitor,
  Smartphone,
  Info,
  ShieldCheck,
  ChevronLeft,
  Undo2,
  Redo2,
  Cloud,
  Settings,
  UserPlus,
  MoreVertical as MoreIcon,
  ArrowLeft,
  ChevronRight,
  Layout as SectionIcon,
  MessageSquare,
  PlusSquare
} from 'lucide-react';
import { MandatoryProtocol } from '../types';

// --- Internal Types ---

type RiskLevel = 'Low' | 'Medium' | 'High';
type SectionRisk = 'Indiv.' | 'Low' | 'Med' | 'High';

interface ResponseOption {
  id: string;
  text: string;
  color: string;
  isFlagged: boolean;
  score: string;
}

interface ResponseSet {
  id: string;
  label: string;
  responses: ResponseOption[];
}

interface QuestionNode {
  id: string;
  text: string;
  responseType: string;
  responses: ResponseOption[];
  risk: RiskLevel;
  requirement: string;
  isRequired: boolean;
  isMultipleSelection: boolean;
  isFlagged: boolean;
  flaggedValue: string;
}

interface SectionNode {
  id: string;
  title: string;
  isApplicable: boolean;
  risk: SectionRisk;
  questions: QuestionNode[];
}

interface PageNode {
  id: string;
  title: string;
  sections: SectionNode[];
}

interface ChecklistTemplate {
  id: string;
  title: string;
  department: string;
  frequency: string;
  questionCount: number;
  lastUpdated: string;
  status: 'Active' | 'Draft' | 'Archived';
  history: any[];
  pages: PageNode[];
  unitDetails: {
    companyName: string;
    repName: string;
    address: string;
    contact: string;
    email: string;
    manday: string;
    scope: string;
    dateFrom: string;
    dateTo: string;
    geotag: string;
    startTime: string;
  };
}

// --- Constants ---

const PREDEFINED_COLORS = [
  '#a0aec0', '#13855f', '#ef4444', '#f59e0b', '#6366f1', '#6e42ff',
  '#ffedd5', '#fef9c3', '#dbeafe', '#dcfce7', '#ccfbf1', '#e0f2fe'
];

// --- Sub-Components ---

/**
 * SCORE BADGE HELPER
 */
const ScoreBadge = ({ score, status }: { score: number, status: string }) => {
  const isCompleted = status === 'Completed';
  if (!isCompleted) return <span className="text-xs font-bold text-slate-400">--</span>;
  const color = score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-blue-600' : 'text-rose-600';
  return (
    <div className="flex flex-col items-end">
      <span className={`text-sm font-black ${color}`}>{score}%</span>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Audit Score</span>
    </div>
  );
};

/**
 * HIGH-FIDELITY ADD TOOLBOX
 */
const AddToolbox = ({ 
  onAddQuestion, 
  onAddSection, 
  isVisible 
}: { 
  onAddQuestion: () => void, 
  onAddSection: () => void, 
  isVisible: boolean 
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute -left-16 sm:-left-20 top-0 z-[100] animate-in fade-in slide-in-from-right-2 duration-300 pointer-events-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-2 flex flex-col items-center gap-2.5 relative min-w-[70px]">
        <button 
          onClick={(e) => { e.stopPropagation(); onAddQuestion(); }}
          className="flex flex-col items-center gap-1 group transition-all hover:scale-105 active:scale-95 w-full"
        >
          <div className="text-[#13855f] transition-colors group-hover:bg-emerald-50 rounded-lg p-1">
            <Plus size={28} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-medium text-slate-500 leading-none">Question</span>
        </button>
        <div className="w-8 h-px bg-slate-100" />
        <button 
          onClick={(e) => { e.stopPropagation(); onAddSection(); }}
          className="flex flex-col items-center gap-1 group transition-all hover:scale-105 active:scale-95 w-full pb-1"
        >
          <div className="text-[#6e42ff] transition-colors group-hover:bg-indigo-50 rounded-lg p-1">
            <div className="w-7 h-6 border-2 border-current rounded-[4px] relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-current" />
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500 leading-none">Section</span>
        </button>
        <div className="absolute top-1/2 -translate-y-1/2 -right-[9px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-white drop-shadow-[1px_0_1px_rgba(0,0,0,0.05)]" />
      </div>
    </div>
  );
};

/**
 * CHECKLIST PREVIEW OVERLAY (MATCHING AUDIT EXECUTION UI)
 */
const ChecklistPreview = ({ 
  checklist, 
  onClose 
}: { 
  checklist: ChecklistTemplate, 
  onClose: () => void 
}) => {
  const [viewDevice, setViewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activePageIdx, setActivePageIdx] = useState(0);

  const activePage = checklist.pages[activePageIdx];

  const PreviewContent = () => (
    <div className="flex flex-col h-full bg-[#f0f2f5] text-left overflow-y-auto custom-scrollbar">
      
      {/* 1. Page Header Section */}
      <div className="p-4 md:p-6 sticky top-0 z-50 bg-[#f0f2f5]">
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4 min-w-0">
             <span className="text-slate-400 font-bold shrink-0">►</span>
             <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 leading-none mb-1">Page {activePageIdx + 1} of {checklist.pages.length || 1}</p>
                <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight truncate">{checklist.title || "Audit Checklist"}</h2>
             </div>
           </div>
           <div className="flex items-center gap-4 shrink-0">
              <button className="p-1 text-slate-400"><MoreIcon size={16}/></button>
              <div className="text-right whitespace-nowrap">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Score: <span className="text-slate-900 font-black">0/0 (0%)</span></p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Unanswered: <span className="text-slate-900 font-black">0</span></p>
              </div>
           </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-12 space-y-6">
        {activePage?.sections.map((section, sidx) => (
          <div key={section.id} className="space-y-4">
            
            {/* 2. Category Level (Kitchen 1 Operations...) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50">
                 <div className="flex items-center gap-4">
                   <span className="text-slate-400 font-bold shrink-0">►</span>
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{section.title}</h3>
                 </div>
                 <div className="flex items-center gap-4">
                    <button className="p-1 text-slate-400"><MoreIcon size={16}/></button>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Score: <span className="text-slate-900 font-black">0/0 (0%)</span></p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Unanswered: <span className="text-slate-900 font-black">0</span></p>
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-white">
                <p className="text-xs font-bold text-slate-700 mb-3">Is this category applicable?</p>
                <div className="flex gap-6">
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center p-0.5"><div className="w-full h-full bg-indigo-600 rounded-full" /></div>
                      <span className="text-xs font-bold text-slate-700">Yes</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      <span className="text-xs font-bold text-slate-500">No</span>
                   </label>
                </div>
              </div>
            </div>

            {/* 3. Sub-section Level (Purple Header - General Cleanliness...) */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-[#664DE5] px-4 py-3 flex items-center justify-between text-white">
                 <div className="flex items-center gap-4">
                   <span className="text-white/60 font-bold shrink-0">►</span>
                   <h3 className="text-sm font-black uppercase tracking-tight truncate">General Cleanliness - Sub-topic Details</h3>
                 </div>
                 <div className="flex items-center gap-4 shrink-0">
                    <Info size={16} className="text-white/80" />
                    <div className="text-right whitespace-nowrap">
                      <p className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">Score: <span className="text-white font-black">0/0 (0%)</span></p>
                      <p className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">Unanswered: <span className="text-white font-black">0</span></p>
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-white border-b border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-3">Is this parameter applicable?</p>
                <div className="flex gap-6">
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center p-0.5"><div className="w-full h-full bg-indigo-600 rounded-full" /></div>
                      <span className="text-xs font-bold text-slate-700">Yes</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      <span className="text-xs font-bold text-slate-500">No</span>
                   </label>
                </div>
              </div>

              {/* 4. Question Blocks (Red Bordered) */}
              <div className="bg-[#f8f9fa] p-4 space-y-4">
                {section.questions.map((q) => (
                  <div key={q.id} className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-rose-500 p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <p className="text-sm font-bold text-slate-800 leading-snug flex-1">{q.text || "New Question node pending text..."}</p>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Marks: <span className="text-slate-900 font-black">--/{q.risk === 'High' ? '2' : '1'} (--%)</span></span>
                            <Info size={14} className="text-slate-400" />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                       {['Yes', 'No', 'NA'].map(label => (
                          <button key={label} className="flex-1 min-w-[80px] py-2 border-2 border-slate-200 rounded-lg text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:bg-slate-50 transition-all">
                             {label}
                          </button>
                       ))}
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                        <button className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                           <MessageSquare size={14}/> Add Comment
                        </button>
                        <button className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                           <PlusSquare size={14}/> Create action
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating Action Button (Global Notes) */}
      <div className="fixed bottom-10 right-10 z-[600] pointer-events-auto">
          <button className="w-14 h-14 bg-[#664DE5] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <ClipboardList size={28} />
          </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="px-10 py-6 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
            <Eye size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Checklist Preview</h3>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Simulation Mode</p>
          </div>
        </div>

        <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl">
           <button onClick={() => setViewDevice('desktop')} className={`p-2.5 rounded-xl transition-all ${viewDevice === 'desktop' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-white'}`}><Monitor size={20}/></button>
           <button onClick={() => setViewDevice('mobile')} className={`p-2.5 rounded-xl transition-all ${viewDevice === 'mobile' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-white'}`}><Smartphone size={20}/></button>
        </div>

        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
          <X size={32} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-hidden">
         {viewDevice === 'desktop' ? (
           <div className="w-full h-full max-w-6xl bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500">
              <PreviewContent />
           </div>
         ) : (
           <div className="relative w-[340px] h-[720px] bg-[#1a1a1a] rounded-[3.5rem] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-[8px] border-[#333] animate-in zoom-in-95 duration-500 flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#333] rounded-b-2xl z-50 flex items-center justify-center">
                 <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>
              <div className="flex-1 bg-white rounded-[2.5rem] overflow-hidden">
                <PreviewContent />
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-600 rounded-full" />
           </div>
         )}
      </div>
    </div>
  );
};

/**
 * COLOR PICKER POPUP
 */
const ColorPicker = ({ activeColor, onSelect, onClose, position }: { activeColor: string, onSelect: (c: string) => void, onClose: () => void, position: { top: number, left: number } }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={ref}
      style={{ top: position.top, left: position.left }}
      className="fixed z-[450] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-64 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-inner" style={{ backgroundColor: activeColor }} />
        <input 
          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none"
          value={activeColor}
          readOnly
        />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {PREDEFINED_COLORS.map(c => (
          <button 
            key={c}
            onClick={() => { onSelect(c); onClose(); }}
            className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${activeColor === c ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-md' : 'border-transparent shadow-sm'}`}
            style={{ backgroundColor: c }}
          >
            {activeColor === c && <Check size={14} className="mx-auto text-white" strokeWidth={4} />}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * MULTIPLE CHOICE RESPONSES MODAL
 */
const MultipleChoiceModal = ({ 
  initialResponses, 
  onSave, 
  onClose 
}: { 
  initialResponses: ResponseOption[], 
  onSave: (resps: ResponseOption[]) => void, 
  onClose: () => void 
}) => {
  const [responses, setResponses] = useState<ResponseOption[]>(initialResponses.length > 0 ? initialResponses : [
    { id: '1', text: 'Option 1', color: '#a0aec0', isFlagged: false, score: '' },
    { id: '2', text: 'Option 2', color: '#a0aec0', isFlagged: false, score: '' }
  ]);
  const [isScoringEnabled, setIsScoringEnabled] = useState(true);
  const [colorPicker, setColorPicker] = useState<{ id: string, top: number, left: number } | null>(null);

  const addOption = () => {
    setResponses([...responses, {
      id: `opt-${Date.now()}`,
      text: `Option ${responses.length + 1}`,
      color: '#a0aec0',
      isFlagged: false,
      score: ''
    }]);
  };

  const removeOption = (id: string) => {
    if (responses.length <= 1) return;
    setResponses(responses.filter(r => r.id !== id));
  };

  const updateOption = (id: string, field: keyof ResponseOption, value: any) => {
    setResponses(responses.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleColorClick = (e: React.MouseEvent, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setColorPicker({
      id,
      top: rect.top,
      left: rect.right + 10
    });
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-10 pb-6 flex justify-between items-start">
          <div className="text-left">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">Multiple choice responses</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">e.g. New Option Set</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer group select-none mt-1">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isScoringEnabled} 
                onChange={e => setIsScoringEnabled(e.target.checked)} 
              />
              <div className="w-6 h-6 rounded-lg border-2 border-slate-300 peer-checked:bg-[#6e42ff] peer-checked:border-[#6e42ff] flex items-center justify-center transition-all group-hover:border-indigo-400">
                <Check size={14} className={`text-white transition-opacity ${isScoringEnabled ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
              </div>
            </div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Scoring</span>
          </label>
        </div>

        <div className="px-10 py-4 overflow-y-auto max-h-[50vh] custom-scrollbar space-y-6">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] block ml-12">Response</span>
          
          <div className="space-y-6">
            {responses.map((opt) => (
              <div key={opt.id} className="flex gap-4 items-start animate-in slide-in-from-left-2">
                <div className="pt-4 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-400 transition-colors">
                  <GripVertical size={20} />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="relative group">
                    <input 
                      className="w-full bg-white border-2 border-indigo-400 rounded-xl p-4 text-sm font-bold text-slate-800 outline-none pr-12 focus:ring-4 focus:ring-indigo-50 transition-all"
                      value={opt.text}
                      onChange={e => updateOption(opt.id, 'text', e.target.value)}
                    />
                    <button 
                      onClick={(e) => handleColorClick(e, opt.id)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 hover:scale-110 transition-transform" 
                      style={{ backgroundColor: opt.color }}
                    />
                  </div>
                  <div className="flex items-center gap-6 px-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={opt.isFlagged}
                          onChange={e => updateOption(opt.id, 'isFlagged', e.target.checked)}
                        />
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:bg-[#6e42ff] peer-checked:border-[#6e42ff] flex items-center justify-center transition-all group-hover:border-indigo-400">
                          <Check size={12} className={`text-white transition-opacity ${opt.isFlagged ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Mark as flagged</span>
                    </label>
                    
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-px bg-slate-200" />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Score:</span>
                        <input 
                          disabled={!isScoringEnabled}
                          type="text"
                          className="w-16 bg-white border-2 border-slate-100 rounded-xl p-2 text-center text-xs font-black outline-none focus:border-indigo-400 transition-all disabled:opacity-20"
                          value={opt.score}
                          onChange={e => updateOption(opt.id, 'score', e.target.value)}
                        />
                      </div>
                      <div className="h-4 w-px bg-slate-200" />
                      <button 
                        onClick={() => removeOption(opt.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={addOption}
            className="flex items-center gap-2 text-indigo-600 text-[11px] font-black uppercase tracking-widest ml-12 hover:underline"
          >
            <Plus size={16} strokeWidth={3} /> Add Response
          </button>
        </div>

        <div className="p-10 pt-6 border-t border-slate-100 flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">Cancel</button>
          <button 
            onClick={() => onSave(responses)}
            className="px-12 py-3 bg-[#6e42ff] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-[#5a35d0] transition-all"
          >
            Save and apply
          </button>
        </div>
      </div>

      {colorPicker && (
        <ColorPicker 
          activeColor={responses.find(r => r.id === colorPicker.id)?.color || '#a0aec0'}
          position={{ top: colorPicker.top, left: colorPicker.left }}
          onSelect={(c) => updateOption(colorPicker.id, 'color', c)}
          onClose={() => setColorPicker(null)}
        />
      )}
    </div>
  );
};

/**
 * RESPONSE TYPE SELECTOR POPUP
 */
const ResponseTypeSelector = ({ 
  onClose, 
  onSelect,
  onOpenRichEditor,
  availableSets
}: { 
  onClose: () => void, 
  onSelect: (type: string, responses: ResponseOption[]) => void,
  onOpenRichEditor: () => void,
  availableSets: ResponseSet[]
}) => {
  const [search, setSearch] = useState("");

  const technicalInputs = [
    { id: 'text', label: 'Text answer', icon: Type, color: 'text-orange-500 bg-orange-50' },
    { id: 'number', label: 'Number', icon: () => <span className="font-bold text-[10px]">123</span>, color: 'text-amber-500 bg-amber-50' },
    { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'text-blue-500 bg-blue-50' },
    { id: 'datetime', label: 'Date & Time', icon: Calendar, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'media', label: 'Media', icon: ImageIcon, color: 'text-teal-500 bg-teal-50' },
    { id: 'slider', label: 'Slider', icon: SlidersHorizontal, color: 'text-sky-500 bg-sky-50' },
    { id: 'annotation', label: 'Annotation', icon: PenTool, color: 'text-yellow-600 bg-yellow-50' }
  ];

  return (
    <div className="absolute right-0 top-full mt-2 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[100] w-[520px] overflow-hidden flex animate-in fade-in slide-in-from-top-2 duration-300 text-left">
      <div className="w-[60%] p-6 border-r border-slate-50 flex flex-col gap-6">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner"
            placeholder="Search responses"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar">
          <div className="flex items-center justify-between">
             <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Multiple choice</h4>
             <button onClick={onOpenRichEditor} className="text-[11px] font-bold text-[#6e42ff] hover:underline">Add responses</button>
          </div>
          
          <div className="space-y-3">
             {availableSets.filter(s => s.label.toLowerCase().includes(search.toLowerCase())).map(opt => (
                <div key={opt.id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors" onClick={() => onSelect('multiple', opt.responses)}>
                    <div className="flex gap-1.5 min-w-0">
                       {opt.responses.map(r => (
                          <span 
                            key={r.id} 
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border truncate`}
                            style={{ 
                              backgroundColor: `${r.color}15`, 
                              color: r.color, 
                              borderColor: `${r.color}25` 
                            }}
                          >
                             {r.text}
                          </span>
                       ))}
                    </div>
                    <Pencil size={14} className="text-slate-300 group-hover:text-[#6e42ff] transition-colors shrink-0" />
                </div>
             ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-50">
            <h4 className="text-[13px] font-black text-slate-700 uppercase tracking-widest mb-2">Global response sets</h4>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">
              Create global response sets to use them across multiple templates.
            </p>
        </div>
      </div>

      <div className="w-[40%] bg-slate-50/50 p-6 flex flex-col gap-1.5 overflow-y-auto">
          {technicalInputs.map((input) => (
             <React.Fragment key={input.id}>
                {input.id === 'datetime' && <div className="h-px bg-slate-100 my-2 mx-2" />}
                {input.id === 'annotation' && <div className="h-px bg-slate-100 my-2 mx-2" />}
                <button 
                  onClick={() => onSelect(input.id, [])}
                  className="w-full flex items-center gap-4 p-2.5 rounded-xl hover:bg-white transition-all group text-left"
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${input.color}`}>
                        <input.icon size={16} />
                    </div>
                    <span className="text-[12px] font-black text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{input.label}</span>
                </button>
             </React.Fragment>
          ))}
      </div>
    </div>
  );
};

/**
 * HIGH FIDELITY AUDIT CHECKLIST CREATOR
 */
const ChecklistCreator = ({ 
  checklist, 
  onSave, 
  onCancel 
}: { 
  checklist: ChecklistTemplate, 
  onSave: (c: ChecklistTemplate) => void, 
  onCancel: () => void 
}) => {
  const [responseSets, setResponseSets] = useState<ResponseSet[]>([
    { id: 'yn', label: 'Yes/No/NA', responses: [
      { id: '1', text: 'Yes', color: '#13855f', isFlagged: false, score: '1' },
      { id: '2', text: 'No', color: '#ef4444', isFlagged: true, score: '0' },
      { id: '3', text: 'N/A', color: '#a0aec0', isFlagged: false, score: '' }
    ] },
    { id: 'gfp', label: 'Good/Fair/Poor', responses: [
      { id: '1', text: 'Good', color: '#13855f', isFlagged: false, score: '1' },
      { id: '2', text: 'Fair', color: '#f59e0b', isFlagged: false, score: '0.5' },
      { id: '3', text: 'Poor', color: '#ef4444', isFlagged: true, score: '0' }
    ] }
  ]);

  const [workingDoc, setWorkingDoc] = useState<ChecklistTemplate>(() => ({
    ...checklist,
    pages: checklist.pages.length > 0 ? checklist.pages : [{
      id: 'p1',
      title: 'Initial Page',
      sections: [{
        id: 's1',
        title: 'Section Title',
        isApplicable: true,
        risk: 'Indiv.',
        questions: [{
          id: 'q1',
          text: '',
          responseType: 'multiple',
          responses: [
            { id: '1', text: 'Yes', color: '#13855f', isFlagged: false, score: '1' },
            { id: '2', text: 'No', color: '#ef4444', isFlagged: true, score: '0' },
            { id: '3', text: 'N/A', color: '#a0aec0', isFlagged: false, score: '' }
          ],
          risk: 'Low',
          requirement: '',
          isRequired: false,
          isMultipleSelection: false,
          isFlagged: true,
          flaggedValue: 'No'
        }]
      }]
    }]
  }));

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [activeResponseSelector, setActiveResponseSelector] = useState<string | null>(null);
  const [richResponseEditor, setRichResponseEditor] = useState<{ pIdx: number, sIdx: number, qIdx: number, responses: ResponseOption[] } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeCreatorTab, setActiveCreatorTab] = useState<'build' | 'report'>('build');
  
  // Singleton expansion state to ensure previous collapses on creation/edit
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>('s1');

  const creatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (creatorRef.current && !creatorRef.current.contains(e.target as Node)) {
          setActiveQuestionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateUnit = (field: keyof ChecklistTemplate['unitDetails'], value: string) => {
    setWorkingDoc(prev => ({
      ...prev,
      unitDetails: { ...prev.unitDetails, [field]: value }
    }));
  };

  const handleUpdateQuestion = (pIdx: number, sIdx: number, qIdx: number, field: keyof QuestionNode, value: any) => {
    setWorkingDoc(prev => {
      const nextPages = [...prev.pages];
      const nextSections = [...nextPages[pIdx].sections];
      const nextQuestions = [...nextSections[sIdx].questions];
      nextQuestions[qIdx] = { ...nextQuestions[qIdx], [field]: value };
      nextSections[sIdx] = { ...nextSections[sIdx], questions: nextQuestions };
      nextPages[pIdx] = { ...nextPages[pIdx], sections: nextSections };
      return { ...prev, pages: nextPages };
    });
  };

  const toggleQuestionExpansion = (id: string) => {
    setExpandedQuestionId(prev => prev === id ? null : id);
  };

  const addQuestion = (pIdx: number, sIdx: number, currentQIdx: number) => {
    const newId = `q-${Date.now()}`;
    setWorkingDoc(prev => {
        const nextPages = [...prev.pages];
        const nextSections = [...nextPages[pIdx].sections];
        const nextQuestions = [...nextSections[sIdx].questions];
        
        nextQuestions.splice(currentQIdx + 1, 0, {
            id: newId,
            text: '',
            responseType: 'multiple',
            responses: [...responseSets[0].responses],
            risk: 'Low' as RiskLevel,
            requirement: '',
            isRequired: false,
            isMultipleSelection: false,
            isFlagged: true,
            flaggedValue: 'No'
        });

        nextSections[sIdx] = { ...nextSections[sIdx], questions: nextQuestions };
        nextPages[pIdx] = { ...nextPages[pIdx], sections: nextSections };
        return { ...prev, pages: nextPages };
    });
    // Auto-collapse others and expand new question
    setExpandedQuestionId(newId);
  };

  const addSection = (pIdx: number, sIdx: number) => {
    const newId = `s-${Date.now()}`;
    setWorkingDoc(prev => {
        const nextPages = [...prev.pages];
        const nextSections = [...nextPages[pIdx].sections];
        
        nextSections.splice(sIdx + 1, 0, {
            id: newId,
            title: 'New Section Title',
            isApplicable: true,
            risk: 'Indiv.' as SectionRisk,
            questions: [{
                id: `q-${Date.now()}`,
                text: '',
                responseType: 'multiple',
                responses: [...responseSets[0].responses],
                risk: 'Low' as RiskLevel,
                requirement: '',
                isRequired: false,
                isMultipleSelection: false,
                isFlagged: true,
                flaggedValue: 'No'
            }]
        });

        nextPages[pIdx] = { ...nextPages[pIdx], sections: nextSections };
        return { ...prev, pages: nextPages };
    });
    // Auto-collapse others and expand new section
    setExpandedSectionId(newId);
    setExpandedQuestionId(null);
  };

  const handleResponseSelect = (pIdx: number, sIdx: number, qIdx: number, type: string, responses: ResponseOption[]) => {
      if (type === 'multiple' && responses.length > 0) {
        const hash = responses.map(r => r.text).join('|');
        const exists = responseSets.some(s => s.responses.map(r => r.text).join('|') === hash);
        if (!exists) {
            setResponseSets(prev => [
                ...prev, 
                { id: `custom-${Date.now()}`, label: `Custom: ${responses.slice(0,2).map(r => r.text).join(', ')}...`, responses }
            ]);
        }
      }

      setWorkingDoc(prev => {
        const nextPages = [...prev.pages];
        const nextSections = [...nextPages[pIdx].sections];
        const nextQuestions = [...nextSections[sIdx].questions];
        nextQuestions[qIdx] = { ...nextQuestions[qIdx], responseType: type, responses: responses };
        nextSections[sIdx] = { ...nextSections[sIdx], questions: nextQuestions };
        nextPages[pIdx] = { ...nextPages[pIdx], sections: nextSections };
        return { ...prev, pages: nextPages };
      });

      setActiveResponseSelector(null);
      setRichResponseEditor(null);
  };

  return (
    <div ref={creatorRef} className="fixed inset-0 z-[150] flex flex-col bg-[#f8fafc] animate-in slide-in-from-right duration-300 overflow-hidden text-left">
      {/* High Fidelity Header */}
      <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-[100] shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center text-left">
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 transition-all text-slate-500">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">{workingDoc.title || 'Untitled template'}</h2>
            </div>
            
            <div className="flex bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-100/50">
                <button 
                    onClick={() => setActiveCreatorTab('build')}
                    className={`px-8 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeCreatorTab === 'build' ? 'bg-[#6e42ff] text-white shadow-lg' : 'text-indigo-600 hover:text-indigo-800'}`}
                >
                    Build template
                </button>
                <button 
                    onClick={() => setActiveCreatorTab('report')}
                    className={`px-8 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeCreatorTab === 'report' ? 'bg-[#6e42ff] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Edit report
                </button>
            </div>

            <div className="flex items-center gap-3">
                <button className="p-2.5 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-400 transition-all">
                    <MoreIcon size={20} />
                </button>
                <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                    <UserPlus size={18} /> Manage access
                </button>
            </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-white flex justify-between items-center text-left">
            <div className="flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all" title="Undo"><Undo2 size={20}/></button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all" title="Redo"><Redo2 size={20}/></button>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5 text-slate-400">
                    <Cloud size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Unpublished changes</span>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><Settings size={20} /></button>
                    <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-6 py-2.5 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95"
                    >
                        Preview
                    </button>
                    <button 
                        onClick={() => onSave(workingDoc)}
                        className="px-10 py-2.5 bg-[#6e42ff] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-[#5a35d0] transition-all active:scale-95"
                    >
                        Publish
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:px-12 xl:px-24 space-y-8 bg-[#f8fafc]">
        {activeCreatorTab === 'build' ? (
            <>
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left max-w-5xl mx-auto w-full">
                    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <h3 className="text-lg font-black text-[#6e42ff] uppercase tracking-tight">Unit Details</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Company Name</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#6e42ff] transition-all shadow-inner" value={workingDoc.unitDetails.companyName} onChange={e => handleUpdateUnit('companyName', e.target.value)} placeholder="Enter company name" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Representative Name</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#6e42ff] transition-all shadow-inner" value={workingDoc.unitDetails.repName} onChange={e => handleUpdateUnit('repName', e.target.value)} placeholder="Enter name" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Complete Address</label>
                                <textarea rows={3} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#6e42ff] transition-all resize-none shadow-inner" value={workingDoc.unitDetails.address} onChange={e => handleUpdateUnit('address', e.target.value)} placeholder="Enter address" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contact Number</label>
                                    <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#6e42ff] transition-all shadow-inner" value={workingDoc.unitDetails.contact} onChange={e => handleUpdateUnit('contact', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email ID</label>
                                    <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#6e42ff] transition-all shadow-inner" value={workingDoc.unitDetails.email} onChange={e => handleUpdateUnit('email', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Scheduled Manday</label>
                                    <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#6e42ff] transition-all shadow-inner" value={workingDoc.unitDetails.manday} onChange={e => handleUpdateUnit('manday', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Audit Scope</label>
                                    <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#6e42ff] transition-all shadow-inner" value={workingDoc.unitDetails.scope} onChange={e => handleUpdateUnit('scope', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 pb-32 max-w-5xl mx-auto w-full">
                    {workingDoc.pages.map((page, pIdx) => (
                        <div key={page.id} className="bg-slate-100/50 rounded-[2.5rem] border border-slate-200 p-2 shadow-inner relative overflow-visible text-left animate-in fade-in duration-500">
                            <div className="flex items-center justify-between px-6 py-4">
                                <h3 className="text-xl font-black text-[#6e42ff] uppercase tracking-tight">{page.title}</h3>
                                <div className="flex items-center gap-4 text-slate-400">
                                    <span className="text-[10px] font-bold uppercase tracking-widest italic opacity-50 hidden sm:inline">(Drag to Reorder Page)</span>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><Copy size={18} className="text-[#6e42ff]"/></button>
                                        <button className="p-2 hover:bg-rose-50 rounded-xl transition-all shadow-sm"><X size={18} className="text-rose-500"/></button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {page.sections.map((section, sIdx) => {
                                    const isSecExpanded = expandedSectionId === section.id;
                                    return (
                                        <div key={section.id} className={`bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden group ${isSecExpanded ? 'border-[#6e42ff] shadow-xl' : 'border-slate-100 shadow-sm hover:border-[#6e42ff]/30'}`}>
                                            <div 
                                                onClick={() => setExpandedSectionId(isSecExpanded ? null : section.id)}
                                                className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between gap-6 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 flex-1 text-left">
                                                    <div className={`transition-transform duration-300 ${isSecExpanded ? 'rotate-180' : ''}`}>
                                                        <ChevronDown size={20} className="text-[#6e42ff]" strokeWidth={3} />
                                                    </div>
                                                    <input 
                                                        onClick={e => e.stopPropagation()}
                                                        className="bg-transparent border-none outline-none font-black text-[#6e42ff] text-base uppercase tracking-tight w-full max-w-sm focus:ring-0" 
                                                        value={section.title} 
                                                        onChange={e => {
                                                            const nextPages = [...workingDoc.pages];
                                                            nextPages[pIdx].sections[sIdx].title = e.target.value;
                                                            setWorkingDoc({...workingDoc, pages: nextPages});
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic hidden md:inline">Risk Mapping:</span>
                                                    <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm">
                                                        {['Indiv.', 'Low', 'Med', 'High'].map(r => (
                                                            <label key={r} className="flex items-center gap-2 cursor-pointer group select-none">
                                                                <input 
                                                                    type="radio" 
                                                                    className="w-3.5 h-3.5 accent-[#6e42ff]" 
                                                                    checked={section.risk === r}
                                                                    onChange={() => {
                                                                        const nextPages = [...workingDoc.pages];
                                                                        nextPages[pIdx].sections[sIdx].risk = r as any;
                                                                        setWorkingDoc({...workingDoc, pages: nextPages});
                                                                    }}
                                                                />
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-800 transition-colors">{r}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {isSecExpanded && (
                                                <div className="p-8 space-y-4 bg-white rounded-b-[2rem] animate-in slide-in-from-top-2 duration-300">
                                                    {section.questions.map((q, qIdx) => {
                                                        const isExpanded = expandedQuestionId === q.id;
                                                        return (
                                                            <div 
                                                                key={q.id} 
                                                                className={`space-y-4 animate-in fade-in duration-500 pb-4 border-b border-slate-50 last:border-0 last:pb-0 ${isExpanded ? 'pb-8 bg-indigo-50/10 rounded-2xl border-indigo-400 border-2 -mx-4 px-4 py-2' : ''}`}
                                                                onMouseDown={(e) => { e.stopPropagation(); setActiveQuestionId(q.id); }}
                                                            >
                                                                <div className="flex flex-col xl:flex-row gap-6 items-start">
                                                                    
                                                                    {/* ToolBox */}
                                                                    <div className="shrink-0 pt-2 relative min-w-[70px] hidden xl:block">
                                                                        <AddToolbox 
                                                                            isVisible={activeQuestionId === q.id}
                                                                            onAddQuestion={() => addQuestion(pIdx, sIdx, qIdx)}
                                                                            onAddSection={() => addSection(pIdx, sIdx)}
                                                                        />
                                                                    </div>

                                                                    <div className="flex-1 w-full space-y-4 text-left">
                                                                        {/* QUESTION ROW */}
                                                                        <div className="flex items-center gap-4 group/qrow">
                                                                            <div className="text-slate-200 cursor-grab active:cursor-grabbing shrink-0">
                                                                                <GripVertical size={20} />
                                                                            </div>
                                                                            
                                                                            <div className="flex-1 min-w-0">
                                                                                {isExpanded ? (
                                                                                    <div className="bg-white border-2 border-[#6e42ff] rounded-2xl p-0.5 shadow-md ring-4 ring-[#6e42ff]/5">
                                                                                        <input 
                                                                                            autoFocus
                                                                                            className="w-full bg-transparent border-none py-3 px-4 text-base font-bold text-slate-800 outline-none transition-all"
                                                                                            value={q.text}
                                                                                            onChange={e => handleUpdateQuestion(pIdx, sIdx, qIdx, 'text', e.target.value)}
                                                                                            placeholder="Type question content..."
                                                                                            onFocus={() => setActiveQuestionId(q.id)}
                                                                                        />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div 
                                                                                        onDoubleClick={() => toggleQuestionExpansion(q.id)}
                                                                                        className="flex-1 text-base font-bold text-slate-800 py-3 px-1 cursor-text select-none truncate hover:text-[#6e42ff] transition-colors"
                                                                                    >
                                                                                        {q.text || "Double click to edit question..."}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="relative flex items-center gap-3 shrink-0">
                                                                                {/* RESPONSE TYPES - ALWAYS VISIBLE */}
                                                                                <div 
                                                                                    onClick={() => setActiveResponseSelector(activeResponseSelector === q.id ? null : q.id)}
                                                                                    className="flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-50 p-1.5 rounded-xl border border-transparent hover:border-slate-200"
                                                                                >
                                                                                    <div className="flex gap-1.5">
                                                                                        {q.responseType === 'multiple' && q.responses.length > 0 ? (
                                                                                            q.responses.slice(0, 3).map((r) => (
                                                                                                <span 
                                                                                                    key={r.id} 
                                                                                                    className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shadow-xs transition-all"
                                                                                                    style={{ 
                                                                                                        backgroundColor: `${r.color}15`, 
                                                                                                        color: r.color, 
                                                                                                        borderColor: `${r.color}25` 
                                                                                                    }}
                                                                                                >
                                                                                                    {r.text}
                                                                                                </span>
                                                                                            ))
                                                                                        ) : (
                                                                                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-100 text-slate-400 border border-slate-200">
                                                                                                {q.responseType}
                                                                                            </span>
                                                                                        )}
                                                                                        {q.responses.length > 3 && <span className="text-[8px] font-black text-slate-300 py-1">+{q.responses.length - 3}</span>}
                                                                                    </div>
                                                                                    <ChevronDown size={14} className={`text-slate-300 transition-transform ${activeResponseSelector === q.id ? 'rotate-180' : ''}`} />
                                                                                </div>

                                                                                {isExpanded && (
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            setRichResponseEditor({ pIdx, sIdx, qIdx, responses: q.responses });
                                                                                            setActiveResponseSelector(null);
                                                                                        }}
                                                                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#6e42ff] hover:border-[#6e42ff] active:scale-95 transition-all"
                                                                                    >
                                                                                        <Plus size={16} strokeWidth={3} />
                                                                                    </button>
                                                                                )}

                                                                                {activeResponseSelector === q.id && (
                                                                                    <ResponseTypeSelector 
                                                                                        availableSets={responseSets}
                                                                                        onClose={() => setActiveResponseSelector(null)}
                                                                                        onSelect={(type, resps) => handleResponseSelect(pIdx, sIdx, qIdx, type, resps)}
                                                                                        onOpenRichEditor={() => {
                                                                                            setRichResponseEditor({ pIdx, sIdx, qIdx, responses: q.responses });
                                                                                            setActiveResponseSelector(null);
                                                                                        }}
                                                                                    />
                                                                                )}

                                                                                <button 
                                                                                    onClick={() => toggleQuestionExpansion(q.id)}
                                                                                    className={`p-2 rounded-xl border transition-all ${isExpanded ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200'}`}
                                                                                >
                                                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* EXPANDED DETAILS */}
                                                                        {isExpanded && (
                                                                            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300 pt-4 border-t border-slate-100/50">
                                                                                <div className="flex items-center gap-6 border-b border-slate-50 pb-4">
                                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity:</span>
                                                                                    <div className="flex items-center gap-6">
                                                                                        {['Low', 'Medium', 'High'].map(r => (
                                                                                            <label key={r} className="flex items-center gap-2 cursor-pointer group select-none">
                                                                                                <input 
                                                                                                    type="radio" 
                                                                                                    className="w-4 h-4 accent-[#6e42ff]" 
                                                                                                    checked={q.risk === r}
                                                                                                    onChange={() => handleUpdateQuestion(pIdx, sIdx, qIdx, 'risk', r as RiskLevel)}
                                                                                                />
                                                                                                <span className="text-[11px] font-bold text-slate-500 uppercase group-hover:text-slate-800 transition-colors">{r}</span>
                                                                                            </label>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="space-y-2">
                                                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Audit Criteria / Requirement</label>
                                                                                    <textarea 
                                                                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-5 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-[#6e42ff] transition-all shadow-inner h-28 resize-none"
                                                                                        value={q.requirement}
                                                                                        onChange={e => handleUpdateQuestion(pIdx, sIdx, qIdx, 'requirement', e.target.value)}
                                                                                        placeholder="Detail the technical standard or requirement for this point..."
                                                                                    />
                                                                                </div>

                                                                                <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6">
                                                                                    <div className="flex flex-wrap items-center gap-8">
                                                                                        <button className="flex items-center gap-2 text-[#6e42ff] text-[11px] font-black uppercase tracking-widest hover:underline transition-all">
                                                                                            <Link2 size={16} /> Add logic
                                                                                        </button>
                                                                                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                                                                                            <div className="relative">
                                                                                                <input type="checkbox" checked={q.isRequired} onChange={e => handleUpdateQuestion(pIdx, sIdx, qIdx, 'isRequired', e.target.checked)} className="sr-only peer" />
                                                                                                <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:bg-[#6e42ff] peer-checked:border-[#6e42ff] flex items-center justify-center transition-all group-hover:border-indigo-300">
                                                                                                    <Check size={12} className="text-white opacity-0 peer-checked:opacity-100" strokeWidth={4} />
                                                                                                </div>
                                                                                            </div>
                                                                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Required</span>
                                                                                        </label>
                                                                                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                                                                                            <div className="relative">
                                                                                                <input type="checkbox" checked={q.isMultipleSelection} onChange={e => handleUpdateQuestion(pIdx, sIdx, qIdx, 'isMultipleSelection', e.target.checked)} className="sr-only peer" />
                                                                                                <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:bg-[#6e42ff] peer-checked:border-[#6e42ff] flex items-center justify-center transition-all group-hover:border-indigo-300">
                                                                                                    <Check size={12} className="text-white opacity-0 peer-checked:opacity-100" strokeWidth={4} />
                                                                                                </div>
                                                                                            </div>
                                                                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Multi-Select</span>
                                                                                        </label>
                                                                                        <div className="flex items-center gap-3 group select-none">
                                                                                            <div className="relative">
                                                                                                <input type="checkbox" checked={q.isFlagged} onChange={e => handleUpdateQuestion(pIdx, sIdx, qIdx, 'isFlagged', e.target.checked)} className="sr-only peer" />
                                                                                                <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:bg-[#6e42ff] peer-checked:border-[#6e42ff] flex items-center justify-center transition-all group-hover:border-indigo-300">
                                                                                                    <Check size={12} className="text-white opacity-0 peer-checked:opacity-100" strokeWidth={4} />
                                                                                                </div>
                                                                                            </div>
                                                                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Auto-Flag Result</span>
                                                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border shadow-xs transition-all ${q.isFlagged ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-30'}`}>
                                                                                                {q.flaggedValue || 'No'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            if(confirm("Permanently delete this audit point?")) {
                                                                                                const nextPages = [...workingDoc.pages];
                                                                                                nextPages[pIdx].sections[sIdx].questions = nextPages[pIdx].sections[sIdx].questions.filter(x => x.id !== q.id);
                                                                                                setWorkingDoc({...workingDoc, pages: nextPages});
                                                                                            }
                                                                                        }}
                                                                                        className="p-2 text-slate-200 hover:text-rose-600 transition-all"
                                                                                    >
                                                                                        <Trash2 size={20}/>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            <div className="px-8 pb-8 pt-6 bg-slate-50/50 flex justify-center rounded-b-[2rem]">
                                                <button 
                                                    onClick={() => addQuestion(pIdx, sIdx, workingDoc.pages[pIdx].sections[sIdx].questions.length - 1)}
                                                    className="px-10 py-4 bg-white border-2 border-indigo-100 text-[#6e42ff] rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:border-[#6e42ff] hover:bg-[#6e42ff] hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    <PlusCircle size={20} strokeWidth={3} /> Append New Audit Point
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shrink-0 mb-20 max-w-5xl mx-auto w-full animate-in slide-in-from-bottom-2 duration-700 text-left">
                    <button className="flex items-center gap-3 px-8 py-4 bg-slate-50 border-2 border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:border-[#6e42ff]/30 transition-all shadow-sm active:scale-95">
                      <FileSpreadsheet size={20} className="text-[#6e42ff]" /> Bulk Import CSV
                    </button>
                    <button className="flex items-center gap-3 px-8 py-4 bg-slate-50 border-2 border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:border-[#6e42ff]/30 transition-all shadow-sm active:scale-95">
                      <Download size={20} className="text-[#6e42ff]" /> Download Schema Template
                    </button>
                </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 max-w-5xl mx-auto w-full opacity-60 h-[60vh]">
                <FileText size={64} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Report Customization Node</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">Functional interface is being synchronized.</p>
            </div>
        )}
      </div>

      {richResponseEditor && (
        <MultipleChoiceModal 
          initialResponses={richResponseEditor.responses}
          onClose={() => setRichResponseEditor(null)}
          onSave={(resps) => handleResponseSelect(richResponseEditor.pIdx, richResponseEditor.sIdx, richResponseEditor.qIdx, 'multiple', resps)}
        />
      )}

      {isPreviewOpen && (
        <ChecklistPreview 
          checklist={workingDoc}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};

// --- Main ChecklistEditor Component ---

interface ChecklistEditorProps {
    protocols: MandatoryProtocol[];
}

const ChecklistEditor: React.FC<ChecklistEditorProps> = ({ protocols = [] }) => {
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);
  const [newChecklist, setNewChecklist] = useState({ title: '', department: '', frequency: 'Monthly' });

  useEffect(() => {
    const synced = protocols.map(p => {
        const existing = checklists.find(c => c.id === p.id);
        if (existing) {
            return {
                ...existing,
                title: p.name,
                frequency: p.frequency,
                lastUpdated: p.effectiveDate
            };
        }
        
        let initialHistory: any[] = [];
        if (p.id === 'm1') {
            initialHistory = [
                { id: "H-101", auditDate: "2025-05-20", auditor: "John Doe", score: 98, status: "Completed", findings: 0 },
                { id: "H-102", auditDate: "2025-05-19", auditor: "Jane Smith", score: 85, status: "Completed", findings: 3 }
            ];
        }

        return {
            id: p.id,
            title: p.name,
            department: "Quality Assurance",
            frequency: p.frequency,
            questionCount: p.id === 'm1' ? 45 : 0,
            lastUpdated: p.effectiveDate,
            status: 'Active' as const,
            history: initialHistory,
            pages: [],
            unitDetails: {
              companyName: '', repName: '', address: '', contact: '', email: '', manday: '', scope: '', dateFrom: '', dateTo: '', geotag: '', startTime: ''
            }
        };
    });

    const localOnly = checklists.filter(c => !protocols.some(p => p.id === c.id));
    setChecklists([...synced, ...localOnly]);
  }, [protocols, checklists]);

  const filteredChecklists = useMemo(() => {
    return checklists.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [checklists, searchTerm]);

  const handleCreate = () => {
    if(!newChecklist.title || !newChecklist.department) return;
    const newItem: ChecklistTemplate = {
        id: `CL-${Date.now()}`,
        title: newChecklist.title,
        department: newChecklist.department,
        frequency: newChecklist.frequency,
        questionCount: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'Draft',
        history: [],
        pages: [],
        unitDetails: {
          companyName: '', repName: '', address: '', contact: '', email: '', manday: '', scope: '', dateFrom: '', dateTo: '', geotag: '', startTime: ''
        }
    };
    setChecklists([newItem, ...checklists]);
    setIsCreateModalOpen(false);
    setEditingChecklist(newItem);
  };

  const handleSaveCreator = (updated: ChecklistTemplate) => {
    setChecklists(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditingChecklist(null);
    alert("Protocol synchronized with unit registry.");
  };

  if (editingChecklist) {
    return (
      <div className="fixed inset-0 z-[150] bg-white overflow-hidden">
         <ChecklistCreator 
           checklist={editingChecklist} 
           onSave={handleSaveCreator} 
           onCancel={() => setEditingChecklist(null)} 
         />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 text-left">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
        <div className="flex items-center gap-5 z-10">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner border border-indigo-100 shrink-0">
            <ClipboardList size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Audit Forms</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Checklist Repository & History</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full md:w-auto">
           <div className="relative group w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search templates..." 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none focus:border-indigo-400 transition-all shadow-sm uppercase tracking-wider"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
           >
             <Plus size={18} strokeWidth={3} /> Create Checklist
           </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
          {filteredChecklists.map((checklist) => {
              const isExpanded = expandedId === checklist.id;
              
              return (
                  <div key={checklist.id} className={`bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden flex flex-col group ${isExpanded ? 'border-indigo-500 shadow-xl' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}>
                      
                      <div className="p-5 flex flex-col xl:flex-row items-start xl:items-center gap-6">
                          <div className="flex items-center gap-5 xl:w-[35%] shrink-0 text-left">
                              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                  <FileText size={28} />
                              </div>
                              <div className="min-w-0">
                                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight truncate pr-4">{checklist.title}</h3>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-bold uppercase border border-slate-200">{checklist.department}</span>
                                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-bold uppercase border border-blue-100 flex items-center gap-1"><Clock size={10} /> {checklist.frequency}</span>
                                      {checklist.status === 'Draft' && <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-bold uppercase border border-amber-100">Draft</span>}
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center gap-8 xl:w-[25%] shrink-0 border-l border-slate-100 pl-6 xl:border-l-0 xl:pl-0 text-left">
                              <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Questions</span><div className="flex items-center gap-2"><BarChart3 size={14} className="text-slate-300" /><span className="text-sm font-black text-slate-800">{checklist.questionCount}</span></div></div>
                              <div className="h-8 w-px bg-slate-100" />
                              <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Update</span><div className="flex items-center gap-2"><Calendar size={14} className="text-slate-300" /><span className="text-sm font-black text-slate-800">{checklist.lastUpdated}</span></div></div>
                          </div>

                          <div className="flex flex-1 items-center justify-end gap-3 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-50">
                              <button onClick={() => setEditingChecklist(checklist)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-2"><Edit size={14} /> Edit</button>
                              <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"><Play size={14} fill="currentColor" strokeWidth={3} /> Start Audit</button>
                              <div className="w-px h-8 bg-slate-200 mx-1" />
                              <button onClick={() => setExpandedId(isExpanded ? null : checklist.id)} className={`p-2.5 rounded-xl border transition-all ${isExpanded ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200'}`}>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
                          </div>
                      </div>

                      {isExpanded && (
                          <div className="bg-slate-50 border-t border-slate-100 p-6 animate-in slide-in-from-top-2 text-left">
                              <div className="flex items-center gap-3 mb-4"><History size={16} className="text-slate-400" /><h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Recent Audit History</h4></div>
                              {checklist.history.length > 0 ? (
                                  <div className="space-y-3">
                                      {checklist.history.map(entry => (
                                          <div key={entry.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-200 transition-all">
                                              <div className="flex items-center gap-4"><div className={`p-2 rounded-lg ${entry.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{entry.status === 'Completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}</div><div><div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-800">{entry.auditDate}</span><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${entry.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{entry.status}</span></div><p className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">Auditor: {entry.auditor}</p></div></div>
                                              <div className="flex items-center gap-6 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">{entry.findings > 0 ? <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100"><AlertTriangle size={12} /><span className="text-[10px] font-black uppercase">{entry.findings} Issues</span></div> : <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100"><CheckCircle2 size={12} /> <span className="text-[10px] font-black uppercase">Clean</span></div>}<div className="text-right min-w-[60px]"><ScoreBadge score={entry.score} status={entry.status} /></div><button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">Report <ArrowRight size={12} /></button></div>
                                          </div>
                                      ))}
                                  </div>
                              ) : <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200"><p className="text-xs text-slate-400 italic">No history recorded.</p></div>}
                          </div>
                      )}
                  </div>
              );
          })}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 text-left">
                  <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">New Checklist</h3><button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button></div>
                  <div className="space-y-5">
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Title</label><input autoFocus className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-inner" placeholder="e.g. Opening Checks" value={newChecklist.title} onChange={e => setNewChecklist({...newChecklist, title: e.target.value})} /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-inner" placeholder="e.g. Kitchen" value={newChecklist.department} onChange={e => setNewChecklist({...newChecklist, department: e.target.value})} /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer" value={newChecklist.frequency} onChange={e => setNewChecklist({...newChecklist, frequency: e.target.value})}><option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option></select></div>
                  </div>
                  <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100"><button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Cancel</button><button onClick={handleCreate} className="flex-[2] py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Create Template</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChecklistEditor;
