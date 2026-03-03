"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Search, Plus, Trash2, X, Filter, Download, Upload, FileText, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Copy, Edit3, Save, ArrowLeft, Eye, EyeOff, Zap, Beef, Wheat, Flame,
  CheckCircle2, XCircle, AlertCircle, FileSpreadsheet, Printer, RotateCcw, ListFilter, BookOpen, List
} from 'lucide-react';

interface MasterIngredient {
  id: number;
  name: string;
  symbol: string;
  keyword: string;
  refrence: string;
  allergen: string;
  portion: number;
  energy: number;
  protein: number;
  carb: number;
  fat: number;
  createdOn: string;
  status: 'active' | 'inactive';
}

interface RecipeIngredientRef {
  ingredientId: number;
  quantity: number;
}

interface RecipeItem {
  id: number;
  corporateName: string;
  regionalName: string;
  unitName: string;
  name: string;
  symbol: string;
  refrence: string;
  allergen: string;
  portion: number;
  energy: string;
  protein: string;
  carb: string;
  fat: string;
  createdOn: string;
  isActive: boolean;
  deactivatedOn: string | null;
  servings: number;
  description: string;
  notes: string;
  ingredients: RecipeIngredientRef[];
}

interface MakerIngredient {
  localId: string;
  ingredientId: number | null;
  userName: string;
  dbName: string;
  keyword: string;
  refrence: string;
  allergen: string;
  symbol: string;
  quantity: number;
  energy: number;
  protein: number;
  carb: number;
  fat: number;
  fromDB: boolean;
  basePortion: number;
  baseEnergy: number;
  baseProtein: number;
  baseCarb: number;
  baseFat: number;
  type: string;
}

const INITIAL_INGREDIENTS: MasterIngredient[] = [
  { id: 1, name: "Kadhai Gravy", symbol: "Veg", keyword: "Gravy, Indian, Base", refrence: "Open Source", allergen: "Dairy", portion: 100, energy: 79, protein: 1.9, carb: 5, fat: 6, createdOn: "2025-01-03 16:30:18", status: 'active' },
  { id: 2, name: "Lamb Leg", symbol: "NonVeg", keyword: "Meat, Mutton", refrence: "Open Source", allergen: "None", portion: 150, energy: 282, protein: 36, carb: 0, fat: 14, createdOn: "2025-01-03 15:51:08", status: 'active' },
  { id: 3, name: "Spelt Flour", symbol: "Veg", keyword: "Grain, Flour, Baking", refrence: "USDA, FSSAI", allergen: "Gluten", portion: 100, energy: 338, protein: 14.6, carb: 70.2, fat: 2.4, createdOn: "2024-11-20 10:00:00", status: 'active' },
  { id: 4, name: "Olive Oil", symbol: "Veg", keyword: "Oil, Fat, Cooking oil", refrence: "USDA", allergen: "None", portion: 100, energy: 884, protein: 0, carb: 0, fat: 100, createdOn: "2024-10-15 12:00:00", status: 'inactive' },
  { id: 5, name: "Tomato", symbol: "Veg", keyword: "Vegetable, Fruit, Salad", refrence: "USDA", allergen: "None", portion: 100, energy: 18, protein: 0.9, carb: 3.9, fat: 0.2, createdOn: "2024-09-01 11:00:00", status: 'active' },
  { id: 6, name: "Chicken Breast", symbol: "NonVeg", keyword: "Poultry, Meat, White meat", refrence: "Internal Recipe", allergen: "None", portion: 150, energy: 248, protein: 46.5, carb: 0, fat: 5.4, createdOn: "2024-08-15 14:00:00", status: 'active' },
  { id: 7, name: "Salt, table, iodised", symbol: "Veg", keyword: "Seasoning", refrence: "USDA", allergen: "None", portion: 100, energy: 0, protein: 0, carb: 0, fat: 0, createdOn: "2024-01-01 12:00:00", status: 'active' },
];

const INITIAL_RECIPES: RecipeItem[] = [
  { id: 101, corporateName: "SFM Corporate", regionalName: "North India", unitName: "SFM Delhi Kitchen", name: "Spicy Lamb Curry", symbol: "NonVeg", refrence: "Internal, Open Source", allergen: "None, Dairy", portion: 250, energy: "450", protein: "40.5", carb: "5.0", fat: "25.0", createdOn: "2025-02-10 12:00:00", isActive: true, deactivatedOn: null, servings: 1, description: "A rich and spicy lamb curry.", notes: "Can be made spicier by adding more chili.", ingredients: [{ ingredientId: 2, quantity: 150 }, { ingredientId: 1, quantity: 120 }] },
  { id: 102, corporateName: "SFM Corporate", regionalName: "South India", unitName: "SFM Chennai Kitchen", name: "Vegan Lentil Soup", symbol: "Veg", refrence: "Internal", allergen: "None", portion: 300, energy: "250", protein: "12.5", carb: "35.0", fat: "5.0", createdOn: "2025-01-15 10:00:00", isActive: true, deactivatedOn: null, servings: 2, description: "A hearty and healthy vegan soup.", notes: "", ingredients: [{ ingredientId: 5, quantity: 450 }] },
  { id: 103, corporateName: "SFM Corporate", regionalName: "North India", unitName: "SFM Gurgaon Canteen", name: "Chicken Tikka Skewers", symbol: "NonVeg", refrence: "FSSAI", allergen: "Dairy", portion: 180, energy: "320", protein: "35.0", carb: "3.0", fat: "18.0", createdOn: "2024-12-20 14:00:00", isActive: false, deactivatedOn: "2025-02-01 09:00:00", servings: 1, description: "Classic chicken skewers.", notes: "Marinate overnight for best results.", ingredients: [{ ingredientId: 6, quantity: 150 }, { ingredientId: 1, quantity: 50 }] },
  { id: 104, corporateName: "Global Foods", regionalName: "West", unitName: "Mumbai Central", name: "Paneer Butter Masala", symbol: "Veg", refrence: "Open Source", allergen: "Dairy, Nuts", portion: 280, energy: "480", protein: "15.0", carb: "12.0", fat: "40.0", createdOn: "2024-11-05 18:00:00", isActive: true, deactivatedOn: null, servings: 4, description: "A creamy and rich paneer dish.", notes: "Add a touch of honey to balance the tanginess.", ingredients: [{ ingredientId: 1, quantity: 200 }, { ingredientId: 4, quantity: 30 }] },
];

const REFERENCE_OPTIONS = ["USDA", "FSSAI", "Open Source", "Internal Recipe", "Supplier Data"];
const ALLERGEN_OPTIONS = ["None", "Gluten", "Dairy", "Nuts", "Soy", "Fish", "Shellfish", "Eggs", "Sesame"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let inQuotedField = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
      inQuotedField = !inQuotedField;
    } else if (char === ',' && !inQuotedField) {
      result.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField);
  return result.map(f => f.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
}

function jaroWinklerDistance(s1: string, s2: string, p = 0.1, lMax = 4): number {
  if (!s1 || !s2) return 0.0;
  if (s1 === s2) return 1.0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0.0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) t++;
    k++;
  }
  t /= 2;
  const jaroDist = (matches / len1 + matches / len2 + (matches - t) / matches) / 3.0;
  let l = 0;
  const prefixLimit = Math.min(lMax, Math.min(len1, len2));
  for (l = 0; l < prefixLimit; l++) {
    if (s1[l] !== s2[l]) break;
  }
  return jaroDist + (l * p * (1 - jaroDist));
}

