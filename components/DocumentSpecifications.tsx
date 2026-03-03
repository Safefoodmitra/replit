
"use client";

import React, { useState, useRef, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  ChevronDown, 
  ChevronUp,
  FileUp, 
  Eye, 
  X,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  FileDigit,
  BookOpen,
  FolderOpen,
  ShieldCheck,
  Info,
  Clock
} from 'lucide-react';

interface SubCard {
  id: string;
  label: string;
  fileName: string | null;
  fileUrl: string | null;
  lastUpdated: string;
}

interface MainCard {
  id: string;
  title: string;
  description: string;
  iconColor: string;
  subCards: SubCard[];
}

const INITIAL_GROUPS: MainCard[] = [
  {
    id: 'grp-1',
    title: 'Operational Standards',
    description: 'Core procedural documentation for unit-level operations.',
    iconColor: 'bg-indigo-600',
    subCards: [
      { id: 'sc-1', label: 'Hygiene Maintenance v2', fileName: 'hygiene_v2.pdf', fileUrl: '#', lastUpdated: '2024-05-10' },
      { id: 'sc-2', label: 'Waste Disposal Protocol', fileName: null, fileUrl: null, lastUpdated: '2024-03-15' }
    ]
  },
  {
    id: 'grp-2',
    title: 'Product Specifications',
    description: 'Technical data sheets for raw material intake.',
    iconColor: 'bg-emerald-600',
    subCards: [
      { id: 'sc-3', label: 'Poultry Grade A Master', fileName: 'poultry_spec.pdf', fileUrl: '#', lastUpdated: '2024-04-20' }
    ]
  }
];

