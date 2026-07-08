# Quarterly Report Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a quarterly report generation feature that produces downloadable `.docx` files — both per-fellow individual reports and program-wide summaries — from a new Reports page in the coordinator sidebar.

**Architecture:** Client-side DOCX generation using the `docx` npm package. Shared `QuarterlyReportGenerator` component handles UI and data fetching. Two separate generator functions produce individual vs program-wide documents. New routes for MDRF and MLRF coordinators.

**Tech Stack:** React, Next.js 14, TypeScript, Tailwind CSS, `docx` (npm), existing Firestore data layer

## Global Constraints

- Next.js 14.2.35 App Router with `"use client"` components
- Tailwind CSS 3.4.19 with CSS custom properties for theming
- ISB branding: `#0d1f4b` (navy), `#80edd9` (aquamarine accent)
- Firebase Firestore data layer — reuse existing functions, no new backend
- Both MDRF and MLRF coordinators share the same component with `program` prop
- All components use `use client` directive

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/coordinator/QuarterlyReportGenerator.tsx` | Report config UI, data fetching, generation trigger |
| Create | `src/components/coordinator/reports/individual-report.ts` | DOCX generation for individual fellow reports |
| Create | `src/components/coordinator/reports/program-report.ts` | DOCX generation for program-wide reports |
| Create | `src/app/mdrf-coordinator/reports/page.tsx` | MDRF reports page (thin wrapper) |
| Create | `src/app/mlrf-coordinator/reports/page.tsx` | MLRF reports page (thin wrapper) |
| Modify | `src/components/layout/nav-config.tsx` | Add Reports nav item for coordinator roles |
| Modify | `package.json` | Add `docx` dependency |

---

### Task 1: Install docx dependency

**Covers:** [S6]

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the docx package**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && pnpm add docx`

Expected: `docx` added to dependencies in package.json

- [ ] **Step 2: Verify installation**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && pnpm ls docx`

Expected: `docx@<version>` listed

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add docx package for quarterly report generation"
```

---

### Task 2: Create individual fellow report generator

**Covers:** [S3]

**Files:**
- Create: `src/components/coordinator/reports/individual-report.ts`

**Interfaces:**
- Consumes: `UserProfile`, `WorkLog[]`, `CaseStudy[]`, `SupportRequest[]`, `CourseProgress[]`, date range `{ start: Date, end: Date }`
- Produces: `Blob` (DOCX file)

- [ ] **Step 1: Create the report generator file**

Create `src/components/coordinator/reports/individual-report.ts`:

```typescript
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer, PageNumber, NumberFormat
} from "docx"
import type { UserProfile, WorkLog, CaseStudy, SupportRequest, CourseProgress } from "@/types"
import { COURSES } from "@/lib/constants"

interface IndividualReportData {
  fellow: UserProfile
  logs: WorkLog[]
  caseStudies: CaseStudy[]
  supportRequests: SupportRequest[]
  courseProgress: CourseProgress[]
  startDate: Date
  endDate: Date
  program: string
}

function createTitle(fellow: UserProfile, startDate: Date, endDate: Date, program: string): Paragraph[] {
  const period = `${startDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
  return [
    new Paragraph({ text: "", spacing: { after: 2000 } }),
    new Paragraph({
      children: [new TextRun({ text: program === "mdrf" ? "MDRF Connect" : "MLRF Connect", size: 28, color: "0d1f4b", font: "Calibri" })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    new Paragraph({
      children: [new TextRun({ text: `${period} Quarterly Report`, size: 48, bold: true, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    new Paragraph({
      children: [new TextRun({ text: fellow.name, size: 32, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `${fellow.district} · ${program.toUpperCase()}`, size: 24, color: "666666", font: "Calibri" })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "", spacing: { after: 2000 } }),
  ]
}

function createProfileSection(fellow: UserProfile): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: "Fellow Profile", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Name: ", bold: true, font: "Calibri" }),
        new TextRun({ text: fellow.name, font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "District: ", bold: true, font: "Calibri" }),
        new TextRun({ text: fellow.district, font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Programme: ", bold: true, font: "Calibri" }),
        new TextRun({ text: fellow.program?.toUpperCase() || "N/A", font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total Logs: ", bold: true, font: "Calibri" }),
        new TextRun({ text: String(fellow.totalLogs || 0), font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Current Streak: ", bold: true, font: "Calibri" }),
        new TextRun({ text: `${fellow.streak || 0} weeks`, font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Last Active: ", bold: true, font: "Calibri" }),
        new TextRun({ text: fellow.lastLogDate ? new Date(fellow.lastLogDate).toLocaleDateString() : "N/A", font: "Calibri" }),
      ],
      spacing: { after: 200 },
    }),
  ]
}

function createLogsSection(logs: WorkLog[]): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "Work Logs & Compliance", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
  ]

  if (logs.length === 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: "No work logs recorded for this period.", italic: true, color: "999999", font: "Calibri" })],
      spacing: { after: 200 },
    }))
    return paragraphs
  }

  // Category breakdown
  const categoryCounts: Record<string, number> = {}
  logs.forEach((log) => {
    categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1
  })

  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: "Category Breakdown", bold: true, size: 24, font: "Calibri" })],
    spacing: { before: 200, after: 100 },
  }))

  Object.entries(categoryCounts).forEach(([cat, count]) => {
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `${cat}: `, font: "Calibri" }),
        new TextRun({ text: `${count} logs`, font: "Calibri" }),
      ],
      spacing: { after: 50 },
    }))
  })

  // Log details table
  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: "Detailed Logs", bold: true, size: 24, font: "Calibri" })],
    spacing: { before: 300, after: 100 },
  }))

  const headerRow = new TableRow({
    children: ["Date", "Category", "Type", "Activity"].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri" })] })],
          shading: { type: ShadingType.SOLID, color: "0d1f4b", fill: "0d1f4b" },
          width: { size: 25, type: WidthType.PERCENTAGE },
        })
    ),
  })

  const dataRows = logs.slice(0, 50).map(
    (log) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: new Date(log.date || log.createdAt).toLocaleDateString(), size: 18, font: "Calibri" })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: log.category, size: 18, font: "Calibri" })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: log.type, size: 18, font: "Calibri" })] })],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: log.activityDescription?.slice(0, 100) || "N/A", size: 18, font: "Calibri" })] })],
            width: { size: 45, type: WidthType.PERCENTAGE },
          }),
        ],
      })
  )

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }) // spacer
  )

  paragraphs.push(
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  )

  return paragraphs
}

function createCaseStudiesSection(caseStudies: CaseStudy[]): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "Case Studies & Research", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
  ]

  if (caseStudies.length === 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: "No case studies submitted during this period.", italic: true, color: "999999", font: "Calibri" })],
    }))
    return paragraphs
  }

  caseStudies.forEach((cs) => {
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: cs.title, bold: true, size: 22, font: "Calibri" }),
      ],
      spacing: { before: 150, after: 50 },
    }))
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `Type: ${cs.type.replace(/_/g, " ")} | Status: ${cs.status}`, size: 18, color: "666666", font: "Calibri" }),
      ],
      spacing: { after: 50 },
    }))
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: cs.summary?.slice(0, 200) || "No summary", size: 18, font: "Calibri" })],
      spacing: { after: 100 },
    }))
  })

  return paragraphs
}

function createSupportSection(supportRequests: SupportRequest[]): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "Support Requests", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
  ]

  if (supportRequests.length === 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: "No support requests during this period.", italic: true, color: "999999", font: "Calibri" })],
    }))
    return paragraphs
  }

  const headerRow = new TableRow({
    children: ["Date", "Category", "Urgency", "Status", "Description"].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri" })] })],
          shading: { type: ShadingType.SOLID, color: "0d1f4b", fill: "0d1f4b" },
        })
    ),
  })

  const dataRows = supportRequests.map(
    (req) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: new Date(req.createdAt).toLocaleDateString(), size: 18, font: "Calibri" })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: req.category, size: 18, font: "Calibri" })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: req.urgency, size: 18, font: "Calibri" })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: req.status, size: 18, font: "Calibri" })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: req.description?.slice(0, 80) || "N/A", size: 18, font: "Calibri" })] })],
          }),
        ],
      })
  )

  paragraphs.push(
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  )

  return paragraphs
}

