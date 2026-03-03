# HACCP PRO - Food Safety Management System

## Overview
Enterprise-grade food safety management dashboard built with Next.js 15. Features login, compliance monitoring, hierarchical data management, audit scheduling, stock management, and more.

## Tech Stack
- **Framework**: Next.js 15.1.0 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 3, Lucide React icons, Font Awesome
- **Libraries**: recharts (charts), jspdf/html2canvas (PDF), exceljs/xlsx (Excel), docx/mammoth (Word docs), cropperjs (image cropping), qrcode.react (QR codes), @google/genai (AI)

## Project Structure
- `app/` - Next.js App Router (layout.tsx, page.tsx, globals.css)
- `components/` - React components (ClientApp.tsx is the main entry)
  - `RecipeCalculation.tsx` - Recipe Calculation module with Ingredients & Recipe tabs, recipe maker, CSV import with fuzzy matching, nutrition calculations
  - `Nutrilator.tsx` - Simple nutritional calculator
- `constants.tsx` - Mock data and configuration constants (NAVIGATION_ITEMS defines sidebar tabs)
- `types.ts` - TypeScript type definitions
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration

## Development
- Run: `npm run dev` (starts on port 5000, host 0.0.0.0)
- Build: `npm run build`
- Production: `npm run start`

## Deployment
- Target: Autoscale
- Build: `npm run build`
- Run: `npm run start -- -H 0.0.0.0 -p 5000`
