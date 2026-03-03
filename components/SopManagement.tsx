
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  BookOpen,
  PlusCircle,
  X,
  Briefcase,
  FileDown,
  Save,
  ImageIcon,
  Type,
  Trash,
  LayoutTemplate
} from 'lucide-react';
import { Entity, HierarchyScope, SopDefinition, SopContent, SopSection } from '../types';
import html2canvas from 'html2canvas';
import RichTextEditor from './RichTextEditor';

interface SopManagementProps {
  entities: Entity[];
  onUpdateEntity: (entity: Entity) => void;
  currentScope: HierarchyScope;
  userRootId?: string | null;
}

const DEFAULT_SOP_CONTENT: SopContent = {
  version: "1.0",
  lastReviewDate: new Date().toISOString().split('T')[0],
  sections: [
    { id: '1', title: '1. Purpose', content: "To establish a standard procedure for..." },
    { id: '2', title: '2. Scope', content: "This procedure applies to all staff in..." },
    { id: '3', title: '3. Responsibilities', content: "<ul><li><b>Unit Manager:</b> Responsible for enforcement.</li><li><b>Staff:</b> Responsible for execution.</li></ul>" },
    { id: '4', title: '4. Procedure', content: "<ol><li>Step one...</li><li>Step two...</li></ol>" },
    { id: '5', title: '5. Monitoring', content: "Daily checks to be performed by..." },
    { id: '6', title: '6. Corrective Action', content: "If deviation is observed..." },
    { id: '7', title: '7. Verification', content: "Weekly verification by..." },
    { id: '8', title: '8. Records', content: "Log book reference..." }
  ]
};

