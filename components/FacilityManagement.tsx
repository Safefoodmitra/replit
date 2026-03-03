
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Warehouse, 
  Wrench, 
  Droplets, 
  Calendar, 
  Thermometer, 
  Bug, 
  Plus, 
  Search, 
  ShieldCheck, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  History,
  Settings2,
  Info,
  ClipboardList,
  MapPin,
  Building,
  User,
  Zap,
  ArrowRight,
  MoreVertical,
  Edit3,
  Trash2,
  Power,
  Globe,
  Tag,
  Hammer,
  FileText,
  X,
  Save,
  Check,
  ShieldAlert,
  Wind,
  Droplet,
  Fingerprint,
  Cpu,
  Monitor,
  CalendarDays,
  Shield,
  ChevronDown,
  Hash,
  Download,
  Upload,
  FileUp,
  CheckCheck,
  AlertCircle,
  PlayCircle,
  Scale,
  Gauge,
  FileSignature,
  Binary,
  CalendarCheck,
  ArrowUpRight,
  Link,
  MonitorSmartphone,
  MousePointer2,
  PlusCircle,
  ChevronUp,
  Activity,
  Filter,
  RefreshCw,
  Target,
  Maximize2,
  Eye,
  File
} from 'lucide-react';
import CleaningChecklistModule from './CleaningChecklistModule';

export interface Equipment {
  id: string;
  name: string;
  idNumber: string;
  location: string;
  department: string;
  unit: string;
  regional: string;
  make: string;
  brand: string;
  
  // Cleaning
  cleaningChecklist: string;
  cleaningFrequencyValue: number;
  cleaningFrequencyUnit: 'Days' | 'Weeks' | 'Months' | 'Years';
  cleaningDay?: string; // Specific day for weekly schedules
  cleaningStartDate: string;
  
  // PM
  pmChecklist: string;
  pmFrequencyValue: number;
  pmFrequencyUnit: 'Days' | 'Weeks' | 'Months' | 'Years';
  pmDay?: string; // Specific day for PM schedules
  pmStartDate: string;
  
  // Calibration
  calibrationRequired: boolean;
  calibrationFrequencyValue: number;
  calibrationFrequencyUnit: 'Days' | 'Weeks' | 'Months' | 'Years';
  calibrationStartDate: string;

  monitoringActivity: string[]; 
  status: 'Active' | 'Inactive';
}

interface CalibrationDevice {
  id: string;
  name: string;
  serialNumber: string;
  type: 'Temperature' | 'Humidity' | 'Pressure' | 'Weight' | 'Timer';
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  certificateId: string;
  calibratedBy: string;
  // New Technical Specs
  workingRange: string;
  leastCount: string;
  calibrationRange: string;
  // State
  isActive: boolean;
  certificateUrl?: string;
  certificateFileName?: string;
}

const REGIONAL_OPTIONS = ["North America", "EMEA", "APAC", "LATAM"];
const UNIT_OPTIONS = ["NYC Central Kitchen", "LA Logistics Unit", "London Hub", "Tokyo Plant", "Berlin HQ"];
const DEPT_OPTIONS = ["Kitchen", "Logistics", "Maintenance", "Storage", "Production"];
const LOCATION_OPTIONS = ["Main Prep Area", "Rear Loading", "Cold Room 1", "Hot Kitchen", "Packaging Line"];
const CLEANING_CHECKLISTS = ["Standard Sanitization", "Deep Clean Master", "Daily Surface Wipe", "Bio-hazard Protocol"];
const PM_CHECKLISTS = ["Refrigeration PM-1", "Heating Elements PM-V2", "Compressor Audit", "Electrical Safety V3"];
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-1',
    name: 'Blast Chiller XT-500',
    idNumber: 'BC-NYC-001',
    location: 'Main Prep Area',
    department: 'Kitchen',
    unit: 'NYC Central Kitchen',
    regional: 'North America',
    make: 'Electrolux',
    brand: 'Professional Line',
    
    cleaningChecklist: 'Standard Sanitization',
    cleaningFrequencyValue: 1,
    cleaningFrequencyUnit: 'Days',
    cleaningStartDate: '2024-01-01',
    
    pmChecklist: 'Refrigeration PM-1',
    pmFrequencyValue: 3,
    pmFrequencyUnit: 'Months',
    pmStartDate: '2024-02-01',
    
    calibrationRequired: true,
    calibrationFrequencyValue: 6,
    calibrationFrequencyUnit: 'Months',
    calibrationStartDate: '2024-01-15',
    
    monitoringActivity: ['Temperature'],
    status: 'Active'
  },
  {
    id: 'eq-2',
    name: 'Combi Oven Pro-9',
    idNumber: 'CO-NYC-442',
    location: 'Hot Kitchen',
    department: 'Production',
    unit: 'NYC Central Kitchen',
    regional: 'North America',
    make: 'Rational',
    brand: 'iCombi Pro',
    
    cleaningChecklist: 'Deep Clean Master',
    cleaningFrequencyValue: 1,
    cleaningFrequencyUnit: 'Weeks',
    cleaningDay: 'Sunday',
    cleaningStartDate: '2024-01-05',
    
    pmChecklist: 'Heating Elements PM-V2',
    pmFrequencyValue: 45,
    pmFrequencyUnit: 'Days',
    pmStartDate: '2024-03-01',
    
    calibrationRequired: true,
    calibrationFrequencyValue: 1,
    calibrationFrequencyUnit: 'Years',
    calibrationStartDate: '2024-01-20',
    
    monitoringActivity: ['Temperature', 'Humidity'],
    status: 'Active'
  }
];

