"use client";

import React, { useMemo, useState } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer, 
    ComposedChart,
    Line,
    Cell,
    PieChart, 
    Pie,
    Radar, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis, 
    LabelList
} from 'recharts';
import { 
    TrendingUp, 
    AlertTriangle, 
    Clock, 
    ShieldCheck, 
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    MapPin,
    Layers,
    Activity,
    BookOpen,
    ArrowRight,
    Briefcase,
    Zap,
    Hash,
    CheckCircle2,
    CircleDashed,
    AlertCircle,
    Search,
    Filter,
    Shield,
    Flame,
    ZapOff,
    CheckCheck,
    History,
    User,
    List,
    // Added missing imports
    LayoutDashboard,
    Globe,
    Building,
    Building2,
    Eye,
    EyeOff,
    // Fix: Added missing RefreshCw import
    RefreshCw
} from 'lucide-react';
import { HierarchyScope } from '../types';

interface AnalyticsProps {
    data: any[];
    currentScope: HierarchyScope;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#64748b', '#06b6d4'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// --- Custom Components ---

const CustomAgeingTick = (props: any) => {
    const { x, y, payload } = props;
    const item = props.fullData?.[payload.index];
    if (!item) return <text x={x} y={y} fill="#64748b">{payload.value}</text>;

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={-10} y={-10} textAnchor="end" fill="#1e293b" fontSize={11} fontWeight={900} className="uppercase tracking-tighter">
                {payload.value}
            </text>
            <text x={-10} y={4} textAnchor="end" fill="#f43f5e" fontSize={9} fontWeight={800} className="uppercase">
                Open: {item.totalOpen}
            </text>
            <text x={-10} y={16} textAnchor="end" fill="#94a3b8" fontSize={8} fontWeight={700} className="uppercase">
                Avg(C): {item.avgLapseClosed}h | Avg(P): {item.avgLapsePending}d
            </text>
        </g>
    );
};

const MatrixDataCard = ({ stats }: { stats: { open: number, closed: number, inflow: number, lapse: string } }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full min-h-[110px] min-w-[120px]">
        <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Open</span>
                <span className="text-sm font-black text-slate-900 leading-none">{stats.open}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Closed</span>
                <span className="text-sm font-black text-emerald-500 leading-none">{stats.closed}</span>
            </div>
        </div>
        <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-50">
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inflow</span>
                <span className="text-xs font-black text-orange-500 leading-none">{stats.inflow}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-lg shadow-sm">
                <span className="text-[8px] font-black text-indigo-400 uppercase leading-none">Lapse</span>
                <span className="text-[10px] font-black text-white leading-none font-mono">{stats.lapse}</span>
            </div>
        </div>
    </div>
);

const GranularAuditCard: React.FC<{ areaData: any }> = ({ areaData }) => {
    const { name, subTitle, status, score, time, closed, wip, open, radarData, maxVal } = areaData;
    const isCompliant = status === 'COMPLIANT';
    const total = closed + wip + open;

    const progressWidths = {
        closed: total > 0 ? (closed / total) * 100 : 0,
        wip: total > 0 ? (wip / total) * 100 : 0,
        open: total > 0 ? (open / total) * 100 : 0,
    };

    const radarColor = isCompliant ? "#10b981" : "#ef4444";

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 flex flex-col min-h-[520px] group transition-all hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center shadow-lg">
                        <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate max-w-[180px]">{name}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 truncate">{subTitle}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${isCompliant ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {status}
                </span>
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={14} />
                    <span className="text-column-gap font-black uppercase">{time}</span>
                </div>
            </div>

            <div className="flex-1 h-[260px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b', textTransform: 'uppercase' }} 
                        />
                        <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, (maxVal || 10) * 1.1]} 
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            name={name}
                            dataKey="count"
                            stroke={radarColor}
                            fill={radarColor}
                            fillOpacity={0.15}
                            strokeWidth={3}
                            animationDuration={1500}
                            border={{
                                r: 4,
                                fill: '#fff',
                                stroke: radarColor,
                                strokeWidth: 2
                            }}
                        >
                            <LabelList 
                                dataKey="count" 
                                position="top" 
                                offset={10}
                                style={{ 
                                    fontSize: '11px', 
                                    fontWeight: '900', 
                                    fill: '#1e293b',
                                    textAnchor: 'middle'
                                }} 
                            />
                        </Radar>
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-4">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">{score}% SCORE</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{total} Total OBS</span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div style={{ width: `${progressWidths.closed}%` }} className="h-full bg-emerald-500 transition-all duration-1000" />
                    <div style={{ width: `${progressWidths.wip}%` }} className="h-full bg-amber-400 transition-all duration-1000" />
                    <div style={{ width: `${progressWidths.open}%` }} className="h-full bg-rose-500 transition-all duration-1000" />
                </div>

                <div className="flex justify-between pt-2">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Closed</span>
                        <span className="text-xl font-black text-emerald-500 tracking-tighter">{closed}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Wip</span>
                        <span className="text-xl font-black text-amber-400 tracking-tighter">{wip}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Open</span>
                        <span className="text-xl font-black text-rose-500 tracking-tighter">{open}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ObservationAnalytics: React.FC<AnalyticsProps> = ({ data, currentScope }) => {
    const [ageingSlice, setAgeingSlice] = useState<'DEPARTMENT' | 'LOCATION' | 'RESPONSIBILITY'>('DEPARTMENT');
    const [isDeptMatrixExpanded, setIsDeptMatrixExpanded] = useState(false);
    const [isLocMatrixExpanded, setIsLocMatrixExpanded] = useState(false);
    const [isRespMatrixExpanded, setIsRespMatrixExpanded] = useState(false);
    const [isUnitMatrixExpanded, setIsUnitMatrixExpanded] = useState(true);
    const [isRegionalMatrixExpanded, setIsRegionalMatrixExpanded] = useState(true);

    const [activeRegionTab, setActiveRegionTab] = useState<'consolidated' | string>('consolidated');

    // --- Data Extraction Helpers ---

    const uniqueRegionNames = useMemo((): string[] => {
        return Array.from(new Set<string>(data.map((r: any) => r.regionalName))).filter(Boolean).sort();
    }, [data]);

    const activeData = useMemo(() => {
        if (activeRegionTab === 'consolidated') return data;
        return data.filter((r: any) => r.regionalName === activeRegionTab);
    }, [data, activeRegionTab]);

    const stats = useMemo(() => {
        const total = activeData.length;
        const open = activeData.filter((r: any) => r.status === 'OPEN').length;
        const closed = activeData.filter((r: any) => r.status === 'RESOLVED').length;
        const inProgress = activeData.filter((r: any) => ['PENDING', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes(r.status)).length;
        const complianceRate = total > 0 ? Math.round((closed / total) * 100) : 0;
        return { total, open, closed, inProgress, complianceRate };
    }, [activeData]);

    const trendData = useMemo(() => {
        const months = new Array(6).fill(0).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return { month: d.getMonth(), year: d.getFullYear(), name: MONTH_NAMES[d.getMonth()] };
        });

        return months.map(m => {
            const monthData = activeData.filter((r: any) => {
                const rDate = new Date(r.createdDate);
                return rDate.getMonth() === m.month && rDate.getFullYear() === m.year;
            });
            const total = monthData.length;
            const closed = monthData.filter((r: any) => r.status === 'RESOLVED').length;
            return {
                name: m.name,
                total,
                closure: total > 0 ? Math.round((closed / total) * 100) : 0
            };
        });
    }, [activeData]);

    const ageingCategories = useMemo((): string[] => {
        const mapped = activeData.map((r: any) => 
            ageingSlice === 'DEPARTMENT' ? (r.departmentName || r.mainKitchen) : 
            ageingSlice === 'LOCATION' ? r.area : 
            r.reportedBy
        ).filter(Boolean) as string[];
        return Array.from(new Set<string>(mapped)).sort();
    }, [activeData, ageingSlice]);

    const transformedAgeingData = useMemo(() => {
        const buckets = [
            { label: '0-24h', min: 0, max: 24, unit: 'hours' },
            { label: '1-7d', min: 1, max: 7, unit: 'days' },
            { label: '7-30d', min: 7, max: 30, unit: 'days' },
            { label: '>30d', min: 30, max: Infinity, unit: 'days' },
        ];

        return buckets.map(bucket => {
            const bucketData: any = { ageing: bucket.label };
            let totalOpen = 0;
            let totalLapseClosed = 0;
            let countClosed = 0;
            let totalLapsePending = 0;
            let countPending = 0;

            ageingCategories.forEach(cat => {
                const catItems = activeData.filter((r: any) => {
                    const rCat = ageingSlice === 'DEPARTMENT' ? (r.departmentName || r.mainKitchen) : 
                                 ageingSlice === 'LOCATION' ? r.area : 
                                 r.reportedBy;
                    if (rCat !== cat) return false;

                    const rDate = new Date(r.createdDate);
                    const now = new Date();
                    const diffHours = (now.getTime() - rDate.getTime()) / 3600000;
                    const diffDays = diffHours / 24;

                    if (bucket.unit === 'hours') {
                        return diffHours >= bucket.min && diffHours < bucket.max;
                    } else {
                        return diffDays >= bucket.min && diffDays < bucket.max;
                    }
                });

                bucketData[cat] = catItems.length;

                catItems.forEach((r: any) => {
                    if (r.status === 'RESOLVED') {
                        if (r.closureDate) {
                            const lapse = (new Date(r.closureDate).getTime() - new Date(r.createdDate).getTime()) / 3600000;
                            totalLapseClosed += lapse;
                            countClosed++;
                        }
                    } else {
                        totalOpen++;
                        const lapse = (new Date().getTime() - new Date(r.createdDate).getTime()) / 86400000;
                        totalLapsePending += lapse;
                        countPending++;
                    }
                });
            });

            bucketData.totalOpen = totalOpen;
            bucketData.avgLapseClosed = countClosed > 0 ? Math.round(totalLapseClosed / countClosed) : 0;
            bucketData.avgLapsePending = countPending > 0 ? Math.round(totalLapsePending / countPending) : 0;

            return bucketData;
        });
    }, [activeData, ageingSlice, ageingCategories]);

    const semanticData = useMemo(() => {
        const sopCounts: Record<string, number> = {};
        activeData.forEach((r: any) => {
            if (r.sop) {
                sopCounts[r.sop] = (sopCounts[r.sop] || 0) + 1;
            }
        });
        return Object.entries(sopCounts)
            .map(([name, val]) => ({ name, val, trend: val > 5 ? 'up' : 'stable' }))
            .sort((a, b) => b.val - a.val);
    }, [activeData]);

    const topSops = useMemo(() => semanticData.map(s => s.name), [semanticData]);

    // --- Dynamic Column Discovery ---
    const activeDepartments = useMemo(() => Array.from(new Set<string>(activeData.map((r: any) => r.departmentName || r.mainKitchen).filter(Boolean) as string[])).sort(), [activeData]);
    const activeResponsibilities = useMemo(() => Array.from(new Set<string>(activeData.map((r: any) => r.mainKitchen || r.responsibility).filter(Boolean) as string[])).sort(), [activeData]);
    const activeLocations = useMemo(() => Array.from(new Set<string>(activeData.map((r: any) => r.area).filter(Boolean) as string[])).sort(), [activeData]);
    const activeUnits = useMemo(() => Array.from(new Set<string>(activeData.map((r: any) => r.unitName).filter(Boolean) as string[])).sort(), [activeData]);

    // --- Common Stat Calculator for Matrix Headers ---
    const getAttributeHeaderStats = (name: string, key: 'departmentName' | 'mainKitchen' | 'area' | 'regionalName' | 'unitName') => {
        const items = activeData.filter((r: any) => r[key] === name || (key === 'departmentName' && r.mainKitchen === name));
        return {
            total: items.length,
            open: items.filter((r: any) => r.status === 'OPEN').length,
            closed: items.filter((r: any) => r.status === 'RESOLVED').length,
            work: items.filter((r: any) => ['PENDING', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes(r.status)).length
        };
    };

    const departmentPolicyMatrix = useMemo(() => {
        return topSops.map(sopName => {
            const deptMetrics = activeDepartments.map(dept => {
                const cellItems = activeData.filter((r: any) => (r.departmentName === dept || r.mainKitchen === dept) && r.sop === sopName);
                const open = cellItems.filter((r: any) => r.status !== 'RESOLVED').length;
                const closed = cellItems.filter((r: any) => r.status === 'RESOLVED').length;
                let totalLapse = 0;
                let resolvedCount = 0;
                cellItems.forEach((r: any) => {
                    if (r.createdDate && r.closureDate) {
                        totalLapse += (new Date(r.closureDate).getTime() - new Date(r.createdDate).getTime()) / 3600000;
                        resolvedCount++;
                    }
                });
                const avgLapse = resolvedCount > 0 ? (totalLapse / resolvedCount).toFixed(1) : '0.0';
                return { open, closed, inflow: 0, lapse: `${avgLapse}h` };
            });
            return { sop: sopName, metrics: deptMetrics };
        });
    }, [activeData, topSops, activeDepartments]);

    const responsibilityPolicyMatrix = useMemo(() => {
        return topSops.map(sopName => {
            const metrics = activeResponsibilities.map(resp => {
                const cellItems = activeData.filter((r: any) => (r.mainKitchen === resp || r.responsibility === resp) && r.sop === sopName);
                const open = cellItems.filter((r: any) => r.status !== 'RESOLVED').length;
                const closed = cellItems.filter((r: any) => r.status === 'RESOLVED').length;
                let totalLapse = 0;
                let resolvedCount = 0;
                cellItems.forEach((r: any) => {
                    if (r.createdDate && r.closureDate) {
                        totalLapse += (new Date(r.closureDate).getTime() - new Date(r.createdDate).getTime()) / 3600000;
                        resolvedCount++;
                    }
                });
                const avgLapse = resolvedCount > 0 ? (totalLapse / resolvedCount).toFixed(1) : '0.0';
                return { open, closed, inflow: 0, lapse: `${avgLapse}h` };
            });
            return { sop: sopName, metrics };
        });
    }, [activeData, topSops, activeResponsibilities]);

    const locationPolicyMatrix = useMemo(() => {
        return topSops.map(sopName => {
            const locMetrics = activeLocations.map(loc => {
                const cellItems = activeData.filter((r: any) => r.area === loc && r.sop === sopName);
                const open = cellItems.filter((r: any) => r.status !== 'RESOLVED').length;
                const closed = cellItems.filter((r: any) => r.status === 'RESOLVED').length;
                let totalLapse = 0;
                let resolvedCount = 0;
                cellItems.forEach((r: any) => {
                    if (r.createdDate && r.closureDate) {
                        totalLapse += (new Date(r.closureDate).getTime() - new Date(r.createdDate).getTime()) / 3600000;
                        resolvedCount++;
                    }
                });
                const avgLapse = resolvedCount > 0 ? (totalLapse / resolvedCount).toFixed(1) : '0.0';
                return { open, closed, inflow: 0, lapse: `${avgLapse}h` };
            });
            return { sop: sopName, metrics: locMetrics };
        });
    }, [activeData, topSops, activeLocations]);

    const regionalPolicyMatrix = useMemo(() => {
        if (activeRegionTab !== 'consolidated') return [];
        return topSops.map(sopName => {
            const metrics = uniqueRegionNames.map(reg => {
                const cellItems = data.filter((r: any) => r.regionalName === reg && r.sop === sopName);
                const open = cellItems.filter((r: any) => r.status !== 'RESOLVED').length;
                const closed = cellItems.filter((r: any) => r.status === 'RESOLVED').length;
                let totalLapse = 0;
                let resolvedCount = 0;
                cellItems.forEach((r: any) => {
                    if (r.createdDate && r.closureDate) {
                        totalLapse += (new Date(r.closureDate).getTime() - new Date(r.createdDate).getTime()) / 3600000;
                        resolvedCount++;
                    }
                });
                const avgLapse = resolvedCount > 0 ? (totalLapse / resolvedCount).toFixed(1) : '0.0';
                return { open, closed, inflow: 0, lapse: `${avgLapse}h` };
            });
            return { sop: sopName, metrics };
        });
    }, [data, topSops, uniqueRegionNames, activeRegionTab]);

    const unitPolicyMatrix = useMemo(() => {
        if (activeRegionTab === 'consolidated') return [];
        return topSops.map(sopName => {
            const metrics = activeUnits.map(unit => {
                const cellItems = activeData.filter((r: any) => r.unitName === unit && r.sop === sopName);
                const open = cellItems.filter((r: any) => r.status !== 'RESOLVED').length;
                const closed = cellItems.filter((r: any) => r.status === 'RESOLVED').length;
                let totalLapse = 0;
                let resolvedCount = 0;
                cellItems.forEach((r: any) => {
                    if (r.createdDate && r.closureDate) {
                        totalLapse += (new Date(r.closureDate).getTime() - new Date(r.createdDate).getTime()) / 3600000;
                        resolvedCount++;
                    }
                });
                const avgLapse = resolvedCount > 0 ? (totalLapse / resolvedCount).toFixed(1) : '0.0';
                return { open, closed, inflow: 0, lapse: `${avgLapse}h` };
            });
            return { sop: sopName, metrics };
        });
    }, [activeData, topSops, activeRegionTab, activeUnits]);

    const granularAuditData = useMemo(() => {
        const respCounts: Record<string, number> = {};
        activeData.forEach((r: any) => {
            const resp = r.mainKitchen || r.departmentName || r.responsibility;
            if (resp) respCounts[resp] = (respCounts[resp] || 0) + 1;
        });

        const topResponsibilities = Object.entries(respCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name]) => name);

        return topResponsibilities.map(respName => {
            const respItems = activeData.filter((r: any) => (r.mainKitchen === respName || r.departmentName === respName || r.responsibility === respName));
            const closed = respItems.filter((r: any) => r.status === 'RESOLVED').length;
            const wip = respItems.filter((r: any) => ['PENDING', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes(r.status)).length;
            const open = respItems.filter((r: any) => r.status === 'OPEN').length;
            const totalCount = respItems.length;
            const score = totalCount > 0 ? Math.round((closed / totalCount) * 100) : 0;

            const sopFreqForResp: Record<string, number> = {};
            respItems.forEach((r: any) => {
                const s = r.sop || "General Compliance";
                sopFreqForResp[s] = (sopFreqForResp[s] || 0) + 1;
            });

            const topPoliciesForResp = Object.entries(sopFreqForResp)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 7);

            const radarData = topPoliciesForResp.map(([sopName, count]) => ({
                subject: `${sopName} (${count})`,
                count: count
            }));

            const maxVal = topPoliciesForResp.length > 0 ? Math.max(...topPoliciesForResp.map(p => p[1])) : 10;

            return {
                name: respName,
                subTitle: "RESPONSIBILITY NODE",
                status: score > 75 ? 'COMPLIANT' : 'URGENT',
                score,
                time: "REAL-TIME",
                closed,
                wip,
                open,
                radarData,
                maxVal
            };
        });
    }, [activeData]);

    const deptShare = useMemo(() => {
        const counts: Record<string, number> = {};
        activeData.forEach((r: any) => {
            const dept = r.departmentName || r.mainKitchen || 'General';
            counts[dept] = (counts[dept] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], i) => ({
            name,
            value,
            color: COLORS[i % COLORS.length]
        })).sort((a,b) => b.value - a.value);
    }, [activeData]);

    // UI Helpers
    const getUnitHeaderStats = (name: string) => {
        const unitItems = activeData.filter((r: any) => r.unitName === name || r.regionalName === name);
        return {
            total: unitItems.length,
            open: unitItems.filter((r: any) => r.status === 'OPEN').length,
            closed: unitItems.filter((r: any) => r.status === 'RESOLVED').length,
            work: unitItems.filter((r: any) => ['PENDING', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes(r.status)).length
        };
    };

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-700 text-left px-4 md:px-0">
            
            {/* 1. Global Navigation Tabs */}
            {(currentScope === 'corporate' || currentScope === 'super-admin') && (
                <div className="flex justify-center mb-8">
                    <div className="flex bg-white p-1.5 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-x-auto hide-scrollbar max-w-full">
                        <button 
                            onClick={() => setActiveRegionTab('consolidated')}
                            className={`px-8 py-3.5 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeRegionTab === 'consolidated' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutDashboard size={16}/> Consolidated View
                        </button>
                        {uniqueRegionNames.map(reg => (
                            <button 
                                key={reg}
                                onClick={() => setActiveRegionTab(reg)}
                                className={`px-8 py-3.5 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeRegionTab === reg ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Globe size={16}/> {reg}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Executive KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Observations', value: stats.total, icon: Layers, color: 'bg-slate-900' },
                    { label: 'Open Issues', value: stats.open, icon: AlertCircle, color: 'bg-rose-500' },
                    { label: 'Closed Records', value: stats.closed, icon: CheckCircle2, color: 'bg-emerald-500' },
                    { label: 'In-Progress Flow', value: stats.inProgress, icon: RefreshCw, color: 'bg-blue-500' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${kpi.color} text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                                <kpi.icon size={24} />
                            </div>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</h4>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* 3. Specialized Matrix View */}
            {activeRegionTab === 'consolidated' ? (
                /* SOPs vs Regional Matrix for Consolidated Tab */
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner"><Globe size={20}/></div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">SOPs Vs Regional Matrix</h3>
                        </div>
                        <button 
                            onClick={() => setIsRegionalMatrixExpanded(!isRegionalMatrixExpanded)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRegionalMatrixExpanded ? 'bg-rose-50 text-rose-600 shadow-md border border-rose-100' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'}`}
                        >
                            {isRegionalMatrixExpanded ? <><EyeOff size={14} /> Hide Overview</> : <><Eye size={14} /> Show Overview</>}
                        </button>
                    </div>

                    <div className="bg-[#0f172a] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 transition-all duration-500">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50">
                                        <th className="p-8 w-[240px] border-b border-white/5 sticky left-0 bg-[#0f172a] z-20">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Standard SOP</span>
                                        </th>
                                        {uniqueRegionNames.map((reg: string) => {
                                            const hStats = getUnitHeaderStats(reg);
                                            return (
                                                <th key={reg} className="p-8 border-b border-white/5 text-center min-w-[200px]">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl"><Globe size={20} /></div>
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.1em] block mb-2 px-2">{reg}</span>
                                                            <div className="grid grid-cols-2 gap-1 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Total</span><span className="text-[10px] font-black text-white">{hStats.total}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Open</span><span className="text-[10px] font-black text-rose-500">{hStats.open}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Closed</span><span className="text-[10px] font-black text-emerald-500">{hStats.closed}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Work</span><span className="text-[10px] font-black text-blue-400">{hStats.work}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                {isRegionalMatrixExpanded && (
                                    <tbody className="divide-y divide-white/5 animate-in slide-in-from-top-2 duration-500">
                                        {regionalPolicyMatrix.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-8 sticky left-0 bg-[#0f172a] z-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><BookOpen size={24} /></div>
                                                        <span className="text-sm font-black text-white uppercase tracking-tight truncate leading-none">{row.sop}</span>
                                                    </div>
                                                </td>
                                                {row.metrics.map((metric: any, midx: number) => (
                                                    <td key={midx} className="p-4 border-l border-white/5">
                                                        <MatrixDataCard stats={metric} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* SOPs vs Unit Matrix for Region-Specific Tab */
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner"><Building size={20}/></div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">SOPs Vs Operational Unit Matrix</h3>
                        </div>
                        <button 
                            onClick={() => setIsUnitMatrixExpanded(!isUnitMatrixExpanded)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isUnitMatrixExpanded ? 'bg-rose-50 text-rose-600 shadow-md border border-rose-100' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'}`}
                        >
                            {isUnitMatrixExpanded ? <><EyeOff size={14} /> Hide Units</> : <><Eye size={14} /> Show Units</>}
                        </button>
                    </div>

                    <div className="bg-[#0f172a] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 transition-all duration-500">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50">
                                        <th className="p-8 w-[240px] border-b border-white/5 sticky left-0 bg-[#0f172a] z-20">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Standard SOP</span>
                                        </th>
                                        {activeUnits.map((unit: string) => {
                                            const hStats = getUnitHeaderStats(unit);
                                            return (
                                                <th key={unit} className="p-8 border-b border-white/5 text-center min-w-[200px]">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl"><Building size={20} /></div>
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.1em] block mb-2 px-2">{unit}</span>
                                                            <div className="grid grid-cols-2 gap-1 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Total</span><span className="text-[10px] font-black text-white">{hStats.total}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Open</span><span className="text-[10px] font-black text-rose-500">{hStats.open}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Closed</span><span className="text-[10px] font-black text-emerald-500">{hStats.closed}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Work</span><span className="text-[10px] font-black text-blue-400">{hStats.work}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                {isUnitMatrixExpanded && (
                                    <tbody className="divide-y divide-white/5 animate-in slide-in-from-top-2 duration-500">
                                        {unitPolicyMatrix.map((row: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-8 sticky left-0 bg-[#0f172a] z-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><BookOpen size={24} /></div>
                                                        <span className="text-sm font-black text-white uppercase tracking-tight truncate leading-none">{row.sop}</span>
                                                    </div>
                                                </td>
                                                {row.metrics.map((metric: any, midx: number) => (
                                                    <td key={midx} className="p-4 border-l border-white/5">
                                                        <MatrixDataCard stats={metric} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Hierarchical Attribute Matrices */}
            <div className="grid grid-cols-1 gap-12">
                
                {/* SOPs vs Department Matrix */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner"><Building2 size={20}/></div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">SOPs Vs Department Matrix</h3>
                        </div>
                        <button 
                            onClick={() => setIsDeptMatrixExpanded(!isDeptMatrixExpanded)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDeptMatrixExpanded ? 'bg-rose-50 text-rose-600 shadow-md border border-rose-100' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'}`}
                        >
                            {isDeptMatrixExpanded ? <><EyeOff size={14} /> Hide Overview</> : <><Eye size={14} /> Show Overview</>}
                        </button>
                    </div>
                    <div className="bg-[#0f172a] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 transition-all duration-500">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50">
                                        <th className="p-8 w-[240px] border-b border-white/5 sticky left-0 bg-[#0f172a] z-20">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Standard SOP</span>
                                        </th>
                                        {activeDepartments.map((dept: string) => {
                                            const hStats = getAttributeHeaderStats(dept, 'departmentName');
                                            return (
                                                <th key={dept} className="p-8 border-b border-white/5 text-center min-w-[200px]">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl"><Building2 size={20} /></div>
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.1em] block mb-2 px-2">{dept}</span>
                                                            <div className="grid grid-cols-2 gap-1 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Total</span><span className="text-[10px] font-black text-white">{hStats.total}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Open</span><span className="text-[10px] font-black text-rose-500">{hStats.open}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Closed</span><span className="text-[10px] font-black text-emerald-500">{hStats.closed}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Work</span><span className="text-[10px] font-black text-blue-400">{hStats.work}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                {isDeptMatrixExpanded && (
                                    <tbody className="divide-y divide-white/5 animate-in slide-in-from-top-2 duration-500">
                                        {departmentPolicyMatrix.map((row: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-8 sticky left-0 bg-[#0f172a] z-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><BookOpen size={24} /></div>
                                                        <span className="text-sm font-black text-white uppercase tracking-tight truncate leading-none">{row.sop}</span>
                                                    </div>
                                                </td>
                                                {row.metrics.map((metric: any, midx: number) => (
                                                    <td key={midx} className="p-4 border-l border-white/5">
                                                        <MatrixDataCard stats={metric} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                </div>

                {/* SOPs vs Responsibility Matrix */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner"><ShieldCheck size={20}/></div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">SOPs Vs Responsibility Matrix</h3>
                        </div>
                        <button 
                            onClick={() => setIsRespMatrixExpanded(!isRespMatrixExpanded)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRespMatrixExpanded ? 'bg-rose-50 text-rose-600 shadow-md border border-rose-100' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'}`}
                        >
                            {isRespMatrixExpanded ? <><EyeOff size={14} /> Hide Overview</> : <><Eye size={14} /> Show Overview</>}
                        </button>
                    </div>
                    <div className="bg-[#0f172a] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 transition-all duration-500">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50">
                                        <th className="p-8 w-[240px] border-b border-white/5 sticky left-0 bg-[#0f172a] z-20">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Standard SOP</span>
                                        </th>
                                        {activeResponsibilities.map((resp: string) => {
                                            const hStats = getAttributeHeaderStats(resp, 'mainKitchen');
                                            return (
                                                <th key={resp} className="p-8 border-b border-white/5 text-center min-w-[200px]">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl"><ShieldCheck size={20} /></div>
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.1em] block mb-2 px-2">{resp}</span>
                                                            <div className="grid grid-cols-2 gap-1 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Total</span><span className="text-[10px] font-black text-white">{hStats.total}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Open</span><span className="text-[10px] font-black text-rose-500">{hStats.open}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Closed</span><span className="text-[10px] font-black text-emerald-500">{hStats.closed}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Work</span><span className="text-[10px] font-black text-blue-400">{hStats.work}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                {isRespMatrixExpanded && (
                                    <tbody className="divide-y divide-white/5 animate-in slide-in-from-top-2 duration-500">
                                        {responsibilityPolicyMatrix.map((row: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-8 sticky left-0 bg-[#0f172a] z-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><BookOpen size={24} /></div>
                                                        <span className="text-sm font-black text-white uppercase tracking-tight truncate leading-none">{row.sop}</span>
                                                    </div>
                                                </td>
                                                {row.metrics.map((metric: any, midx: number) => (
                                                    <td key={midx} className="p-4 border-l border-white/5">
                                                        <MatrixDataCard stats={metric} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                </div>

                {/* SOPs vs Physical Location Matrix */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner"><MapPin size={20}/></div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">SOPs Vs Physical Location Matrix</h3>
                        </div>
                        <button 
                            onClick={() => setIsLocMatrixExpanded(!isLocMatrixExpanded)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLocMatrixExpanded ? 'bg-rose-50 text-rose-600 shadow-md border border-rose-100' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'}`}
                        >
                            {isLocMatrixExpanded ? <><EyeOff size={14} /> Hide Overview</> : <><Eye size={14} /> Show Overview</>}
                        </button>
                    </div>
                    <div className="bg-[#0f172a] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 transition-all duration-500">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50">
                                        <th className="p-8 w-[240px] border-b border-white/5 sticky left-0 bg-[#0f172a] z-20">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Standard SOP</span>
                                        </th>
                                        {activeLocations.map((loc: string) => {
                                            const hStats = getAttributeHeaderStats(loc, 'area');
                                            return (
                                                <th key={loc} className="p-8 border-b border-white/5 text-center min-w-[200px]">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl"><MapPin size={20} /></div>
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.1em] block mb-2 px-2">{loc}</span>
                                                            <div className="grid grid-cols-2 gap-1 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Total</span><span className="text-[10px] font-black text-white">{hStats.total}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Open</span><span className="text-[10px] font-black text-rose-500">{hStats.open}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Closed</span><span className="text-[10px] font-black text-emerald-500">{hStats.closed}</span></div>
                                                                <div className="flex flex-col"><span className="text-[7px] text-slate-400 uppercase">Work</span><span className="text-[10px] font-black text-blue-400">{hStats.work}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                {isLocMatrixExpanded && (
                                    <tbody className="divide-y divide-white/5 animate-in slide-in-from-top-2 duration-500">
                                        {locationPolicyMatrix.map((row: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-8 sticky left-0 bg-[#0f172a] z-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><BookOpen size={24} /></div>
                                                        <span className="text-sm font-black text-white uppercase tracking-tight truncate leading-none">{row.sop}</span>
                                                    </div>
                                                </td>
                                                {row.metrics.map((metric: any, midx: number) => (
                                                    <td key={midx} className="p-4 border-l border-white/5">
                                                        <MatrixDataCard stats={metric} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Charts & Analytics Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Observation Trend */}
                <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-xl flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Observation Trend</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">Live</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                <Bar yAxisId="left" dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
                                <Line yAxisId="right" type="monotone" dataKey="closure" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#f59e0b', strokeWidth: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ageing Intelligence */}
                <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-xl flex flex-col relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Ageing Analytics Intelligence</h3>
                            <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">Advanced</span>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                            {(['DEPARTMENT', 'LOCATION', 'RESPONSIBILITY'] as const).map(slice => (
                                <button key={slice} onClick={() => setAgeingSlice(slice)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${ageingSlice === slice ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-400'}`}>{slice}</button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[350px] w-full mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={transformedAgeingData} layout="vertical" margin={{ left: 160 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="ageing" type="category" axisLine={false} tickLine={false} tick={<CustomAgeingTick fullData={transformedAgeingData} />} width={150} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                {ageingCategories.map((cat, idx) => <Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={COLORS[idx % COLORS.length]} barSize={40} />)}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Keyword Intelligence */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Keyword Semantic Intelligence</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Analysis of Observation Descriptions and Triggers</p>
                        </div>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-10">
                        <div className="flex-1 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={semanticData} layout="vertical" margin={{ left: 40 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontBold: true, fill: '#64748b' }} width={120} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px'}} />
                                    <Bar dataKey="val" radius={[0, 10, 10, 0]} barSize={24}>{semanticData.map((entry, index) => <Cell key={index} fill={entry.val > 10 ? '#ef4444' : '#6366f1'} />)}</Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Pie Reporting Share */}
                <div className="bg-[#0f172a] p-10 rounded-[3.5rem] shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="mb-10 relative z-10">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2">Departmental Reporting Share</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Volume Distribution by Organizational Vertical</p>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center gap-12 flex-1 relative z-10">
                        <div className="relative w-[280px] h-[280px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart><Pie data={deptShare} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">{deptShare.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie></PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-3xl font-black text-white leading-none">{activeData.length}</span><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Logs</span></div>
                        </div>
                        <div className="flex-1 space-y-6 w-full text-left max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {deptShare.map((dept, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="flex justify-between items-center mb-1.5"><div className="flex items-center gap-3 min-w-0"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dept.color }} /><span className="text-[11px] font-black text-slate-300 uppercase tracking-wide truncate">{dept.name}</span></div><span className="text-[11px] font-black text-slate-500 whitespace-nowrap">{dept.value} OBS</span></div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full transition-all duration-1000" style={{ backgroundColor: dept.color, width: `${(dept.value / activeData.length) * 100}%` }} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Granular Audit Records (Radar Cards) */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner"><List size={20}/></div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Responsibility Wise Dynamic Audit Records</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {granularAuditData.map((area, idx) => (
                        <GranularAuditCard key={idx} areaData={area} />
                    ))}
                </div>
            </div>

            {/* System Integrity Footer */}
            <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="flex items-center gap-8 relative z-10">
                    <div className="p-5 bg-white/5 rounded-[2.5rem] border border-slate-100 shadow-inner group cursor-pointer hover:bg-white/10 transition-all">
                        <ShieldCheck size={40} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="space-y-2 text-left">
                        <h5 className="text-xl font-black uppercase tracking-[0.4em] leading-none">Security Registry Protocol</h5>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest max-w-lg leading-relaxed">
                            Analytics generated from <span className="text-indigo-400">Digital Immutable Logs</span>. 
                            Data integrity verified via System Hash and ISO 22000 Authentication layer.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-14 py-5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-4">
                        Synchronize <RefreshCw size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ObservationAnalytics;