const DocumentSpecifications: React.FC<{ activeSubTab: string; currentScope: string }> = ({ activeSubTab, currentScope }) => {
  const [groups, setGroups] = useState<MainCard[]>(INITIAL_GROUPS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [activeMainCardId, setActiveMainCardId] = useState<string | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  
  // Track which groups are expanded
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set(['grp-1', 'grp-2']));

  const [mainForm, setMainForm] = useState({ title: '', description: '' });
  const [subForm, setSubForm] = useState({ label: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => 
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.subCards.some(sc => sc.label.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [groups, searchTerm]);

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroupIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedGroupIds(next);
  };

  const handleAddMainCard = () => {
    if (!mainForm.title) return;
    const newId = `grp-${Date.now()}`;
    const newGroup: MainCard = {
      id: newId,
      title: mainForm.title,
      description: mainForm.description,
      iconColor: 'bg-indigo-600',
      subCards: []
    };
    setGroups([...groups, newGroup]);
    setExpandedGroupIds(prev => new Set(prev).add(newId));
    setIsMainModalOpen(false);
    setMainForm({ title: '', description: '' });
  };

  const handleAddSubCard = () => {
    if (!subForm.label || !activeMainCardId) return;
    const newSub: SubCard = {
      id: `sc-${Date.now()}`,
      label: subForm.label,
      fileName: null,
      fileUrl: null,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setGroups(prev => prev.map(g => g.id === activeMainCardId ? { ...g, subCards: [...g.subCards, newSub] } : g));
    setIsSubModalOpen(false);
    setSubForm({ label: '' });
  };

  const handleDeleteMain = (id: string) => {
    if (confirm("Delete this group and all its specifications?")) {
      setGroups(prev => prev.filter(g => g.id !== id));
      const next = new Set(expandedGroupIds);
      next.delete(id);
      setExpandedGroupIds(next);
    }
  };

  const handleDeleteSub = (groupId: string, subId: string) => {
    if (confirm("Remove this specification?")) {
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, subCards: g.subCards.filter(sc => sc.id !== subId) } : g));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      setGroups(prev => prev.map(g => ({
        ...g,
        subCards: g.subCards.map(sc => sc.id === uploadTarget ? {
          ...sc,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          lastUpdated: new Date().toISOString().split('T')[0]
        } : sc)
      })));
      setUploadTarget(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileChange} />
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner border border-indigo-100">
            <BookOpen size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Document Specifications</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> Hierarchical Standard Compliance Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search registry..." 
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none focus:border-indigo-400 transition-all shadow-inner uppercase tracking-wider"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsMainModalOpen(true)}
            className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} strokeWidth={3} /> Add Group
          </button>
        </div>
      </div>

      {/* Main Grid - One card per line */}
      <div className="grid grid-cols-1 gap-8">
        {filteredGroups.map(group => {
          const isExpanded = expandedGroupIds.has(group.id);
          
          return (
            <div key={group.id} className={`bg-white rounded-[3rem] border-2 transition-all duration-300 overflow-hidden flex flex-col group ${isExpanded ? 'border-indigo-500 shadow-2xl' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}>
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-5 cursor-pointer" onClick={() => toggleGroup(group.id)}>
                  <div className={`w-14 h-14 rounded-2xl ${group.iconColor} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                    <FolderOpen size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{group.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setActiveMainCardId(group.id); setIsSubModalOpen(true); }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em]"
                  >
                    <Plus size={16} strokeWidth={3} /> Create Entry
                  </button>
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${isExpanded ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'}`}
                    title={isExpanded ? "Collapse" : "Show"}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{isExpanded ? 'Collapse' : 'Show'}</span>
                    {isExpanded ? <ChevronUp size={20} strokeWidth={2.5} /> : <ChevronDown size={20} strokeWidth={2.5} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteMain(group.id)}
                    className="p-2.5 bg-white text-slate-300 border border-slate-100 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-8 bg-white animate-in slide-in-from-top-4 duration-500">
                  {group.subCards.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {group.subCards.map(sub => (
                        <div key={sub.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group/sub hover:bg-white hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-5 min-w-0">
                            <div className={`p-3.5 rounded-2xl shadow-sm shrink-0 ${sub.fileUrl ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-300'}`}>
                              <FileText size={22} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-black text-slate-800 uppercase tracking-tight leading-none mb-2 truncate">{sub.label}</p>
                              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] font-bold text-slate-400">
                                 {sub.fileName ? (
                                   <span className="text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                     <CheckCircle2 size={12}/> {sub.fileName}
                                   </span>
                                 ) : (
                                   <span className="text-rose-400 flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                                     <AlertCircle size={12}/> No PDF Linked
                                   </span>
                                 )}
                                 <div className="flex items-center gap-1.5 opacity-70">
                                    <Clock size={12} className="text-slate-300" />
                                    <span>Updated: {sub.lastUpdated}</span>
                                 </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-end shrink-0 pt-2 sm:pt-0">
                            {sub.fileUrl && (
                              <button 
                                onClick={() => window.open(sub.fileUrl!, '_blank')}
                                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                                title="View Document"
                              >
                                <Eye size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => { setUploadTarget(sub.id); fileInputRef.current?.click(); }}
                              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-sm ${sub.fileUrl ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'}`}
                            >
                              <FileUp size={16} strokeWidth={2.5} /> {sub.fileUrl ? 'Update Artifact' : 'Upload PDF'}
                            </button>
                            <button 
                              onClick={() => handleDeleteSub(group.id, sub.id)}
                              className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center flex flex-col items-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                      <FileDigit size={40} className="text-slate-200 mb-4" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Zero Specifications Registered</p>
                      <button 
                        onClick={() => { setActiveMainCardId(group.id); setIsSubModalOpen(true); }}
                        className="mt-6 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                      >
                        + Add first sub-card
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {filteredGroups.length === 0 && (
          <div className="col-span-full py-48 text-center flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
             <LayoutGrid size={64} className="text-slate-100 mb-6" />
             <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Empty Registry Node</h3>
             <p className="text-slate-400 text-sm mt-3 font-medium uppercase tracking-widest max-w-sm leading-relaxed text-center">
               No specification groups match your current search criteria. Initialze a new group node to start building your hierarchical document vault.
             </p>
          </div>
        )}
      </div>

      {/* Main Card Modal */}
      {isMainModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 border border-slate-200">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">New Specification Group</h3>
                <button onClick={() => setIsMainModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Group Title</label>
                    <input 
                      autoFocus
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black uppercase focus:border-indigo-500 outline-none transition-all shadow-inner"
                      value={mainForm.title}
                      onChange={e => setMainForm({...mainForm, title: e.target.value})}
                      placeholder="e.g. CORE PROCEDURES"
                    />
                </div>
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 transition-all shadow-inner resize-none h-24"
                      value={mainForm.description}
                      onChange={e => setMainForm({...mainForm, description: e.target.value})}
                      placeholder="Enter group purpose..."
                    />
                </div>
                <button 
                  disabled={!mainForm.title}
                  onClick={handleAddMainCard}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 disabled:opacity-30 disabled:grayscale active:scale-95 transition-all"
                >
                  Create Main Node
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Sub Card Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 border border-slate-200">
             <div className="flex justify-between items-center mb-8 text-left">
                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">New Specification</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Adding to {groups.find(g => g.id === activeMainCardId)?.title}</p>
                </div>
                <button onClick={() => setIsSubModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Label</label>
                    <input 
                      autoFocus
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black uppercase focus:border-indigo-500 outline-none transition-all shadow-inner"
                      value={subForm.label}
                      onChange={e => setSubForm({...subForm, label: e.target.value})}
                      placeholder="e.g. Hygiene v2.1"
                    />
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-left">
                   <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
                   <p className="text-[10px] text-blue-800 font-bold uppercase leading-relaxed tracking-wide">You can link a PDF artifact immediately after creating this placeholder card.</p>
                </div>
                <button 
                  disabled={!subForm.label}
                  onClick={handleAddSubCard}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 disabled:opacity-30 active:scale-95 transition-all"
                >
                  Confirm Specification
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentSpecifications;