const SopManagement: React.FC<SopManagementProps> = ({ 
  entities, 
  onUpdateEntity, 
  currentScope, 
  userRootId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSopIds, setExpandedSopIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSop, setEditingSop] = useState<SopDefinition | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [newSopName, setNewSopName] = useState('');
  const [newSubTopic, setNewSubTopic] = useState('');
  const [sopContent, setSopContent] = useState<SopContent>(DEFAULT_SOP_CONTENT);
  const [activeTab, setActiveTab] = useState<'info' | 'content'>('info');

  const canManage = ['super-admin', 'corporate'].includes(currentScope);

  const findAncestorByType = (entityId: string | null | undefined, type: HierarchyScope, allEntities: Entity[]): Entity | undefined => {
    if (!entityId) return undefined;
    const entity = allEntities.find(e => e.id === entityId);
    if (!entity) return undefined;
    if (entity.type === type) return entity;
    return findAncestorByType(entity.parentId, type, allEntities);
  };

  const targetCorporate = useMemo(() => {
    if (currentScope === 'super-admin') {
      return entities.find(e => e.type === 'corporate');
    }
    return findAncestorByType(userRootId, 'corporate', entities);
  }, [entities, currentScope, userRootId]);

  const sops = useMemo(() => targetCorporate?.masterSops || [], [targetCorporate]);

  const filteredSops = useMemo(() => {
    if (!searchTerm) return sops;
    const lowerSearch = searchTerm.toLowerCase();
    return sops.filter(sop => 
      sop.name.toLowerCase().includes(lowerSearch) || 
      sop.subTopics.some(st => st.toLowerCase().includes(lowerSearch))
    );
  }, [sops, searchTerm]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedSopIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSopIds(newSet);
  };

  const handleSaveSop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCorporate || !newSopName.trim()) return;

    const currentSops = targetCorporate.masterSops || [];
    let updatedSops: SopDefinition[];

    if (editingSop) {
      updatedSops = currentSops.map(s => s.id === editingSop.id ? { ...s, name: newSopName, content: sopContent } : s);
    } else {
      updatedSops = [...currentSops, { id: `sop-${Date.now()}`, name: newSopName, subTopics: [], content: sopContent }];
    }

    onUpdateEntity({ ...targetCorporate, masterSops: updatedSops });
    setIsModalOpen(false);
    setNewSopName('');
    setSopContent(DEFAULT_SOP_CONTENT);
    setEditingSop(null);
  };

  const handleDeleteSop = (id: string) => {
    if (!targetCorporate || !window.confirm('Delete this SOP and all its sub-topics?')) return;
    const updatedSops = (targetCorporate.masterSops || []).filter(s => s.id !== id);
    onUpdateEntity({ ...targetCorporate, masterSops: updatedSops });
  };

  const handleAddSubTopic = (sopId: string) => {
    if (!targetCorporate || !newSubTopic.trim()) return;
    const updatedSops = (targetCorporate.masterSops || []).map(s => {
      if (s.id === sopId) {
        if (s.subTopics.includes(newSubTopic.trim())) {
          alert('Sub-topic already exists');
          return s;
        }
        return { ...s, subTopics: [...s.subTopics, newSubTopic.trim()] };
      }
      return s;
    });
    onUpdateEntity({ ...targetCorporate, masterSops: updatedSops });
    setNewSubTopic('');
  };

  const handleDeleteSubTopic = (sopId: string, topic: string) => {
    if (!targetCorporate || !window.confirm('Remove this sub-topic?')) return;
    const updatedSops = (targetCorporate.masterSops || []).map(s => {
      if (s.id === sopId) {
        return { ...s, subTopics: s.subTopics.filter(t => t !== topic) };
      }
      return s;
    });
    onUpdateEntity({ ...targetCorporate, masterSops: updatedSops });
  };

  const handleAddSection = () => {
    const newId = Date.now().toString();
    const nextNum = (sopContent.sections?.length || 0) + 1;
    setSopContent({
        ...sopContent,
        sections: [
            ...(sopContent.sections || []),
            { id: newId, title: `${nextNum}. New Section`, content: '' }
        ]
    });
  };

  const handleUpdateSection = (id: string, field: keyof SopSection, value: string) => {
    setSopContent({
        ...sopContent,
        sections: (sopContent.sections || []).map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const handleRemoveSection = (id: string) => {
    if(!confirm('Delete this section?')) return;
    setSopContent({
        ...sopContent,
        sections: (sopContent.sections || []).filter(s => s.id !== id)
    });
  };

  const generateSOPPDF = async (sop: SopDefinition) => {
    setIsGenerating(true);
    const printArea = document.createElement('div');
    printArea.style.position = 'fixed';
    printArea.style.top = '-9999px';
    printArea.style.left = '0';
    printArea.style.width = '800px'; 
    printArea.style.backgroundColor = 'white';
    printArea.style.padding = '40px';
    printArea.style.fontFamily = 'Arial, sans-serif';
    printArea.style.color = '#000';
    
    const content = sop.content || DEFAULT_SOP_CONTENT;
    const sections = content.sections || [];
    
    printArea.innerHTML = `
      <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase;">Standard Operating Procedure</h1>
        <h2 style="font-size: 18px; margin: 5px 0 0 0; color: #555;">${targetCorporate?.name}</h2>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px;">
        <tr>
           <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9; font-weight: bold;">SOP Title</td>
           <td style="border: 1px solid #ddd; padding: 8px;">${sop.name}</td>
           <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9; font-weight: bold;">Version</td>
           <td style="border: 1px solid #ddd; padding: 8px;">${content.version}</td>
        </tr>
        <tr>
           <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9; font-weight: bold;">Date</td>
           <td style="border: 1px solid #ddd; padding: 8px;" colspan="3">${content.lastReviewDate}</td>
        </tr>
      </table>

      <div style="font-size: 14px; line-height: 1.6;">
        ${sections.map(section => `
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">${section.title}</h3>
                <div class="sop-rich-content">${section.content}</div>
            </div>
        `).join('')}
      </div>

      <div style="margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
        Generated by HACCP PRO System | ${new Date().toLocaleString()}
      </div>
      <style>
        .sop-rich-content img { max-width: 100%; height: auto; margin: 10px 0; }
        .sop-rich-content ul, .sop-rich-content ol { padding-left: 20px; }
      </style>
    `;

    document.body.appendChild(printArea);

    try {
        const { jsPDF } = await import('jspdf');
        const images = printArea.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
        }));

        const canvas = await html2canvas(printArea, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${sop.name.replace(/\s+/g, '_')}_SOP.pdf`);
    } catch (e) {
        console.error(e);
        alert("Failed to generate PDF");
    } finally {
        document.body.removeChild(printArea);
        setIsGenerating(false);
    }
  };

  const openEditModal = (sop: SopDefinition | null) => {
    setEditingSop(sop);
    setNewSopName(sop ? sop.name : '');
    let initialContent = sop?.content || DEFAULT_SOP_CONTENT;
    if(!initialContent.sections) {
         initialContent = DEFAULT_SOP_CONTENT;
    }
    setSopContent(initialContent);
    setActiveTab('info');
    setIsModalOpen(true);
  };

  if (!targetCorporate) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
        <p className="text-lg font-bold">No Corporate Context Found</p>
        <p className="text-sm mt-2">Please select a corporate entity to view SOPs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Standard Operating Procedures</h2>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Master Repository for {targetCorporate.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Search SOPs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-full md:w-64 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all placeholder:text-slate-300" />
          </div>
          {canManage && (
            <button onClick={() => openEditModal(null)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 shadow-xl active:scale-95"><Plus size={14} /> New SOP</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSops.length > 0 ? filteredSops.map(sop => {
          const isExpanded = expandedSopIds.has(sop.id);
          return (
            <div key={sop.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              <div onClick={() => toggleExpand(sop.id)} className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm tracking-tight">{sop.name}</h4>
                    <div className="flex gap-4 mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>{sop.subTopics.length} Training Sub-topics</span>{sop.content && <span>v{sop.content.version}</span>}</div>
                  </div>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                   <button onClick={() => generateSOPPDF(sop)} disabled={isGenerating} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 disabled:opacity-50"><FileDown size={16} /></button>
                  {canManage && (
                    <><button onClick={() => openEditModal(sop)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDeleteSop(sop.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                  <div className="mt-4 space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Briefcase size={12} className="text-blue-500" /> Training Sub-Topics</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {sop.subTopics.map((topic, i) => (
                        <div key={i} className="group bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-blue-200 transition-all shadow-sm">
                          <span className="text-xs font-bold text-slate-700">{topic}</span>
                          {canManage && (<button onClick={() => handleDeleteSubTopic(sop.id, topic)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={14} /></button>)}
                        </div>
                      ))}
                      {canManage && (
                        <div className="flex gap-2 bg-white p-1 rounded-xl border border-dashed border-slate-300 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                          <input type="text" placeholder="Add sub-topic..." value={newSubTopic} onChange={(e) => setNewSubTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubTopic(sop.id)} className="flex-1 bg-transparent px-3 py-1.5 text-xs font-bold outline-none placeholder:text-slate-300" />
                          <button onClick={() => handleAddSubTopic(sop.id)} disabled={!newSubTopic.trim()} className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:grayscale transition-all"><PlusCircle size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FileText size={32} /></div><p className="text-sm font-bold uppercase tracking-widest">No SOPs found</p></div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0"><h3 className="text-lg font-black text-slate-800 tracking-tight">{editingSop ? 'Edit SOP Document' : 'Create New SOP'}</h3><button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18} className="text-slate-500" /></button></div>
            <div className="px-8 py-2 bg-white border-b border-slate-100 flex gap-4 shrink-0"><button onClick={() => setActiveTab('info')} className={`py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>General Info</button><button onClick={() => setActiveTab('content')} className={`py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Document Content</button></div>
            <form onSubmit={handleSaveSop} className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/30">
              {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">SOP Name</label><div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" /><input autoFocus required type="text" value={newSopName} onChange={(e) => setNewSopName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all placeholder:text-slate-300" placeholder="e.g. Chemical Handling Procedures" /></div></div>
                    <div className="grid grid-cols-2 gap-6"><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Version</label><input value={sopContent.version} onChange={(e) => setSopContent({...sopContent, version: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400 transition-all" placeholder="1.0" /></div><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Review Date</label><input type="date" value={sopContent.lastReviewDate} onChange={(e) => setSopContent({...sopContent, lastReviewDate: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400 transition-all" /></div></div>
                  </div>
              )}
              {activeTab === 'content' && (
                  <div className="space-y-8">
                      {(sopContent.sections || []).map((section) => (
                          <div key={section.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group/section transition-all hover:shadow-md">
                              <div className="flex justify-between items-center mb-4"><input value={section.title} onChange={(e) => handleUpdateSection(section.id, 'title', e.target.value)} className="text-sm font-black text-slate-800 uppercase tracking-tight w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none pb-1 transition-colors" placeholder="SECTION TITLE" /><button type="button" onClick={() => handleRemoveSection(section.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-full hover:bg-slate-50" title="Remove Section"><Trash2 size={16} /></button></div>
                              <div className="rounded-xl overflow-hidden"><RichTextEditor label="" value={section.content} onChange={(val) => handleUpdateSection(section.id, 'content', val)} /></div>
                          </div>
                      ))}
                      <button type="button" onClick={handleAddSection} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all group bg-white/50 hover:bg-white"><PlusCircle size={20} className="group-hover:scale-110 transition-transform" /><span className="text-xs font-black uppercase tracking-widest">Add New Section</span></button>
                  </div>
              )}
            </form>
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors">Cancel</button><button onClick={handleSaveSop} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"><Save size={16} /> {editingSop ? 'Update Document' : 'Create SOP'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SopManagement;
