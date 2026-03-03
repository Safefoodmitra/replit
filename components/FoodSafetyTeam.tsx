"use client";

import React, { useState, useMemo, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  Trash2, 
  User, 
  X, 
  Star, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  AlertCircle, 
  Award, 
  Users, 
  Upload, 
  Check, 
  FileBadge, 
  Info, 
  Clock, 
  Save, 
  Edit3, 
  RefreshCw, 
  History, 
  Archive, 
  PenTool, 
  Download, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileDigit,
  Hash,
  Loader2
} from 'lucide-react';
import { Entity, HierarchyScope } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Logo from './Logo';
import { renderToString } from 'react-dom/server';

// --- ISO 22000 Definitions ---
const ISO_TOOLTIPS = {
    fsmsRole: "The specific authority and responsibility assigned within the Food Safety Management System (e.g., FSTL, Internal Auditor) as per ISO 22000 Clause 5.3.",
    domain: "The specific area of technical or scientific knowledge (e.g., Microbiology, Engineering) this member contributes to the HACCP study.",
    appointment: "Formal documented evidence (Clause 5.3.2) assigning the FSMS responsibilities and authority to this individual.",
    assessment: "Evidence of competence (Clause 7.2). The date the member's food safety skills and training were last evaluated.",
    meeting: "Evidence of internal communication (Clause 7.4). Date of the last Food Safety Team meeting attended to review the system.",
    deputy: "The designated substitute authorized to perform these duties during absence to ensure FSMS continuity.",
    docControl: "Mandatory Document Control information (Clause 7.5.3) to ensure the team list is current, authorized, and identifiable."
};

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group/tooltip relative inline-flex items-center ml-1.5 align-middle cursor-help z-10">
    <Info size={12} className="text-slate-400 hover:text-indigo-500 transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-[10px] font-medium rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] pointer-events-none shadow-xl text-center leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

interface Certificate {
    id: string;
    name: string;
    url: string;
    expiry?: string;
}

interface TeamMember {
  id: string;
  unitId: string;
  name: string;
  designation: string;
  fsmsRole: string;
  isFSTL: boolean;
  department: string;
  domain: string;
  employmentType: 'Internal' | 'External';
  email: string;
  mobile: string;
  totalExperience: number;
  employeeId?: string;
  qualification: string;
  appointmentLetterUrl?: string;
  certificates: Certificate[];
  trainings: string[];
  lastCompetencyAssessmentDate?: string;
  lastMeetingAttended?: string;
  deputyId?: string;
  deputyName?: string;
  lastUpdated?: string;
  status: 'Active' | 'Archived';
  exitDate?: string;
  replacedBy?: string;
}

interface DocControlInfo {
    docRef: string;
    version: string;
    effectiveDate: string;
    approvedBy: string;
}

interface FoodSafetyTeamProps {
  entities: Entity[];
  currentScope: HierarchyScope;
  userRootId?: string | null;
}

const DOMAINS = [
    "Quality Assurance & Microbiology",
    "Engineering & Utilities",
    "Production & Processing",
    "Supply Chain & Procurement",
    "Sanitation & Hygiene",
    "Regulatory Affairs"
];

const SKILL_MATRIX_COLS = ["HACCP L3", "Internal Audit", "VACCP/TACCP", "Allergen Mgmt", "Food Microbiology"];

const FoodSafetyTeam: React.FC<FoodSafetyTeamProps> = ({ entities, currentScope, userRootId }) => {
    const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set());
    const [showHistory, setShowHistory] = useState(false);
    const [matrixViewUnits, setMatrixViewUnits] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    
    const [docControlData, setDocControlData] = useState<Record<string, DocControlInfo>>({
        'unit-ny-kitchen': {
            docRef: 'FST-LST-01',
            version: '3.0',
            effectiveDate: '2023-10-20',
            approvedBy: 'Director of Operations'
        },
        'default': {
            docRef: 'FSMS-REC-005',
            version: '1.0',
            effectiveDate: new Date().toISOString().split('T')[0],
            approvedBy: 'Plant Manager'
        }
    });
    
    const [isDocControlModalOpen, setIsDocControlModalOpen] = useState(false);
    const [editingDocControlUnitId, setEditingDocControlUnitId] = useState<string | null>(null);
    const [tempDocControl, setTempDocControl] = useState<DocControlInfo>({ docRef: '', version: '', effectiveDate: '', approvedBy: '' });

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
        {
            id: 'tm-1',
            unitId: 'unit-ny-kitchen',
            name: 'Sarah Connor',
            designation: 'Quality Assurance Manager',
            fsmsRole: 'Food Safety Team Leader (FSTL)',
            isFSTL: true,
            department: 'QA',
            domain: 'Quality Assurance & Microbiology',
            employmentType: 'Internal',
            email: 'sarah.c@acme.com',
            mobile: '+1 555-0199',
            totalExperience: 12.5,
            employeeId: 'EMP-042',
            qualification: 'M.Sc Food Tech',
            appointmentLetterUrl: 'appt-letter-001.pdf',
            certificates: [
                { id: 'c1', name: 'Lead Auditor ISO 22000', url: 'cert-la.pdf', expiry: '2026-05-20' },
                { id: 'c2', name: 'Advanced HACCP L4', url: 'cert-haccp.pdf' }
            ],
            trainings: ['HACCP L3', 'VACCP/TACCP', 'Internal Audit'],
            lastCompetencyAssessmentDate: '2024-01-15',
            lastMeetingAttended: '2024-05-10',
            deputyId: 'tm-2',
            deputyName: 'Mike Ross',
            lastUpdated: '2024-05-12',
            status: 'Active'
        },
        {
            id: 'tm-2',
            unitId: 'unit-ny-kitchen',
            name: 'Mike Ross',
            designation: 'Chief Engineer',
            fsmsRole: 'Infrastructure & Maintenance Rep',
            isFSTL: false,
            department: 'Engineering',
            domain: 'Engineering & Utilities',
            employmentType: 'Internal',
            email: 'mike.r@acme.com',
            mobile: '+1 555-0200',
            totalExperience: 8.2,
            employeeId: 'EMP-105',
            qualification: 'B.Tech Mechanical',
            appointmentLetterUrl: 'appt-letter-002.pdf',
            certificates: [
                { id: 'c3', name: 'HACCP Level 3', url: 'cert-eng-haccp.pdf', expiry: '2023-11-01' }
            ],
            trainings: ['HACCP L3', 'Basic Food Hygiene'],
            lastCompetencyAssessmentDate: '2024-02-20',
            lastMeetingAttended: '2024-05-10',
            deputyId: 'tm-1',
            deputyName: 'Sarah Connor',
            lastUpdated: '2024-04-05',
            status: 'Active'
        }
    ]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [replacingMemberId, setReplacingMemberId] = useState<string | null>(null);

    const [newMember, setNewMember] = useState<Partial<TeamMember>>({
        employmentType: 'Internal',
        isFSTL: false,
        domain: DOMAINS[0],
        certificates: [],
        trainings: []
    });

    const toggleExpand = (id: string) => {
        const next = new Set(expandedUnitIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedUnitIds(next);
    };

    const handleOpenAddModal = (unitId: string) => {
        setActiveUnitId(unitId);
        setEditingMemberId(null);
        setReplacingMemberId(null);
        setNewMember({
            unitId: unitId,
            employmentType: 'Internal',
            isFSTL: false,
            domain: DOMAINS[0],
            trainings: [],
            certificates: []
        });
        setIsAddModalOpen(true);
    };

    const handleEditMember = (member: TeamMember) => {
        setActiveUnitId(member.unitId);
        setEditingMemberId(member.id);
        setReplacingMemberId(null);
        setNewMember({ ...member });
        setIsAddModalOpen(true);
    };

    const handleReplaceMember = (member: TeamMember) => {
        setReplacingMemberId(member.id);
        setEditingMemberId(null);
        setActiveUnitId(member.unitId);
        setNewMember({
            unitId: member.unitId,
            designation: member.designation,
            fsmsRole: member.fsmsRole,
            isFSTL: member.isFSTL,
            department: member.department,
            domain: member.domain,
            employmentType: 'Internal',
            trainings: [],
            certificates: []
        });
        setIsAddModalOpen(true);
    };

    const handleArchiveMember = (id: string) => {
        if(confirm('Archive this team member? They will be moved to history.')) {
            const exitDate = new Date().toISOString().split('T')[0];
            setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'Archived', exitDate } : m));
        }
    };

    const handleEditDocControl = (unitId: string) => {
        setEditingDocControlUnitId(unitId);
        const currentData = docControlData[unitId] || docControlData['default'];
        setTempDocControl({ ...currentData });
        setIsDocControlModalOpen(true);
    };

    const handleSaveDocControl = () => {
        if (editingDocControlUnitId) {
            setDocControlData(prev => ({
                ...prev,
                [editingDocControlUnitId]: tempDocControl
            }));
            setIsDocControlModalOpen(false);
            setEditingDocControlUnitId(null);
        }
    };

    const handleSaveNewMember = () => {
        if (!newMember.name || !newMember.designation || !newMember.fsmsRole) {
            alert("Please fill in Name, Job Title, and FSMS Role.");
            return;
        }

        const finalDeputyName = newMember.deputyId 
            ? teamMembers.find(m => m.id === newMember.deputyId)?.name 
            : newMember.deputyName;

        if (editingMemberId) {
            setTeamMembers(prev => prev.map(m => m.id === editingMemberId ? { ...m, ...newMember, deputyName: finalDeputyName, lastUpdated: new Date().toISOString() } as TeamMember : m));
        } else {
            const newId = `tm-${Date.now()}`;
            const member: TeamMember = {
                id: newId,
                unitId: activeUnitId!,
                name: newMember.name!,
                designation: newMember.designation!,
                fsmsRole: newMember.fsmsRole!,
                isFSTL: newMember.isFSTL || false,
                department: newMember.department || 'General',
                domain: newMember.domain || DOMAINS[0],
                employmentType: newMember.employmentType || 'Internal',
                email: newMember.email || '',
                mobile: newMember.mobile || '',
                totalExperience: newMember.totalExperience || 0,
                employeeId: newMember.employeeId || '',
                qualification: newMember.qualification || '',
                appointmentLetterUrl: newMember.appointmentLetterUrl,
                certificates: newMember.certificates || [],
                trainings: newMember.trainings || [],
                lastCompetencyAssessmentDate: newMember.lastCompetencyAssessmentDate,
                lastMeetingAttended: newMember.lastMeetingAttended,
                deputyId: newMember.deputyId,
                deputyName: finalDeputyName,
                lastUpdated: new Date().toISOString(),
                status: 'Active'
            };

            if (replacingMemberId) {
                const exitDate = new Date().toISOString().split('T')[0];
                setTeamMembers(prev => {
                    const updatedPrev = prev.map(m => m.id === replacingMemberId ? { ...m, status: 'Archived', exitDate, replacedBy: newId } as TeamMember : m);
                    return [...updatedPrev, member];
                });
            } else {
                setTeamMembers(prev => [...prev, member]);
            }
        }
        setIsAddModalOpen(false);
    };

    const filteredUnits = useMemo(() => {
        if (currentScope === 'unit' && userRootId) {
            return entities.filter(e => e.id === userRootId && e.type === 'unit');
        }
        return entities.filter(e => e.type === 'unit');
    }, [entities, currentScope, userRootId]);

    const isCertExpired = (dateStr?: string) => dateStr ? new Date(dateStr) < new Date() : false;

    const globalStats = useMemo(() => {
        const totalUnits = filteredUnits.length;
        const assignedFSTLCount = filteredUnits.filter(u => 
            teamMembers.some(m => m.unitId === u.id && m.status === 'Active' && m.isFSTL)
        ).length;
        
        const activeMembers = teamMembers.filter(m => m.status === 'Active');
        const compliantCount = activeMembers.filter(m => {
            const hasExpiredCerts = m.certificates.some(c => isCertExpired(c.expiry));
            const assessmentDue = !m.lastCompetencyAssessmentDate || (new Date().getTime() - new Date(m.lastCompetencyAssessmentDate).getTime() > 365 * 24 * 60 * 60 * 1000);
            return !hasExpiredCerts && !assessmentDue;
        }).length;

        return {
            fstlAssignedCount: assignedFSTLCount,
            fstlMissingCount: Math.max(0, totalUnits - assignedFSTLCount),
            compliantTeamCount: compliantCount,
            nonCompliantTeamCount: activeMembers.length - compliantCount
        };
    }, [filteredUnits, teamMembers]);

    // --- ISO 22000 PDF EXPORT RE-IMPLEMENTATION (PROFESSIONAL CONTROLLED FORMAT) ---
    const handleExportPDF = async (targetUnitId?: string) => {
        setIsGeneratingPDF(true);
        const securityId = `CERT-FST-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now().toString().slice(-4)}`;

        const printArea = document.createElement('div');
        printArea.style.position = 'fixed';
        printArea.style.top = '-9999px';
        printArea.style.left = '0';
        printArea.style.width = '1000px'; 
        printArea.style.backgroundColor = 'white';
        printArea.style.padding = '0';
        printArea.style.fontFamily = 'Arial, Helvetica, sans-serif';
        printArea.style.color = '#1e293b';

        const unitsToExport = targetUnitId ? filteredUnits.filter(u => u.id === targetUnitId) : filteredUnits;
        const now = new Date();
        const downloadTimestamp = now.toLocaleString();

        let htmlContent = '';

        unitsToExport.forEach((unit, unitIdx) => {
            const members = teamMembers.filter(m => m.unitId === unit.id && m.status === 'Active');
            if (members.length === 0) return;

            const docInfo = docControlData[unit.id] || docControlData['default'];
            const fstl = members.find(m => m.isFSTL);

            // Calculate competency coverage for this unit
            const domainCoverage = DOMAINS.map(d => ({
                name: d,
                covered: members.some(m => m.domain === d)
            }));

            htmlContent += `
                <div style="padding: 50px; page-break-after: always; min-height: 1400px; display: flex; flex-direction: column; position: relative; background: #fff;">
                    
                    <!-- WATERMARK (ISO COMPLIANCE) -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; font-weight: 900; color: rgba(226, 232, 240, 0.4); pointer-events: none; text-transform: uppercase; z-index: 0; white-space: nowrap;">Controlled Record</div>

                    <!-- CONTROLLED HEADER (ISO 7.5.2) -->
                    <div style="border: 2px solid #1e293b; margin-bottom: 25px; position: relative; z-index: 10; background: #fff;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="width: 20%; padding: 15px; border-right: 2px solid #1e293b; text-align: center;">
                                    <div style="width: 70px; height: 70px; margin: 0 auto;">
                                        ${renderToString(<Logo className="w-16 h-16" />)}
                                    </div>
                                </td>
                                <td style="width: 50%; padding: 15px; border-right: 2px solid #1e293b;">
                                    <div style="font-size: 16px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; color: #0f172a;">${entities.find(e => e.type === 'corporate')?.name || 'HACCP PRO SYSTEMS'}</div>
                                    <div style="font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Food Safety Team Registry (ISO 22:2018)</div>
                                    <div style="font-size: 11px; margin-top: 8px; font-weight: 600; color: #64748b;">Unit Node: ${unit.name} | Location: ${unit.location}</div>
                                </td>
                                <td style="width: 30%; padding: 0;">
                                    <table style="width: 100%; border-collapse: collapse; font-size: 10px; font-weight: 700;">
                                        <tr><td style="padding: 6px 12px; border-bottom: 1px solid #1e293b; background: #f8fafc; color: #64748b;">Doc Ref:</td><td style="padding: 6px 12px; border-bottom: 1px solid #1e293b;">${docInfo.docRef}</td></tr>
                                        <tr><td style="padding: 6px 12px; border-bottom: 1px solid #1e293b; background: #f8fafc; color: #64748b;">Revision:</td><td style="padding: 6px 12px; border-bottom: 1px solid #1e293b;">v${docInfo.version}</td></tr>
                                        <tr><td style="padding: 6px 12px; background: #f8fafc; color: #64748b;">Effective:</td><td style="padding: 6px 12px;">${docInfo.effectiveDate}</td></tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- EXECUTIVE SUMMARY OF COMPETENCE (ISO 7.2) -->
                    <div style="margin-bottom: 30px; position: relative; z-index: 10;">
                        <h4 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #475569; margin-bottom: 10px; border-left: 4px solid #4f46e5; padding-left: 10px;">Executive Summary: Resource Competency Coverage</h4>
                        <div style="display: grid; grid-template-cols: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                            ${domainCoverage.map(d => `
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 9px; font-weight: 700;">
                                    <div style="width: 12px; height: 12px; border-radius: 3px; background: ${d.covered ? '#10b981' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; color: white;">${d.covered ? '✓' : ''}</div>
                                    <span style="color: ${d.covered ? '#0f172a' : '#94a3b8'};">${d.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- TEAM REGISTER -->
                    <div style="flex: 1; position: relative; z-index: 10;">
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            <thead>
                                <tr style="background: #1e293b; color: white; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">
                                    <th style="padding: 15px; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">Team Member</th>
                                    <th style="padding: 15px; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">FSMS Authority (Clause 5.3)</th>
                                    <th style="padding: 15px; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">Knowledge Domain</th>
                                    <th style="padding: 15px; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">Competency Evidence</th>
                                    <th style="padding: 15px; text-align: left;">Assigned Deputy</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${members.map(m => `
                                    <tr style="font-size: 10px; border-bottom: 1px solid #e2e8f0; background: #fff;">
                                        <td style="padding: 15px; border-right: 1px solid #e2e8f0;">
                                            <div style="font-weight: 800; color: #0f172a; font-size: 11px;">${m.name} ${m.isFSTL ? '<span style="color: #f59e0b; margin-left: 4px;">★</span>' : ''}</div>
                                            <div style="font-size: 8px; color: #64748b; margin-top: 4px; text-transform: uppercase; font-weight: 700;">${m.designation} (${m.department})</div>
                                            <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Exp: ${m.totalExperience} Yrs</div>
                                        </td>
                                        <td style="padding: 15px; border-right: 1px solid #e2e8f0; font-weight: 800; color: #4f46e5;">${m.fsmsRole}</td>
                                        <td style="padding: 15px; border-right: 1px solid #e2e8f0;">
                                            <div style="font-weight: 700; color: #334155;">${m.domain}</div>
                                        </td>
                                        <td style="padding: 15px; border-right: 1px solid #e2e8f0;">
                                            <div style="font-weight: 700; color: #0f172a;">${m.qualification}</div>
                                            <div style="font-size: 8px; color: #64748b; margin-top: 6px; line-height: 1.4;">
                                                ${m.certificates.map(c => `<div style="display: flex; align-items: center; gap: 4px;"><span style="color: #4f46e5;">•</span> ${c.name}</div>`).join('')}
                                            </div>
                                        </td>
                                        <td style="padding: 15px; font-weight: 600; color: #475569;">${m.deputyName || 'No substitute assigned'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- AUTHORIZATION & FOOTER -->
                    <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px; position: relative; z-index: 10;">
                        <div style="display: flex; gap: 30px; margin-bottom: 25px;">
                            <div style="flex: 1; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; background: #f8fafc;">
                                <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Prepared & Signed (FSTL)</div>
                                <div style="display: flex; align-items: flex-end; gap: 15px;">
                                    <div style="border-bottom: 1px solid #cbd5e1; flex: 1; height: 30px;"></div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 12px; font-weight: 900;">${fstl?.name || '---'}</div>
                                        <div style="font-size: 10px; color: #475569;">Food Safety Team Leader</div>
                                    </div>
                                </div>
                            </div>
                            <div style="flex: 1; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; background: #f8fafc;">
                                <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Approved & Validated (Authority)</div>
                                <div style="display: flex; align-items: flex-end; gap: 15px;">
                                    <div style="border-bottom: 1px solid #cbd5e1; flex: 1; height: 30px;"></div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 12px; font-weight: 900;">${docInfo.approvedBy}</div>
                                        <div style="font-size: 10px; color: #475569;">Management Representative</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="background: #fff1f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
                            <div style="font-size: 11px; font-weight: 900; color: #e11d48; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 2px;">Uncontrolled Copy When Printed</div>
                            <div style="font-size: 9px; color: #be123c; font-weight: 600;">Document authenticity must be verified against the Master Digital Registry on the HACCP PRO Platform.</div>
                        </div>

                        <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                            <div>Gen. Timestamp: ${downloadTimestamp}</div>
                            <div>System integrity ID: ${securityId}</div>
                            <div>Page ${unitIdx + 1} of ${unitsToExport.length}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        printArea.innerHTML = htmlContent;
        document.body.appendChild(printArea);

        try {
            const canvas = await html2canvas(printArea, { 
                scale: 3, // High resolution
                useCORS: true, 
                backgroundColor: '#ffffff',
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate how many pages the canvas spans based on our HTML structure
            // In our case, we used page-break-after, but html2canvas captures one giant image.
            // A better way is to iterate pages, but for this refactor we slice for high-res output.
            
            const totalCanvasHeight = canvas.height;
            const singlePageCanvasHeight = (pdfHeight * canvas.width) / pdfWidth;
            let currentCanvasY = 0;

            while (currentCanvasY < totalCanvasHeight) {
                if (currentCanvasY > 0) pdf.addPage();
                
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = Math.min(singlePageCanvasHeight, totalCanvasHeight - currentCanvasY);
                
                const ctx = pageCanvas.getContext('2d');
                ctx?.drawImage(canvas, 0, currentCanvasY, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
                
                pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, (pageCanvas.height * pdfWidth) / canvas.width);
                currentCanvasY += singlePageCanvasHeight;
            }

            pdf.save(`ISO_22000_Food_Safety_Team_Registry_${now.toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("Registry Export failed", err);
            alert("Digital Registry Export failed. Critical System Error.");
        } finally {
            document.body.removeChild(printArea);
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Dashboard Ribbon */}
            <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col xl:flex-row items-center justify-between gap-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                 <div className="flex items-center gap-5">
                     <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                         <ShieldCheck size={32} />
                     </div>
                     <div>
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Food Safety Team</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ISO 22000 Registry Hub</p>
                     </div>
                 </div>

                 <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0 justify-center">
                     <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-3 border border-slate-100">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FSTL Coverage</span>
                         <div className="flex items-center gap-3">
                             <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Check size={12}/> {globalStats.fstlAssignedCount} Assigned</span>
                             <div className="h-4 w-px bg-slate-200" />
                             <span className="text-sm font-bold text-rose-500 flex items-center gap-1"><X size={12}/> {globalStats.fstlMissingCount} Gap</span>
                         </div>
                     </div>
                     <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-3 border border-slate-100">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Personnel Adherence</span>
                         <div className="flex items-center gap-3">
                             <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Check size={12}/> {globalStats.compliantTeamCount} Compliant</span>
                             <div className="h-4 w-px bg-slate-200" />
                             <span className="text-sm font-bold text-rose-500 flex items-center gap-1"><X size={12}/> {globalStats.nonCompliantTeamCount} Incomplete</span>
                         </div>
                     </div>
                 </div>

                 <div className="flex items-center gap-3 pr-4">
                     <div className="relative group w-full md:w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                         <input type="text" placeholder="Search Member..." className="pl-9 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-400 w-full transition-all shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                     </div>
                     <button onClick={() => handleExportPDF()} disabled={isGeneratingPDF} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-indigo-600 shadow-sm disabled:opacity-50 transition-all active:scale-95">
                        {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                     </button>
                 </div>
            </div>

            {/* Units List */}
            <div className="space-y-6">
                {filteredUnits.map(unit => {
                    const isExpanded = expandedUnitIds.has(unit.id);
                    const isMatrixView = matrixViewUnits.has(unit.id);
                    const allMembers = teamMembers.filter(m => m.unitId === unit.id);
                    let displayMembers = allMembers.filter(m => showHistory ? true : m.status === 'Active');
                    if (searchTerm) {
                        displayMembers = displayMembers.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.designation.toLowerCase().includes(searchTerm.toLowerCase()));
                    }
                    const activeMembers = allMembers.filter(m => m.status === 'Active');
                    const hasFSTL = activeMembers.some(m => m.isFSTL);
                    const expiredCertsCount = activeMembers.reduce((acc, m) => acc + m.certificates.filter(c => isCertExpired(c.expiry)).length, 0);
                    const assessmentsDueCount = activeMembers.filter(m => !m.lastCompetencyAssessmentDate || (new Date().getTime() - new Date(m.lastCompetencyAssessmentDate).getTime() > 365 * 24 * 60 * 60 * 1000)).length;
                    const docInfo = docControlData[unit.id] || docControlData['default'];

                    return (
                        <div key={unit.id} className={`bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden flex flex-col ${isExpanded ? 'border-indigo-500 shadow-xl' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}>
                            <div className="p-6 md:p-8 flex flex-col cursor-pointer bg-slate-50/30 hover:bg-slate-50 transition-colors gap-6" onClick={() => toggleExpand(unit.id)}>
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0"><Building2 size={28} /></div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{unit.name}</h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12} className="text-indigo-500" /> {unit.location}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                        <div className="flex -space-x-2 mr-2">
                                            {activeMembers.slice(0,4).map(m => (<div key={m.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">{m.name.charAt(0)}</div>))}
                                            {activeMembers.length > 4 && <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">+{activeMembers.length - 4}</div>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleExportPDF(unit.id); }} disabled={isGeneratingPDF} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-indigo-600 shadow-sm active:scale-95 transition-all"><Download size={18} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenAddModal(unit.id); }} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-2"><Plus size={14} strokeWidth={3} /> <span className="hidden sm:inline">Add Member</span></button>
                                            <div className={`p-3 rounded-xl border transition-all ${isExpanded ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-white text-slate-400 border-slate-200'}`}>{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                     <div className="flex flex-col items-center md:items-start"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Team</span><div className="flex items-center gap-2"><span className="text-lg font-black text-slate-900">{activeMembers.length}</span><Users size={14} className="text-indigo-400" /></div></div>
                                     <div className="flex flex-col items-center md:items-start"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">FSTL Status</span><div className="flex items-center gap-2"><span className={`text-sm font-black uppercase ${hasFSTL ? 'text-emerald-600' : 'text-rose-500'}`}>{hasFSTL ? 'Assigned' : 'Missing'}</span>{hasFSTL ? <CheckCircle2 size={14} className="text-emerald-500"/> : <AlertCircle size={14} className="text-rose-500"/>}</div></div>
                                     <div className="flex flex-col items-center md:items-start"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Expired Certs</span><div className="flex items-center gap-2"><span className={`text-lg font-black ${expiredCertsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{expiredCertsCount}</span>{expiredCertsCount > 0 && <AlertTriangle size={14} className="text-rose-500" />}</div></div>
                                     <div className="flex flex-col items-center md:items-start"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Assessments Due</span><div className="flex items-center gap-2"><span className={`text-lg font-black ${assessmentsDueCount > 0 ? 'text-amber-500' : 'text-slate-900'}`}>{assessmentsDueCount}</span><Award size={14} className={assessmentsDueCount > 0 ? 'text-amber-400' : 'text-slate-300'} /></div></div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-6 md:p-8 border-t border-slate-100 bg-white space-y-6 animate-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                             <button onClick={() => { const s = new Set(matrixViewUnits); s.delete(unit.id); setMatrixViewUnits(s); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isMatrixView ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>List View</button>
                                             <button onClick={() => { const s = new Set(matrixViewUnits); s.add(unit.id); setMatrixViewUnits(s); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isMatrixView ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Matrix View</button>
                                        </div>
                                        <button onClick={() => setShowHistory(!showHistory)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${showHistory ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}><History size={14} /> {showHistory ? 'Hide History' : 'Show History'}</button>
                                    </div>

                                    <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={16} /></div>
                                            <div>
                                                <div className="flex items-center gap-2"><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document Control</h4><InfoTooltip text={ISO_TOOLTIPS.docControl} /></div>
                                                <div className="flex gap-4 text-[10px] font-mono font-bold text-slate-700 mt-0.5"><span>Ref: {docInfo.docRef}</span><span>Ver: {docInfo.version}</span><span>Date: {docInfo.effectiveDate}</span></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-slate-400 uppercase">Approved By:</span><span className="text-[10px] font-black text-slate-800 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{docInfo.approvedBy}</span></div>
                                            <button onClick={() => handleEditDocControl(unit.id)} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={14}/></button>
                                        </div>
                                    </div>

                                    {isMatrixView ? (
                                        <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-2xl">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50"><tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-200"><th className="p-4 w-[200px]">Team Member</th>{SKILL_MATRIX_COLS.map(skill => (<th key={skill} className="p-4 text-center border-l border-slate-100">{skill}</th>))}</tr></thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {displayMembers.map(member => (
                                                        <tr key={member.id} className="hover:bg-indigo-50/30 transition-colors">
                                                            <td className="p-4 bg-white sticky left-0 z-10"><div className="font-bold text-slate-800 text-xs">{member.name}</div><div className="text-[9px] text-slate-400 uppercase">{member.designation}</div></td>
                                                            {SKILL_MATRIX_COLS.map(skill => {
                                                                const hasSkill = member.trainings.includes(skill) || member.certificates.some(c => c.name.includes(skill));
                                                                return (<td key={skill} className="p-4 text-center border-l border-slate-100">{hasSkill ? (<div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm"><Check size={14} strokeWidth={3} /></div>) : (<div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-auto" />)}</td>);
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-[#1e293b] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em]"><div className="col-span-4">Role & Identity</div><div className="col-span-3">Competency & Evidence</div><div className="col-span-3">Engagement Status</div><div className="col-span-2 text-right">Actions</div></div>
                                            {displayMembers.map((member) => {
                                                const isArchived = member.status === 'Archived';
                                                return (
                                                <div key={member.id} className={`group relative bg-white border-2 rounded-3xl p-5 hover:shadow-xl transition-all duration-300 ${isArchived ? 'opacity-70 grayscale bg-slate-50 border-slate-200' : member.isFSTL ? 'border-amber-200 shadow-md bg-amber-50/20' : 'border-slate-100 hover:border-indigo-100'}`}>
                                                    {member.isFSTL && !isArchived && (<div className="absolute -top-3 left-6 bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1"><Star size={10} fill="currentColor"/> Team Leader (FSTL)</div>)}
                                                    {isArchived && (<div className="absolute -top-3 left-6 bg-slate-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1"><Archive size={10} /> Archived: {member.exitDate}</div>)}
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                                        <div className="lg:col-span-4 flex items-start gap-4"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black border-2 shadow-sm shrink-0 ${member.isFSTL ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{member.name.charAt(0)}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 mb-1"><h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{member.name}</h4><span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${member.employmentType === 'External' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{member.employmentType}</span></div><div className="flex items-center gap-1"><p className="text-[10px] font-bold text-indigo-600 uppercase truncate">{member.fsmsRole}</p><InfoTooltip text={ISO_TOOLTIPS.fsmsRole} /></div><p className="text-[9px] font-medium text-slate-400 uppercase truncate mt-0.5">{member.designation} • {member.department}</p><div className="mt-2 flex gap-3 text-[9px] text-slate-500"><span className="flex items-center gap-1 truncate"><Mail size={10}/> Email</span><span className="flex items-center gap-1 truncate"><Phone size={10}/> {member.mobile}</span></div></div></div>
                                                        <div className="lg:col-span-3 space-y-3"><div className="flex flex-col gap-1"><span className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Domain & Qualification <InfoTooltip text={ISO_TOOLTIPS.domain} /></span><span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit">{member.domain}</span><span className="text-[9px] text-slate-500 truncate"><GraduationCap size={10} className="inline mr-1"/>{member.qualification} • {member.totalExperience} Yrs</span></div><div className="flex flex-col gap-1"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Certificates ({member.certificates.length})</span><div className="flex flex-wrap gap-2">{member.certificates.map(cert => (<span key={cert.id} className={`text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${isCertExpired(cert.expiry) ? 'text-white bg-rose-600' : 'text-blue-600 bg-blue-50 border-blue-100'}`}><FileBadge size={10}/> {cert.name}</span>))}</div></div></div>
                                                        <div className={`lg:col-span-3 space-y-3 p-2 rounded-xl transition-all`}>
                                                            <div className="flex flex-col gap-1">
                                                                <div className={`flex items-center gap-2 text-[10px] font-bold text-emerald-700`}><UserCheck size={12}/>Meeting: {member.lastMeetingAttended || 'Never'}</div>
                                                                <div className="text-[10px] font-bold text-slate-600 flex items-center gap-2"><Award size={12} className="text-slate-400"/> Assessment: {member.lastCompetencyAssessmentDate || 'Pending'}</div>
                                                            </div>
                                                            <div className="flex flex-col gap-1 pt-1 border-t border-slate-100/50"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deputy: <span className="text-slate-600 font-bold">{member.deputyName || 'None'}</span></span></div>
                                                        </div>
                                                        <div className="lg:col-span-2 flex justify-end gap-2">{isArchived ? (<div className="text-[9px] font-bold text-slate-400 italic">Exited: {member.exitDate}</div>) : (<><button onClick={() => handleEditMember(member)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Edit3 size={16} /></button><button onClick={() => handleReplaceMember(member)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-orange-600 rounded-xl transition-all"><RefreshCw size={16} /></button><button onClick={() => handleArchiveMember(member.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={16} /></button></>)}</div>
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* MODAL SECTION: ADD/EDIT/REPLACE MEMBER */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6"><div><h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">{editingMemberId ? "Edit Member Profile" : replacingMemberId ? "Replace Team Member" : "Appoint Team Member"}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ISO 22000 Compliance Node</p></div><button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4"><h4 className="text-xs font-black text-slate-500 uppercase border-b pb-1"><User size={14}/> Identity & Role</h4><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label><input type="text" className="w-full border rounded-lg p-2.5 text-sm font-bold bg-slate-50" value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})} /></div><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Job Title</label><input type="text" className="w-full border rounded-lg p-2.5 text-xs font-bold bg-slate-50" value={newMember.designation || ''} onChange={e => setNewMember({...newMember, designation: e.target.value})} /></div><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">EMP ID</label><input type="text" className="w-full border rounded-lg p-2.5 text-xs font-bold bg-slate-50" value={newMember.employeeId || ''} onChange={e => setNewMember({...newMember, employeeId: e.target.value})} /></div></div><div className="pt-2"><label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">FSMS Role <InfoTooltip text={ISO_TOOLTIPS.fsmsRole}/></label><input type="text" className="w-full border rounded-lg p-2.5 text-sm font-bold bg-indigo-50 border-indigo-100" value={newMember.fsmsRole || ''} onChange={e => setNewMember({...newMember, fsmsRole: e.target.value})} /></div></div>
                            <div className="space-y-4"><h4 className="text-xs font-black text-slate-500 uppercase border-b pb-1"><Award size={14}/> Competency & Deputy</h4><div><label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">Knowledge Domain <InfoTooltip text={ISO_TOOLTIPS.domain}/></label><select className="w-full border rounded-lg p-2.5 text-xs font-bold bg-slate-50" value={newMember.domain} onChange={e => setNewMember({...newMember, domain: e.target.value})}>{DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qualif.</label><input type="text" className="w-full border rounded-lg p-2.5 text-xs font-bold bg-slate-50" value={newMember.qualification || ''} onChange={e => setNewMember({...newMember, qualification: e.target.value})} /></div><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Exp (Yrs)</label><input type="number" className="w-full border rounded-lg p-2.5 text-xs font-bold bg-slate-50" value={newMember.totalExperience || ''} onChange={e => setNewMember({...newMember, totalExperience: parseFloat(e.target.value)})} /></div></div><div><label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">Deputy <InfoTooltip text={ISO_TOOLTIPS.deputy}/></label><select className="w-full border rounded-lg p-2.5 text-xs font-bold bg-slate-50" value={newMember.deputyId || ""} onChange={e => setNewMember({...newMember, deputyId: e.target.value})}><option value="">Select Deputy...</option>{teamMembers.filter(m => m.unitId === activeUnitId && m.status === 'Active' && m.id !== editingMemberId).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}</select></div></div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t"><button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-wider">Cancel</button><button onClick={handleSaveNewMember} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"><CheckCircle2 className="inline mr-2" size={16}/> Commit To Registry</button></div>
                    </div>
                </div>
            )}

            {/* MODAL SECTION: DOC CONTROL */}
            {isDocControlModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6"><div><h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Document Control</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ISO 22000 Clause 7.5.3</p></div><button onClick={() => setIsDocControlModalOpen(false)} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button></div>
                        <div className="space-y-4">
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Doc Reference</label><input className="w-full border rounded-lg p-3 text-sm font-bold bg-slate-50 font-mono" value={tempDocControl.docRef} onChange={e => setTempDocControl({...tempDocControl, docRef: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Version</label><input className="w-full border rounded-lg p-3 text-sm font-bold bg-slate-50" value={tempDocControl.version} onChange={e => setTempDocControl({...tempDocControl, version: e.target.value})} /></div><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Effective Date</label><input type="date" className="w-full border rounded-lg p-3 text-sm font-bold bg-slate-50" value={tempDocControl.effectiveDate} onChange={e => setTempDocControl({...tempDocControl, effectiveDate: e.target.value})} /></div></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Approved By</label><input className="w-full border rounded-lg p-3 text-sm font-bold bg-slate-50" value={tempDocControl.approvedBy} onChange={e => setTempDocControl({...tempDocControl, approvedBy: e.target.value})} /></div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t"><button onClick={() => setIsDocControlModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-wider">Cancel</button><button onClick={handleSaveDocControl} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"><Save size={16} /> Update Control</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodSafetyTeam;