// Mock One-to-Many Data: One Equipment -> Many Devices
const INITIAL_DEVICES: Record<string, CalibrationDevice[]> = {
    'eq-1': [
        {
            id: 'dev-1a',
            name: 'Core Probe Sensor',
            serialNumber: 'SN-998822',
            type: 'Temperature',
            lastCalibrationDate: '2024-01-15',
            nextCalibrationDate: '2024-07-15',
            certificateId: 'CERT-001-A',
            isActive: true,
            calibratedBy: 'Tech Labs Inc.',
            workingRange: '-40°C to 100°C',
            leastCount: '0.1°C',
            calibrationRange: '-10°C to 90°C'
        },
        {
            id: 'dev-1b',
            name: 'Chamber Thermostat',
            serialNumber: 'SN-998823',
            type: 'Temperature',
            lastCalibrationDate: '2023-12-10',
            nextCalibrationDate: '2024-06-10',
            certificateId: 'CERT-001-B',
            isActive: true,
            calibratedBy: 'Tech Labs Inc.',
            workingRange: '-20°C to 50°C',
            leastCount: '0.5°C',
            calibrationRange: '0°C to 40°C'
        }
    ],
    'eq-2': [
        {
            id: 'dev-2a',
            name: 'Humidity Sensor Main',
            serialNumber: 'HS-442-1',
            type: 'Humidity',
            lastCalibrationDate: '2023-05-20',
            nextCalibrationDate: '2024-05-20',
            certificateId: 'CERT-442-H',
            isActive: true,
            calibratedBy: 'Global Calibrate',
            workingRange: '0% to 100% RH',
            leastCount: '1% RH',
            calibrationRange: '20% to 80% RH'
        },
         {
            id: 'dev-2b',
            name: 'Internal Timer',
            serialNumber: 'TM-442-9',
            type: 'Timer',
            lastCalibrationDate: '2023-01-10',
            nextCalibrationDate: '2024-01-10',
            certificateId: 'CERT-442-T',
            isActive: true,
            calibratedBy: 'Internal QA',
            workingRange: '0 to 24 Hours',
            leastCount: '1 Second',
            calibrationRange: '10 Min to 6 Hours'
        }
    ]
};

// --- Custom Internal Components ---