function normalizeForMatching(str: string): string {
  return str ? str.toLowerCase().replace(/\s*&\s*/g, " and ").replace(/[.,\/#!$%\^*;:{}=\-_`~()']/g, "").replace(/\s+/g, ' ').trim() : "";
}

const FssaiSymbol: React.FC<{ type: string; size?: number }> = ({ type, size = 16 }) => {
  const lower = type?.toLowerCase();
  if (lower === 'veg') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div style={{ width: size, height: size, border: '1.5px solid #128236', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', backgroundColor: '#128236' }} />
        </div>
        <span className="text-[10px] text-gray-500">{type}</span>
      </div>
    );
  }
  if (lower === 'nonveg') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div style={{ width: size, height: size, border: '1.5px solid #A5432D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10">
            <polygon points="5,1 0.5,9 9.5,9" fill="#A5432D" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-500">{type}</span>
      </div>
    );
  }
  return <span className="text-xs text-gray-500">{type || '-'}</span>;
};

const PortionDropdown: React.FC<{
  basePortion: number;
  currentLabel: string;
  onSelect: (grams: number, label: string) => void;
}> = ({ basePortion, currentLabel, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded flex items-center gap-1 hover:bg-gray-200 transition-colors">
        {currentLabel} <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px]">
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors" onClick={() => { onSelect(basePortion, `1 Portion (${basePortion}g)`); setOpen(false); }}>
            1 Portion ({basePortion}g)
          </button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors" onClick={() => { onSelect(100, '100g'); setOpen(false); }}>
            100g
          </button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors" onClick={() => {
            const val = prompt("Enter custom portion size in grams:", "150");
            if (val) {
              const num = parseFloat(val);
              if (!isNaN(num) && num > 0) { onSelect(num, `Custom (${num}g)`); setOpen(false); }
              else alert("Please enter a valid positive number.");
            }
          }}>
            Customized...
          </button>
        </div>
      )}
    </div>
  );
};

