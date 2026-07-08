import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, ShadingType,
  Header, Footer, PageNumber
} from "docx"
import type { UserProfile, WorkLog, CaseStudy, SupportRequest, CourseProgress } from "@/types"

type DocElement = Paragraph | Table

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

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 28, bold: true, font: "Calibri" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  })
}

function label(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: "Calibri" }),
      new TextRun({ text: value, font: "Calibri" }),
    ],
    spacing: { after: 100 },
  })
}

function createTitle(startDate: Date, endDate: Date, program: string): DocElement[] {
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

function createExecutiveSummary(fellows: UserProfile[], logs: WorkLog[], startDate: Date, endDate: Date): DocElement[] {
  const activeFellows = fellows.filter((f) => f.isActive !== false).length
  const totalLogs = logs.length

  return [
    heading("Executive Summary"),
    label("Total Fellows", String(fellows.length)),
    label("Active Fellows", String(activeFellows)),
    label("Total Work Logs", String(totalLogs)),
    label("Period", `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`),
    new Paragraph({ text: "", spacing: { after: 200 } }),
  ]
}

function createDistrictBreakdown(fellows: UserProfile[], logs: WorkLog[]): DocElement[] {
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
    heading("District Breakdown"),
    new Table({
      rows: [
        new TableRow({
          children: ["District", "Fellows", "Active", "Logs"].map(
            (text) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "FFFFFF" })] })],
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

function createCaseStudiesSummary(caseStudies: CaseStudy[]): DocElement[] {
  const byType: Record<string, number> = {}
  caseStudies.forEach((cs) => {
    byType[cs.type] = (byType[cs.type] || 0) + 1
  })

  const elements: DocElement[] = [
    heading("Case Studies Summary"),
    label("Total Submissions", String(caseStudies.length)),
  ]

  Object.entries(byType).forEach(([type, count]) => {
    elements.push(new Paragraph({
      children: [
        new TextRun({ text: `${type.replace(/_/g, " ")}: `, font: "Calibri" }),
        new TextRun({ text: String(count), font: "Calibri" }),
      ],
      spacing: { after: 50 },
    }))
  })

  return elements
}

function createSupportSummary(supportRequests: SupportRequest[]): DocElement[] {
  const byStatus: Record<string, number> = {}
  supportRequests.forEach((req) => {
    byStatus[req.status] = (byStatus[req.status] || 0) + 1
  })

  const elements: DocElement[] = [
    heading("Support Requests Summary"),
    label("Total Requests", String(supportRequests.length)),
  ]

  Object.entries(byStatus).forEach(([status, count]) => {
    elements.push(new Paragraph({
      children: [
        new TextRun({ text: `${status}: `, font: "Calibri" }),
        new TextRun({ text: String(count), font: "Calibri" }),
      ],
      spacing: { after: 50 },
    }))
  })

  return elements
}

export async function generateProgramReport(data: ProgramReportData): Promise<Blob> {
  const { fellows, logs, caseStudies, supportRequests, startDate, endDate, program } = data

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
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
      children: [
        ...createTitle(startDate, endDate, program),
        ...createExecutiveSummary(fellows, logs, startDate, endDate),
        ...createDistrictBreakdown(fellows, logs),
        ...createCaseStudiesSummary(caseStudies),
        ...createSupportSummary(supportRequests),
      ],
    }],
  })

  return Packer.toBlob(doc)
}