function createLmsSection(courseProgress: CourseProgress[]): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "LMS & Training Progress", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
  ]

  const headerRow = new TableRow({
    children: ["Course", "Status"].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri" })] })],
          shading: { type: ShadingType.SOLID, color: "0d1f4b", fill: "0d1f4b" },
        })
    ),
  })

  const progressMap = new Map(courseProgress.map((cp) => [cp.courseKey, cp.status]))

  const dataRows = COURSES.map(
    (course) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: course.title, size: 18, font: "Calibri" })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: progressMap.get(course.key) || "not_started", size: 18, font: "Calibri" })] })],
          }),
        ],
      })
  )

  paragraphs.push(
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  )

  return paragraphs
}

export async function generateIndividualReport(data: IndividualReportData): Promise<Blob> {
  const { fellow, logs, caseStudies, supportRequests, courseProgress, startDate, endDate, program } = data

  const sections = [
    ...createTitle(fellow, startDate, endDate, program),
    ...createProfileSection(fellow),
    ...createLogsSection(logs),
    ...createCaseStudiesSection(caseStudies),
    ...createSupportSection(supportRequests),
    ...createLmsSection(courseProgress),
  ]

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({ text: "Research Fellow Connect — Quarterly Report", size: 16, color: "999999", font: "Calibri" })],
            alignment: AlignmentType.RIGHT,
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Page ", size: 16, font: "Calibri" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Calibri" }),
            ],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: sections,
    }],
  })

  return Packer.toBlob(doc)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && npx tsc --noEmit src/components/coordinator/reports/individual-report.ts`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/coordinator/reports/individual-report.ts
git commit -m "feat: add individual fellow quarterly report DOCX generator"
```

---

### Task 3: Create program-wide report generator

**Covers:** [S3]

**Files:**
- Create: `src/components/coordinator/reports/program-report.ts`

**Interfaces:**
- Consumes: `UserProfile[]`, `WorkLog[]`, `CaseStudy[]`, `SupportRequest[]`, `CourseProgress[]`, `DistrictStats[]`, date range
- Produces: `Blob` (DOCX file)

- [ ] **Step 1: Create the program report generator**

Create `src/components/coordinator/reports/program-report.ts`:

```typescript
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, ShadingType,
  Header, Footer, PageNumber
} from "docx"
import type { UserProfile, WorkLog, CaseStudy, SupportRequest, CourseProgress } from "@/types"

interface ProgramReportData {
  fellows: UserProfile[]
  logs: WorkLog[]
  caseStudies: CaseStudy[]
  supportRequests: SupportRequest[]
  courseProgress: CourseProgress[]
  startDate: Date
  endDate: Date
  program: string
}

interface DistrictAggregate {
  district: string
  fellowCount: number
  totalLogs: number
  activeFellows: number
}

function createTitle(startDate: Date, endDate: Date, program: string): Paragraph[] {
  const period = `${startDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
  const programLabel = program === "mdrf" ? "MDRF Connect" : "MLRF Connect"
  return [
    new Paragraph({ text: "", spacing: { after: 2000 } }),
    new Paragraph({
      children: [new TextRun({ text: programLabel, size: 28, color: "0d1f4b", font: "Calibri" })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    new Paragraph({
      children: [new TextRun({ text: `${period} Program Summary`, size: 48, bold: true, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    new Paragraph({
      children: [new TextRun({ text: `${program.toUpperCase()} Programme`, size: 24, color: "666666", font: "Calibri" })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "", spacing: { after: 2000 } }),
  ]
}

function createExecutiveSummary(fellows: UserProfile[], logs: WorkLog[], startDate: Date, endDate: Date): Paragraph[] {
  const activeFellows = fellows.filter((f) => f.isActive !== false).length
  const totalLogs = logs.length

  return [
    new Paragraph({
      children: [new TextRun({ text: "Executive Summary", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total Fellows: ", bold: true, font: "Calibri" }),
        new TextRun({ text: String(fellows.length), font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Active Fellows: ", bold: true, font: "Calibri" }),
        new TextRun({ text: String(activeFellows), font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total Work Logs: ", bold: true, font: "Calibri" }),
        new TextRun({ text: String(totalLogs), font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Period: ", bold: true, font: "Calibri" }),
        new TextRun({
          text: `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`,
          font: "Calibri",
        }),
      ],
      spacing: { after: 200 },
    }),
  ]
}

function createDistrictBreakdown(fellows: UserProfile[], logs: WorkLog[]): Paragraph[] {
  const districtMap = new Map<string, { fellowCount: number; totalLogs: number; activeFellows: number }>()

  fellows.forEach((f) => {
    const d = f.district
    if (!districtMap.has(d)) {
      districtMap.set(d, { fellowCount: 0, totalLogs: 0, activeFellows: 0 })
    }
    const agg = districtMap.get(d)!
    agg.fellowCount++
    if (f.isActive !== false) agg.activeFellows++
  })

  logs.forEach((log) => {
    const agg = districtMap.get(log.district)
    if (agg) agg.totalLogs++
  })

  const rows = Array.from(districtMap.entries()).map(
    ([district, agg]) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: district, size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(agg.fellowCount), size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(agg.activeFellows), size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(agg.totalLogs), size: 18, font: "Calibri" })] })] }),
        ],
      })
  )

  return [
    new Paragraph({
      children: [new TextRun({ text: "District Breakdown", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Table({
      rows: [
        new TableRow({
          children: ["District", "Fellows", "Active", "Logs"].map(
            (text) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri" })] })],
                shading: { type: ShadingType.SOLID, color: "0d1f4b", fill: "0d1f4b" },
              })
          ),
        }),
        ...rows,
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
  ]
}

function createCaseStudiesSummary(caseStudies: CaseStudy[]): Paragraph[] {
  const byType: Record<string, number> = {}
  caseStudies.forEach((cs) => {
    byType[cs.type] = (byType[cs.type] || 0) + 1
  })

  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "Case Studies Summary", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total Submissions: ", bold: true, font: "Calibri" }),
        new TextRun({ text: String(caseStudies.length), font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
  ]

  Object.entries(byType).forEach(([type, count]) => {
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `${type.replace(/_/g, " ")}: `, font: "Calibri" }),
        new TextRun({ text: String(count), font: "Calibri" }),
      ],
      spacing: { after: 50 },
    }))
  })

  return paragraphs
}

function createSupportSummary(supportRequests: SupportRequest[]): Paragraph[] {
  const byStatus: Record<string, number> = {}
  supportRequests.forEach((req) => {
    byStatus[req.status] = (byStatus[req.status] || 0) + 1
  })

  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "Support Requests Summary", size: 28, bold: true, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total Requests: ", bold: true, font: "Calibri" }),
        new TextRun({ text: String(supportRequests.length), font: "Calibri" }),
      ],
      spacing: { after: 100 },
    }),
  ]

  Object.entries(byStatus).forEach(([status, count]) => {
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `${status}: `, font: "Calibri" }),
        new TextRun({ text: String(count), font: "Calibri" }),
      ],
      spacing: { after: 50 },
    }))
  })

  return paragraphs
}

