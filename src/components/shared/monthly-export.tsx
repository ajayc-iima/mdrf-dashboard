"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { downloadCSV, downloadMultiSheetExcel, parseMonthValue } from "@/lib/utils"
import type { ExportSheet } from "@/lib/export"

export function MonthlyExportButton({
  label = "Export",
  build,
}: {
  label?: string
  /** Receives the chosen year/month (0-indexed) and returns export sheets. */
  build: (year: number, month: number) => Promise<ExportSheet[]>
}) {
  const now = new Date()
  const [value, setValue] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  )
  const [busy, setBusy] = useState<null | "csv" | "xlsx">(null)
  const [open, setOpen] = useState(false)

  async function run(fmt: "csv" | "xlsx") {
    setBusy(fmt)
    try {
      const { year, month } = parseMonthValue(value)
      const sheets = await build(year, month)
      const file = `mdrf-report-${value}`
      if (fmt === "csv") {
        // CSV: primary sheet (Work Logs) for spreadsheet-friendly single file.
        const primary = sheets.find((s) => s.name === "Work Logs") || sheets[0]
        await downloadCSV(primary.data, file)
      } else {
        await downloadMultiSheetExcel(sheets, file)
      }
      setOpen(false)
    } catch (e) {
      console.error("Export failed", e)
      alert("Export failed. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-semibold text-[hsl(var(--navy))] shadow-sm transition hover:bg-[hsl(var(--bg-muted))]"
      >
        <Download className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-black/10 bg-white p-3 shadow-xl">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--text-3))]">
            Report month
          </label>
          <input
            type="month"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1.5 text-[13px] outline-none focus:border-[hsl(var(--navy))]/40"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => run("xlsx")}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--navy))] px-2 py-2 text-[12px] font-semibold text-white transition hover:bg-[hsl(var(--navy))]/90 disabled:opacity-50"
            >
              {busy === "xlsx" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              Excel
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => run("csv")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-white px-2 py-2 text-[12px] font-semibold text-[hsl(var(--navy))] transition hover:bg-[hsl(var(--bg-muted))] disabled:opacity-50"
            >
              {busy === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
