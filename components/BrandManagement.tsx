"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Tag, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    CheckCircle2, 
    XCircle, 
    X, 
    Upload, 
    Download, 
    FileText,
    ShieldCheck, 
    Globe, 
    Building2,
    RefreshCw,
    AlertTriangle,
    MapPin,
    Building,
    Check,
    MessageSquare,
    ChevronRight,
    ArrowRight,
    FileUp,
    History,
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    GitMerge,
    Link,
    Zap,
    Database,
    Fingerprint,
    Copy,
    ArrowDownToLine,
    Anchor,
    Edit3,
    Save,
    Power,
    ZapOff,
    Settings2,
    FileCheck,
    Boxes,
    FileSearch
} from 'lucide-react';
import { Entity, Brand, HierarchyScope } from '../types';

// --- Utility: Jaro-Winkler Fuzzy Matching ---
function jaroWinkler(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  let m = 0;
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1.length === 0 || str2.length === 0) return 0;
  if (str1 === str2) return 1;
  let r = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  let rOrder = Math.max(str1.length, str2.length);
  let s1M = new Array(str1.length).fill(false);
  let s2M = new Array(str2.length).fill(false);
  for (let i = 0; i < str1.length; i++) {
    let low = i >= r ? i - r : 0;
    let high = i + r <= str2.length ? i + r : str2.length - 1;
    for (let j = low; j <= high; j++) {
      if (!s2M[j] && str1[i] === str2[j]) {
        s1M[i] = true;
        s2M[j] = true;
        m++;
        break;
      }
    }
  }
  if (m === 0) return 0;
  let k = 0, t = 0;
  for (let i = 0; i < str1.length; i++) {
    if (s1M[i]) {
      while (!s2M[k]) k++;
      if (str1[i] !== s2[k]) t++;
      k++;
    }
  }
  t /= 2;
  let jaro = (m / str1.length + m / str2.length + (m - t) / m) / 3;
  let p = 0.1, l = 0;
  if (jaro > 0.7) {
    while (str1[l] === str2[l] && l < 4) l++;
    jaro = jaro + l * p * (1 - jaro);
  }
  return jaro;
}

interface BrandManagementProps {
    entities: Entity[];
    onUpdateEntity: (e: Entity) => void;
    currentScope: HierarchyScope;
    userRootId?: string | null;
}

