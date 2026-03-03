
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Filter, UserCheck, 
  ChevronRight, ChevronDown, Clock, CheckCircle2, AlertTriangle, 
  ListCheck, Building, Calendar, Info, X, 
  History, PenTool,
  ShieldCheck, Plus, Layers, Hourglass, ClipboardCheck, Trash2, Edit3,
  Layout, Check, ImageIcon, CalendarDays, CalendarRange, CalendarClock,
  ArrowRight, ChevronLeft, MapPin, PlayCircle,
  ListFilter,
  Repeat,
  RotateCw,
  Tag,
  Camera,
  Eraser,
  Upload,
  User,
  MessageSquare,
  FileCheck,
  MoreVertical,
  MoveRight,
  Download,
  Calendar as CalendarIcon,
  Thermometer,
  ArrowRightLeft,
  ChevronsRight
} from 'lucide-react';

// --- Types ---
interface CleaningTask {
  id: string;
  corporateName: string;
  regionName: string;
  unitName: string;
  departmentName: string;
  equipmentName: string;
  equipmentIcon: string;
  equipmentId: string;
  make: string;
  location: string;
  scheduledDate: string; // YYYY-MM-DD
  validUntilDate?: string; // The start of the next cycle
  frequency: string;
  assignedDay: string;
  lastCleaned?: string;
  nextDue?: string;
  status: 'pending' | 'ongoing' | 'completed' | 'verified' | 'overdue' | 'scheduled';
  verificationStatus?: string;
  completedBy?: string;
  completionDate?: string;
  verifiedBy?: string;
  verificationDate?: string;
  checklistAnswers?: { yes: number; no: number; na: number };
  totalCheckpoints: number;
  responsibility: string;
  evidencePhotos?: string[];
  operatorSignature?: string;
  verificationComments?: string; 
  verificationSignature?: string; 
  // Reschedule Fields
  isRescheduled?: boolean;
  originalDate?: string;
  rescheduleReason?: string;
  isCarryOver?: boolean;
  daysOverdue?: number;
}

// Interface matching the Equipment from FacilityManagement
interface ConnectedEquipment {
  id: string;
  name: string;
  idNumber: string;
  location: string;
  department: string;
  unit: string;
  regional: string;
  make: string;
  brand: string;
  cleaningChecklist: string;
  cleaningFrequencyValue: number;
  cleaningFrequencyUnit: 'Days' | 'Weeks' | 'Months' | 'Years';
  cleaningDay?: string;
  cleaningStartDate: string; 
  status: 'Active' | 'Inactive';
}

interface CleaningChecklistModuleProps {
    equipmentList?: ConnectedEquipment[];
}

// --- Helper Functions ---

const toLocalISOString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
};

const getWeeksInMonth = (year: number, month: number) => {
  const weeks = new Set<number>();
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    weeks.add(getWeekNumber(date));
    date.setDate(date.getDate() + 1);
  }
  return Array.from(weeks).sort((a,b) => a-b);
};

const getDaysInWeek = (year: number, week: number) => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ISOweekStart);
    d.setDate(ISOweekStart.getDate() + i);
    days.push(d);
  }
  return days;
};