const SearchableSelect = ({ label, options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = options.filter((opt: string) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative space-y-1" ref={dropdownRef}>
      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-white border-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-between cursor-pointer ${isOpen ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
      >
        <span className={value ? "text-slate-800" : "text-slate-300"}>{value || placeholder}</span>
        <ChevronDown size={14} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[100] top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-50 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3" />
              <input 
                autoFocus
                className="w-full pl-6 pr-2 py-1 text-[10px] bg-white border border-slate-200 rounded-md focus:outline-none" 
                placeholder="Filter..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.map((opt: string) => (
              <button 
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border-b border-slate-50 last:border-0 transition-colors uppercase"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Placeholder Views ---
const MaintenanceView = () => (
    <div className="p-20 text-center text-slate-400 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
        <Wrench size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-lg font-black uppercase tracking-widest text-slate-300">Maintenance Terminal</p>
        <p className="text-xs mt-3 uppercase font-bold tracking-widest">Preventive Maintenance Schedule & Logs</p>
    </div>
);

const CalibrationHub: React.FC<{ equipmentList: Equipment[] }> = ({ equipmentList }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [deviceMap, setDeviceMap] = useState<Record<string, CalibrationDevice[]>>(INITIAL_DEVICES);
    
    // Modal & Upload State
    const [renewModal, setRenewModal] = useState<{ eqId: string, devId: string } | null>(null);
    const [renewForm, setRenewForm] = useState({ date: '', nextDate: '', certId: '' });
    
    // Sensor Add/Edit State
    const [sensorModal, setSensorModal] = useState<{ isOpen: boolean, eqId: string, sensor: CalibrationDevice | null } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{ eqId: string, devId: string } | null>(null);

    // Filter only equipment that requires calibration
    const calibrationAssets = useMemo(() => {
        return equipmentList
            .filter(e => e.calibrationRequired)
            .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.idNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [equipmentList, searchQuery]);

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setExpandedIds(next);
    };

    const getStatus = (device: CalibrationDevice) => {
        if (!device.isActive) return 'Inactive';
        const today = new Date();
        const next = new Date(device.nextCalibrationDate);
        const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Expired';
        if (diffDays < 30) return 'Due Soon';
        return 'Valid';
    };

    const stats = useMemo(() => {
        let totalDevices = 0;
        let dueSoon = 0;
        let overdue = 0;
        
        calibrationAssets.forEach(asset => {
            const devices = deviceMap[asset.id] || [];
            totalDevices += devices.length;
            devices.forEach(d => {
                const status = getStatus(d);
                if (status === 'Due Soon') dueSoon++;
                if (status === 'Expired') overdue++;
            });
        });

        return { totalAssets: calibrationAssets.length, totalDevices, dueSoon, overdue };
    }, [calibrationAssets, deviceMap]);

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'Valid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Expired': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Due Soon': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Inactive': return 'bg-slate-100 text-slate-400 border-slate-200 grayscale';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const getDeviceIcon = (type: string) => {
        switch(type) {
            case 'Temperature': return <Thermometer size={16} />;
            case 'Humidity': return <Droplet size={16} />;
            case 'Pressure': return <Gauge size={16} />;
            case 'Weight': return <Scale size={16} />;
            case 'Timer': return <Clock size={16} />;
            default: return <Cpu size={16} />;
        }
    };

    // Actions
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const url = ev.target?.result as string;
            setDeviceMap(prev => ({
                ...prev,
                [uploadTarget.eqId]: prev[uploadTarget.eqId].map(d => 
                    d.id === uploadTarget.devId ? { ...d, certificateUrl: url, certificateFileName: file.name } : d
                )
            }));
            setUploadTarget(null);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const triggerUpload = (eqId: string, devId: string) => {
        setUploadTarget({ eqId, devId });
        fileInputRef.current?.click();
    };

    const handleRenewSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!renewModal) return;
        setDeviceMap(prev => ({
            ...prev,
            [renewModal.eqId]: prev[renewModal.eqId].map(d => 
                d.id === renewModal.devId ? { 
                    ...d, 
                    lastCalibrationDate: renewForm.date, 
                    nextCalibrationDate: renewForm.nextDate, 
                    certificateId: renewForm.certId 
                } : d
            )
        }));
        setRenewModal(null);
    };

    const handleSaveSensor = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!sensorModal) return;
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        
        const newDevice: CalibrationDevice = {
            id: sensorModal.sensor?.id || `dev-${Date.now()}`,
            name: data.name as string,
            serialNumber: data.serialNumber as string,
            type: data.type as any,
            workingRange: data.workingRange as string,
            leastCount: data.leastCount as string,
            calibrationRange: data.calibrationRange as string,
            lastCalibrationDate: data.lastCalibrationDate as string,
            nextCalibrationDate: data.nextCalibrationDate as string,
            calibratedBy: data.calibratedBy as string,
            certificateId: data.certificateId as string,
            isActive: true
        };

        setDeviceMap(prev => {
            const currentList = prev[sensorModal.eqId] || [];
            if (sensorModal.sensor) {
                // Edit Mode
                return {
                    ...prev,
                    [sensorModal.eqId]: currentList.map(d => d.id === sensorModal.sensor!.id ? { ...newDevice, isActive: d.isActive, certificateUrl: d.certificateUrl } : d)
                };
            } else {
                // Add Mode
                return {
                    ...prev,
                    [sensorModal.eqId]: [...currentList, newDevice]
                };
            }
        });
        setSensorModal(null);
    };

    const openRenewModal = (eqId: string, dev: CalibrationDevice) => {
        setRenewForm({ 
            date: new Date().toISOString().split('T')[0], 
            nextDate: dev.nextCalibrationDate, 
            certId: '' 
        });
        setRenewModal({ eqId, devId: dev.id });
    };

    const toggleDeviceStatus = (eqId: string, devId: string) => {
        setDeviceMap(prev => ({
            ...prev,
            [eqId]: prev[eqId].map(d => d.id === devId ? { ...d, isActive: !d.isActive } : d)
        }));
    };

    const deleteDevice = (eqId: string, devId: string) => {
        if (!confirm("Are you sure you want to remove this sensor?")) return;
        setDeviceMap(prev => ({
            ...prev,
            [eqId]: prev[eqId].filter(d => d.id !== devId)
        }));
    };

    const openAddSensor = (eqId: string) => {
        setSensorModal({ isOpen: true, eqId, sensor: null });
    };

    const openEditSensor = (eqId: string, sensor: CalibrationDevice) => {
        setSensorModal({ isOpen: true, eqId, sensor });
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500 px-4 md:px-0">
             <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleFileUpload} />

             {/* 1. Dashboard / KPI Header */}
             <div className="flex overflow-x-auto snap-x hide-scrollbar xl:grid xl:grid-cols-4 gap-4 pb-4 xl:pb-0">
                {[
                    { label: 'Monitored Assets', value: stats.totalAssets, icon: Target, color: 'bg-indigo-600', trend: null },
                    { label: 'Total Devices', value: stats.totalDevices, icon: MonitorSmartphone, color: 'bg-blue-500', trend: null },
                    { label: 'Due for Calib.', value: stats.dueSoon, icon: Clock, color: 'bg-amber-500', trend: stats.dueSoon > 0 ? -1 : 0 },
                    { label: 'Critical Alerts', value: stats.overdue, icon: ShieldAlert, color: 'bg-rose-500', trend: -5 },
                ].map((stat, i) => (
                    <div key={i} className="min-w-[240px] xl:min-w-0 snap-center shrink-0 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                        </div>
                        <div className={`p-4 ${stat.color} text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon size={22} />
                        </div>
                    </div>
                ))}
             </div>

             {/* 2. Action Bar */}
             <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500" />
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-cyan-50 text-cyan-600 rounded-3xl shadow-inner border border-cyan-100">
                        <Settings2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Calibration Hub</h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={12} className="text-cyan-500" /> Precision Instrument Registry
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search Equipment..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none focus:border-cyan-400 focus:bg-white transition-all shadow-inner uppercase tracking-wider"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-cyan-600 hover:border-cyan-200 transition-all shadow-sm active:scale-95">
                        <Filter size={20} />
                    </button>
                    <button className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-95">
                        <RefreshCw size={20} />
                    </button>
                </div>
             </div>

             {/* 3. Main List (Cards) */}
             <div className="space-y-6">
                {calibrationAssets.map((asset, idx) => {
                    const devices = deviceMap[asset.id] || [];
                    const dueCount = devices.filter(d => getStatus(d) === 'Due Soon' || getStatus(d) === 'Expired').length;
                    const isExpanded = expandedIds.has(asset.id);
                    
                    return (
                        <div key={asset.id} className={`bg-white rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden flex flex-col ${isExpanded ? 'border-cyan-400 shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-sm hover:border-cyan-200'}`}>
                            
                            {/* Card Header Row */}
                            <div className="flex flex-col xl:flex-row items-stretch min-h-[140px]">
                                
                                {/* 3.1 Equipment Identity & Hierarchy */}
                                <div className="p-6 md:p-8 xl:w-[35%] border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col justify-center bg-white shrink-0">
                                    <div className="flex items-start gap-5">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform ${dueCount > 0 ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                                            <Wrench size={32} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex flex-wrap gap-2">
                                                <span>{asset.regional}</span> <ChevronRight size={10} />
                                                <span>{asset.unit}</span> <ChevronRight size={10} />
                                                <span className="text-indigo-600">{asset.department}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-2">{asset.name}</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                 <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    <Hash size={10} /> {asset.idNumber}
                                                 </span>
                                                 <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    <Tag size={10} /> {asset.brand} ({asset.make})
                                                 </span>
                                                 <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    <MapPin size={10} /> {asset.location}
                                                 </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3.2 Metrics & Context */}
                                <div className="p-6 md:p-8 flex-1 border-b xl:border-b-0 xl:border-r border-slate-100 bg-slate-50/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex flex-wrap gap-4 md:gap-8 justify-center md:justify-start w-full md:w-auto">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</span>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                <Calendar size={14} className="text-indigo-500"/>
                                                <span className="text-xs font-black text-slate-700 uppercase">Every {asset.calibrationFrequencyValue} {asset.calibrationFrequencyUnit}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Schedule</span>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                <Clock size={14} className="text-indigo-500"/>
                                                <span className="text-xs font-black text-slate-700 uppercase">{new Date(asset.calibrationStartDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-4 justify-center md:justify-end w-full md:w-auto">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Connected Devices</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{devices.length}</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 hidden md:block" />
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Status</p>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${dueCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <span className={`text-sm font-black ${dueCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{dueCount > 0 ? 'Attention' : 'Compliant'}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => openAddSensor(asset.id)}
                                            className="ml-4 p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95"
                                            title="Add New Sensor"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* 3.3 Expand Action */}
                                <div className="p-6 md:p-8 xl:w-[120px] flex items-center justify-center bg-white shrink-0">
                                    <button 
                                        onClick={() => toggleExpand(asset.id)}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${isExpanded ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-110' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:border-indigo-400'}`}
                                    >
                                        {isExpanded ? <ChevronUp size={24} strokeWidth={3} /> : <ChevronDown size={24} strokeWidth={3} />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Sub-Cards (Devices) */}
                            {isExpanded && (
                                <div className="bg-slate-50/50 border-t border-slate-100 p-6 md:p-8 animate-in slide-in-from-top-4 duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
                                            <MonitorSmartphone size={14} className="text-indigo-500" /> Attached Instruments Registry
                                        </h5>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                        {devices.map(device => {
                                            const status = getStatus(device);
                                            return (
                                                <div key={device.id} className={`group relative bg-white border-2 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${!device.isActive ? 'border-slate-100 opacity-60 grayscale' : 'border-slate-100 hover:border-cyan-200 hover:shadow-lg'}`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-3 rounded-2xl ${status === 'Valid' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : status === 'Inactive' ? 'bg-slate-100 text-slate-400' : 'bg-rose-50 text-rose-600 shadow-sm'}`}>
                                                                {getDeviceIcon(device.type)}
                                                            </div>
                                                            <div>
                                                                <h6 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate leading-none mb-1.5">{device.name}</h6>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{device.serialNumber}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusStyle(status)}`}>
                                                                        {status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 mb-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Working Range</span>
                                                            <span className="text-[10px] font-black text-slate-600">{device.workingRange || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 border-l border-slate-100 pl-4">
                                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Least Count</span>
                                                            <span className="text-[10px] font-black text-slate-600">{device.leastCount || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 border-l border-slate-100 pl-4">
                                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Calib Range</span>
                                                            <span className="text-[10px] font-black text-slate-600">{device.calibrationRange || 'N/A'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                        <div className="flex gap-6 w-full sm:w-auto">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Next Due</span>
                                                                <span className={`text-[10px] font-black ${status === 'Expired' ? 'text-rose-600' : 'text-emerald-600'}`}>{device.nextCalibrationDate}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Cert ID</span>
                                                                <span className="text-[10px] font-bold text-slate-600">{device.certificateId || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                        {device.certificateUrl && (
                                                            <button 
                                                                onClick={() => window.open(device.certificateUrl)}
                                                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-colors"
                                                            >
                                                                <File size={12}/> {device.certificateFileName ? (device.certificateFileName.length > 8 ? device.certificateFileName.substring(0,8)+'...' : device.certificateFileName) : 'View PDF'}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap items-center justify-end gap-2 bg-slate-50/30 -mx-6 -mb-6 px-6 py-3 rounded-b-3xl">
                                                        <button 
                                                            onClick={() => openEditSensor(asset.id, device)}
                                                            title="Edit Sensor Details"
                                                            disabled={!device.isActive}
                                                            className="p-2 bg-white text-slate-500 border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all disabled:opacity-50"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => triggerUpload(asset.id, device.id)}
                                                            title="Upload Certificate"
                                                            disabled={!device.isActive}
                                                            className="p-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 shadow-sm transition-all disabled:opacity-50"
                                                        >
                                                            <Upload size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => openRenewModal(asset.id, device)}
                                                            title="Renew Calibration"
                                                            disabled={!device.isActive}
                                                            className="p-2 bg-white text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-50 shadow-sm transition-all disabled:opacity-50"
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleDeviceStatus(asset.id, device.id)}
                                                            title={device.isActive ? "Deactivate" : "Activate"}
                                                            className={`p-2 bg-white border rounded-xl shadow-sm transition-all ${device.isActive ? 'text-amber-500 border-amber-100 hover:bg-amber-50' : 'text-emerald-500 border-emerald-100 hover:bg-emerald-50'}`}
                                                        >
                                                            <Power size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteDevice(asset.id, device.id)}
                                                            title="Remove Sensor"
                                                            className="p-2 bg-white text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-50 shadow-sm transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {calibrationAssets.length === 0 && (
                    <div className="p-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                             <Search size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Calibration Assets Found</h3>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Try adjusting filters or add new equipment</p>
                    </div>
                )}
             </div>

             {/* RENEW MODAL */}
             {renewModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
                        <div className="flex items-center gap-4 mb-6 text-emerald-600">
                            <RefreshCw size={24} />
                            <h3 className="text-lg font-black uppercase tracking-tight">Renew Calibration</h3>
                        </div>
                        <form onSubmit={handleRenewSave} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Calib. Date</label>
                                <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" value={renewForm.date} onChange={e => setRenewForm({...renewForm, date: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Due Date</label>
                                <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" value={renewForm.nextDate} onChange={e => setRenewForm({...renewForm, nextDate: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Certificate ID</label>
                                <input type="text" placeholder="Enter ID..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all uppercase" value={renewForm.certId} onChange={e => setRenewForm({...renewForm, certId: e.target.value})} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setRenewModal(null)} className="flex-1 py-3 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-emerald-700 transition-all">Confirm Renewal</button>
                            </div>
                        </form>
                    </div>
                </div>
             )}

             {/* SENSOR FORM MODAL (Add/Edit) */}
             {sensorModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 h-[90vh] md:h-auto">
                         <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Settings2 size={24}/></div>
                               <h3 className="text-xl font-black uppercase tracking-tight">{sensorModal.sensor ? 'Edit Sensor' : 'Add New Sensor'}</h3>
                            </div>
                            <button onClick={() => setSensorModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24}/></button>
                         </div>
                         <form onSubmit={handleSaveSensor} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Name</label>
                                    <input required name="name" defaultValue={sensorModal.sensor?.name} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none" placeholder="e.g. Core Probe 1" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial Number</label>
                                    <input required name="serialNumber" defaultValue={sensorModal.sensor?.serialNumber} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none uppercase" placeholder="SN-XXXX" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Type</label>
                                    <select name="type" defaultValue={sensorModal.sensor?.type || 'Temperature'} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none cursor-pointer">
                                        <option value="Temperature">Temperature</option>
                                        <option value="Humidity">Humidity</option>
                                        <option value="Pressure">Pressure</option>
                                        <option value="Weight">Weight</option>
                                        <option value="Timer">Timer</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Working Range</label>
                                    <input name="workingRange" defaultValue={sensorModal.sensor?.workingRange} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none" placeholder="e.g. -40 to 100°C" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Least Count</label>
                                    <input name="leastCount" defaultValue={sensorModal.sensor?.leastCount} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none" placeholder="e.g. 0.1°C" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calibrated Range</label>
                                    <input name="calibrationRange" defaultValue={sensorModal.sensor?.calibrationRange} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none" placeholder="e.g. 0 to 80°C" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Calibration</label>
                                    <input required type="date" name="lastCalibrationDate" defaultValue={sensorModal.sensor?.lastCalibrationDate} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Due</label>
                                    <input required type="date" name="nextCalibrationDate" defaultValue={sensorModal.sensor?.nextCalibrationDate} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calibrated By (Agency)</label>
                                    <input name="calibratedBy" defaultValue={sensorModal.sensor?.calibratedBy} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none" placeholder="Lab Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Certificate ID</label>
                                    <input name="certificateId" defaultValue={sensorModal.sensor?.certificateId} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none uppercase" placeholder="CERT-XXXX" />
                                </div>
                            </div>
                            <div className="pt-6 flex gap-4 border-t border-slate-100">
                                <button type="button" onClick={() => setSensorModal(null)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">{sensorModal.sensor ? 'Update Sensor' : 'Register Sensor'}</button>
                            </div>
                         </form>
                    </div>
                </div>
             )}
        </div>
    );
};

