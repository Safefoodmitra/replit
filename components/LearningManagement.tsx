
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Monitor } from 'lucide-react';
import TrainerManagement from './TrainerManagement';
import StaffCompetencyMapping from './StaffCompetencyMapping';
import HierarchicalTrainingDashboard from './HierarchicalTrainingDashboard';
import TrainingCalendar from './TrainingCalendar';
import QuizCreator from './QuizCreator';
import { HierarchyScope, Entity } from '../types';

// --- Shared Types ---
export interface Certification {
  name: string;
  date: string;
  status: string;
}

export interface CompetencyScore {
    domain: string;
    level: number; // 1-5 scale
    description: string;
}

export interface ExternalResourceArtifacts {
    cvAttached: boolean;
    companyApprovalAttached: boolean;
    verifiedDate?: string;
    consultantCompany?: string;
}

export interface EmployeeRecord {
  id: string; 
  Corporate: string;
  Regional: string;
  Unit: string;
  Name: string;
  ID: string; 
  Gender: string;
  JoinedDate: string;
  BirthDate: string;
  Email: string;
  Phone: string;
  Department: string;
  Role: string;
  Category: string;
  FoodHandler: string;
  Status: "Active" | "Inactive";
  isTrainer: boolean;
  delivered_uniqueCourses: number;
  delivered_participants: number;
  delivered_hours: number;
  trainerQualification?: string;
  trainerCategory?: 'Internal' | 'External'; // Clause 7.1.6
  externalArtifacts?: ExternalResourceArtifacts;
  isCoreComplianceNode?: boolean; // For Auditor "One-Click" Mode
  certifications: Certification[];
  competencyScorecard: CompetencyScore[]; 
  // ISO 22000 Clause 7.2.f Metrics
  effectivenessScore: number; 
  classPassRate: number; 
  avgCompetencyGain: number;
  // ISO 22000 Clause 5.3.2 Authority & Impartiality
  isFSTL: boolean; // Food Safety Team Leader
  authorizedScope: string[]; // e.g. ["PRP", "CCP", "OPRP"]
  appointmentLetterUrl?: string;
  digitalWarrantId?: string;
  
  performanceLevel?: string;
  rating?: number;
  departmentalReach?: number;
  avgHoursPerParticipant?: number;
  lastUpdated: string;
  avgDelivery: number;
  selfLearning: number;
  lastTrainedDate: string;
}

// ISO 22000 Domains for SME Tracking
const ISO_DOMAINS = [
    { key: 'haccp', label: 'HACCP Analysis', desc: 'Hazard identification and control point determination' },
    { key: 'prp', label: 'PRP Controls', desc: 'Prerequisite programs and sanitation' },
    { key: 'defense', label: 'Food Defense', desc: 'Vulnerability and threat assessment' },
    { key: 'audit', label: 'Internal Audit', desc: 'System verification and compliance' },
    { key: 'micro', label: 'Microbiology', desc: 'Pathogen control and lab protocols' }
];

const SCOPE_POOL = ["General Hygiene (PRP)", "CCP Monitoring", "OPRP Management", "Allergen Control", "Internal Audit", "Crisis Management"];

