# Quarterly Report Generator — Design Spec

## [S1] Problem

Coordinators currently have no way to generate structured quarterly reports for fellows or the program. A Python `.docx` template exists but is disconnected from the web app. The only export options are CSV (work logs) from the Overview page. Coordinators need a built-in way to produce professional quarterly reports directly from the platform.

## [S2] Solution Overview

A new **Reports** page in the coordinator sidebar that generates downloadable `.docx` quarterly reports on-demand. Supports two report types:

1. **Individual Fellow Report** — per-fellow summary covering their work, compliance, research, support, and training
2. **Program-Wide Summary Report** — aggregate view covering all fellows, districts, compliance trends, and activity

Reports are generated client-side using the `docx` npm package. No server-side processing required.

## [S3] Report Types

### Individual Fellow Report

| Section | Content |
|---------|---------|
| Fellow Profile | Name, email, district, constituencies, programme, total logs, streak, last active, badges |
| Work Logs & Compliance | Week-by-week logs, compliance rate vs target, work category breakdown (research, fieldwork, report, admin, capacity, other) |
| Case Studies & Research | Submitted case studies, policy briefs, field breakthroughs with title, type, status, date |
| Support Requests | Requests made by the fellow during the quarter with urgency, status, and resolution date |
| LMS & Training | Course completion status for all 10 modules (not started / in progress / done) |

### Program-Wide Summary Report

| Section | Content |
|---------|---------|
| Executive Summary | Total fellows, active fellows, overall compliance rate, total logs, date range |
| District Breakdown | Per-district table: fellow count, total logs, average compliance |
| Compliance Trends | Weekly compliance rates over the date range (table format) |
| Case Studies Summary | Submissions by type and district |
| Support Summary | Requests by status (open / in-progress / resolved) and urgency |
| LMS Completion | Aggregate course completion rates |

## [S4] Date Selection

Two modes, user picks one:

1. **Preset Quarters** — Q1 (Jan–Mar), Q2 (Apr–Jun), Q3 (Jul–Sep), Q4 (Oct–Dec) with year dropdown
2. **Custom Range** — Start Month + End Month + Year selectors

Report title updates dynamically:
- Preset: "Q1 2026 Quarterly Report — MDRF"
- Custom: "Feb–May 2026 Report — MDRF"

## [S5] UI Design

### Page Layout

- Full-width card-based layout matching existing coordinator pages
- PageHeader with title "Quarterly Reports"
- Configuration card with:
  - Report Type toggle: Individual | Program-Wide
  - If Individual: Fellow selector dropdown (filtered to active fellows)
  - Date Mode toggle: Preset Quarter | Custom Range
  - Date selectors (quarter picker OR month range)
  - Generate Report button
- Preview section below showing what will be included (optional, stretch goal)

### Sidebar Navigation

- New item: **Reports** (FileText icon)
- Added to both MDRF and MLRF coordinator nav configs
- Position: after Case Studies, before Support

## [S6] Technical Architecture

### New Dependencies

```
npm install docx
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/coordinator/QuarterlyReportGenerator.tsx` | Shared report generation UI and logic |
| `src/components/coordinator/reports/individual-report.ts` | DOCX generation for individual fellow reports |
| `src/components/coordinator/reports/program-report.ts` | DOCX generation for program-wide reports |
| `src/app/mdrf-coordinator/reports/page.tsx` | MDRF reports page |
| `src/app/mlrf-coordinator/reports/page.tsx` | MLRF reports page |

### Modified Files

| File | Change |
|------|--------|
| `src/components/layout/nav-config.tsx` | Add Reports nav item for coordinator roles |
| `package.json` | Add `docx` dependency |

### Data Flow

1. User selects report type, fellow (if individual), and date range
2. Component fetches data using existing Firestore functions:
   - `getWeeklyCompliance(weekKey, program, target)` — for each week in range
   - `getCategoryStats(program, startDate, endDate)` — work category breakdown
   - `getDistrictStats(program)` — district-level aggregates
   - Firestore queries for `caseStudies`, `supportRequests`, `courseProgress` filtered by date range and fellow/program
3. Data is assembled into `docx` document sections
4. Document is serialized to `.docx` and downloaded via Blob URL

### DOCX Structure

```
Document
├── Title Page
│   ├── Programme name (MDRF Connect / MLRF Connect)
│   ├── Report period (Q1 2026 / Feb–May 2026)
│   └── Fellow name (if individual) / "Program Summary"
├── Fellow Profile (individual only)
│   ├── Name, district, programme
│   ├── Stats: total logs, streak, badges
├── Work Logs & Compliance
│   ├── Weekly compliance table
│   └── Category breakdown chart (as text table)
├── Case Studies & Research
│   ├── List of submissions with type and status
├── Support Requests
│   ├── List with urgency and status
├── LMS & Training
│   ├── Course completion status table
└── Footer
    └── Generated by Research Fellow Connect
```

## [S7] Error Handling

- Empty data: Show "No data available for this period" in report sections
- Missing fellow: Validate fellow selection before generating
- Generation failure: Toast notification with error message
- Large datasets: Generate in chunks if needed (unlikely for quarterly data)

## [S8] Testing

- Generate individual report for a fellow with work logs → verify DOCX opens and contains correct data
- Generate program-wide report → verify aggregate numbers match coordinator dashboard
- Test with empty quarter → verify graceful empty sections
- Test date range spanning multiple quarters
- Test both MDRF and MLRF coordinator access