const DAY_MAP: Record<string, number> = {
  "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MAKES = ["Rational", "Hobart", "Electrolux", "True", "Vulcan", "Hoshizaki"];

const FREQUENCY_DAYS: Record<string, number> = {
  "Daily": 1,
  "Weekly": 7,
  "Monthly": 30,
  "Quarterly": 90,
  "Bi-Annually": 180,
  "Annually": 365
};

// --- Linked Data Generator with Advanced Logic ---
const generateTasksForRange = (equipmentList: ConnectedEquipment[], startDate: Date, endDate: Date): CleaningTask[] => {
    const tasks: CleaningTask[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // Normalize range times
    const start = new Date(startDate); start.setHours(0,0,0,0);
    const end = new Date(endDate); end.setHours(23,59,59,999);

    equipmentList.forEach(eq => {
        if (eq.status !== 'Active') return;
        if (!eq.cleaningStartDate) return;

        const val = eq.cleaningFrequencyValue || 1;
        const unit = eq.cleaningFrequencyUnit || 'Days';
        const preferredDayIdx = eq.cleaningDay ? DAY_MAP[eq.cleaningDay] : -1;

        // 1. Determine Initial Anchor Date
        let anchorDate = new Date(eq.cleaningStartDate);
        anchorDate.setHours(0,0,0,0);
        
        // If a specific day is required (Weeks), align the anchor
        if (unit === 'Weeks' && preferredDayIdx !== -1) {
            const startDay = anchorDate.getDay();
            let daysToAdd = preferredDayIdx - startDay;
            if (daysToAdd < 0) daysToAdd += 7;
            anchorDate.setDate(anchorDate.getDate() + daysToAdd);
        }

        // 2. Iterate through cycles to find all occurrences within [start, end]
        let cycleStart = new Date(anchorDate);
        let safetyCounter = 0;

        // Fast forward to near range start to avoid huge loops for old start dates
        // Only simple logic for 'Days'/'Weeks' optimization, else simple loop
        // (Keeping simple loop for reliability as frequency varies)

        while (safetyCounter < 5000) {
            // Determine Next Cycle Start (The end of current task window)
            let nextCycleStart = new Date(cycleStart);
            if (unit === 'Days') nextCycleStart.setDate(nextCycleStart.getDate() + val);
            if (unit === 'Weeks') nextCycleStart.setDate(nextCycleStart.getDate() + (val * 7));
            if (unit === 'Months') nextCycleStart.setMonth(nextCycleStart.getMonth() + val);
            if (unit === 'Years') nextCycleStart.setFullYear(nextCycleStart.getFullYear() + val);

            // Check overlap
            // We include the task if its Scheduled Date (cycleStart) is within the requested range
            if (cycleStart >= start && cycleStart <= end) {
                const scheduledDateStr = toLocalISOString(cycleStart);
                const isCarryOver = cycleStart < today;
                
                // Status Determination
                let status: CleaningTask['status'] = 'scheduled';
                if (cycleStart < today) status = 'overdue';
                else if (cycleStart.getTime() === today.getTime()) status = 'pending';
                else status = 'scheduled';

                // Randomly mark some past tasks as completed/verified for realism in mock mode
                // Stable hash for consistency
                const hash = (eq.id + scheduledDateStr).split('').reduce((a,b)=>a+b.charCodeAt(0),0);
                if (status === 'overdue') {
                   if (hash % 3 === 0) status = 'completed';
                   else if (hash % 5 === 0) status = 'verified';
                }

                const daysOverdue = (status === 'overdue' || (status === 'pending' && isCarryOver))
                    ? Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                tasks.push({
                    id: `task-${scheduledDateStr}-${eq.id}`,
                    corporateName: 'Acme Corp',
                    regionName: eq.regional,
                    unitName: eq.unit,
                    departmentName: eq.department,
                    equipmentName: eq.name,
                    equipmentIcon: 'Box',
                    equipmentId: eq.idNumber,
                    make: eq.make,
                    location: eq.location,
                    scheduledDate: scheduledDateStr,
                    validUntilDate: toLocalISOString(nextCycleStart),
                    frequency: `Every ${val} ${unit}${eq.cleaningDay ? ` on ${eq.cleaningDay}` : ''}`,
                    assignedDay: eq.cleaningDay || 'Dynamic',
                    status: status,
                    totalCheckpoints: 5,
                    responsibility: 'Staff',
                    isCarryOver: isCarryOver,
                    daysOverdue: daysOverdue,
                });
            }

            cycleStart = nextCycleStart;
            safetyCounter++;
            
            // Break if we are past the requested end range
            if (cycleStart > end) break;
        }
    });

    return tasks;
};

// --- Mock Data Generator for Standalone Mode ---
const generateMockTasks = (): CleaningTask[] => {
    const today = new Date();
    const dateStr = toLocalISOString(today);
    
    return [
      {
        id: 'mock-1',
        corporateName: 'Acme Corp',
        regionName: 'North America',
        unitName: 'NYC Central',
        departmentName: 'Kitchen',
        equipmentName: 'Deep Fryer 1',
        equipmentIcon: 'Box',
        equipmentId: 'EQ-DF-01',
        make: 'Vulcan',
        location: 'Hot Line',
        scheduledDate: dateStr,
        validUntilDate: dateStr,
        frequency: 'Daily',
        assignedDay: 'Daily',
        status: 'pending',
        totalCheckpoints: 5,
        responsibility: 'Line Cook',
        isCarryOver: false,
        daysOverdue: 0
      }
    ];
};

// --- Components ---

const SignaturePad: React.FC<{ onSave: (data: string) => void, onClear: () => void, initialData?: string, label?: string }> = ({ onSave, onClear, initialData, label }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Initial render of existing signature
    useEffect(() => {
        if (initialData && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0);
                img.src = initialData;
            }
        }
    }, [initialData]);

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Get correct coordinates
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
        
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            if (canvas) onSave(canvas.toDataURL());
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onClear();
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label || "Signature Auth"}</label>
                <button 
                  type="button" 
                  onClick={clear} 
                  className="text-[9px] font-black text-rose-500 uppercase hover:underline flex items-center gap-1"
                >
                    <Eraser size={10} /> Reset
                </button>
            </div>
            <div className="w-full h-32 bg-slate-50 border-2 border-slate-200 border-dashed rounded-[1.5rem] relative overflow-hidden shadow-inner cursor-crosshair">
                <canvas 
                    ref={canvasRef} 
                    width={500} 
                    height={128} 
                    className="w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!initialData && !isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <span className="text-3xl font-black uppercase -rotate-6 select-none tracking-tighter">Sign Here</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailBadge = ({ label, value, icon: Icon, color = "text-slate-500" }: any) => (
    <div className="flex flex-col">
        <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{label}</span>
        <div className="flex items-center gap-1.5">
            {Icon && <Icon size={10} className="text-slate-300" />}
            <span className={`text-[10px] font-bold uppercase truncate ${color}`}>{value}</span>
        </div>
    </div>
);

