"use client"

import { useState, useEffect } from "react"
import { getFellows } from "@/lib/firestore"
import type { UserProfile, WorkLog, CaseStudy, SupportRequest, CourseProgress } from "@/types"
import { generateIndividualReport } from "./reports/individual-report"
import { generateProgramReport } from "./reports/program-report"
import { PageHeader } from "@/components/shared/page-header"
import { Download, Calendar, User, Building2 } from "lucide-react"

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

async function fetchDocs<T>(collectionName: string, ...constraints: any[]): Promise<T[]> {
  const { collection, query, getDocs } = await import("firebase/firestore")
  const { db } = await import("@/lib/firebase")
  const q = query(collection(db, collectionName), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
}

export function QuarterlyReportGenerator({ program }: { program: "mdrf" | "mlrf" }) {
  const [fellows, setFellows] = useState<UserProfile[]>([])
  const [reportType, setReportType] = useState<ReportType>("individual")
  const [selectedFellow, setSelectedFellow] = useState("")
  const [dateMode, setDateMode] = useState<DateMode>("quarter")
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption>(QUARTERS[0])
  const [year, setYear] = useState(new Date().getFullYear())
  const [startMonth, setStartMonth] = useState(0)
  const [endMonth, setEndMonth] = useState(2)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    getFellows(program).then((data) => {
      setFellows(data.filter((f) => f.isActive !== false))
    })
  }, [program])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const { start, end } = getDateRange(dateMode, selectedQuarter, year, startMonth, endMonth)
      const { where } = await import("firebase/firestore")

      if (reportType === "individual") {
        const fellow = fellows.find((f) => f.id === selectedFellow)
        if (!fellow) return

        const [logs, caseStudies, supportRequests, courseProgress] = await Promise.all([
          fetchDocs<WorkLog>("workLogs", where("fellowId", "==", fellow.id), where("date", ">=", start.toISOString().split("T")[0]), where("date", "<=", end.toISOString().split("T")[0])),
          fetchDocs<CaseStudy>("caseStudies", where("authorId", "==", fellow.id), where("createdAt", ">=", start.toISOString()), where("createdAt", "<=", end.toISOString())),
          fetchDocs<SupportRequest>("supportRequests", where("fellowId", "==", fellow.id), where("createdAt", ">=", start.toISOString()), where("createdAt", "<=", end.toISOString())),
          fetchDocs<CourseProgress>("courseProgress", where("fellowId", "==", fellow.id)),
        ])

        const blob = await generateIndividualReport({ fellow, logs, caseStudies, supportRequests, courseProgress, startDate: start, endDate: end, program })
        downloadBlob(blob, `${program}-fellow-report-${fellow.name.replace(/\s+/g, "-").toLowerCase()}-${year}.docx`)
      } else {
        const [logs, caseStudies, supportRequests] = await Promise.all([
          fetchDocs<WorkLog>("workLogs", where("program", "==", program), where("date", ">=", start.toISOString().split("T")[0]), where("date", "<=", end.toISOString().split("T")[0])),
          fetchDocs<CaseStudy>("caseStudies", where("program", "==", program), where("createdAt", ">=", start.toISOString()), where("createdAt", "<=", end.toISOString())),
          fetchDocs<SupportRequest>("supportRequests", where("program", "==", program), where("createdAt", ">=", start.toISOString()), where("createdAt", "<=", end.toISOString())),
        ])

        const blob = await generateProgramReport({ fellows, logs, caseStudies, supportRequests, courseProgress: [], startDate: start, endDate: end, program })
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

  const canGenerate = reportType === "individual" ? !!selectedFellow : true

  return (
    <div>
      <PageHeader
        title="Quarterly Reports"
        description="Generate downloadable .docx reports for fellows or the entire programme."
      />

      <div className="max-w-2xl mt-6">
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

          {/* Fellow Selector */}
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
                { value: "quarter" as DateMode, label: "Preset Quarter" },
                { value: "custom" as DateMode, label: "Custom Range" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDateMode(value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                    dateMode === value
                      ? "border-[#0d1f4b]/20 bg-[#0d1f4b]/[0.03]"
                      : "border-black/[0.06] hover:border-black/[0.12]"
                  }`}
                >
                  <Calendar className={`w-5 h-5 ${dateMode === value ? "text-[#0d1f4b]" : "text-[#7c8698]"}`} />
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