const RecipeCalculation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'recipe'>('recipe');
  const [masterIngredients, setMasterIngredients] = useState<MasterIngredient[]>(INITIAL_INGREDIENTS);
  const [recipes, setRecipes] = useState<RecipeItem[]>(INITIAL_RECIPES);

  // Ingredients tab state
  const [ingSearch, setIngSearch] = useState('');
  const [ingPage, setIngPage] = useState(1);
  const [ingPerPage, setIngPerPage] = useState(10);
  const [ingSelectedIds, setIngSelectedIds] = useState<Set<number>>(new Set());
  const [ingPortionMode, setIngPortionMode] = useState<'actual' | 'per100g'>('actual');
  const [ingPortionOverrides, setIngPortionOverrides] = useState<Record<number, { grams: number; label: string }>>({});
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<MasterIngredient | null>(null);
  const [ingColumnFilters, setIngColumnFilters] = useState<Record<string, string[]>>({});

  // Recipe tab state
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipePage, setRecipePage] = useState(1);
  const [recipePerPage, setRecipePerPage] = useState(10);
  const [recipeSelectedIds, setRecipeSelectedIds] = useState<Set<number>>(new Set());
  const [recipePortionMode, setRecipePortionMode] = useState<'actual' | 'per100g'>('actual');
  const [recipePortionOverrides, setRecipePortionOverrides] = useState<Record<number, { grams: number; label: string }>>({});
  const [recipeView, setRecipeView] = useState<'list' | 'maker'>('list');
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  // Recipe maker state
  const [makerTitle, setMakerTitle] = useState('');
  const [makerDescription, setMakerDescription] = useState('');
  const [makerServings, setMakerServings] = useState('1');
  const [makerPrepTime, setMakerPrepTime] = useState('');
  const [makerCookTime, setMakerCookTime] = useState('');
  const [makerNotes, setMakerNotes] = useState('');
  const [makerIngredients, setMakerIngredients] = useState<MakerIngredient[]>([]);
  const [makerSearch, setMakerSearch] = useState('');
  const [makerSearchResults, setMakerSearchResults] = useState<any[]>([]);
  const [showMakerSearch, setShowMakerSearch] = useState(false);
  const [makerFinalWeight, setMakerFinalWeight] = useState('');
  const [showDescription, setShowDescription] = useState(true);

  // Ingredient modal form state
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('Veg');
  const [formKeyword, setFormKeyword] = useState('');
  const [formPortion, setFormPortion] = useState('100');
  const [formEnergy, setFormEnergy] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCarb, setFormCarb] = useState('');
  const [formFat, setFormFat] = useState('');
  const [formRefrence, setFormRefrence] = useState<string[]>([]);
  const [formAllergen, setFormAllergen] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // ============================
  // INGREDIENTS TAB LOGIC
  // ============================
  const filteredIngredients = useMemo(() => {
    let data = [...masterIngredients];
    data.sort((a, b) => {
      if (a.status === 'active' && b.status === 'inactive') return -1;
      if (a.status === 'inactive' && b.status === 'active') return 1;
      return 0;
    });
    if (ingSearch) {
      const term = ingSearch.toLowerCase();
      data = data.filter(item =>
        (item.name || '').toLowerCase().includes(term) ||
        (item.keyword || '').toLowerCase().includes(term) ||
        (item.refrence || '').toLowerCase().includes(term) ||
        (item.allergen || '').toLowerCase().includes(term)
      );
    }
    Object.keys(ingColumnFilters).forEach(key => {
      const values = ingColumnFilters[key];
      if (values && values.length > 0) {
        data = data.filter(item => {
          const val = (item as any)[key] || '';
          return values.includes(val);
        });
      }
    });
    return data;
  }, [masterIngredients, ingSearch, ingColumnFilters]);

  const ingTotalPages = Math.ceil(filteredIngredients.length / ingPerPage);
  const ingPaginatedData = filteredIngredients.slice((ingPage - 1) * ingPerPage, ingPage * ingPerPage);

  const getNutrition = (item: MasterIngredient, targetGrams: number) => {
    const base = item.portion || 100;
    const ratio = targetGrams / base;
    return {
      energy: (item.energy * ratio).toFixed(0),
      protein: (item.protein * ratio).toFixed(1),
      carb: (item.carb * ratio).toFixed(1),
      fat: (item.fat * ratio).toFixed(1),
    };
  };

  const getIngPortionGrams = (item: MasterIngredient) => {
    if (ingPortionOverrides[item.id]) return ingPortionOverrides[item.id].grams;
    return ingPortionMode === 'per100g' ? 100 : (item.portion || 100);
  };

  const getIngPortionLabel = (item: MasterIngredient) => {
    if (ingPortionOverrides[item.id]) return ingPortionOverrides[item.id].label;
    return ingPortionMode === 'per100g' ? '100g' : `1 Portion (${item.portion || 100}g)`;
  };

  const handleIngSelectAll = (checked: boolean) => {
    if (checked) {
      setIngSelectedIds(new Set(ingPaginatedData.map(i => i.id)));
    } else {
      setIngSelectedIds(new Set());
    }
  };

  const toggleIngSelect = (id: number) => {
    const next = new Set(ingSelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setIngSelectedIds(next);
  };

  const deleteSelectedIngredients = () => {
    if (ingSelectedIds.size === 0) return;
    if (!confirm(`Delete ${ingSelectedIds.size} selected ingredient(s)?`)) return;
    setMasterIngredients(prev => prev.filter(i => !ingSelectedIds.has(i.id)));
    setIngSelectedIds(new Set());
  };

  const toggleIngStatus = (id: number) => {
    setMasterIngredients(prev => prev.map(i =>
      i.id === id ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' } : i
    ));
  };

  const duplicateIngredient = (id: number) => {
    const orig = masterIngredients.find(i => i.id === id);
    if (!orig) return;
    const newItem: MasterIngredient = {
      ...orig,
      id: Date.now() + Math.random(),
      name: `Copy of ${orig.name}`,
      createdOn: new Date().toISOString(),
    };
    setMasterIngredients(prev => [newItem, ...prev]);
  };

  const deleteIngredient = (id: number) => {
    if (!confirm('Delete this ingredient?')) return;
    setMasterIngredients(prev => prev.filter(i => i.id !== id));
  };

  const openIngredientModal = (item?: MasterIngredient) => {
    if (item) {
      setEditingIngredient(item);
      setFormName(item.name);
      setFormSymbol(item.symbol);
      setFormKeyword(item.keyword);
      setFormPortion(String(item.portion));
      setFormEnergy(String(item.energy));
      setFormProtein(String(item.protein));
      setFormCarb(String(item.carb));
      setFormFat(String(item.fat));
      setFormRefrence(item.refrence ? item.refrence.split(', ') : []);
      setFormAllergen(item.allergen ? item.allergen.split(', ') : []);
    } else {
      setEditingIngredient(null);
      setFormName('');
      setFormSymbol('Veg');
      setFormKeyword('');
      setFormPortion('100');
      setFormEnergy('');
      setFormProtein('');
      setFormCarb('');
      setFormFat('');
      setFormRefrence([]);
      setFormAllergen([]);
    }
    setShowIngredientModal(true);
  };

  const saveIngredient = () => {
    if (!formName.trim()) { alert('Name is required.'); return; }
    const data: MasterIngredient = {
      id: editingIngredient?.id || Date.now() + Math.random(),
      name: formName.trim(),
      symbol: formSymbol,
      keyword: formKeyword,
      refrence: formRefrence.join(', '),
      allergen: formAllergen.join(', ') || 'None',
      portion: parseFloat(formPortion) || 100,
      energy: parseFloat(formEnergy) || 0,
      protein: parseFloat(formProtein) || 0,
      carb: parseFloat(formCarb) || 0,
      fat: parseFloat(formFat) || 0,
      createdOn: editingIngredient?.createdOn || new Date().toISOString(),
      status: editingIngredient?.status || 'active',
    };
    if (editingIngredient) {
      setMasterIngredients(prev => prev.map(i => i.id === editingIngredient.id ? data : i));
    } else {
      setMasterIngredients(prev => [data, ...prev]);
    }
    setShowIngredientModal(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split(/\r\n|\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error("CSV must have a header and data.");
        const headers = parseCsvLine(lines.shift()!);
        const headerMapping: Record<string, string> = {
          'Name': 'name', 'Type': 'symbol', 'Keyword': 'keyword', 'Reference': 'refrence',
          'Allergen': 'allergen', 'Portion (g)': 'portion', 'Energy (kcal)': 'energy',
          'Protein (g)': 'protein', 'Carb (g)': 'carb', 'Fat (g)': 'fat'
        };
        const internalKeys = headers.map(h => headerMapping[h.trim()]);
        const newItems: MasterIngredient[] = [];
        lines.forEach(line => {
          const values = parseCsvLine(line);
          if (values.length !== headers.length) return;
          const obj: any = {};
          internalKeys.forEach((key, idx) => { if (key) obj[key] = values[idx] || ''; });
          if (!obj.portion || isNaN(parseFloat(obj.portion))) obj.portion = 100;
          else obj.portion = parseFloat(obj.portion);
          ['energy', 'protein', 'carb', 'fat'].forEach(k => { obj[k] = parseFloat(obj[k]) || 0; });
          obj.id = Date.now() + Math.random();
          obj.createdOn = new Date().toISOString();
          obj.status = 'active';
          if (obj.name) newItems.push(obj as MasterIngredient);
        });
        setMasterIngredients(prev => [...newItems, ...prev]);
        alert(`Imported ${newItems.length} ingredients.`);
      } catch (err) {
        alert("Failed to import CSV. Check file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) { alert("No data to download."); return; }
    const headers = ['Name', 'Type', 'Keyword', 'Reference', 'Allergen', 'Portion (g)', 'Energy (kcal)', 'Protein (g)', 'Carb (g)', 'Fat (g)'];
    const csv = [
      headers.join(','),
      ...data.map(row => [
        row.name, row.symbol, row.keyword, row.refrence, row.allergen,
        row.portion, row.energy, row.protein, row.carb, row.fat
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const downloadSampleCSV = () => {
    const sample = [
      { name: "Tomato", symbol: "Veg", keyword: "Vegetable, Fruit", refrence: "USDA", allergen: "None", portion: 100, energy: 18, protein: 0.9, carb: 3.9, fat: 0.2 },
      { name: "Chicken Breast", symbol: "NonVeg", keyword: "Poultry, Meat", refrence: "Internal Recipe", allergen: "None", portion: 150, energy: 248, protein: 46.5, carb: 0, fat: 5.4 }
    ];
    downloadCSV(sample, 'ingredients_import_sample.csv');
  };

  // ============================
  // RECIPE TAB LOGIC
  // ============================
  const filteredRecipes = useMemo(() => {
    let data = [...recipes];
    if (recipeSearch) {
      const term = recipeSearch.toLowerCase();
      data = data.filter(item => (item.name || '').toLowerCase().includes(term));
    }
    data.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime();
    });
    return data;
  }, [recipes, recipeSearch]);

  const recipeTotalPages = Math.ceil(filteredRecipes.length / recipePerPage);
  const recipePaginatedData = filteredRecipes.slice((recipePage - 1) * recipePerPage, recipePage * recipePerPage);

  const getRecipeNutrition = (item: RecipeItem, targetGrams: number) => {
    const base = item.portion || 100;
    const ratio = targetGrams / base;
    return {
      energy: (parseFloat(item.energy) * ratio).toFixed(0),
      protein: (parseFloat(item.protein) * ratio).toFixed(1),
      carb: (parseFloat(item.carb) * ratio).toFixed(1),
      fat: (parseFloat(item.fat) * ratio).toFixed(1),
    };
  };

  const getRecipePortionGrams = (item: RecipeItem) => {
    if (recipePortionOverrides[item.id]) return recipePortionOverrides[item.id].grams;
    return recipePortionMode === 'per100g' ? 100 : (item.portion || 100);
  };

  const getRecipePortionLabel = (item: RecipeItem) => {
    if (recipePortionOverrides[item.id]) return recipePortionOverrides[item.id].label;
    return recipePortionMode === 'per100g' ? '100g' : `1 Portion (${item.portion || 100}g)`;
  };

  const toggleRecipeSelect = (id: number) => {
    const next = new Set(recipeSelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRecipeSelectedIds(next);
  };

  const toggleRecipeStatus = (id: number) => {
    setRecipes(prev => prev.map(r =>
      r.id === id ? { ...r, isActive: !r.isActive, deactivatedOn: r.isActive ? new Date().toISOString() : null } : r
    ));
  };

  const deleteRecipe = (id: number) => {
    if (!confirm('Delete this recipe?')) return;
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const duplicateRecipe = (id: number) => {
    const orig = recipes.find(r => r.id === id);
    if (!orig) return;
    const newItem: RecipeItem = {
      ...orig,
      id: Date.now() + Math.random(),
      name: `Copy of ${orig.name}`,
      createdOn: new Date().toISOString(),
      isActive: true,
      deactivatedOn: null,
    };
    setRecipes(prev => [newItem, ...prev]);
  };

  const deleteSelectedRecipes = () => {
    if (recipeSelectedIds.size === 0) return;
    if (!confirm(`Delete ${recipeSelectedIds.size} selected recipe(s)?`)) return;
    setRecipes(prev => prev.filter(r => !recipeSelectedIds.has(r.id)));
    setRecipeSelectedIds(new Set());
  };

  // ============================
  // RECIPE MAKER LOGIC
  // ============================
  const unifiedItems = useMemo(() => [
    ...masterIngredients.filter(i => i.status === 'active').map(i => ({ ...i, type: 'ingredient' as const })),
    ...recipes.filter(r => r.isActive).map(r => ({
      id: r.id, name: r.name, symbol: r.symbol, keyword: '', refrence: r.refrence,
      allergen: r.allergen, portion: r.portion, energy: parseFloat(r.energy) || 0,
      protein: parseFloat(r.protein) || 0, carb: parseFloat(r.carb) || 0, fat: parseFloat(r.fat) || 0,
      createdOn: r.createdOn, status: 'active' as const, type: 'recipe' as const
    }))
  ], [masterIngredients, recipes]);

  const openRecipeMaker = (recipeId?: number) => {
    if (recipeId) {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;
      setEditingRecipeId(recipeId);
      setMakerTitle(recipe.name);
      setMakerDescription(recipe.description || '');
      setMakerServings(String(recipe.servings || 1));
      setMakerNotes(recipe.notes || '');
      setMakerFinalWeight(String(recipe.portion || ''));
      const ingList: MakerIngredient[] = recipe.ingredients.map(ref => {
        const full = unifiedItems.find(i => i.id === ref.ingredientId);
        if (!full) return null;
        const qty = ref.quantity;
        const factor = qty / (full.portion || 100);
        return {
          localId: `${Date.now()}-${Math.random()}`,
          ingredientId: full.id,
          userName: full.name,
          dbName: full.name,
          keyword: (full as any).keyword || '',
          refrence: full.type === 'recipe' ? 'Recipe' : full.refrence,
          allergen: full.allergen,
          symbol: full.symbol,
          quantity: qty,
          energy: parseFloat((full.energy * factor).toFixed(2)),
          protein: parseFloat((full.protein * factor).toFixed(2)),
          carb: parseFloat((full.carb * factor).toFixed(2)),
          fat: parseFloat((full.fat * factor).toFixed(2)),
          fromDB: true,
          basePortion: full.portion || 100,
          baseEnergy: full.energy,
          baseProtein: full.protein,
          baseCarb: full.carb,
          baseFat: full.fat,
          type: full.type,
        };
      }).filter(Boolean) as MakerIngredient[];
      setMakerIngredients(ingList.length > 0 ? ingList : [createEmptyMakerIngredient()]);
    } else {
      setEditingRecipeId(null);
      setMakerTitle('');
      setMakerDescription('');
      setMakerServings('1');
      setMakerPrepTime('');
      setMakerCookTime('');
      setMakerNotes('');
      setMakerFinalWeight('');
      setMakerIngredients([createEmptyMakerIngredient()]);
    }
    setRecipeView('maker');
  };

  const createEmptyMakerIngredient = (): MakerIngredient => ({
    localId: `${Date.now()}-${Math.random()}`,
    ingredientId: null,
    userName: '',
    dbName: '',
    keyword: '',
    refrence: '',
    allergen: '',
    symbol: 'Veg',
    quantity: 0,
    energy: 0, protein: 0, carb: 0, fat: 0,
    fromDB: false,
    basePortion: 100, baseEnergy: 0, baseProtein: 0, baseCarb: 0, baseFat: 0,
    type: 'ingredient',
  });

  const addMakerIngredientFromDB = (item: any) => {
    const newIng: MakerIngredient = {
      localId: `${Date.now()}-${Math.random()}`,
      ingredientId: item.id,
      userName: item.name,
      dbName: item.name,
      keyword: item.keyword || '',
      refrence: item.type === 'recipe' ? 'Recipe' : (item.refrence || ''),
      allergen: item.allergen || '',
      symbol: item.symbol || 'Veg',
      quantity: 0,
      energy: 0, protein: 0, carb: 0, fat: 0,
      fromDB: true,
      basePortion: item.portion || 100,
      baseEnergy: item.energy || 0,
      baseProtein: item.protein || 0,
      baseCarb: item.carb || 0,
      baseFat: item.fat || 0,
      type: item.type || 'ingredient',
    };
    setMakerIngredients(prev => [newIng, ...prev]);
    setMakerSearch('');
    setShowMakerSearch(false);
  };

  const updateMakerIngredientQty = (localId: string, qty: number) => {
    setMakerIngredients(prev => prev.map(ing => {
      if (ing.localId !== localId) return ing;
      const factor = qty / (ing.basePortion || 100);
      return {
        ...ing,
        quantity: qty,
        energy: parseFloat((ing.baseEnergy * factor).toFixed(2)),
        protein: parseFloat((ing.baseProtein * factor).toFixed(2)),
        carb: parseFloat((ing.baseCarb * factor).toFixed(2)),
        fat: parseFloat((ing.baseFat * factor).toFixed(2)),
      };
    }));
  };

  const removeMakerIngredient = (localId: string) => {
    setMakerIngredients(prev => {
      const next = prev.filter(i => i.localId !== localId);
      return next.length === 0 ? [createEmptyMakerIngredient()] : next;
    });
  };

  const makerTotals = useMemo(() => {
    return makerIngredients.reduce((acc, ing) => ({
      weight: acc.weight + (ing.quantity || 0),
      energy: acc.energy + (ing.energy || 0),
      protein: acc.protein + (ing.protein || 0),
      carb: acc.carb + (ing.carb || 0),
      fat: acc.fat + (ing.fat || 0),
    }), { weight: 0, energy: 0, protein: 0, carb: 0, fat: 0 });
  }, [makerIngredients]);

  const makerFinalNutrition = useMemo(() => {
    const numServings = parseInt(makerServings) || 1;
    const finalWPS = parseFloat(makerFinalWeight);
    if (isNaN(finalWPS) || finalWPS <= 0 || numServings <= 0) {
      return { per100g: null, perServing: null, finalWeight: finalWPS };
    }
    const totalFinalWeight = finalWPS * numServings;
    const per100g = {
      energy: ((makerTotals.energy / totalFinalWeight) * 100),
      protein: ((makerTotals.protein / totalFinalWeight) * 100),
      carb: ((makerTotals.carb / totalFinalWeight) * 100),
      fat: ((makerTotals.fat / totalFinalWeight) * 100),
    };
    const perServing = {
      energy: per100g.energy * (finalWPS / 100),
      protein: per100g.protein * (finalWPS / 100),
      carb: per100g.carb * (finalWPS / 100),
      fat: per100g.fat * (finalWPS / 100),
    };
    return { per100g, perServing, finalWeight: finalWPS };
  }, [makerTotals, makerServings, makerFinalWeight]);

  const overallSymbol = useMemo(() => {
    return makerIngredients.some(i => i.symbol?.toLowerCase() === 'nonveg') ? 'NonVeg' : 'Veg';
  }, [makerIngredients]);

  const combinedAllergens = useMemo(() => {
    const set = new Set<string>();
    makerIngredients.forEach(i => {
      if (i.allergen) i.allergen.split(',').forEach(a => { const t = a.trim(); if (t && t !== 'None') set.add(t); });
    });
    return Array.from(set);
  }, [makerIngredients]);

  const combinedRefrences = useMemo(() => {
    const set = new Set<string>();
    makerIngredients.forEach(i => {
      if (i.refrence) i.refrence.split(',').forEach(r => { const t = r.trim(); if (t) set.add(t); });
    });
    return Array.from(set);
  }, [makerIngredients]);

  const saveRecipeFromMaker = () => {
    if (!makerTitle.trim()) { alert('Recipe title is required.'); return; }
    const numServings = parseInt(makerServings) || 1;
    const finalWeight = parseFloat(makerFinalWeight) || makerTotals.weight / numServings;
    const ingredientRefs: RecipeIngredientRef[] = makerIngredients
      .filter(i => i.ingredientId && i.quantity > 0)
      .map(i => ({ ingredientId: i.ingredientId!, quantity: i.quantity }));

    const totalWeight = makerTotals.weight;
    const concentrationFactor = totalWeight > 0 ? finalWeight / (totalWeight / numServings) : 1;

    const recipeData: RecipeItem = {
      id: editingRecipeId || Date.now() + Math.random(),
      corporateName: 'Default Corporate',
      regionalName: 'Default Region',
      unitName: 'Default Unit',
      name: makerTitle.trim(),
      symbol: overallSymbol,
      refrence: combinedRefrences.join(', '),
      allergen: combinedAllergens.length > 0 ? combinedAllergens.join(', ') : 'None',
      portion: finalWeight,
      energy: ((makerTotals.energy * concentrationFactor) / numServings).toFixed(1),
      protein: ((makerTotals.protein * concentrationFactor) / numServings).toFixed(1),
      carb: ((makerTotals.carb * concentrationFactor) / numServings).toFixed(1),
      fat: ((makerTotals.fat * concentrationFactor) / numServings).toFixed(1),
      createdOn: editingRecipeId ? recipes.find(r => r.id === editingRecipeId)?.createdOn || new Date().toISOString() : new Date().toISOString(),
      isActive: true,
      deactivatedOn: null,
      servings: numServings,
      description: makerDescription,
      notes: makerNotes,
      ingredients: ingredientRefs,
    };

    if (editingRecipeId) {
      setRecipes(prev => prev.map(r => r.id === editingRecipeId ? recipeData : r));
    } else {
      setRecipes(prev => [recipeData, ...prev]);
    }
    setRecipeView('list');
  };

  const handleMakerSearch = (term: string) => {
    setMakerSearch(term);
    if (term.length < 2) { setShowMakerSearch(false); return; }
    const lower = term.toLowerCase();
    const results = unifiedItems.filter(i =>
      i.name.toLowerCase().includes(lower) || ((i as any).keyword || '').toLowerCase().includes(lower)
    ).slice(0, 10);
    setMakerSearchResults(results);
    setShowMakerSearch(results.length > 0);
  };

  const handleMakerCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.replace(/\r\n|\r/g, '\n').trim().split('\n');
      let dataStartIndex = 0;
      if (lines.length > 0) {
        const headerLine = lines[0].toLowerCase();
        if (headerLine.includes("ingredient") || headerLine.includes("quantity") || headerLine.includes("name")) {
          dataStartIndex = 1;
        }
      }
      const JW_THRESHOLD = 0.85;
      const newIngredients: MakerIngredient[] = [];
      const unmatched: string[] = [];

      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(p => p.replace(/"/g, '').trim());
        if (!parts || parts.length < 2) { unmatched.push(line); continue; }
        const [rawName, rawQtyStr] = parts;
        const qty = parseFloat(rawQtyStr);
        if (!rawName || isNaN(qty) || qty <= 0) { unmatched.push(line); continue; }

        const normalizedName = normalizeForMatching(rawName);
        let bestMatch: any = null;
        let bestScore = 0;

        for (const dbItem of unifiedItems) {
          const score = jaroWinklerDistance(normalizedName, normalizeForMatching(dbItem.name));
          if (score > bestScore) { bestScore = score; bestMatch = dbItem; }
          if (dbItem.name && dbItem.name.includes(',')) {
            dbItem.name.split(',').forEach(part => {
              const partScore = jaroWinklerDistance(normalizedName, normalizeForMatching(part));
              if (partScore > bestScore) { bestScore = partScore; bestMatch = dbItem; }
            });
          }
        }

        if (bestMatch && bestScore >= JW_THRESHOLD) {
          const factor = qty / (bestMatch.portion || 100);
          newIngredients.push({
            localId: `${Date.now()}-${Math.random()}`,
            ingredientId: bestMatch.id,
            userName: rawName,
            dbName: bestMatch.name,
            keyword: bestMatch.keyword || '',
            refrence: bestMatch.type === 'recipe' ? 'Recipe' : (bestMatch.refrence || ''),
            allergen: bestMatch.allergen || '',
            symbol: bestMatch.symbol || 'Veg',
            quantity: qty,
            energy: parseFloat((bestMatch.energy * factor).toFixed(2)),
            protein: parseFloat((bestMatch.protein * factor).toFixed(2)),
            carb: parseFloat((bestMatch.carb * factor).toFixed(2)),
            fat: parseFloat((bestMatch.fat * factor).toFixed(2)),
            fromDB: true,
            basePortion: bestMatch.portion || 100,
            baseEnergy: bestMatch.energy || 0,
            baseProtein: bestMatch.protein || 0,
            baseCarb: bestMatch.carb || 0,
            baseFat: bestMatch.fat || 0,
            type: bestMatch.type || 'ingredient',
          });
        } else {
          newIngredients.push({
            localId: `${Date.now()}-${Math.random()}`,
            ingredientId: null,
            userName: rawName,
            dbName: '',
            keyword: '',
            refrence: '',
            allergen: '',
            symbol: 'Veg',
            quantity: qty,
            energy: 0, protein: 0, carb: 0, fat: 0,
            fromDB: false,
            basePortion: 100, baseEnergy: 0, baseProtein: 0, baseCarb: 0, baseFat: 0,
            type: 'ingredient',
          });
        }
      }

      if (newIngredients.length > 0) {
        setMakerIngredients(prev => {
          const nonEmpty = prev.filter(i => i.ingredientId || i.userName);
          return [...newIngredients, ...nonEmpty];
        });
      }
      if (unmatched.length > 0) {
        alert(`${unmatched.length} line(s) could not be parsed.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const initialWeightPerServing = useMemo(() => {
    const numServings = parseInt(makerServings) || 1;
    return (makerTotals.weight / numServings).toFixed(2);
  }, [makerTotals.weight, makerServings]);

  const weightChange = useMemo(() => {
    const initial = parseFloat(initialWeightPerServing);
    const final_ = parseFloat(makerFinalWeight);
    if (isNaN(initial) || isNaN(final_) || initial <= 0) return '';
    return (((final_ - initial) / initial) * 100).toFixed(1);
  }, [initialWeightPerServing, makerFinalWeight]);

  // ============================
  // RENDER
  // ============================
  return (
    <div className="space-y-0">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => { setActiveTab('ingredients'); setRecipeView('list'); }}
            className={`px-6 py-3.5 font-semibold text-sm transition-all border-b-[3px] ${activeTab === 'ingredients' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <List className="w-4 h-4 inline mr-2" />Ingredients
          </button>
          <button
            onClick={() => setActiveTab('recipe')}
            className={`px-6 py-3.5 font-semibold text-sm transition-all border-b-[3px] ${activeTab === 'recipe' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />Recipe
          </button>
        </div>
      </div>

      {activeTab === 'ingredients' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Ingredients</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={ingSearch}
                    onChange={(e) => { setIngSearch(e.target.value); setIngPage(1); }}
                    placeholder="Search by name, keyword, reference..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => openIngredientModal()} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />Add Manual
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />Import
                </button>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                <button onClick={downloadSampleCSV} className="px-4 py-2.5 border border-cyan-500 text-cyan-600 rounded-lg text-sm font-semibold hover:bg-cyan-50 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />Sample
                </button>
                <button onClick={() => { setIngSearch(''); setIngColumnFilters({}); setIngPortionMode('actual'); setIngPortionOverrides({}); }} className="p-2.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors" title="Clear All Filters">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            {(ingPortionMode === 'per100g' || Object.keys(ingColumnFilters).length > 0) && (
              <div className="flex flex-wrap gap-2 mt-3 items-center">
                {ingPortionMode === 'per100g' && (
                  <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                    Portion: By 100g
                    <button onClick={() => setIngPortionMode('actual')} className="ml-2 hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {Object.entries(ingColumnFilters).map(([key, values]) =>
                  values.map(val => (
                    <span key={`${key}-${val}`} className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                      {key}: {val}
                      <button onClick={() => {
                        setIngColumnFilters(prev => {
                          const next = { ...prev };
                          next[key] = next[key].filter(v => v !== val);
                          if (next[key].length === 0) delete next[key];
                          return next;
                        });
                      }} className="ml-2 hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 p-4 border-b border-gray-200">
            {ingSelectedIds.size > 0 && (
              <button onClick={deleteSelectedIngredients} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" />Delete Selected
              </button>
            )}
            <div className="relative group">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />Download Table <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute z-10 top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] hidden group-hover:block">
                <button onClick={() => downloadCSV(filteredIngredients, 'ingredients_export.csv')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />As Excel (.csv)
                </button>
                <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Printer className="w-4 h-4" />As PDF
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 w-10">
                    <input type="checkbox" className="rounded" checked={ingPaginatedData.length > 0 && ingPaginatedData.every(i => ingSelectedIds.has(i.id))} onChange={(e) => handleIngSelectAll(e.target.checked)} />
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">No.</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Type</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Created on</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Ingredients Name</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Keyword</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Reference</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Allergen</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">
                    Portion
                    <button className="ml-2 text-gray-400 hover:text-blue-600" onClick={() => setIngPortionMode(ingPortionMode === 'actual' ? 'per100g' : 'actual')}>
                      <ListFilter className="w-3 h-3 inline" />
                    </button>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Energy (kcal)</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Protein (g)</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Carb (g)</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Fat (g)</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide" style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingPaginatedData.map((item, idx) => {
                  const grams = getIngPortionGrams(item);
                  const nutr = getNutrition(item, grams);
                  const label = getIngPortionLabel(item);
                  return (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${item.status === 'inactive' ? 'opacity-50' : ''}`}>
                      <td className="p-4"><input type="checkbox" className="rounded" checked={ingSelectedIds.has(item.id)} onChange={() => toggleIngSelect(item.id)} /></td>
                      <td className="p-4">{(ingPage - 1) * ingPerPage + idx + 1}</td>
                      <td className="p-4"><FssaiSymbol type={item.symbol} /></td>
                      <td className="p-4 text-xs text-gray-600">{formatDate(item.createdOn)}</td>
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {item.keyword ? item.keyword.split(',').map(k => k.trim()).filter(Boolean).map(kw => (
                            <span key={kw} className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 rounded-full border border-gray-200">{kw}</span>
                          )) : '-'}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{item.refrence || '-'}</td>
                      <td className="p-4 text-sm">{item.allergen || 'None'}</td>
                      <td className="p-4">
                        <PortionDropdown
                          basePortion={item.portion || 100}
                          currentLabel={label}
                          onSelect={(g, l) => setIngPortionOverrides(prev => ({ ...prev, [item.id]: { grams: g, label: l } }))}
                        />
                      </td>
                      <td className="p-4 text-sm">{nutr.energy}</td>
                      <td className="p-4 text-sm">{nutr.protein}</td>
                      <td className="p-4 text-sm">{nutr.carb}</td>
                      <td className="p-4 text-sm">{nutr.fat}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button onClick={() => toggleIngStatus(item.id)} className={`p-1.5 rounded border text-xs ${item.status === 'active' ? 'border-green-300 text-green-600 hover:bg-green-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`} title={item.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {item.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openIngredientModal(item)} className="p-1.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-50" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => duplicateIngredient(item.id)} className="p-1.5 rounded border border-blue-300 text-blue-500 hover:bg-blue-50" title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteIngredient(item.id)} className="p-1.5 rounded border border-red-300 text-red-500 hover:bg-red-50" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {ingPaginatedData.length === 0 && (
                  <tr><td colSpan={14} className="p-8 text-center text-gray-500">No ingredients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-3">
            <div className="text-sm text-gray-500">
              {filteredIngredients.length === 0 ? 'No entries found.' : `Showing ${(ingPage - 1) * ingPerPage + 1} to ${Math.min(ingPage * ingPerPage, filteredIngredients.length)} of ${filteredIngredients.length} entries.`}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Show:</label>
                <select value={ingPerPage} onChange={(e) => { setIngPerPage(parseInt(e.target.value)); setIngPage(1); }} className="border border-gray-300 rounded px-2 py-1 text-sm">
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex gap-1">
                <button disabled={ingPage <= 1} onClick={() => setIngPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
                {Array.from({ length: ingTotalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setIngPage(p)} className={`px-3 py-1 border rounded text-sm ${p === ingPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>{p}</button>
                ))}
                <button disabled={ingPage >= ingTotalPages} onClick={() => setIngPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recipe' && recipeView === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={recipeSearch}
                    onChange={(e) => { setRecipeSearch(e.target.value); setRecipePage(1); }}
                    placeholder="Search recipes..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setRecipeSearch(''); setRecipePortionMode('actual'); setRecipePortionOverrides({}); }} className="p-2.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors" title="Clear All">
                  <RotateCcw className="w-4 h-4" />
                </button>
                {recipeSelectedIds.size > 0 && (
                  <button onClick={deleteSelectedRecipes} className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />Delete
                  </button>
                )}
                <div className="relative group">
                  <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />Download <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute z-10 top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] hidden group-hover:block">
                    <button onClick={() => {
                      const activeData = filteredRecipes.filter(r => r.isActive);
                      const headers = ['Name', 'Type', 'Reference', 'Allergen', 'Portion (g)', 'Energy (kcal)', 'Protein (g)', 'Carb (g)', 'Fat (g)'];
                      const csv = [headers.join(','), ...activeData.map(r => [r.name, r.symbol, r.refrence, r.allergen, r.portion, r.energy, r.protein, r.carb, r.fat].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))].join('\r\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = 'recipes_export.csv';
                      link.click();
                    }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />As Excel (.csv)
                    </button>
                    <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Printer className="w-4 h-4" />As PDF
                    </button>
                  </div>
                </div>
                <button onClick={() => openRecipeMaker()} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />Create Recipe
                </button>
              </div>
            </div>
            {recipePortionMode === 'per100g' && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                  Portion: By 100g
                  <button onClick={() => setRecipePortionMode('actual')} className="ml-2 hover:text-blue-900"><X className="w-3 h-3" /></button>
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 w-10"><input type="checkbox" className="rounded" onChange={(e) => {
                    if (e.target.checked) setRecipeSelectedIds(new Set(recipePaginatedData.map(r => r.id)));
                    else setRecipeSelectedIds(new Set());
                  }} /></th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">No.</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Unit Details</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Type</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Date</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Recipe Name</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Reference</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Allergen</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">
                    Portion
                    <button className="ml-2 text-gray-400 hover:text-blue-600" onClick={() => setRecipePortionMode(recipePortionMode === 'actual' ? 'per100g' : 'actual')}>
                      <ListFilter className="w-3 h-3 inline" />
                    </button>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Energy (kcal)</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Protein (g)</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Carb (g)</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide">Fat (g)</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 tracking-wide" style={{ width: 250 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipePaginatedData.map((item, idx) => {
                  const grams = getRecipePortionGrams(item);
                  const nutr = getRecipeNutrition(item, grams);
                  const label = getRecipePortionLabel(item);
                  return (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${!item.isActive ? 'opacity-50 bg-gray-50' : ''}`}>
                      <td className="p-4"><input type="checkbox" className="rounded" checked={recipeSelectedIds.has(item.id)} onChange={() => toggleRecipeSelect(item.id)} /></td>
                      <td className="p-4">{(recipePage - 1) * recipePerPage + idx + 1}</td>
                      <td className="p-4 text-xs">
                        <div><strong>Corporate:</strong> {item.corporateName}</div>
                        <div><strong>Regional:</strong> {item.regionalName}</div>
                        <div><strong>Unit:</strong> {item.unitName}</div>
                      </td>
                      <td className="p-4"><FssaiSymbol type={item.symbol} /></td>
                      <td className="p-4 text-xs">
                        {item.isActive ? `Created: ${formatDate(item.createdOn)}` : `Deactivated: ${formatDate(item.deactivatedOn || '')}`}
                      </td>
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-sm">{item.refrence || '-'}</td>
                      <td className="p-4 text-sm">{item.allergen || 'None'}</td>
                      <td className="p-4">
                        <PortionDropdown
                          basePortion={item.portion || 100}
                          currentLabel={label}
                          onSelect={(g, l) => setRecipePortionOverrides(prev => ({ ...prev, [item.id]: { grams: g, label: l } }))}
                        />
                      </td>
                      <td className="p-4 text-sm">{nutr.energy}</td>
                      <td className="p-4 text-sm">{nutr.protein}</td>
                      <td className="p-4 text-sm">{nutr.carb}</td>
                      <td className="p-4 text-sm">{nutr.fat}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button onClick={() => toggleRecipeStatus(item.id)} className={`p-1.5 rounded border text-xs ${item.isActive ? 'border-green-300 text-green-600 hover:bg-green-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`} title={item.isActive ? 'Deactivate' : 'Activate'}>
                            {item.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openRecipeMaker(item.id)} className="p-1.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-50" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => duplicateRecipe(item.id)} className="p-1.5 rounded border border-blue-300 text-blue-500 hover:bg-blue-50" title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteRecipe(item.id)} className="p-1.5 rounded border border-red-300 text-red-500 hover:bg-red-50" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {recipePaginatedData.length === 0 && (
                  <tr><td colSpan={14} className="p-8 text-center text-gray-500">No recipes found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-3">
            <div className="text-sm text-gray-500">
              {filteredRecipes.length === 0 ? 'No recipes found.' : `Showing ${(recipePage - 1) * recipePerPage + 1} to ${Math.min(recipePage * recipePerPage, filteredRecipes.length)} of ${filteredRecipes.length} entries.`}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Show:</label>
                <select value={recipePerPage} onChange={(e) => { setRecipePerPage(parseInt(e.target.value)); setRecipePage(1); }} className="border border-gray-300 rounded px-2 py-1 text-sm">
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex gap-1">
                <button disabled={recipePage <= 1} onClick={() => setRecipePage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
                {Array.from({ length: recipeTotalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setRecipePage(p)} className={`px-3 py-1 border rounded text-sm ${p === recipePage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>{p}</button>
                ))}
                <button disabled={recipePage >= recipeTotalPages} onClick={() => setRecipePage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recipe' && recipeView === 'maker' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{editingRecipeId ? 'Edit Recipe' : 'Recipe Maker'}</h1>
            <button onClick={() => setRecipeView('list')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />Back to List
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4 inline-flex items-center gap-2">
            <span className="text-green-700 font-semibold text-sm">STEP 1</span>
            <span className="text-gray-700 font-semibold text-sm">Recipe Overview</span>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Title</label>
                <input type="text" value={makerTitle} onChange={(e) => setMakerTitle(e.target.value)} placeholder="Enter recipe title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time</label>
                <input type="text" value={makerPrepTime} onChange={(e) => setMakerPrepTime(e.target.value)} placeholder="e.g., 20m" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cook Time</label>
                <input type="text" value={makerCookTime} onChange={(e) => setMakerCookTime(e.target.value)} placeholder="e.g., 45m" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
                <input type="number" value={makerServings} onChange={(e) => setMakerServings(e.target.value)} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <button onClick={() => setShowDescription(!showDescription)} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                  {showDescription ? 'Hide' : 'Show'} Description
                </button>
              </div>
              {showDescription && (
                <textarea value={makerDescription} onChange={(e) => setMakerDescription(e.target.value)} rows={3} placeholder="Enter a brief description..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y" />
              )}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4 inline-flex items-center gap-2">
            <span className="text-green-700 font-semibold text-sm">STEP 2</span>
            <span className="text-gray-700 font-semibold text-sm">Ingredients Management & List <span className="text-gray-500 font-normal italic text-xs ml-2">(for {makerServings || 1} serving{(parseInt(makerServings) || 1) > 1 ? 's' : ''})</span></span>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Upload Ingredients File (CSV)</label>
                <div className="flex gap-2 items-end">
                  <input ref={csvFileInputRef} type="file" accept=".csv" onChange={handleMakerCSVUpload} className="text-sm border border-gray-300 rounded px-2 py-1.5 flex-1" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <button onClick={() => {
                    const csv = '"Name","Qty (g)"\n"Tomato","200"\n"Chicken Breast","150"';
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = 'recipe_ingredients_sample.csv';
                    link.click();
                  }} className="text-blue-600 hover:underline">Download Sample CSV</button> (Format: "Name", "Qty (g)")
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Search & Add from Database</label>
                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={makerSearch}
                      onChange={(e) => handleMakerSearch(e.target.value)}
                      onFocus={() => { if (makerSearch.length >= 2) setShowMakerSearch(true); }}
                      placeholder="Type to search ingredients or recipes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {showMakerSearch && makerSearchResults.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {makerSearchResults.map(item => (
                          <button key={`${item.type}-${item.id}`} onClick={() => addMakerIngredientFromDB(item)} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-sm border-b border-gray-100 last:border-0">
                            <FssaiSymbol type={item.symbol} size={12} />
                            <span className="flex-1">{item.name}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.type}</span>
                            <span className="text-xs text-gray-400">{item.energy} kcal</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => {
                    setMakerIngredients(prev => [createEmptyMakerIngredient(), ...prev]);
                  }} className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors whitespace-nowrap">
                    Add Manual
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[40px_40px_50px_80px_1fr_1fr_100px_100px_80px_80px_80px_80px_60px] gap-1 text-xs font-semibold text-gray-500 pb-2 border-b border-gray-200 px-1">
                  <span>Sel.</span><span>#</span><span>Logo</span><span>Qty (g)</span>
                  <span>Ingredient Name</span><span>DB Name</span><span>Keyword</span>
                  <span>Ref</span><span>Allergen</span><span>Energy</span><span>Protein</span>
                  <span>Carb</span><span>Fat</span>
                </div>
                {makerIngredients.map((ing, idx) => (
                  <div key={ing.localId} className="grid grid-cols-[40px_40px_50px_80px_1fr_1fr_100px_100px_80px_80px_80px_80px_60px] gap-1 items-center py-2 border-b border-gray-100 px-1 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-500 text-xs">{idx + 1}</span>
                    <div className="flex justify-center"><FssaiSymbol type={ing.symbol} size={14} /></div>
                    <input
                      type="number"
                      value={ing.quantity || ''}
                      onChange={(e) => updateMakerIngredientQty(ing.localId, parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      value={ing.userName}
                      onChange={(e) => setMakerIngredients(prev => prev.map(i => i.localId === ing.localId ? { ...i, userName: e.target.value } : i))}
                      readOnly={ing.fromDB}
                      className={`w-full px-1 py-1 border border-gray-300 rounded text-xs ${ing.fromDB ? 'bg-gray-100' : ''}`}
                      placeholder="Type name"
                    />
                    <input type="text" value={ing.dbName} readOnly className="w-full px-1 py-1 border border-gray-300 rounded text-xs bg-gray-100" />
                    <input type="text" value={ing.keyword} readOnly className="w-full px-1 py-1 border border-gray-300 rounded text-xs bg-gray-100 truncate" />
                    <input type="text" value={ing.refrence} readOnly className="w-full px-1 py-1 border border-gray-300 rounded text-xs bg-gray-100 truncate" />
                    <span className="text-xs truncate">{ing.allergen || '-'}</span>
                    <span className="text-xs text-right">{ing.energy ? ing.energy.toFixed(1) : '-'}</span>
                    <span className="text-xs text-right">{ing.protein ? ing.protein.toFixed(1) : '-'}</span>
                    <span className="text-xs text-right">{ing.carb ? ing.carb.toFixed(1) : '-'}</span>
                    <button onClick={() => removeMakerIngredient(ing.localId)} className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {makerIngredients.length > 0 && (
                  <div className="grid grid-cols-[40px_40px_50px_80px_1fr_1fr_100px_100px_80px_80px_80px_80px_60px] gap-1 items-center py-3 px-1 bg-gray-50 border-t-2 border-gray-800 font-bold text-sm mt-2">
                    <span></span>
                    <span className="text-xs">Total ({makerServings || 1}s):</span>
                    <div className="flex justify-center"><FssaiSymbol type={overallSymbol} size={14} /></div>
                    <span className="text-xs">{makerTotals.weight.toFixed(0)}g</span>
                    <span className="text-xs col-span-2 truncate">{makerIngredients.filter(i => i.userName).map(i => i.userName).join(', ')}</span>
                    <span className="text-xs truncate">{combinedRefrences.join(', ') || '-'}</span>
                    <span className="text-xs truncate">{combinedAllergens.join(', ') || 'None'}</span>
                    <span></span>
                    <span className="text-xs text-right">{makerTotals.energy.toFixed(1)}</span>
                    <span className="text-xs text-right">{makerTotals.protein.toFixed(1)}</span>
                    <span className="text-xs text-right">{makerTotals.carb.toFixed(1)}</span>
                    <span></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4 inline-flex items-center gap-2">
            <span className="text-green-700 font-semibold text-sm">STEP 3</span>
            <span className="text-gray-700 font-semibold text-sm">Weight & Final Nutrition</span>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 mb-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-sm text-amber-800 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Nutrition values may differ from their actual values. Check the accuracy of your raw material nutrition data.</span>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center border border-blue-500 rounded overflow-hidden h-10">
                <span className="px-3 bg-blue-500 text-white text-sm h-full flex items-center">Initial Wt/Serving</span>
                <input type="text" value={initialWeightPerServing} readOnly className="px-3 w-24 text-right text-sm bg-gray-100 h-full border-x border-blue-500" />
                <span className="px-2 bg-blue-500 text-white text-sm font-bold h-full flex items-center">g</span>
              </div>
              <div className="flex items-center border border-blue-500 rounded overflow-hidden h-10">
                <span className="px-3 bg-blue-500 text-white text-sm h-full flex items-center">Final Wt/Serving</span>
                <input type="number" value={makerFinalWeight} onChange={(e) => setMakerFinalWeight(e.target.value)} className="px-3 w-24 text-right text-sm h-full border-x border-blue-500 outline-none" placeholder="0" />
                <span className="px-2 bg-blue-500 text-white text-sm font-bold h-full flex items-center">g</span>
              </div>
              <div className="flex items-center border border-blue-500 rounded overflow-hidden h-10">
                <span className="px-3 bg-blue-500 text-white text-sm h-full flex items-center">Weight Change</span>
                <input type="text" value={weightChange ? `${weightChange}%` : ''} readOnly className="px-3 w-20 text-right text-sm bg-gray-100 h-full border-x border-blue-500" />
                <span className="px-2 bg-blue-500 text-white text-sm font-bold h-full flex items-center">%</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-center font-bold text-gray-800 mb-4">Final Nutrition Summary</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-3 py-2.5 text-left font-semibold">Nutrient</th>
                      <th className="border border-gray-200 px-3 py-2.5 text-right font-semibold">Per 100g</th>
                      <th className="border border-gray-200 px-3 py-2.5 text-right font-semibold">Per Serving ({makerFinalNutrition.finalWeight ? `${makerFinalNutrition.finalWeight}g` : '-'})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Energy (kcal)', key: 'energy' },
                      { label: 'Protein (g)', key: 'protein' },
                      { label: 'Carbohydrate (g)', key: 'carb' },
                      { label: 'Fat (g)', key: 'fat' },
                    ].map(({ label, key }) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2.5 font-medium">{label}</td>
                        <td className="border border-gray-200 px-3 py-2.5 text-right">
                          {makerFinalNutrition.per100g ? (makerFinalNutrition.per100g as any)[key].toFixed(2) : 'N/A'}
                        </td>
                        <td className="border border-gray-200 px-3 py-2.5 text-right">
                          {makerFinalNutrition.perServing ? (makerFinalNutrition.perServing as any)[key].toFixed(2) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Notes (Optional)</label>
            <textarea value={makerNotes} onChange={(e) => setMakerNotes(e.target.value)} rows={3} placeholder="Add any notes or special instructions..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y" />
          </div>

          <div className="flex gap-4">
            <button onClick={saveRecipeFromMaker} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />{editingRecipeId ? 'Update Data' : 'Save Data'}
            </button>
            <button onClick={() => setRecipeView('list')} className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-semibold text-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />Back to List
            </button>
          </div>
        </div>
      )}

      {showIngredientModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold">{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</h3>
              <button onClick={() => setShowIngredientModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formSymbol} onChange={(e) => setFormSymbol(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Veg">Veg</option>
                    <option value="NonVeg">NonVeg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portion (g)</label>
                  <input type="number" value={formPortion} onChange={(e) => setFormPortion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input type="text" value={formKeyword} onChange={(e) => setFormKeyword(e.target.value)} placeholder="e.g., Meat, Poultry" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Energy (kcal)</label>
                  <input type="number" value={formEnergy} onChange={(e) => setFormEnergy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                  <input type="number" value={formProtein} onChange={(e) => setFormProtein(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carb (g)</label>
                  <input type="number" value={formCarb} onChange={(e) => setFormCarb(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                  <input type="number" value={formFat} onChange={(e) => setFormFat(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <div className="flex flex-wrap gap-2">
                  {REFERENCE_OPTIONS.map(opt => (
                    <label key={opt} className="inline-flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={formRefrence.includes(opt)} onChange={(e) => {
                        if (e.target.checked) setFormRefrence(prev => [...prev, opt]);
                        else setFormRefrence(prev => prev.filter(v => v !== opt));
                      }} className="rounded" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergen</label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map(opt => (
                    <label key={opt} className="inline-flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={formAllergen.includes(opt)} onChange={(e) => {
                        if (e.target.checked) setFormAllergen(prev => [...prev, opt]);
                        else setFormAllergen(prev => prev.filter(v => v !== opt));
                      }} className="rounded" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowIngredientModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={saveIngredient} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">{editingIngredient ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeCalculation;
