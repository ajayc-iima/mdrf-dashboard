import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, ShadingType,
  Header, Footer, PageNumber
} from "docx"
import type { UserProfile, WorkLog, CaseStudy, SupportRequest, CourseProgress } from "@/types"
import { COURSES } from "@/lib/constants"

type DocElement = Paragraph | Table

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

function emptyNote(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, color: "999999", font: "Calibri" })],
    spacing: { after: 200 },
  })
}

function createTitlePage(fellow: UserProfile, startDate: Date, endDate: Date, program: string): DocElement[] {
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

function createProfileSection(fellow: UserProfile): DocElement[] {
  return [
    heading("Fellow Profile"),
    label("Name", fellow.name),
    label("District", fellow.district),
    label("Programme", fellow.program?.toUpperCase() || "N/A"),
    label("Total Logs", String(fellow.totalLogs || 0)),
    label("Current Streak", `${fellow.streak || 0} weeks`),
    label("Last Active", fellow.lastLogDate ? new Date(fellow.lastLogDate).toLocaleDateString() : "N/A"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
  ]
}

function createLogsSection(logs: WorkLog[]): DocElement[] {
  const elements: DocElement[] = [heading("Work Logs & Compliance")]

  if (logs.length === 0) {
    elements.push(emptyNote("No work logs recorded for this period."))
    return elements
  }

  // Category breakdown
  const categoryCounts: Record<string, number> = {}
  logs.forEach((log) => {
    categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1
  })

  elements.push(new Paragraph({
    children: [new TextRun({ text: "Category Breakdown", bold: true, size: 24, font: "Calibri" })],
    spacing: { before: 200, after: 100 },
  }))

  Object.entries(categoryCounts).forEach(([cat, count]) => {
    elements.push(new Paragraph({
      children: [
        new TextRun({ text: `${cat}: `, font: "Calibri" }),
        new TextRun({ text: `${count} logs`, font: "Calibri" }),
      ],
      spacing: { after: 50 },
    }))
  })

  // Log details table
  elements.push(new Paragraph({
    children: [new TextRun({ text: "Detailed Logs", bold: true, size: 24, font: "Calibri" })],
    spacing: { before: 300, after: 100 },
  }))

  const headerRow = new TableRow({
    children: ["Date", "Category", "Type", "Activity"].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "FFFFFF" })] })],
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

  elements.push(new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  }))

  return elements
}

function createCaseStudiesSection(caseStudies: CaseStudy[]): DocElement[] {
  const elements: DocElement[] = [heading("Case Studies & Research")]

  if (caseStudies.length === 0) {
    elements.push(emptyNote("No case studies submitted during this period."))
    return elements
  }

  caseStudies.forEach((cs) => {
    elements.push(new Paragraph({
      children: [new TextRun({ text: cs.title, bold: true, size: 22, font: "Calibri" })],
      spacing: { before: 150, after: 50 },
    }))
    elements.push(new Paragraph({
      children: [new TextRun({ text: `Type: ${cs.type.replace(/_/g, " ")} | Status: ${cs.status}`, size: 18, color: "666666", font: "Calibri" })],
      spacing: { after: 50 },
    }))
    elements.push(new Paragraph({
      children: [new TextRun({ text: cs.summary?.slice(0, 200) || "No summary", size: 18, font: "Calibri" })],
      spacing: { after: 100 },
    }))
  })

  return elements
}

function createSupportSection(supportRequests: SupportRequest[]): DocElement[] {
  const elements: DocElement[] = [heading("Support Requests")]

  if (supportRequests.length === 0) {
    elements.push(emptyNote("No support requests during this period."))
    return elements
  }

  const headerRow = new TableRow({
    children: ["Date", "Category", "Urgency", "Status", "Description"].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "FFFFFF" })] })],
          shading: { type: ShadingType.SOLID, color: "0d1f4b", fill: "0d1f4b" },
        })
    ),
  })

  const dataRows = supportRequests.map(
    (req) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Date(req.createdAt).toLocaleDateString(), size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: req.category, size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: req.urgency, size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: req.status, size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: req.description?.slice(0, 80) || "N/A", size: 18, font: "Calibri" })] })] }),
        ],
      })
  )

  elements.push(new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  }))

  return elements
}

function createLmsSection(courseProgress: CourseProgress[]): DocElement[] {
  const elements: DocElement[] = [heading("LMS & Training Progress")]

  const headerRow = new TableRow({
    children: ["Course", "Status"].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "FFFFFF" })] })],
          shading: { type: ShadingType.SOLID, color: "0d1f4b", fill: "0d1f4b" },
        })
    ),
  })

  const progressMap = new Map(courseProgress.map((cp) => [cp.courseKey, cp.status]))

  const dataRows = COURSES.map(
    (course) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: course.title, size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: progressMap.get(course.key) || "not_started", size: 18, font: "Calibri" })] })] }),
        ],
      })
  )

  elements.push(new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  }))

  return elements
}

export async function generateIndividualReport(data: IndividualReportData): Promise<Blob> {
  const { fellow, logs, caseStudies, supportRequests, courseProgress, startDate, endDate, program } = data

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
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
      children: [
        ...createTitlePage(fellow, startDate, endDate, program),
        ...createProfileSection(fellow),
        ...createLogsSection(logs),
        ...createCaseStudiesSection(caseStudies),
        ...createSupportSection(supportRequests),
        ...createLmsSection(courseProgress),
      ],
    }],
  })

  return Packer.toBlob(doc)
}