// --- Shared Generator ---
const generateMasterEmployeeList = (): EmployeeRecord[] => {
  const names = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
    "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Margaret", "Anthony", "Betty", "Donald", "Sandra"
  ];
  const surnames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
  ];
  const depts = ["Main Kitchen", "Housekeeping", "Engineering", "Front Office", "F&B Service"];
  const roles = ["Manager", "Supervisor", "Associate", "Chef", "Specialist"];
  
  return Array.from({ length: 120 }).map((_, i) => {
    const isAcme = i % 2 === 0;
    const corp = isAcme ? "Acme Catering Group" : "PureFlow Dairy Corp";
    const reg = isAcme ? "North America Division" : "EMEA";
    const unit = isAcme ? (i % 4 === 0 ? "LA Logistics Unit" : "NYC Central Kitchen") : "Main Branch";
    const name = `${names[i % names.length]} ${surnames[i % surnames.length]}`;
    
    const isTrainer = i < 15;
    const isExternal = i > 0 && i < 4; // Mock first few as external

    return {
      id: `uuid-${i}`,
      Corporate: corp,
      Regional: reg,
      Unit: unit,
      Name: name,
      ID: `EMP${1000 + i}`,
      Gender: i % 3 === 0 ? "Female" : "Male",
      JoinedDate: "2021-05-23",
      BirthDate: "1993-05-30",
      Email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      Phone: `555-01${i}`,
      Department: depts[i % depts.length],
      Role: roles[i % roles.length],
      Category: "Staff",
      FoodHandler: i % 5 === 0 ? "Yes" : "No",
      Status: "Active",
      isTrainer: isTrainer, 
      delivered_uniqueCourses: isTrainer ? (i % 8) + 1 : 0,
      delivered_participants: i * 10 + 20,
      delivered_hours: i * 5 + 10,
      trainerQualification: isTrainer ? "Certified Expert" : undefined,
      trainerCategory: isTrainer ? (isExternal ? 'External' : 'Internal') : undefined,
      externalArtifacts: isExternal ? {
          cvAttached: true,
          companyApprovalAttached: i !== 2, // Mock one missing approval
          verifiedDate: "2024-01-10",
          consultantCompany: "GFSI Solutions Global"
      } : undefined,
      isCoreComplianceNode: isTrainer && (i % 2 === 0 || isExternal), // Core nodes for auditor mode
      certifications: isTrainer ? [{ name: 'Train the Trainer', date: '2023-11-10', status: 'Completed' }] : [],
      // ISO 22000 Scorecard Logic
      competencyScorecard: isTrainer ? ISO_DOMAINS.map(d => ({
          domain: d.label,
          level: Math.floor(Math.random() * 5) + 1,
          description: d.desc
      })) : [],
      // ISO 22000 Clause 7.2.f Logic
      effectivenessScore: isTrainer ? 75 + Math.floor(Math.random() * 20) : 0,
      classPassRate: isTrainer ? 85 + Math.floor(Math.random() * 14) : 0,
      avgCompetencyGain: isTrainer ? 0.8 + (Math.random() * 1.5) : 0,
      // ISO 22000 Clause 5.3.2 Logic
      isFSTL: isTrainer && i === 0, // Mark first trainer as FSTL
      authorizedScope: isTrainer ? SCOPE_POOL.slice(0, (i % 4) + 2) : [],
      appointmentLetterUrl: isTrainer ? "apt-2024-001.pdf" : undefined,
      digitalWarrantId: isTrainer ? `WNT-${2000 + i}` : undefined,
      lastUpdated: "2025-12-20T22:09:00",
      avgDelivery: isTrainer ? (Math.random() * 5) : 0,
      selfLearning: isTrainer ? Math.floor(Math.random() * 100) : 0,
      lastTrainedDate: isTrainer ? `2024-0${(i % 9) + 1}-15` : ""
    };
  });
};

interface LearningManagementProps {
  activeSubTab: string;
  currentScope: HierarchyScope;
  userRootId?: string | null;
  entities?: Entity[];
}

const LearningManagement: React.FC<LearningManagementProps> = ({ 
  activeSubTab,
  currentScope,
  userRootId,
  entities = []
}) => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setEmployees(generateMasterEmployeeList());
    setIsLoaded(true);
  }, []);

  const trainers = useMemo(() => employees.filter(e => e.isTrainer), [employees]);

  if (!isLoaded) return <div className="p-12 text-center text-indigo-600 font-bold">Initializing Learning Environment...</div>;

  if (activeSubTab === 'learning-trainer') {
    return (
      <TrainerManagement 
        currentScope={currentScope} 
        userRootId={userRootId} 
        entities={entities} 
        masterEmployees={employees}
        setMasterEmployees={setEmployees}
      />
    );
  }

  if (activeSubTab === 'learning-tni') {
    return (
      <StaffCompetencyMapping 
        entities={entities}
        currentScope={currentScope}
        userRootId={userRootId}
      />
    );
  }

  if (activeSubTab === 'learning-tracker') {
    return <HierarchicalTrainingDashboard />;
  }

  if (activeSubTab === 'learning-calendar') {
    return (
      <TrainingCalendar 
        currentScope={currentScope} 
        userRootId={userRootId} 
        entities={entities} 
        trainers={trainers}
        allEmployees={employees}
      />
    );
  }

  if (activeSubTab === 'learning-quiz') {
    return (
      <QuizCreator />
    );
  }

  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2rem] border border-dashed border-slate-200 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <Monitor className="w-10 h-10 text-slate-300" />
      </div>
      <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Learning Module Interface</h2>
      <p className="text-slate-400 text-sm mt-3 max-w-sm font-medium uppercase tracking-widest">Select a valid sub-section from the navigation menu above to access specialized datasets.</p>
    </div>
  );
};

export default LearningManagement;