const TaskCard: React.FC<{ task: CleaningTask, onAttend: () => void, onVerify: () => void, onHistory?: () => void, onReschedule?: () => void, viewDate?: string }> = ({ task, onAttend, onVerify, onHistory, onReschedule, viewDate }) => {
  const isVerified = task.status === 'verified';
  const isCompleted = task.status === 'completed';
  const isOverdue = task.status === 'overdue';
  const isScheduled = task.status === 'scheduled';
  const isPending = task.status === 'pending' || task.status === 'ongoing';
  
  // Logic from generator: task.isCarryOver is already calculated relative to the viewDate
  const isCarriedOver = task.isCarryOver;
  const daysOverdue = task.daysOverdue || 0;

  let statusColor = "border-slate-100 bg-white";
  let barColor = "bg-slate-300";
  let badgeColor = "bg-slate-100 text-slate-600";
  
  if (isVerified) { statusColor = "border-emerald-500 bg-emerald-50/10"; barColor = "bg-emerald-500"; badgeColor = "bg-emerald-100 text-emerald-700"; }
  else if (isCompleted) { statusColor = "border-blue-500 bg-blue-50/10"; barColor = "bg-blue-500"; badgeColor = "bg-blue-100 text-blue-700"; }
  else if (isOverdue || isCarriedOver) { statusColor = "border-rose-300 bg-rose-50/20"; barColor = "bg-rose-500"; badgeColor = "bg-rose-100 text-rose-700"; }
  else if (task.status === 'ongoing') { statusColor = "border-amber-400 bg-amber-50/20"; barColor = "bg-amber-500"; badgeColor = "bg-amber-100 text-amber-700"; }
  else if (isScheduled) { statusColor = "border-slate-200 bg-slate-50/50"; barColor = "bg-slate-400"; badgeColor = "bg-slate-200 text-slate-500"; }

  return (
    <div className={`relative rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col xl:flex-row items-stretch overflow-hidden group hover:shadow-lg ${statusColor}`}>
      <div className={`w-1.5 h-full absolute left-0 top-0 bottom-0 ${barColor}`} />
      
      {/* Main Info Row */}
      <div className="flex flex-col xl:flex-row items-stretch w-full">
          {/* Col 1: Identity & Equipment */}
          <div className="p-5 xl:w-[35%] border-b xl:border-b-0 xl:border-r border-slate-100 space-y-4">
            {/* Hierarchy Context */}
            <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <span>{task.regionName}</span> <ChevronRight size={8} />
                <span>{task.unitName}</span> <ChevronRight size={8} />
                <span className="text-indigo-500">{task.departmentName}</span>
            </div>

            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${isVerified ? 'bg-emerald-600' : (isOverdue || isCarriedOver) ? 'bg-rose-600' : 'bg-slate-900'}`}>
                <Layout size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight truncate leading-none">{task.equipmentName}</h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border border-current/20 ${badgeColor}`}>
                        {isCarriedOver ? 'Carry Over' : task.status}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 uppercase flex items-center gap-1">
                        <Tag size={8} /> {task.equipmentId}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 uppercase">
                        MK: {task.make}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                   <MapPin size={10} className="text-indigo-500" /> {task.location}
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Schedule & Logic */}
          <div className="p-5 xl:w-[45%] border-b xl:border-b-0 xl:border-r border-slate-100 bg-slate-50/30 flex flex-col justify-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                  <DetailBadge label="Frequency" value={task.frequency} icon={Repeat} />
                  <DetailBadge label="Scheduled For" value={formatDateDisplay(task.scheduledDate)} icon={CalendarIcon} color={isCarriedOver ? 'text-rose-600' : 'text-slate-700'} />
                  <DetailBadge label="Valid Until" value={formatDateDisplay(task.validUntilDate)} icon={CalendarRange} color="text-slate-600" />
                  <DetailBadge label="Next Due" value={formatDateDisplay(task.nextDue)} icon={CalendarClock} color="text-indigo-600" />
              </div>
              
              {task.checklistAnswers && (
                 <div className="mt-4 pt-3 border-t border-slate-200 flex gap-4">
                     <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircle2 size={10}/> Yes: {task.checklistAnswers.yes}</span>
                     <span className="text-[9px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-1 rounded border border-rose-100 flex items-center gap-1"><X size={10}/> No: {task.checklistAnswers.no}</span>
                 </div>
              )}

              {/* Carryover / Auto-Move Badge */}
              {isCarriedOver && (
                 <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-start gap-2 animate-in slide-in-from-left-2">
                    <ChevronsRight size={12} className="text-rose-500 mt-0.5" />
                    <div>
                        <p className="text-[9px] font-black text-rose-700 uppercase tracking-wide">
                            Task carried over from {task.scheduledDate}
                        </p>
                        <p className="text-[8px] font-bold text-rose-500">
                            Action required. Overdue by {daysOverdue} day{daysOverdue > 1 ? 's' : ''}.
                        </p>
                    </div>
                 </div>
              )}
          </div>

          {/* Col 3: Actions */}
          <div className="p-5 flex-1 flex flex-col justify-center items-center gap-3 bg-white relative">
              {/* Quick Actions (History, Reschedule) */}
              <div className="absolute top-2 right-2 flex gap-1">
                 {onHistory && (
                     <button onClick={(e) => { e.stopPropagation(); onHistory(); }} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg hover:text-indigo-600 transition-colors" title="View History">
                        <History size={14} />
                     </button>
                 )}
                 {onReschedule && (isPending || isOverdue) && (
                     <button onClick={(e) => { e.stopPropagation(); onReschedule(); }} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg hover:text-orange-600 transition-colors" title="Reschedule Task">
                        <CalendarDays size={14} />
                     </button>
                 )}
              </div>

              <div className="w-full flex justify-between items-center mb-1 px-1">
                 <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Action</span>
                 <span className="text-[9px] font-bold text-slate-300 uppercase">{task.scheduledDate}</span>
              </div>
              
              {isPending || isOverdue ? (
                <button 
                  onClick={onAttend}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-800"
                >
                  <PenTool size={14} /> {isCarriedOver ? 'Attend Overdue' : 'Start Task'}
                </button>
              ) : isCompleted ? (
                <button 
                  onClick={onVerify}
                  className="w-full py-3 bg-amber-400 text-amber-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-amber-500"
                >
                  <ShieldCheck size={14} /> Verify
                </button>
              ) : isScheduled ? (
                <div className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                   <Clock size={16} /> Scheduled
                </div>
              ) : (
                <div className="w-full py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Verified
                </div>
              )}
          </div>
      </div>

      {/* Expanded Data Row: Evidence & Signatures (Shows only when data exists) */}
      {(isCompleted || isVerified) && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-5 flex flex-col gap-6 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Operator Section */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><User size={14} /></div>
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Cleaned By</p>
                              <p className="text-xs font-bold text-slate-800">{task.completedBy || 'Staff'}</p>
                          </div>
                          <span className="ml-auto text-[9px] font-mono text-slate-400">{task.completionDate ? new Date(task.completionDate).toLocaleDateString() : ''}</span>
                      </div>
                      
                      <div className="flex gap-4">
                          {task.operatorSignature ? (
                              <div className="flex-1 h-16 border border-slate-100 rounded-xl flex items-center justify-center bg-slate-50 p-1">
                                  <img src={task.operatorSignature} alt="Operator Sig" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                              </div>
                          ) : (
                              <div className="flex-1 h-16 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-300 italic">No Signature</div>
                          )}
                          
                          {task.evidencePhotos && task.evidencePhotos.length > 0 ? (
                              <div className="flex gap-2">
                                  {task.evidencePhotos.map((photo, idx) => (
                                      <div key={idx} className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-pointer" onClick={() => window.open(photo)}>
                                          <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="w-16 h-16 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                  <ImageIcon size={18} />
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Verifier Section (Only if verified) */}
                  {isVerified && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                          <div className="flex items-center gap-3 border-b border-emerald-100/50 pb-2">
                              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg"><FileCheck size={14} /></div>
                              <div>
                                  <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest leading-none mb-0.5">Verified By</p>
                                  <p className="text-xs font-bold text-emerald-900">{task.verifiedBy || 'Supervisor'}</p>
                              </div>
                              <span className="ml-auto text-[9px] font-mono text-emerald-600/60">{task.verificationDate ? new Date(task.verificationDate).toLocaleDateString() : ''}</span>
                          </div>

                          <div className="flex gap-4">
                              <div className="flex-1 space-y-1">
                                  <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-tight">Audit Remarks</p>
                                  <p className="text-[10px] text-emerald-700 italic leading-relaxed">"{task.verificationComments || 'Verified via protocol.'}"</p>
                              </div>
                              {task.verificationSignature ? (
                                  <div className="w-24 h-16 border border-emerald-100 rounded-xl flex items-center justify-center bg-white p-1 shadow-sm">
                                      <img src={task.verificationSignature} alt="Verifier Sig" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                  </div>
                              ) : (
                                  <div className="w-24 h-16 border border-dashed border-emerald-200 rounded-xl flex items-center justify-center text-[9px] text-emerald-400 italic">No Sig</div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

const HistoryModal: React.FC<{ task: CleaningTask, onClose: () => void }> = ({ task, onClose }) => {
    // Generate some fake history data based on the current task
    const historyData = useMemo(() => {
        const history = [];
        const baseDate = new Date(task.scheduledDate);
        for (let i = 1; i <= 5; i++) {
            const date = new Date(baseDate);
            // Updated to use FREQUENCY_DAYS correctly from prop or scope if available
            // but since it's inside component, we'll use a simple fallback for mockup
            date.setDate(date.getDate() - (i * (task.frequency.includes('Daily') ? 1 : 7)));
            
            history.push({
                scheduled: date.toISOString().split('T')[0],
                cleaningDate: new Date(date.getTime() + 1000 * 60 * 60 * 15).toISOString(), // same day 3pm
                cleaner: 'John Smith',
                status: i === 1 && Math.random() > 0.5 ? 'COMPLETED' : 'VERIFIED',
                verifier: i === 1 && Math.random() > 0.5 ? undefined : 'Bob The Builder',
                verificationDate: i === 1 && Math.random() > 0.5 ? undefined : new Date(date.getTime() + 1000 * 60 * 60 * 38).toISOString(), // next day 2pm
                frequency: task.frequency.toLowerCase(),
                checklistStatus: 'N/A'
            });
        }
        return history;
    }, [task]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 h-[80vh]">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-white">
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment Cleaning History</div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{task.equipmentName}</h2>
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-emerald-200">ACTIVE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
                            <Download size={14} /> Download Report
                         </button>
                         <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                            <X size={20} />
                         </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-200">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 shrink-0">
                            {/* Placeholder for Thermometer icon as per image, though equipment icon varies */}
                            <Thermometer size={32} />
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Equipment ID</p>
                                <p className="text-sm font-bold text-slate-800">{task.equipmentId}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Make/Brand</p>
                                <p className="text-sm font-bold text-slate-800">{task.make || '--'}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                <p className="text-sm font-bold text-slate-800">{task.location}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Installation Date</p>
                                <p className="text-sm font-bold text-slate-800">--</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* History Table Section */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100">
                         <div className="flex items-center gap-2 text-indigo-600">
                             <History size={18} />
                             <h3 className="font-bold text-sm">Cleaning Schedule</h3>
                         </div>
                         <select className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 shadow-sm">
                             <option>All Time</option>
                             <option>Last 30 Days</option>
                             <option>Last 3 Months</option>
                         </select>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 border-b border-slate-200">Scheduled</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Cleaning</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Status</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Verification</th>
                                    <th className="px-6 py-3 border-b border-slate-200 text-right">Checklist</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
                                {historyData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{new Date(row.scheduled).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Frequency: {row.frequency}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{row.cleaner}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{new Date(row.cleaningDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${row.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {row.verifier ? (
                                                <>
                                                    <div className="font-bold text-slate-800">{row.verifier}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(row.verificationDate!).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                                                </>
                                            ) : (
                                                <span className="text-slate-300 italic text-xs">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-slate-400 text-xs font-medium">{row.checklistStatus}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors shadow-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const CleaningChecklistModule: React.FC<CleaningChecklistModuleProps> = ({ equipmentList = [] }) => {
  // State
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'completed' | 'ongoing'>('all');
  const [isAttendModalOpen, setIsAttendModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  const [activeTask, setActiveTask] = useState<CleaningTask | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState(""); // Add reason state

  // New state for session data
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification State
  const [verifyComments, setVerifyComments] = useState("");
  const [verifySignature, setVerifySignature] = useState("");
  
  // View Mode: 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Time State
  const [now, setNow] = useState(new Date());
  
  // Navigation State
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(now));
  const [selectedDay, setSelectedDay] = useState<string>(toLocalISOString(now));

  // Load Initial Data based on view mode range
  useEffect(() => {
    let start: Date, end: Date;

    if (viewMode === 'day') {
        start = new Date(selectedDay);
        end = new Date(selectedDay);
    } else if (viewMode === 'week') {
        const days = getDaysInWeek(selectedYear, selectedWeek);
        start = days[0];
        end = days[6];
    } else { // month
        start = new Date(selectedYear, selectedMonth, 1);
        end = new Date(selectedYear, selectedMonth + 1, 0); // Last day of month
    }

    if (equipmentList && equipmentList.length > 0) {
        setTasks(generateTasksForRange(equipmentList, start, end));
    } else {
        setTasks(generateMockTasks()); 
    }
  }, [equipmentList, selectedDay, selectedWeek, selectedMonth, selectedYear, viewMode]);

  // Derived Navigation Options
  const availableYears = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const availableMonths = MONTHS; 
  const availableWeeks = useMemo(() => getWeeksInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const availableDays = useMemo(() => getDaysInWeek(selectedYear, selectedWeek), [selectedYear, selectedWeek]);

  // Auto-correction for hierarchy
  useEffect(() => {
      const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);
      if (!weeksInMonth.includes(selectedWeek)) {
          setSelectedWeek(weeksInMonth[0]);
      }
  }, [selectedMonth, selectedYear]);

  // Filter Tasks
  const filteredTasks = useMemo(() => {
      return tasks.filter(t => {
        const searchMatch = (t.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
         t.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()));
        
        let statusMatch = true;
        if (statusFilter !== 'all') {
            if (statusFilter === 'completed') statusMatch = t.status === 'completed' || t.status === 'verified';
            else statusMatch = t.status === statusFilter;
        }

        return searchMatch && statusMatch;
      }).sort((a, b) => {
          // Sort by date so carried over tasks appear first (older dates first)
          return a.scheduledDate.localeCompare(b.scheduledDate);
      });
  }, [tasks, searchTerm, statusFilter]);

  // --- HANDLERS (Same as before) ---
  const handleOpenAttendModal = (task: CleaningTask) => { setActiveTask(task); setEvidencePhotos([]); setSignature(""); setIsAttendModalOpen(true); };
  const handleOpenVerifyModal = (task: CleaningTask) => { setActiveTask(task); setVerifyComments(""); setVerifySignature(""); setIsVerifyModalOpen(true); };
  const handleOpenHistory = (task: CleaningTask) => { setActiveTask(task); setIsHistoryModalOpen(true); };
  const handleOpenReschedule = (task: CleaningTask) => { setActiveTask(task); setNewScheduleDate(task.scheduledDate); setRescheduleReason(""); setIsRescheduleModalOpen(true); };
  const confirmReschedule = () => { if (!activeTask || !newScheduleDate) return; setTasks(prev => prev.map(t => { if (t.id === activeTask.id) { return { ...t, originalDate: t.originalDate || t.scheduledDate, scheduledDate: newScheduleDate, status: 'pending', isRescheduled: true, rescheduleReason: rescheduleReason, isCarryOver: false, daysOverdue: 0 }; } return t; })); setIsRescheduleModalOpen(false); setActiveTask(null); };
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (files) { Array.from(files).forEach((file: File) => { const reader = new FileReader(); reader.onload = (ev) => { if (ev.target?.result) setEvidencePhotos(prev => [...prev, ev.target!.result as string]); }; reader.readAsDataURL(file as Blob); }); } if (fileInputRef.current) fileInputRef.current.value = ""; };
  const handleRemovePhoto = (index: number) => { setEvidencePhotos(prev => prev.filter((_, i) => i !== index)); };
  const handleCompleteTask = () => { if (!activeTask || !signature) { alert("Signature required to complete task."); return; } const nowIso = new Date().toISOString(); setTasks(prev => prev.map(t => { if (t.id === activeTask.id) { return { ...t, status: 'completed', completedBy: 'Staff User', completionDate: nowIso, checklistAnswers: { yes: 5, no: 0, na: 0 }, evidencePhotos: [...evidencePhotos], operatorSignature: signature }; } return t; })); setIsAttendModalOpen(false); setSignature(""); setEvidencePhotos([]); setActiveTask(null); };
  const handleVerifySubmit = () => { if (!activeTask || !verifySignature) { alert("Signature required to verify."); return; } setTasks(prev => prev.map(t => { if (t.id === activeTask.id) { return { ...t, status: 'verified', verifiedBy: 'Manager', verificationDate: new Date().toISOString(), verificationComments: verifyComments, verificationSignature: verifySignature }; } return t; })); setIsVerifyModalOpen(false); setVerifyComments(""); setVerifySignature(""); setActiveTask(null); };

  // --- STATS CALCULATORS ---
  const getDayStats = (dateStr: string) => {
    // Current stats logic for Day view (works for selected day)
    // For Month/Week, we might want aggregate stats, but simplifying for now.
    return {
        active: tasks.filter(t => t.status === 'pending').length,
        missed: tasks.filter(t => t.status === 'overdue').length,
        ongoing: tasks.filter(t => t.status === 'ongoing').length,
        completed: tasks.filter(t => t.status === 'completed' || t.status === 'verified').length,
        total: tasks.length
    };
  };

  const currentStats = getDayStats(selectedDay);

  // --- Reschedule Helpers ---
  const getMaxRescheduleDate = (originalDateStr: string, frequency: string) => { const days = FREQUENCY_DAYS[frequency] || 7; const date = new Date(originalDateStr); date.setDate(date.getDate() + days); return toLocalISOString(date); };
  const maxRescheduleDate = activeTask ? getMaxRescheduleDate(activeTask.originalDate || activeTask.scheduledDate, activeTask.frequency) : "";

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-500">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col xl:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
        <div className="flex items-center gap-6 z-10">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner border border-indigo-100">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Cleaning Registry</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={12} className="text-indigo-500" /> Digital Hygiene Performance Dashboard
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full xl:w-auto z-10">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Asset, Dept or ID..." 
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner uppercase tracking-wider"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center gap-2">
             <Plus size={18} strokeWidth={3} /> New Task
          </button>
        </div>
      </div>

      {/* 2. Unified Hierarchical Timeline */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-2 shadow-sm flex flex-col lg:flex-row items-center gap-4 overflow-hidden">
         
         <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto p-1">
             {/* Year & Month Selectors */}
             <div className="flex items-center gap-1 p-1.5 bg-slate-50/50 rounded-[2rem] border border-slate-100 w-full sm:w-auto justify-between">
                <div className="relative">
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl px-4 py-3 pr-8 outline-none focus:border-indigo-500 cursor-pointer uppercase shadow-sm"
                    >
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <select 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(parseInt(e.target.value))}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl px-4 py-3 pr-8 outline-none focus:border-indigo-500 cursor-pointer uppercase shadow-sm"
                    >
                        {availableMonths.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
             </div>

             {/* View Mode Toggle */}
             <div className="flex bg-slate-100 p-1 rounded-[1.5rem] border border-slate-200 w-full sm:w-auto">
                 {(['day', 'week', 'month'] as const).map(mode => (
                     <button 
                        key={mode} 
                        onClick={() => setViewMode(mode)}
                        className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white shadow-md text-indigo-600 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        {mode}
                     </button>
                 ))}
              </div>
         </div>
         
         <div className="h-10 w-px bg-slate-200 hidden lg:block" />

         {/* Scrollable Timeline (Weeks & Days) */}
         <div className="flex-1 w-full overflow-x-auto hide-scrollbar flex items-center gap-6 px-2">
            
            {/* Week Selector */}
            {viewMode !== 'month' && (
                <div className="flex items-center gap-1 shrink-0">
                   {availableWeeks.map(wk => {
                      const isActive = selectedWeek === wk;
                      return (
                          <button 
                             key={wk}
                             onClick={() => setSelectedWeek(wk)}
                             className={`
                                 group flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all border
                                 ${isActive 
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg' 
                                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-50'
                                 }
                             `}
                          >
                             <span className="text-[10px] font-black uppercase tracking-wider mb-1">W{wk}</span>
                          </button>
                      );
                   })}
                </div>
            )}

            {viewMode === 'day' && (
                <>
                    <div className="w-px h-8 bg-slate-100 shrink-0" />
                    {/* Day Selector */}
                    <div className="flex items-center gap-2">
                       {availableDays.map(d => {
                           const dStr = toLocalISOString(d);
                           const isSelected = selectedDay === dStr;
                           const isToday = dStr === toLocalISOString(now);
                           
                           return (
                               <button
                                  key={dStr}
                                  onClick={() => setSelectedDay(dStr)}
                                  className={`
                                    relative flex flex-col items-center justify-center w-14 h-16 rounded-2xl border-2 transition-all shrink-0
                                    ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110 z-10' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}
                                  `}
                               >
                                  {isToday && !isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                                  
                                  <span className="text-[8px] font-bold uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                  <span className="text-sm font-black">{d.getDate()}</span>
                               </button>
                           );
                       })}
                    </div>
                </>
            )}

            {viewMode === 'month' && (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50 rounded-xl p-3 border border-dashed border-slate-200">
                    Viewing Full Month Schedule
                </div>
            )}

         </div>
      </div>

      {/* 2.5 Filter Ribbon (New) */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[
              { id: 'all', label: 'All Tasks', count: currentStats.total, color: 'bg-slate-800 text-white' },
              { id: 'pending', label: 'Pending', count: currentStats.active, color: 'bg-slate-200 text-slate-600' },
              { id: 'ongoing', label: 'Ongoing', count: currentStats.ongoing, color: 'bg-amber-100 text-amber-700' },
              { id: 'overdue', label: 'Missed', count: currentStats.missed, color: 'bg-rose-100 text-rose-700' },
              { id: 'completed', label: 'Completed', count: currentStats.completed, color: 'bg-emerald-100 text-emerald-700' },
          ].map(filter => (
              <button
                 key={filter.id}
                 onClick={() => setStatusFilter(filter.id as any)}
                 className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all shrink-0
                    ${statusFilter === filter.id 
                        ? 'border-indigo-600 ring-2 ring-indigo-100 scale-105 shadow-md ' + filter.color.replace('bg-slate-200', 'bg-slate-800 text-white')
                        : 'border-transparent hover:border-slate-200 bg-white shadow-sm text-slate-500'
                    }
                 `}
              >
                  <span className="text-[10px] font-black uppercase tracking-wider">{filter.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusFilter === filter.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {filter.count}
                  </span>
              </button>
          ))}
      </div>

      {/* 3. Task List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                <ListFilter size={18} className="text-indigo-600" />
                {viewMode === 'day' ? `Schedule for ${new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : viewMode === 'week' ? `Schedule for Week ${selectedWeek}` : `Schedule for ${MONTHS[selectedMonth]} ${selectedYear}`}
            </h3>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200">
                {filteredTasks.length} Visible
            </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {filteredTasks.length > 0 ? filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onAttend={() => handleOpenAttendModal(task)}
                  onVerify={() => handleOpenVerifyModal(task)}
                  onHistory={() => handleOpenHistory(task)}
                  onReschedule={() => handleOpenReschedule(task)}
                  viewDate={selectedDay}
                />
            )) : (
                <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <CalendarDays size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No Tasks Found</h3>
                    <p className="text-slate-400 text-xs mt-3 font-medium uppercase tracking-widest max-w-xs">
                        There are no cleaning assignments matching your filter for this period.
                    </p>
                </div>
            )}
        </div>
      </div>

      {/* --- Modals (Keep existing functionality) --- */}
      
      {isAttendModalOpen && activeTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 bg-[#0f172a] text-white flex justify-between items-center shrink-0 shadow-lg">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20"><PenTool size={24}/></div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Attend Task Terminal</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic flex items-center gap-2">
                         Digital Checklist Completion Registry
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsAttendModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={28} strokeWidth={3} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
                  <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center"><Layout size={32}/></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Asset</p>
                           <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{activeTask.equipmentName}</h4>
                           <p className="text-xs font-bold text-indigo-600 mt-1 uppercase">{activeTask.unitName} • {activeTask.location}</p>
                        </div>
                     </div>
                     <div className="h-16 w-px bg-slate-100 mx-8 hidden md:block" />
                     <div className="hidden md:flex flex-col items-end">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled Date</p>
                        <p className="text-xl font-black text-slate-900">{activeTask.scheduledDate}</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
                        <ListCheck size={16} className="text-indigo-500"/> Hygiene Checklist Points
                     </h4>
                     <div className="space-y-3">
                        {[
                          "Exterior surface free of dust and contaminants",
                          "Internal chambers sanitized with approved agents",
                          "Seal integrity checked and found optimal",
                          "Sensors cleared of any obstruction"
                        ].map((q, i) => (
                           <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-200 transition-all shadow-sm">
                              <span className="text-sm font-bold text-slate-700 leading-relaxed">{i+1}. {q}</span>
                              <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner w-fit">
                                  <button className="px-6 py-2 rounded-lg text-[10px] font-black uppercase bg-emerald-600 text-white shadow-lg"><Check size={14} strokeWidth={4}/> Yes</button>
                                  <button className="px-6 py-2 rounded-lg text-[10px] font-black uppercase text-slate-400">No</button>
                                  <button className="px-6 py-2 rounded-lg text-[10px] font-black uppercase text-slate-400">N/A</button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Evidence & Context</h4>
                        
                        {/* Multiple Image Uploader */}
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
                            <div className="flex flex-wrap gap-4">
                                {evidencePhotos.map((photo, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 group">
                                        <img src={photo} alt={`evidence-${index}`} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => handleRemovePhoto(index)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                        >
                                            <X size={10} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                                <div 
                                    className="w-20 h-20 rounded-xl border-2 border-slate-100 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 hover:text-indigo-500 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera size={20} className="mb-1" />
                                    <span className="text-[8px] font-black uppercase">Add Photo</span>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    multiple 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handlePhotoUpload} 
                                />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-center mt-4 text-slate-300">
                                {evidencePhotos.length > 0 ? `${evidencePhotos.length} Images Attached` : "Upload cleaning proof"}
                            </p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Signature Auth</h4>
                        {/* Interactive Signature Pad */}
                        <SignaturePad 
                            onSave={setSignature} 
                            onClear={() => setSignature("")} 
                            initialData={signature} 
                        />
                     </div>
                  </div>
              </div>

              <div className="px-10 py-8 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
                  <button onClick={() => setIsAttendModalOpen(false)} className="px-10 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest">Discard</button>
                  <button 
                    disabled={!signature}
                    onClick={handleCompleteTask}
                    className={`px-16 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 ${signature ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    <CheckCircle2 size={22} strokeWidth={3} /> Finalize Session
                  </button>
              </div>
           </div>
        </div>
      )}

      {isVerifyModalOpen && activeTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
              <div className="px-10 py-8 bg-amber-500 text-white flex justify-between items-center shrink-0 shadow-lg">
                  <div className="flex items-center gap-4">
                    <UserCheck size={28} strokeWidth={3} />
                    <h3 className="text-xl font-black uppercase tracking-tight">Authorization Hub</h3>
                  </div>
                  <button onClick={() => setIsVerifyModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24} /></button>
              </div>
              <div className="p-10 space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifying Node</p>
                     <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{activeTask.equipmentName}</p>
                     <p className="text-xs font-bold text-slate-500 uppercase">{activeTask.unitName}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Verification Remarks</label>
                    <textarea 
                        className="w-full h-32 p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-medium outline-none focus:border-amber-400 shadow-inner resize-none transition-all" 
                        placeholder="Enter findings or feedback..." 
                        value={verifyComments}
                        onChange={(e) => setVerifyComments(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    {/* Reused Signature Pad for Verification */}
                    <SignaturePad 
                        onSave={setVerifySignature} 
                        onClear={() => setVerifySignature("")} 
                        initialData={verifySignature}
                        label="Authority Signature" 
                    />
                  </div>
              </div>
              <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                  <button onClick={() => setIsVerifyModalOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest">Cancel</button>
                  <button 
                    disabled={!verifySignature}
                    onClick={handleVerifySubmit} 
                    className={`px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${verifySignature ? 'bg-amber-500 text-white shadow-amber-100 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    Verify & Sync
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && activeTask && (
        <HistoryModal task={activeTask} onClose={() => setIsHistoryModalOpen(false)} />
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && activeTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
                <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <CalendarClock size={24} />
                        <h3 className="text-lg font-black uppercase tracking-tight">Reschedule Task</h3>
                    </div>
                    <button onClick={() => setIsRescheduleModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Date</p>
                        <p className="text-sm font-black text-slate-800">{activeTask.scheduledDate}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Frequency: <span className="text-indigo-600">{activeTask.frequency}</span></p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Original: <span className="text-slate-600">{activeTask.originalDate || activeTask.scheduledDate}</span></p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Date</label>
                        <input 
                            type="date" 
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 shadow-inner"
                            value={newScheduleDate}
                            min={activeTask.scheduledDate}
                            max={maxRescheduleDate}
                            onChange={(e) => setNewScheduleDate(e.target.value)}
                        />
                        <p className="text-[9px] text-slate-400 italic px-1">
                            Must be within {FREQUENCY_DAYS[activeTask.frequency] || 7} days of original schedule ({maxRescheduleDate}).
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reschedule Reason</label>
                        <textarea 
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 shadow-inner resize-none h-20"
                            placeholder="Reason for changing date..."
                            value={rescheduleReason}
                            onChange={(e) => setRescheduleReason(e.target.value)}
                        />
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold leading-relaxed">Rescheduling will reset the task status to pending. This action is logged.</p>
                    </div>
                </div>
                <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button onClick={() => setIsRescheduleModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                    <button 
                        disabled={!newScheduleDate || !rescheduleReason}
                        onClick={confirmReschedule} 
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${!newScheduleDate || !rescheduleReason ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        Confirm Change
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default CleaningChecklistModule;