const BrandManagement: React.FC<BrandManagementProps> = ({ entities, onUpdateEntity, currentScope, userRootId }) => {
    // Determine Corporate Context
    const corporateEntity = useMemo(() => {
        let curr = entities.find(e => e.id === userRootId);
        while (curr) {
            if (curr.type === 'corporate') return curr;
            curr = entities.find(e => e.id === curr?.parentId);
        }
        return entities.find(e => e.type === 'corporate');
    }, [entities, userRootId]);

    const masterBrands = useMemo(() => corporateEntity?.masterBrands || [], [corporateEntity]);

    const [view, setView] = useState<'dashboard' | 'review'>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending' | 'Provisional' | 'Rejected' | 'Flagged'>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [newBrandName, setNewBrandName] = useState("");
    const [similarBrands, setSimilarBrands] = useState<Brand[]>([]);
    const [reviewData, setReviewData] = useState<{ matched: Brand[], unique: Brand[] }>({ matched: [], unique: [] });
    
    // Merge State
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [mergeSource, setMergeSource] = useState<Brand | null>(null);
    const [mergeTargetSearch, setMergeTargetSearch] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(10);

    const isCorporateAdmin = ['super-admin', 'corporate'].includes(currentScope);

    // Fuzzy Search for Duplicity Control (Single Item)
    useEffect(() => {
        if (newBrandName.length < 2) { setSimilarBrands([]); return; }
        const matches = masterBrands.filter(b => {
            const score = jaroWinkler(b.name, newBrandName);
            return score > 0.80;
        });
        setSimilarBrands(matches);
    }, [newBrandName, masterBrands]);

    const filteredBrands = useMemo(() => {
        return masterBrands.filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                b.addedByUnitName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [masterBrands, searchTerm, statusFilter]);

    // Paginated Data
    const totalItems = filteredBrands.length;
    const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(totalItems / (itemsPerPage as number));
    
    const paginatedBrands = useMemo(() => {
        if (itemsPerPage === 'All') return filteredBrands;
        const start = (currentPage - 1) * (itemsPerPage as number);
        return filteredBrands.slice(start, start + (itemsPerPage as number));
    }, [filteredBrands, currentPage, itemsPerPage]);

    // Handle page reset on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, itemsPerPage]);

    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | string)[] = [];
        pages.push(1);
        if (currentPage > 3) {
            if (currentPage > 4) pages.push('...');
        }
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) {
            if (currentPage < totalPages - 3) pages.push('...');
        }
        if (totalPages > 1) pages.push(totalPages);
        return pages;
    };

    const handleAction = (id: string, action: 'Active' | 'Flagged' | 'Delete' | 'Rejected') => {
        if (!corporateEntity) return;
        if (action === 'Delete') {
            if (confirm('Remove this brand identity permanently?')) {
                onUpdateEntity({
                    ...corporateEntity,
                    masterBrands: masterBrands.filter(b => b.id !== id)
                });
            }
            return;
        }
        onUpdateEntity({
            ...corporateEntity,
            masterBrands: masterBrands.map(b => b.id === id ? { ...b, status: action } : b)
        });
    };

    const mergeSuggestions = useMemo(() => {
        if (!mergeSource) return [];
        return masterBrands
            .filter(b => b.id !== mergeSource.id) 
            .map(b => ({
                brand: b,
                score: jaroWinkler(mergeSource.name, b.name)
            }))
            .filter(item => {
                if (mergeTargetSearch) {
                    return item.brand.name.toLowerCase().includes(mergeTargetSearch.toLowerCase());
                }
                return item.score > 0.6; 
            })
            .sort((a, b) => b.score - a.score);
    }, [mergeSource, masterBrands, mergeTargetSearch]);

    const handleMerge = (officialBrand: Brand) => {
        if (!corporateEntity || !mergeSource) return;
        
        const msg = `Data Sinking Initiated:\n\n1. Updating all regional and unit records linked to "${mergeSource.name}" (from ${mergeSource.addedByUnitName}) to the primary identity "${officialBrand.name}".\n2. Consolidating all stock history and compliance points into one official node.\n3. Deleting the duplicate redundant identity ${mergeSource.id}.\n\nOperation completed. The registry is now clean and synchronized.`;
        alert(msg);

        onUpdateEntity({
            ...corporateEntity,
            masterBrands: masterBrands.filter(b => b.id !== mergeSource.id)
        });

        setIsMergeModalOpen(false);
        setMergeSource(null);
        setMergeTargetSearch("");
    };

    const handleDownloadSample = () => {
        const headers = "Name,Description\n";
        const sampleRows = "Coca-Cola,Premium carbonated beverages\nNestlé,Global food and beverage processing\nUnilever,Consumer goods and nutrition";
        const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brand_upload_sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !corporateEntity) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target?.result as string;
            const lines = csv.split('\n');
            const newRecords: Brand[] = [];
            const userEntity = entities.find(ent => ent.id === userRootId);
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const [name, description] = line.split(',').map(s => s.trim());
                if (!name) continue;

                newRecords.push({
                    id: `temp-${Date.now()}-${i}`,
                    name,
                    description: description || 'Bulk imported identity',
                    status: isCorporateAdmin ? 'Active' : 'Provisional', 
                    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=100',
                    addedByUnitId: userEntity?.id || 'System',
                    addedByUnitName: userEntity?.name || 'Central Auth',
                    addedByUserName: userEntity?.contactPerson || 'Operator',
                    createdAt: new Date().toISOString().split('T')[0]
                });
            }

            const matched: Brand[] = [];
            const unique: Brand[] = [];

            newRecords.forEach(newBrand => {
                let bestMatch: { score: number, brand: Brand | null } = { score: 0, brand: null };
                
                masterBrands.forEach(existing => {
                    const score = jaroWinkler(newBrand.name, existing.name);
                    if (score > bestMatch.score) {
                        bestMatch = { score, brand: existing };
                    }
                });

                if (bestMatch.score > 0.85) {
                    matched.push({
                        ...newBrand,
                        similarityScore: bestMatch.score,
                        addedByUserName: bestMatch.brand?.name || 'Matched Entity' 
                    });
                } else {
                    unique.push(newBrand);
                }
            });

            setReviewData({ matched, unique });
            if (matched.length > 0 || unique.length > 0) {
                setView('review');
            } else {
                alert("The file appears to be empty or contains invalid data.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const commitReview = () => {
        if (!corporateEntity) return;
        const totalToUpload = [...reviewData.unique]; 
        const sunkCount = reviewData.matched.length;

        if (totalToUpload.length === 0 && sunkCount === 0) {
            setView('dashboard');
            return;
        }

        onUpdateEntity({
            ...corporateEntity,
            masterBrands: [...totalToUpload, ...masterBrands]
        });

        alert(`Commit Complete:\n- Finalized ${totalToUpload.length} new unique identities.\n- Sunk ${sunkCount} duplicate requests into the existing master registry.`);
        setView('dashboard');
        setReviewData({ matched: [], unique: [] });
    };

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!corporateEntity) return;
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const userEntity = entities.find(e => e.id === userRootId);

        const brandPayload: Brand = {
            id: editingBrand?.id || `B-${Date.now()}`,
            name: (data.name as string).trim(),
            description: data.description as string,
            status: editingBrand?.status || (isCorporateAdmin ? 'Active' : 'Provisional'),
            logo: editingBrand?.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=100',
            addedByUnitId: userEntity?.id || 'System',
            addedByUnitName: userEntity?.name || 'Central Auth',
            addedByUserName: userEntity?.contactPerson || 'Operator',
            createdAt: editingBrand?.createdAt || new Date().toISOString().split('T')[0]
        };

        const updatedBrands = editingBrand 
            ? masterBrands.map(b => b.id === editingBrand.id ? brandPayload : b)
            : [brandPayload, ...masterBrands];

        onUpdateEntity({ ...corporateEntity, masterBrands: updatedBrands });
        setIsModalOpen(false);
        setEditingBrand(null);
        setNewBrandName("");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-4 md:px-0">
            {/* Context Awareness Bar */}
            <div className="bg-indigo-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                    <Globe size={24} className="text-indigo-400" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Registry Integrity Control</p>
                        <h2 className="text-sm font-bold uppercase">{corporateEntity?.name} Verified Domain</h2>
                    </div>
                </div>
                <div className="flex gap-4 text-center">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-50">Global Identity</p>
                        <p className="text-lg font-black">{masterBrands.length}</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                        <p className="text-[10px] font-black uppercase text-amber-400">Auth Required</p>
                        <p className="text-lg font-black text-amber-400">{masterBrands.filter(b => ['Provisional', 'Pending'].includes(b.status)).length}</p>
                    </div>
                </div>
            </div>

            {/* Main Action Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-[112px] z-20">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Tag size={20} /></div>
                    <div className="relative group flex-1 lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search identities..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-50 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start md:justify-end">
                    <button onClick={handleDownloadSample} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex-1 md:flex-none justify-center"><Download size={14} /> <span className="hidden xl:inline">Sample CSV</span></button>
                    <input type="file" ref={fileInputRef} onChange={handleBulkUpload} accept=".csv" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 flex-1 md:flex-none justify-center"><FileUp size={14} /> <span className="hidden xl:inline">Bulk Import</span></button>
                    <div className="h-8 w-px bg-slate-200 mx-1 hidden lg:block"></div>
                    <select className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest outline-none shadow-sm flex-1 md:flex-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                        <option value="All">All Status</option>
                        <option value="Active">Active Only</option>
                        <option value="Provisional">Operational (Prov.)</option>
                        <option value="Pending">Pending Auth</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Flagged">Flagged</option>
                    </select>
                    <button onClick={() => { setEditingBrand(null); setIsModalOpen(true); }} className="hidden md:flex px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl active:scale-95 flex-1 md:flex-none justify-center whitespace-nowrap"><Plus size={16} strokeWidth={3} /> Onboard New</button>
                </div>
            </div>

            {/* Tabular Layout for Desktop */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col hidden md:flex">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th className="p-6 pl-8 w-[35%]">Identity & Context</th>
                                <th className="p-6 w-[25%]">Added By Unit Details</th>
                                <th className="p-6 text-center">Status Hub</th>
                                <th className="p-6 text-right pr-8">Authority Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {paginatedBrands.map((brand) => (
                                <tr key={brand.id} className={`group hover:bg-slate-50 transition-colors ${['Pending', 'Provisional'].includes(brand.status) ? 'bg-amber-50/20' : brand.status === 'Rejected' ? 'bg-rose-50/20 opacity-80' : ''}`}>
                                    <td className="p-6 pl-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300 shrink-0">
                                                {brand.logo ? <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" /> : <Building2 className="text-slate-300" size={32} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-black text-slate-800 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{brand.name}</div>
                                                    {brand.status === 'Provisional' && (
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[8px] font-black uppercase rounded-full border border-orange-200 flex items-center gap-1 shadow-xs"><Zap size={8} /> Emergency Use</span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 mt-1 max-w-xl truncate">{brand.description}</div>
                                                <div className="text-[8px] font-black text-slate-400 mt-2 uppercase tracking-widest">Added: {brand.createdAt}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors"><Building size={16} /></div>
                                            <div>
                                                <div className="text-xs font-black text-slate-700 uppercase tracking-tight">{brand.addedByUnitName}</div>
                                                <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">By: {brand.addedByUserName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex justify-center">
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${brand.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ['Pending', 'Provisional'].includes(brand.status) ? 'bg-amber-50 text-amber-700 border-amber-100' : brand.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                                                <span className={`w-2 h-2 rounded-full ${brand.status === 'Active' ? 'bg-emerald-500' : ['Pending', 'Provisional'].includes(brand.status) ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
                                                {brand.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            {isCorporateAdmin && ['Pending', 'Provisional'].includes(brand.status) ? (
                                                <>
                                                    <button onClick={() => handleAction(brand.id, 'Active')} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"><Check size={18} strokeWidth={3} /></button>
                                                    <button onClick={() => { setMergeSource(brand); setIsMergeModalOpen(true); }} className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Anchor size={18} /></button>
                                                    <button onClick={() => handleAction(brand.id, 'Rejected')} className="p-2.5 bg-white text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><X size={18} strokeWidth={3} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setEditingBrand(brand); setNewBrandName(brand.name); setIsModalOpen(true); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Edit size={18} /></button>
                                                    <button onClick={() => handleAction(brand.id, 'Delete')} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-white border-t border-slate-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Show Rows:</span>
                        <select value={itemsPerPage} onChange={(e) => setItemsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value))} className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-black rounded-xl px-3 py-1.5 outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner">
                            <option value="5">5 Identities</option>
                            <option value="10">10 Identities</option>
                            <option value="25">25 Identities</option>
                            <option value="All">All Registry</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={18} /></button>
                        <div className="flex gap-1 mx-2">{getPageNumbers().map((p, i) => (typeof p === 'number' ? <button key={i} onClick={() => setCurrentPage(p)} className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}>{p}</button> : <span key={i} className="px-1 text-slate-300 font-bold">...</span>))}</div>
                        <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Mobile View Placeholder */}
            <div className="md:hidden space-y-4">
                {paginatedBrands.map(brand => (
                    <div key={brand.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0">{brand.logo ? <img src={brand.logo} className="w-full h-full object-cover" alt={brand.name} /> : <Building2 className="text-slate-300" size={24} />}</div>
                                <div><h4 className="font-black text-slate-800 uppercase tracking-tight leading-none">{brand.name}</h4><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">v1.0 • {brand.status}</p></div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingBrand(brand); setNewBrandName(brand.name); setIsModalOpen(true); }} className="p-2 text-slate-400"><Edit size={16} /></button>
                                <button onClick={() => handleAction(brand.id, 'Delete')} className="p-2 text-slate-400"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Mobile Floating Action Button (FAB) */}
                <div className="fixed bottom-24 right-6 z-50">
                    <button 
                        onClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
                        className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white"
                    >
                        <Plus size={32} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
                        <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Tag size={24}/></div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{editingBrand ? 'Edit Identity' : 'Onboard Identity'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-8 bg-white overflow-y-auto max-h-[70vh] custom-scrollbar text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Name (Public SKU)</label>
                                <input required name="name" value={newBrandName} onChange={e => setNewBrandName(e.target.value.toUpperCase())} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-xl font-black focus:outline-none focus:border-indigo-500 transition-all shadow-inner uppercase tracking-wider" placeholder="ENTER BRAND NAME..." />
                            </div>
                            {similarBrands.length > 0 && (
                                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] space-y-4 animate-in slide-in-from-top-4 shadow-sm">
                                    <div className="flex items-center gap-3 text-rose-600"><AlertTriangle size={20} /><span className="text-xs font-black uppercase tracking-widest">Duplicity Control Alert</span></div>
                                    <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed">System identified {similarBrands.length} potential collisions in the master registry. Please verify before creating a redundant node.</p>
                                    <div className="space-y-2">
                                        {similarBrands.map(b => (
                                            <div key={b.id} className="bg-white p-4 rounded-2xl border border-rose-100 flex items-center justify-between shadow-xs">
                                                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400">{b.name.charAt(0)}</div><span className="text-xs font-black text-slate-800 uppercase">{b.name}</span></div>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${b.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{b.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Description</label>
                                <textarea name="description" defaultValue={editingBrand?.description} className="w-full h-32 p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-medium outline-none focus:border-indigo-400 shadow-inner resize-none transition-all" placeholder="Enter brand positioning or SKU category details..." />
                            </div>
                            <div className="px-10 py-8 border-t bg-slate-50 -mx-10 -mb-10 flex justify-end gap-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest">Discard</button><button type="submit" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3"><Save size={18} /> {editingBrand ? 'Update Record' : 'Initialize Node'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Merge/Sink Modal */}
            {isMergeModalOpen && mergeSource && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95">
                        <div className="px-10 py-8 bg-blue-600 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <Anchor size={32} />
                                <div><h3 className="text-xl font-black uppercase tracking-tight">Identity Sinking Hub</h3><p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-2">Consolidating Provisional Identities into Global Masters</p></div>
                            </div>
                            <button onClick={() => setIsMergeModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={28}/></button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
                            <div className="p-10 border-b border-slate-100 bg-white">
                                <div className="flex items-center gap-10">
                                    <div className="flex-1 bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl relative overflow-hidden group/source">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/source:scale-110 transition-transform"><Trash2 size={80}/></div>
                                        <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5">Source (Redundant)</div>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{mergeSource.name}</h4>
                                        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase">{mergeSource.addedByUnitName} Node</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xl border-4 border-white animate-pulse"><ArrowRight size={32} strokeWidth={3} /></div>
                                    <div className="flex-1 bg-emerald-50 border-2 border-emerald-500 p-6 rounded-3xl relative overflow-hidden group/target">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/target:scale-110 transition-transform"><CheckCircle size={80}/></div>
                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Destination (Master)</div>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic opacity-50">Choose from list...</h4>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col overflow-hidden p-10 space-y-6">
                                <div className="relative group shrink-0">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input type="text" placeholder="Search Master Identities to Sink into..." className="w-full pl-14 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:border-blue-500 transition-all shadow-inner uppercase tracking-wider" value={mergeTargetSearch} onChange={e => setMergeTargetSearch(e.target.value)} />
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                    {mergeSuggestions.map(item => (
                                        <button key={item.brand.id} onClick={() => handleMerge(item.brand)} className="w-full text-left p-5 bg-white border-2 border-slate-100 rounded-[1.75rem] hover:border-blue-500 hover:shadow-lg transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all font-black text-sm">{item.brand.name.charAt(0)}</div>
                                                <div><p className="font-black text-slate-800 text-base uppercase tracking-tight leading-none mb-1.5">{item.brand.name}</p><div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${item.brand.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{item.brand.status} Master</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Added: {item.brand.createdAt}</span></div></div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="flex flex-col items-end"><span className="text-[10px] font-black text-blue-600 uppercase">Fuzzy Match</span><span className="text-[9px] font-bold text-slate-300">{Math.round(item.score * 100)}% Confidence</span></div>
                                                <div className="p-2 bg-slate-50 rounded-full text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all"><ChevronRight size={20} strokeWidth={3} /></div>
                                            </div>
                                        </button>
                                    ))}
                                    {mergeSuggestions.length === 0 && <div className="p-20 text-center text-slate-300 italic text-sm uppercase font-bold border-2 border-dashed border-slate-200 rounded-[2rem]">No Collision Candidates Identified</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandManagement;