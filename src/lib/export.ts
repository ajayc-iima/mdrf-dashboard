import type { Program, UserProfile, WorkLog } from "@/types"
import {
  getWorkLogs, getFellows, getWeeklyCompliance, getSupportRequests,
  getCaseStudies, getAllFellowsCourseProgress, getDailyActivity, getCategoryStats,
} from "./firestore"
import { getMonthRange, getWeekKey, formatDate } from "./utils"
import { WEEKLY_LOG_TARGET } from "./constants"

export interface ExportSheet {
  name: string
  data: Record<string, any>[]
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function fmt(date: Date | null | undefined): string {
  if (!date) return ""
  return formatDate(date)
}

function weeksInRange(from: Date, to: Date): string[] {
  const weeks: string[] = []
  const d = new Date(from)
  while (d <= to) {
    weeks.push(getWeekKey(d))
    d.setDate(d.getDate() + 7)
  }
  return weeks
}

/** Build a complete monthly report (multi-sheet) for a programme. */
export async function buildMonthlyExport(
  program: Program,
  year: number,
  month: number,
): Promise<ExportSheet[]> {
  const [from, to] = getMonthRange(year, month)
  const monthLabel = `${MONTH_NAMES[month]} ${year}`
  const target = WEEKLY_LOG_TARGET

  const [logs, fellows, support, cases, courses, daily, categories] = await Promise.all([
    getWorkLogs({ program, startDate: from, endDate: to, limitCount: 10000 }),
    getFellows(program),
    getSupportRequests({ program }),
    getCaseStudies({ program }),
    getAllFellowsCourseProgress(program),
    getDailyActivity(program, 31),
    getCategoryStats(program, from, to),
  ])

  const monthLogs = logs.filter((l) => l.date >= from && l.date <= to)
  const monthSupport = support.filter((s) => s.createdAt >= from && s.createdAt <= to)
  const monthCases = cases.filter((c) => c.createdAt >= from && c.createdAt <= to)

  // ── Sheet: Summary ──
  const summary = [
    { Metric: "Programme", Value: program.toUpperCase() },
    { Metric: "Month", Value: monthLabel },
    { Metric: "Fellows (registered)", Value: fellows.length },
    { Metric: "Work logs this month", Value: monthLogs.length },
    { Metric: "Support requests this month", Value: monthSupport.length },
    { Metric: "Case studies this month", Value: monthCases.length },
    { Metric: "Weekly log target", Value: target },
  ]

  // ── Sheet: Work Logs ──
  const workLogRows = monthLogs.map((l: WorkLog) => ({
    Date: fmt(l.date),
    Week: l.weekKey,
    Fellow: l.fellowName,
    District: l.district,
    Constituency: l.constituency,
    Category: l.category,
    Status: l.type,
    "Activity Description": l.activityDescription,
    "Output / Deliverable": l.outputDeliverable,
  }))

  // ── Sheet: Fellows ──
  const fellowRows = fellows.map((f: UserProfile) => ({
    Name: f.name,
    Email: f.email,
    District: f.district,
    Constituencies: f.constituencies?.join(", ") || "",
    "Total Logs": f.totalLogs || 0,
    Streak: f.streak || 0,
    "Last Active": fmt(f.lastLogDate),
    Active: f.isActive ? "Yes" : "No",
  }))

  // ── Sheet: Weekly Compliance ──
  const weeks = weeksInRange(from, to)
  const complianceRows: Record<string, any>[] = []
  for (const week of weeks) {
    const comp = await getWeeklyCompliance(week, program, target)
    for (const c of comp) {
      complianceRows.push({
        Week: week,
        Fellow: c.fellow.name,
        District: c.fellow.district,
        "Logs This Week": c.logCount,
        "Met Target": c.metTarget ? "Yes" : "No",
        Workload: c.pressure || "",
      })
    }
  }

  // ── Sheet: Support Requests ──
  const supportRows = monthSupport.map((s) => ({
    Date: fmt(s.createdAt),
    Fellow: s.fellowName,
    District: s.district,
    Category: s.category,
    Type: s.requestType || "",
    Urgency: s.urgency,
    Status: s.status,
    Description: s.description,
    "Resolved At": fmt(s.resolvedAt),
  }))

  // ── Sheet: Case Studies ──
  const caseRows = monthCases.map((c) => ({
    Date: fmt(c.createdAt),
    Title: c.title,
    Type: c.type,
    Author: c.authorName,
    District: c.district,
    Status: c.status,
    Tags: c.tags?.join(", ") || "",
  }))

  // ── Sheet: Course Progress (rollup) ──
  const courseStatusCount: Record<string, number> = {}
  for (const cp of courses) {
    courseStatusCount[cp.status] = (courseStatusCount[cp.status] || 0) + 1
  }
  const courseRows = Object.entries(courseStatusCount).map(([status, count]) => ({
    "Course Status": status,
    Count: count,
  }))

  // ── Sheet: Daily Activity (filtered to month) ──
  const dailyRows = daily
    .filter((d) => {
      const dt = new Date(d.date)
      return dt >= from && dt <= to
    })
    .map((d) => ({ Date: d.date, "Work Logs": d.count }))

  // ── Sheet: Category Breakdown ──
  const categoryRows = Object.entries(categories).map(([cat, count]) => ({
    Category: cat,
    "Work Logs": count,
  }))

  return [
    { name: "Summary", data: summary },
    { name: "Work Logs", data: workLogRows },
    { name: "Fellows", data: fellowRows },
    { name: "Weekly Compliance", data: complianceRows },
    { name: "Support Requests", data: supportRows },
    { name: "Case Studies", data: caseRows },
    { name: "Course Progress", data: courseRows },
    { name: "Daily Activity", data: dailyRows },
    { name: "Categories", data: categoryRows },
  ]
}
