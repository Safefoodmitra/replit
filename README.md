HACCP PRO - Food Safety Management System
Overview
HACCP PRO is an enterprise-grade food safety management dashboard designed to automate and streamline food safety compliance for businesses. Built with Next.js, it offers a comprehensive suite of tools for managing operations, ensuring regulatory adherence, and enhancing efficiency. Key capabilities include user authentication, compliance monitoring, hierarchical data organization, audit scheduling, stock management, and detailed record-keeping across various food processes. The project aims to significantly improve food safety standards and operational effectiveness.

User Preferences
I want iterative development. Ask before making major changes. I prefer detailed explanations for complex logic or significant architectural decisions. I prioritize clear, maintainable code.

System Architecture
The application is built using Next.js 15 (App Router), TypeScript, React 19, and Tailwind CSS 3, featuring a responsive UI/UX design with md and lg breakpoints, Lucide React icons, Font Awesome, and glassmorphism effects.

Core Architectural Decisions & Features:

Responsive Design: A 3-tier responsive layout with dynamic component rendering and a unified, responsive pagination system.
Audit Management:
Comprehensive audit form builder (AuditChecklistCreator.tsx) supporting hierarchical structures, various response types, scoring, logic rules, and CSV import/export.
Features include dynamic answer buttons, real-time score calculation, risk level labels, applicability toggles, integrated audit timer, geolocation, notes, and progress tracking.
Draft persistence via localStorage with debounced writes, beforeunload, and on close, allowing users to resume audits.
Hierarchy-based checklist visibility: Checklists are scope-specific. Super-admin-created data is isolated — only visible to super-admin users. Corporate data cascades down to Regional → Unit → Department → User. Each module enforces this via client-side filtering using createdByScope, createdByEntityId, unitId, and entity lineage checks.
Raw Material Management (RawMaterialList.tsx): Manages Ingredients and Food Contact Materials (FCM), including analytics, brand onboarding, vendor assignment, and Excel export.
Recipe Calculation (RecipeCalculation.tsx): Features a "Recipe Studio" with a stepper, card-based sections, sticky save bar, mobile/desktop ingredient displays, visual nutrition stats, advanced CSV import with fuzzy matching, and manual allergen tagging.
Facility Hygiene Tab: Consolidates facility management modules (Equipment List, Cleaning Checklist, Preventive Maintenance, Calibration, Pest Management) under a single top-level navigation tab (facility) with sub-tab routing.
Calibration Hub: Manages calibration devices, displaying status, ranges, and due dates, with history tracking.
Equipment Linking: Integrates equipment data into observation and breakdown records, showing details, service timelines, and related observations.
Breakdown History (BreakdownHistory.tsx): Displays equipment-centric breakdown cards with inline analytics, action types, status, downtime, cost, and technician information, linking to ObservationDetailModal.
Nutritional Calculator (Nutrilator.tsx): A standalone component for basic nutritional calculations.
Image Handling: utils/imageCompression.ts provides auto-compression for uploaded images and signatures.
PWA PDF Download: utils/pdfDownload.ts ensures reliable PDF downloads across all components, especially for PWA standalone mode.
Notification System: A global system (NotificationContext.tsx) for managing in-app notifications and toasts, integrated with Browser Notification API and Web Audio API. Supports corporate-level configuration (NotificationPanel.tsx, NotificationSettings.tsx) for various modules and process alerts (e.g., cooling, thawing).
Record Management (Receiving, Cooking, Reheating, Thawing): Dedicated modules with responsive views, detailed record forms (signature pads, image uploads, corrective actions), and native jsPDF generation with QR code integration. Includes specific validation rules for temperature and image uploads.
Cooling Record Traceability: CoolingRecordEntry provides full ancestry tracing of cooling records, including mother thaw batch, cooking data, and product distribution, displayed in various reports and QR codes. Includes comprehensive temperature validation with conditional logic and visual feedback.
SOP Management (SopManagement.tsx): Master repository for Standard Operating Procedures using a rich text editor (TipTap/ProseMirror) with professional PDF and Word (DOCX) export capabilities.
Internal Audit Hub (InternalAudit.tsx): Consolidates Schedule, Audit Forms, and My Audits.
Database Persistence: Audit checklists, schedules, tasks, and unit schedule data are persisted to PostgreSQL via dedicated API routes, using a JSONB storage pattern.
Shared/Consolidated Audit System: Supports cross-department audits with per-location auditor assignments, task grouping by groupId, and consolidated PDF reports upon completion.
Cross-Location Audit Scheduling (AuditSchedule.tsx): Enables scheduling audits across multiple locations, assigning teams, and tracking status. Includes "Mark Complete" functionality with score options and gated "Export Unit Report" PDFs.
Corporate Mandate Scheduling Restriction: Corporate/Regional-mandated audits can only be scheduled at the unit level, with higher-level users having read-only access.
Schedule Tab KPI Dashboard: Four summary cards display Total Scheduled, Completed, Overdue, and Average Compliance Score.
Auditor Workload Summary: Collapsible section showing per-auditor metrics.
Enriched Unit Cards: Display compliance score, due dates, last audited dates, completion rates, and risk levels.
Cycle Notes (AuditPeriod.notes): Optional notes field for each audit cycle.
Audit Priority Flags (CrossDeptAudit.priority): Audits can be tagged with High/Medium/Low priority.
Recurring Audit Auto-Suggestion: Suggests scheduling the next cycle upon completion of a published cycle.
Audit Publish Email Intimation: Confirmation modal with email preview for auditors upon publishing a DRAFT cycle, creating tasks, firing in-app notifications, and logging intimations for future email service integration.
Data Structures: types.ts defines TypeScript interfaces for data consistency.
Configuration: constants.tsx stores mock data and configuration.
External Dependencies
UI Libraries: React 19, Tailwind CSS 3, Lucide React, Font Awesome
Charting: recharts
PDF Generation: jspdf
Data Export/Import: exceljs, xlsx
Document Processing: docx, mammoth
Image Manipulation: cropperjs
QR Code Generation: qrcode.react
Artificial Intelligence: @google/genai