export async function generateProgramReport(data: ProgramReportData): Promise<Blob> {
  const { fellows, logs, caseStudies, supportRequests, startDate, endDate, program } = data

  const sections = [
    ...createTitle(startDate, endDate, program),
    ...createExecutiveSummary(fellows, logs, startDate, endDate),
    ...createDistrictBreakdown(fellows, logs),
    ...createCaseStudiesSummary(caseStudies),
    ...createSupportSummary(supportRequests),
  ]

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({ text: "Research Fellow Connect — Program Summary", size: 16, color: "999999", font: "Calibri" })],
            alignment: AlignmentType.RIGHT,
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Page ", size: 16, font: "Calibri" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Calibri" }),
            ],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: sections,
    }],
  })

  return Packer.toBlob(doc)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && npx tsc --noEmit src/components/coordinator/reports/program-report.ts`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/coordinator/reports/program-report.ts
git commit -m "feat: add program-wide quarterly report DOCX generator"
```

---

### Task 4: Create QuarterlyReportGenerator component

**Covers:** [S4, S5]

**Files:**
- Create: `src/components/coordinator/QuarterlyReportGenerator.tsx`

**Interfaces:**
- Props: `{ program: "mdrf" | "mlrf" }`
- Consumes: `UserProfile[]`, Firestore functions
- Produces: Triggers DOCX download

- [ ] **Step 1: Create the shared generator component**

Create `src/components/coordinator/QuarterlyReportGenerator.tsx`:

```tsx
"use client"

import { useState, useEffect } from "react"
import { getFellows, getWeeklyCompliance, getAllTasks } from "@/lib/firestore"
import { getFellows as getFellowsFromFirestore } from "@/lib/firestore"
import type { UserProfile, WorkLog, CaseStudy, SupportRequest, CourseProgress } from "@/types"
import { generateIndividualReport } from "./reports/individual-report"
import { generateProgramReport } from "./reports/program-report"
import { PageHeader } from "@/components/shared/page-header"
import { Download, FileText, Calendar, User, Building2 } from "lucide-react"

type DateMode = "quarter" | "custom"
type ReportType = "individual" | "program"

interface QuarterOption {
  label: string
  value: number
  months: [number, number]
}

const QUARTERS: QuarterOption[] = [
  { label: "Q1 (Jan–Mar)", value: 1, months: [0, 2] },
  { label: "Q2 (Apr–Jun)", value: 2, months: [3, 5] },
  { label: "Q3 (Jul–Sep)", value: 3, months: [6, 8] },
  { label: "Q4 (Oct–Dec)", value: 4, months: [9, 11] },
]

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getDateRange(mode: DateMode, quarter: QuarterOption, year: number, startMonth: number, endMonth: number): { start: Date; end: Date } {
  if (mode === "quarter") {
    return {
      start: new Date(year, quarter.months[0], 1),
      end: new Date(year, quarter.months[1] + 1, 0, 23, 59, 59),
    }
  }
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, endMonth + 1, 0, 23, 59, 59),
  }
}

function getReportTitle(mode: DateMode, quarter: QuarterOption, year: number, startMonth: number, endMonth: number): string {
  if (mode === "quarter") {
    return `${quarter.label} ${year} Report`
  }
  return `${MONTHS[startMonth].slice(0, 3)}–${MONTHS[endMonth].slice(0, 3)} ${year} Report`
}

export function QuarterlyReportGenerator({ program }: { program: "mdrf" | "mlrf" }) {
  const [fellows, setFellows] = useState<UserProfile[]>([])
  const [reportType, setReportType] = useState<ReportType>("individual")
  const [selectedFellow, setSelectedFellow] = useState<string>("")
  const [dateMode, setDateMode] = useState<DateMode>("quarter")
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption>(QUARTERS[0])
  const [year, setYear] = useState(new Date().getFullYear())
  const [startMonth, setStartMonth] = useState(0)
  const [endMonth, setEndMonth] = useState(2)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadFellows()
  }, [program])

  async function loadFellows() {
    const data = await getFellowsFromFirestore(program)
    setFellows(data.filter((f) => f.isActive !== false))
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const { start, end } = getDateRange(dateMode, selectedQuarter, year, startMonth, endMonth)
      const title = getReportTitle(dateMode, selectedQuarter, year, startMonth, endMonth)

      if (reportType === "individual") {
        const fellow = fellows.find((f) => f.id === selectedFellow)
        if (!fellow) return

        // Fetch fellow-specific data
        const logs = await fetchLogsForPeriod(fellow.id, start, end)
        const tasks = await fetchTasksForPeriod(fellow.id, start, end)
        const caseStudies = await fetchCaseStudiesForPeriod(fellow.id, start, end)
        const supportRequests = await fetchSupportForPeriod(fellow.id, start, end)
        const courseProgress = await fetchCourseProgress(fellow.id)

        const blob = await generateIndividualReport({
          fellow,
          logs,
          caseStudies,
          supportRequests,
          courseProgress,
          startDate: start,
          endDate: end,
          program,
        })

        downloadBlob(blob, `${program}-fellow-report-${fellow.name.replace(/\s+/g, "-").toLowerCase()}-${year}.docx`)
      } else {
        // Program-wide report
        const logs = await fetchAllLogsForPeriod(program, start, end)
        const caseStudies = await fetchAllCaseStudiesForPeriod(program, start, end)
        const supportRequests = await fetchAllSupportForPeriod(program, start, end)

        const blob = await generateProgramReport({
          fellows,
          logs,
          caseStudies,
          supportRequests,
          courseProgress: [],
          startDate: start,
          endDate: end,
          program,
        })

        downloadBlob(blob, `${program}-program-report-${year}.docx`)
      }
    } catch (err) {
      console.error("Failed to generate report:", err)
    } finally {
      setGenerating(false)
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Firestore query helpers (simplified — use existing functions where possible)
  async function fetchLogsForPeriod(fellowId: string, start: Date, end: Date): Promise<WorkLog[]> {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    const q = query(
      collection(db, "workLogs"),
      where("fellowId", "==", fellowId),
      where("date", ">=", start.toISOString().split("T")[0]),
      where("date", "<=", end.toISOString().split("T")[0])
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkLog))
  }

  async function fetchTasksForPeriod(fellowId: string, start: Date, end: Date) {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    const q = query(
      collection(db, "tasks"),
      where("fellowId", "==", fellowId),
      where("createdAt", ">=", start.toISOString()),
      where("createdAt", "<=", end.toISOString())
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  async function fetchCaseStudiesForPeriod(fellowId: string, start: Date, end: Date): Promise<CaseStudy[]> {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    const q = query(
      collection(db, "caseStudies"),
      where("authorId", "==", fellowId),
      where("createdAt", ">=", start.toISOString()),
      where("createdAt", "<=", end.toISOString())
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CaseStudy))
  }

  async function fetchSupportForPeriod(fellowId: string, start: Date, end: Date): Promise<SupportRequest[]> {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    const q = query(
      collection(db, "supportRequests"),
      where("fellowId", "==", fellowId),
      where("createdAt", ">=", start.toISOString()),
      where("createdAt", "<=", end.toISOString())
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportRequest))
  }

  async function fetchCourseProgress(fellowId: string): Promise<CourseProgress[]> {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    const q = query(
      collection(db, "courseProgress"),
      where("fellowId", "==", fellowId)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseProgress))
  }

  async function fetchAllLogsForPeriod(program: string, start: Date, end: Date): Promise<WorkLog[]> {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    const q = query(
      collection(db, "workLogs"),
      where("program", "==", program),
      where("date", ">=", start.toISOString().split("T")[0]),
      where("date", "<=", end.toISOString().split("T")[0])
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkLog))
  }

  async function fetchAllCaseStudiesForPeriod(program: string, start: Date, end: Date): Promise<CaseStudy[]> {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    const q = query(
      collection(db, "caseStudies"),
      where("program", "==", program),
      where("createdAt", ">=", start.toISOString()),
      where("createdAt", "<=", end.toISOString())
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CaseStudy))
  }

  async function fetchAllSupportForPeriod(program: string, start: Date, end: Date): Promise<SupportRequest[]> {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    const q = query(
      collection(db, "supportRequests"),
      where("program", "==", program),
      where("createdAt", ">=", start.toISOString()),
      where("createdAt", "<=", end.toISOString())
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportRequest))
  }

  const canGenerate = reportType === "individual" ? !!selectedFellow : true

  return (
    <div>
      <PageHeader
        title="Quarterly Reports"
        description="Generate downloadable .docx reports for fellows or the entire programme."
      />

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">

          {/* Report Type */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-[0.1em] text-[#0d1f4b]/60 mb-3">Report Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "individual" as ReportType, label: "Individual Fellow", icon: User },
                { value: "program" as ReportType, label: "Program Summary", icon: Building2 },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setReportType(value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                    reportType === value
                      ? "border-[#0d1f4b]/20 bg-[#0d1f4b]/[0.03]"
                      : "border-black/[0.06] hover:border-black/[0.12]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${reportType === value ? "text-[#0d1f4b]" : "text-[#7c8698]"}`} />
                  <span className={`text-[13px] font-semibold ${reportType === value ? "text-[#0d1f4b]" : "text-[#5d6f7a]"}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fellow Selector (individual only) */}
          {reportType === "individual" && (
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-[0.1em] text-[#0d1f4b]/60 mb-3">Select Fellow</label>
              <select
                value={selectedFellow}
                onChange={(e) => setSelectedFellow(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-black/[0.08] bg-white text-[13px] text-[#0d1f4b] focus:outline-none focus:border-[#0d1f4b]/30 transition-colors"
              >
                <option value="">Choose a fellow...</option>
                {fellows.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — {f.district}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date Mode */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-[0.1em] text-[#0d1f4b]/60 mb-3">Date Range</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { value: "quarter" as DateMode, label: "Preset Quarter", icon: Calendar },
                { value: "custom" as DateMode, label: "Custom Range", icon: Calendar },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setDateMode(value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                    dateMode === value
                      ? "border-[#0d1f4b]/20 bg-[#0d1f4b]/[0.03]"
                      : "border-black/[0.06] hover:border-black/[0.12]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${dateMode === value ? "text-[#0d1f4b]" : "text-[#7c8698]"}`} />
                  <span className={`text-[13px] font-semibold ${dateMode === value ? "text-[#0d1f4b]" : "text-[#5d6f7a]"}`}>{label}</span>
                </button>
              ))}
            </div>

            {/* Year */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-[#0d1f4b]/50 mb-2">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-black/[0.08] bg-white text-[13px] text-[#0d1f4b] focus:outline-none focus:border-[#0d1f4b]/30"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {dateMode === "quarter" ? (
              <div className="grid grid-cols-2 gap-3">
                {QUARTERS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setSelectedQuarter(q)}
                    className={`p-3 rounded-lg border text-[13px] font-medium transition-all ${
                      selectedQuarter.value === q.value
                        ? "border-[#0d1f4b]/20 bg-[#0d1f4b]/[0.03] text-[#0d1f4b]"
                        : "border-black/[0.06] text-[#5d6f7a] hover:border-black/[0.12]"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0d1f4b]/50 mb-2">Start Month</label>
                  <select
                    value={startMonth}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setStartMonth(v)
                      if (v > endMonth) setEndMonth(v)
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-black/[0.08] bg-white text-[13px] text-[#0d1f4b] focus:outline-none focus:border-[#0d1f4b]/30"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0d1f4b]/50 mb-2">End Month</label>
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-black/[0.08] bg-white text-[13px] text-[#0d1f4b] focus:outline-none focus:border-[#0d1f4b]/30"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i} disabled={i < startMonth}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="w-full h-12 rounded-xl bg-[#0d1f4b] text-white font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-[#131f70] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(13,31,75,0.25)]"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/coordinator/QuarterlyReportGenerator.tsx
git commit -m "feat: add QuarterlyReportGenerator UI component"
```

---

### Task 5: Create MDRF and MLRF report pages

**Covers:** [S5]

**Files:**
- Create: `src/app/mdrf-coordinator/reports/page.tsx`
- Create: `src/app/mlrf-coordinator/reports/page.tsx`

- [ ] **Step 1: Create MDRF reports page**

Create `src/app/mdrf-coordinator/reports/page.tsx`:

```tsx
import { QuarterlyReportGenerator } from "@/components/coordinator/QuarterlyReportGenerator"

export default function MdrfReportsPage() {
  return <QuarterlyReportGenerator program="mdrf" />
}
```

- [ ] **Step 2: Create MLRF reports page**

Create `src/app/mlrf-coordinator/reports/page.tsx`:

```tsx
import { QuarterlyReportGenerator } from "@/components/coordinator/QuarterlyReportGenerator"

export default function MlrfReportsPage() {
  return <QuarterlyReportGenerator program="mlrf" />
}
```

- [ ] **Step 3: Verify build**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && npx next build 2>&1 | Select-String -Pattern "error|Error|✓|✗"`

Expected: `Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add src/app/mdrf-coordinator/reports/page.tsx src/app/mlrf-coordinator/reports/page.tsx
git commit -m "feat: add MDRF and MLRF quarterly reports pages"
```

---

### Task 6: Add Reports to coordinator sidebar navigation

**Covers:** [S5]

**Files:**
- Modify: `src/components/layout/nav-config.tsx`

- [ ] **Step 1: Add Reports nav item**

Open `src/components/layout/nav-config.tsx` and add a Reports entry to the coordinator nav items. The item should:
- Label: "Reports"
- Icon: `FileText` (from lucide-react)
- Path: `/mdrf-coordinator/reports` or `/mlrf-coordinator/reports`
- Position: after Case Studies, before Support

Find the coordinator nav items array and add:

```typescript
{
  label: "Reports",
  icon: FileText,
  path: `/${program}-coordinator/reports`,
},
```

- [ ] **Step 2: Verify build**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && npx next build 2>&1 | Select-String -Pattern "error|Error|✓|✗"`

Expected: `Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/nav-config.tsx
git commit -m "feat: add Reports to coordinator sidebar navigation"
```

---

### Task 7: Final verification

**Covers:** [S8]

- [ ] **Step 1: Full build check**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && npx next build`

Expected: Build succeeds, all routes compile, no type errors

- [ ] **Step 2: Verify routes exist**

Run: `cd "D:\OneDrive - Indian School of Business\Documents\MDRF Apps" && npx next build 2>&1 | Select-String -Pattern "reports"`

Expected: `/mdrf-coordinator/reports` and `/mlrf-coordinator/reports` listed in route table

- [ ] **Step 3: Final commit if needed**

```bash
git add -A
git commit -m "chore: quarterly report feature complete"
```