const PestManagement = () => (
    <div className="p-20 text-center text-slate-400 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
        <Bug size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-lg font-black uppercase tracking-widest text-slate-300">Pest Control</p>
        <p className="text-xs mt-3 uppercase font-bold tracking-widest">Pest Management Activity Logs</p>
    </div>
);

// --- Main Component ---

const FacilityManagement: React.FC<{ activeSubTab: string }> = ({ activeSubTab }) => {
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkStagedData, setBulkStagedData] = useState<Partial<Equipment>[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Equipment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(eq => 
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [equipment, searchTerm]);

  const handleUpdateEditForm = (field: keyof Equipment, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const toggleStatus = (id: string) => {
    setEquipment(prev => prev.map(eq => 
      eq.id === id ? { ...eq, status: eq.status === 'Active' ? 'Inactive' : 'Active' } : eq
    ));
  };

  const deleteEquipment = (id: string) => {
    if (window.confirm("Permanently remove this asset from the registry?")) {
      setEquipment(prev => prev.filter(eq => eq.id !== id));
    }
  };

  const startInlineEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setEditForm({ ...eq });
  };

  const saveInlineEdit = () => {
    if (!editForm) return;
    setEquipment(prev => prev.map(eq => eq.id === editForm.id ? editForm : eq));
    setEditingId(null);
    setEditForm(null);
  };

  const toggleMonitoring = (activity: string) => {
    if (!editForm) return;
    const current = editForm.monitoringActivity;
    const next = current.includes(activity) ? current.filter(a => a !== activity) : [...current, activity];
    handleUpdateEditForm('monitoringActivity', next);
  };

  // --- Bulk Upload Handlers ---

  const handleDownloadSample = () => {
    const headers = "Equipment Name,Equipment Id Number,Location,Department,Make,brand,Calibration Yes and No";
    const sampleRows = [
      "Walk-in Chiller,CH-001,Kitchen North,Production,ColdTech,Arctic-V1,Yes",
      "Convection Oven,OV-202,Bakery,Pastry,HeatStream,Master-Pro,No"
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...sampleRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "facility_equipment_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) return;

      const staged: Partial<Equipment>[] = lines.slice(1).map((line, idx) => {
        const parts = line.split(',').map(p => p.trim());
        const rawLoc = parts[2] || "";
        const rawDept = parts[3] || "";
        const rawCal = (parts[6] || "").toLowerCase();
        
        // Logical soft-matching for boolean
        const calBool = rawCal === 'yes' || rawCal === 'y' || rawCal === 'true' || rawCal === '1';
        
        const now = new Date().toISOString().split('T')[0];

        return {
          id: `bulk-${Date.now()}-${idx}`,
          name: parts[0] || 'Unknown',
          idNumber: parts[1] || 'TBD',
          location: rawLoc,
          department: rawDept,
          make: parts[4] || 'TBD',
          brand: parts[5] || 'TBD',
          calibrationRequired: calBool,
          status: 'Active' as const,
          regional: REGIONAL_OPTIONS[0],
          unit: UNIT_OPTIONS[0],
          
          cleaningChecklist: CLEANING_CHECKLISTS[0],
          cleaningFrequencyValue: 1,
          cleaningFrequencyUnit: 'Days',
          cleaningStartDate: now,
          
          pmChecklist: PM_CHECKLISTS[0],
          pmFrequencyValue: 1,
          pmFrequencyUnit: 'Months',
          pmStartDate: now,
          
          calibrationFrequencyValue: 1,
          calibrationFrequencyUnit: 'Years',
          calibrationStartDate: now,
          
          monitoringActivity: []
        };
      });

      setBulkStagedData(staged);
      setIsBulkUploadModalOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const commitBulkUpload = () => {
    const finalized = bulkStagedData.map(item => ({
        ...item,
        department: DEPT_OPTIONS.includes(item.department || "") ? item.department : DEPT_OPTIONS[0],
        location: LOCATION_OPTIONS.includes(item.location || "") ? item.location : LOCATION_OPTIONS[0],
    })) as Equipment[];

    setEquipment(prev => [...finalized, ...prev]);
    setIsBulkUploadModalOpen(false);
    setBulkStagedData([]);
  };

  const handleAddNewSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const activities = [];
    if (formData.get('mon_temp')) activities.push('Temperature');
    if (formData.get('mon_hum')) activities.push('Humidity');

    const payload: Equipment = {
      id: `eq-${Date.now()}`,
      name: data.name as string,
      idNumber: data.idNumber as string,
      location: data.location as string,
      department: data.department as string,
      unit: data.unit as string,
      regional: data.regional as string,
      make: data.make as string,
      brand: data.brand as string,
      
      cleaningChecklist: data.cleaningChecklist as string,
      cleaningFrequencyValue: parseInt(data.cleaningFrequencyValue as string) || 1,
      cleaningFrequencyUnit: data.cleaningFrequencyUnit as any,
      cleaningDay: data.cleaningDay as string,
      cleaningStartDate: data.cleaningStartDate as string,
      
      pmChecklist: data.pmChecklist as string,
      pmFrequencyValue: parseInt(data.pmFrequencyValue as string) || 1,
      pmFrequencyUnit: data.pmFrequencyUnit as any,
      pmDay: data.pmDay as string,
      pmStartDate: data.pmStartDate as string,
      
      calibrationRequired: data.calibrationRequired === 'on',
      calibrationFrequencyValue: parseInt(data.calibrationFrequencyValue as string) || 1,
      calibrationFrequencyUnit: data.calibrationFrequencyUnit as any,
      calibrationStartDate: data.calibrationStartDate as string,
      
      monitoringActivity: activities,
      status: 'Active'
    };

    setEquipment(prev => [payload, ...prev]);
    setIsModalOpen(false);
  };

  // --- Modal State ---
  const [cleaningFreqUnit, setCleaningFreqUnit] = useState('Days');

  return (
    <div className="flex flex-col gap-6">
      {activeSubTab === 'fac-equipment' && (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header and Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-4">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 ring-4 ring-white">
                  <Warehouse size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Asset Fleet</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500" /> Infrastructure Maintenance Registry
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                <div className="relative group flex-1 md:w-64 min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search Asset, SKU..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-[1.25rem] text-sm font-black focus:outline-none focus:border-indigo-400 transition-all shadow-inner uppercase"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleDownloadSample} className="p-3 bg-white border-2 border-slate-100 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"><Download size={20} /></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all active:scale-95 shadow-sm"><FileUp size={16} strokeWidth={3} /> Bulk Upload</button>
                    <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center gap-2"><Plus size={16} strokeWidth={3} /> New Asset</button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-6">
                {filteredEquipment.map((eq, index) => {
                  const isEditing = editingId === eq.id;
                  if (isEditing && editForm) {
                    return (
                        <div key={eq.id} className="relative bg-slate-50 rounded-[2.5rem] border-2 border-indigo-400 shadow-2xl shadow-indigo-100 transition-all duration-500 flex flex-col xl:flex-row items-stretch animate-in zoom-in-95 z-50 overflow-visible">
                           {/* Identity and Hierarchy Nodes */}
                           <div className="p-8 xl:w-[28%] flex items-start gap-6 border-b xl:border-b-0 xl:border-r border-indigo-100 shrink-0 bg-white rounded-t-[2.5rem] xl:rounded-t-none xl:rounded-l-[2.5rem]">
                              <div className="flex flex-col items-center gap-3 shrink-0">
                                <div className="p-4 rounded-3xl bg-indigo-600 text-white shadow-lg"><Wrench size={28} /></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">SN: {(index + 1).toString().padStart(3, '0')}</span>
                              </div>
                              <div className="min-w-0 flex-1 space-y-3">
                                <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">Asset Name</label><input value={editForm.name} onChange={e => handleUpdateEditForm('name', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black uppercase focus:border-indigo-500 outline-none" /></div>
                                <div className="grid grid-cols-2 gap-2"><div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">ID Number</label><input value={editForm.idNumber} onChange={e => handleUpdateEditForm('idNumber', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono font-bold focus:border-indigo-500 outline-none" /></div><div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400 ml-1">Brand</label><input value={editForm.brand} onChange={e => handleUpdateEditForm('brand', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase focus:border-indigo-500 outline-none" /></div></div>
                              </div>
                           </div>
                           <div className="p-8 xl:w-[22%] bg-slate-50/50 border-b xl:border-b-0 xl:border-r border-indigo-100 flex flex-col justify-center gap-3 shrink-0">
                                <SearchableSelect label="Regional Office" options={REGIONAL_OPTIONS} value={editForm.regional} onChange={(val: string) => handleUpdateEditForm('regional', val)} placeholder="Region" />
                                <SearchableSelect label="Unit Node" options={UNIT_OPTIONS} value={editForm.unit} onChange={(val: string) => handleUpdateEditForm('unit', val)} placeholder="Unit" />
                                <div className="grid grid-cols-2 gap-2">
                                    <SearchableSelect label="Dept" options={DEPT_OPTIONS} value={editForm.department} onChange={(val: string) => handleUpdateEditForm('department', val)} placeholder="Dept" />
                                    <SearchableSelect label="Location" options={LOCATION_OPTIONS} value={editForm.location} onChange={(val: string) => handleUpdateEditForm('location', val)} placeholder="Loc" />
                                </div>
                           </div>

                           {/* UPDATED SERVICE MATRIX INLINE EDIT */}
                           <div className="p-0 xl:flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-indigo-100 bg-white min-w-0">
                                <div className="p-6 space-y-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Droplets size={12} className="text-blue-500" /> Hygiene Setup</span>
                                    <SearchableSelect label="Checklist" options={CLEANING_CHECKLISTS} value={editForm.cleaningChecklist} onChange={(v: string) => handleUpdateEditForm('cleaningChecklist', v)} placeholder="Find Checklist..." />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Frequency</label>
                                            <div className="flex gap-1">
                                                <input type="number" min="1" value={editForm.cleaningFrequencyValue} onChange={e => handleUpdateEditForm('cleaningFrequencyValue', parseInt(e.target.value))} className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black outline-none" />
                                                <select value={editForm.cleaningFrequencyUnit} onChange={e => handleUpdateEditForm('cleaningFrequencyUnit', e.target.value)} className="w-1/2 px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none">
                                                    <option value="Days">Days</option><option value="Weeks">Weeks</option><option value="Months">Months</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><PlayCircle size={8}/> Task Start</label>
                                            <input type="date" value={editForm.cleaningStartDate} onChange={e => handleUpdateEditForm('cleaningStartDate', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1 pt-1 border-t border-slate-50">
                                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Preferred Day</label>
                                        <div className="relative">
                                            <select value={editForm.cleaningDay || 'Monday'} onChange={e => handleUpdateEditForm('cleaningDay', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none appearance-none">
                                                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Hammer size={12} className="text-orange-500" /> PPM Setup</span>
                                    <SearchableSelect label="PM Checklist" options={PM_CHECKLISTS} value={editForm.pmChecklist} onChange={(v: string) => handleUpdateEditForm('pmChecklist', v)} placeholder="Find PM Spec..." />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Frequency</label>
                                            <div className="flex gap-1">
                                                <input type="number" min="1" value={editForm.pmFrequencyValue} onChange={e => handleUpdateEditForm('pmFrequencyValue', parseInt(e.target.value))} className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black outline-none" />
                                                <select value={editForm.pmFrequencyUnit} onChange={e => handleUpdateEditForm('pmFrequencyUnit', e.target.value)} className="w-1/2 px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none">
                                                    <option value="Days">Days</option><option value="Weeks">Weeks</option><option value="Months">Months</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><PlayCircle size={8}/> PM Start</label>
                                            <input type="date" value={editForm.pmStartDate} onChange={e => handleUpdateEditForm('pmStartDate', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1 pt-1 border-t border-slate-50">
                                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Preferred Day</label>
                                        <div className="relative">
                                            <select value={editForm.pmDay || 'Monday'} onChange={e => handleUpdateEditForm('pmDay', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none appearance-none">
                                                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                                        </div>
                                    </div>
                                </div>
                           </div>

                           {/* Inline Edit Terminal Actions */}
                           <div className="p-8 xl:w-[220px] bg-indigo-50/30 flex flex-col justify-between items-center gap-6 shrink-0 lg:border-l border-indigo-100 rounded-b-[2.5rem] xl:rounded-b-none xl:rounded-r-[2.5rem]">
                              <div className="space-y-4 w-full">
                                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm">
                                   <span className="text-[8px] font-black uppercase text-slate-400">Monitoring</span>
                                   <div className="flex gap-2">
                                      <button onClick={() => toggleMonitoring('Temperature')} className={`p-1.5 rounded-lg transition-all ${editForm.monitoringActivity.includes('Temperature') ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}><Thermometer size={14}/></button>
                                      <button onClick={() => toggleMonitoring('Humidity')} className={`p-1.5 rounded-lg transition-all ${editForm.monitoringActivity.includes('Humidity') ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300'}`}><Droplet size={14}/></button>
                                   </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm cursor-pointer">
                                       <span className="text-[8px] font-black uppercase text-slate-400">Calibration Req.</span>
                                       <input type="checkbox" checked={editForm.calibrationRequired} onChange={e => handleUpdateEditForm('calibrationRequired', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                                    </label>
                                    {editForm.calibrationRequired && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Frequency</label>
                                                <div className="flex gap-1">
                                                    <input type="number" min="1" value={editForm.calibrationFrequencyValue} onChange={e => handleUpdateEditForm('calibrationFrequencyValue', parseInt(e.target.value))} className="w-1/2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black outline-none" />
                                                    <select value={editForm.calibrationFrequencyUnit} onChange={e => handleUpdateEditForm('calibrationFrequencyUnit', e.target.value)} className="w-1/2 px-1 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none">
                                                        <option value="Days">Days</option><option value="Weeks">Weeks</option><option value="Months">Months</option><option value="Years">Years</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Start Date</label>
                                                <input type="date" value={editForm.calibrationStartDate} onChange={e => handleUpdateEditForm('calibrationStartDate', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none" />
                                            </div>
                                        </>
                                    )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <button onClick={saveInlineEdit} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"><Save size={16} /> Commit Sync</button>
                                <button onClick={() => setEditingId(null)} className="w-full py-2 bg-white text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Discard</button>
                              </div>
                           </div>
                        </div>
                    );
                  }

                  return (
                    <div key={eq.id} className={`relative bg-white rounded-[2.5rem] border-2 transition-all duration-500 group overflow-hidden flex flex-col xl:flex-row items-stretch min-h-[160px] ${eq.status === 'Inactive' ? 'opacity-60 grayscale border-slate-200 bg-slate-50' : 'border-slate-50 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10'}`}>
                      {/* Read Only Display */}
                      <div className="p-8 xl:w-[28%] flex items-start gap-6 border-b xl:border-b-0 xl:border-r border-slate-100 shrink-0">
                         <div className="flex flex-col items-center gap-3 shrink-0">
                           <div className={`p-4 rounded-3xl ${eq.status === 'Active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'} shadow-inner`}>
                             <Wrench size={28} />
                           </div>
                           <div className="flex flex-col items-center gap-1.5">
                             <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${eq.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{eq.status}</span>
                             <span className="text-[9px] font-black text-slate-300 uppercase font-mono">SN: {(index + 1).toString().padStart(3, '0')}</span>
                           </div>
                         </div>
                         <div className="min-w-0 flex-1">
                           <div className="flex flex-wrap items-center gap-2 mb-2">
                             <span className="text-[9px] font-mono font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-100">#{eq.idNumber}</span>
                             {eq.calibrationRequired && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[8px] font-black uppercase flex items-center gap-1"><ShieldAlert size={10} /> Cal. Req</span>}
                           </div>
                           <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{eq.name}</h4>
                           <div className="mt-3 flex flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-100"><Building size={12} className="text-slate-400" /><span className="text-[9px] font-black text-slate-600 uppercase">{eq.make}</span></div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-100"><Tag size={12} className="text-slate-400" /><span className="text-[9px] font-black text-slate-600 uppercase">{eq.brand}</span></div>
                           </div>
                         </div>
                      </div>

                      <div className="p-8 xl:w-[22%] bg-slate-50/20 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col justify-center gap-4 shrink-0">
                        <div className="flex items-start gap-3"><Globe size={14} className="text-indigo-500 mt-1" /><div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Context</p><p className="text-xs font-bold text-slate-700 uppercase leading-snug">{eq.regional} • {eq.unit}</p></div></div>
                        <div className="flex items-start gap-3"><MapPin size={14} className="text-indigo-500 mt-1" /><div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Functional Node</p><p className="text-xs font-bold text-slate-700 uppercase leading-snug">{eq.department} • {eq.location}</p></div></div>
                      </div>

                      <div className="p-0 xl:flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white min-w-0">
                        <div className="p-8 flex flex-col justify-center gap-2 hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-2 mb-1"><Droplets size={14} className="text-blue-500" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hygiene Protocol</span></div>
                           <p className="text-[11px] font-black text-slate-800 uppercase leading-snug line-clamp-2">{eq.cleaningChecklist}</p>
                           <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase mt-1">
                              <Clock size={10} /> 
                              Every {eq.cleaningFrequencyValue} {eq.cleaningFrequencyUnit}
                              {eq.cleaningDay && ` (${eq.cleaningDay})`}
                              <span className="text-slate-300">|</span> <span className="text-emerald-600">Start: {eq.cleaningStartDate}</span>
                           </div>
                        </div>
                        
                        <div className="p-8 flex flex-col justify-center gap-2 hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-2 mb-1"><Hammer size={14} className="text-orange-500" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Maintenance Cycle</span></div>
                           <p className="text-[11px] font-black text-slate-800 uppercase leading-snug line-clamp-2">{eq.pmChecklist}</p>
                           <div className="flex flex-wrap gap-1.5 mt-1">
                              <span className="px-1.5 py-0.5 bg-slate-50 border rounded text-[8px] font-black text-slate-500 uppercase">Every {eq.pmFrequencyValue} {eq.pmFrequencyUnit} {eq.pmDay && `(${eq.pmDay})`}</span>
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase border bg-indigo-50 text-indigo-700 border-indigo-100">Start: {eq.pmStartDate}</span>
                           </div>
                        </div>
                      </div>

                      <div className="p-8 xl:w-[220px] bg-slate-50/30 flex flex-col justify-between items-center gap-6 shrink-0 lg:border-l border-slate-100">
                        <div className="flex gap-2">
                          {eq.monitoringActivity.map(act => (<div key={act} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm group-hover:text-indigo-600 transition-colors" title={`Monitoring: ${act}`}>{act === 'Temperature' ? <Thermometer size={18} /> : <Droplet size={18} />}</div>))}
                          {eq.monitoringActivity.length === 0 && (<span className="text-[8px] font-black text-slate-300 uppercase tracking-widest py-3">Passive node</span>)}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startInlineEdit(eq)} className="p-3 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-90" title="Modify Entry"><Edit3 size={18} /></button>
                          <button onClick={() => toggleStatus(eq.id)} className={`p-3 rounded-2xl border-2 transition-all shadow-sm active:scale-90 ${eq.status === 'Active' ? 'bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200' : 'bg-emerald-600 border-emerald-600 text-white shadow-lg'}`} title={eq.status === 'Active' ? 'Deactivate' : 'Activate'}><Power size={18} /></button>
                          <button onClick={() => deleteEquipment(eq.id)} className="p-3 bg-white border-2 border-slate-100 text-slate-300 rounded-2xl hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-90" title="Archive/Delete"><Trash2 size={18} /></button>
                        </div>
                      </div>
                      <div className={`w-1.5 h-full absolute left-0 top-0 ${eq.status === 'Active' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    </div>
                  );
                })}
            </div>
        </div>
      )}
      
      {/* ... Other Tabs ... */}
      {activeSubTab === 'fac-cleaning' && <CleaningChecklistModule equipmentList={equipment as any} />}
      {activeSubTab === 'fac-maintenance' && <MaintenanceView />}
      {activeSubTab === 'fac-calibration' && <CalibrationHub equipmentList={equipment} />}
      {activeSubTab === 'fac-pest' && <PestManagement />}

      {/* MODAL: ADD NEW ASSET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20"><Wrench size={24}/></div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Register New Asset</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24}/></button>
            </div>
            
            <form id="asset-onboarding-form" onSubmit={handleAddNewSave} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
              
              <div className="space-y-6">
                 <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Fingerprint size={16} /> Asset Identification & Hierarchy
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label><input required name="name" className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-indigo-400 outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID #</label><input required name="idNumber" className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-indigo-400 outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand</label><input name="brand" className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold" /></div>
                    
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regional</label><select name="regional" className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold uppercase">{REGIONAL_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label><select name="unit" className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold uppercase">{UNIT_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label><select name="department" className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold uppercase">{DEPT_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <History size={16} /> Hygiene & Maintenance Schedules
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cleaning Config */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                       <h5 className="text-[11px] font-black uppercase text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2"><Droplets size={14} className="text-blue-500" /> Cleaning Protocol</h5>
                       <select name="cleaningChecklist" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase">{CLEANING_CHECKLISTS.map(o => <option key={o}>{o}</option>)}</select>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Every</label>
                               <input type="number" name="cleaningFrequencyValue" min="1" defaultValue="1" className="w-full h-12 px-4 bg-slate-50 border rounded-xl text-xs font-bold uppercase" />
                           </div>
                           <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Unit</label>
                               <select name="cleaningFrequencyUnit" className="w-full h-12 px-4 bg-slate-50 border rounded-xl text-xs font-bold uppercase" onChange={(e) => setCleaningFreqUnit(e.target.value)}>
                                   <option value="Days">Days</option>
                                   <option value="Weeks">Weeks</option>
                                   <option value="Months">Months</option>
                                   <option value="Years">Years</option>
                               </select>
                           </div>
                       </div>
                       
                       <div className="space-y-1 animate-in slide-in-from-top-1">
                           <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Preferred Day</label>
                           <select name="cleaningDay" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase">
                               {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                       </div>

                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label><input type="date" name="cleaningStartDate" className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold uppercase outline-none" required /></div>
                    </div>

                    {/* PM Config */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                       <h5 className="text-[11px] font-black uppercase text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2"><Hammer size={14} className="text-orange-500" /> Preventive Maintenance</h5>
                       <select name="pmChecklist" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase">{PM_CHECKLISTS.map(o => <option key={o}>{o}</option>)}</select>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Every</label>
                               <input type="number" name="pmFrequencyValue" min="1" defaultValue="1" className="w-full h-12 px-4 bg-slate-50 border rounded-xl text-xs font-bold uppercase" />
                           </div>
                           <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Unit</label>
                               <select name="pmFrequencyUnit" className="w-full h-12 px-4 bg-slate-50 border rounded-xl text-xs font-bold uppercase">
                                   <option value="Days">Days</option>
                                   <option value="Weeks">Weeks</option>
                                   <option value="Months">Months</option>
                                   <option value="Years">Years</option>
                               </select>
                           </div>
                       </div>
                       <div className="space-y-1 animate-in slide-in-from-top-1">
                           <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Preferred Day</label>
                           <select name="pmDay" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase">
                               {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                       </div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label><input type="date" name="pmStartDate" className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold uppercase outline-none" required /></div>
                    </div>
                 </div>
              </div>

              {/* ... Calibration Section ... */}
              <div className="space-y-6">
                 <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Settings2 size={16} /> Technical Monitoring & Calibration
                 </h4>
                 <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Cpu size={180} /></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-8">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-6">Monitoring Parameters</h5>
                          <div className="flex gap-4">
                             <label className="flex-1 flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer"><input type="checkbox" name="mon_temp" className="w-5 h-5 rounded accent-indigo-50" /><span className="text-xs font-black uppercase">Temp</span></label>
                             <label className="flex-1 flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer"><input type="checkbox" name="mon_hum" className="w-5 h-5 rounded accent-indigo-50" /><span className="text-xs font-black uppercase">Humidity</span></label>
                          </div>
                       </div>
                       <div className="space-y-8">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-orange-400 mb-6">Precision Control</h5>
                          <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl">
                                 <span className="text-xs font-black uppercase">Calibration Required</span>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="calibrationRequired" className="sr-only peer" />
                                    <div className="w-14 h-8 bg-white/10 rounded-full peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6"></div>
                                 </label>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-1">
                                       <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Every</label>
                                       <input type="number" name="calibrationFrequencyValue" min="1" defaultValue="1" className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase text-white" />
                                   </div>
                                   <div className="space-y-1">
                                       <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Unit</label>
                                       <select name="calibrationFrequencyUnit" className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase text-white">
                                           <option className="text-slate-900" value="Days">Days</option>
                                           <option className="text-slate-900" value="Weeks">Weeks</option>
                                           <option className="text-slate-900" value="Months">Months</option>
                                           <option className="text-slate-900" value="Years">Years</option>
                                       </select>
                                   </div>
                              </div>
                              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label><input type="date" name="calibrationStartDate" className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold uppercase outline-none text-slate-900" /></div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </form>

            <div className="px-10 py-8 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-xs font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-all">Discard</button>
               <button type="submit" form="asset-onboarding-form" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                  <Save size={18}/> Commit Registry
               </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ... Bulk Modal same as before ... */}
    </div>
  );
};

export default FacilityManagement;
