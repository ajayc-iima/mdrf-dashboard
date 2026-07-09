import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { WEEKLY_DEADLINE } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

/** Green = logged recently, yellow = slipping, red = silent. */
export function getWorkloadStatus(lastLogDate: Date | null): "green" | "yellow" | "red" {
  if (!lastLogDate) return "red"
  const daysSince = (Date.now() - lastLogDate.getTime()) / 86400000
  if (daysSince < 2) return "green"
  if (daysSince < 4) return "yellow"
  return "red"
}

// ─── ISO week helpers ─────────────────────────────────────────────

/** Returns ISO week key like "2026-W27" (Monday-anchored). */
export function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = (d.getUTCDay() + 6) % 7 // Mon=0 .. Sun=6
  d.setUTCDate(d.getUTCDate() - day + 3) // Thursday of this ISO week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(
    ((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  )
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

export function getCurrentWeekKey(): string {
  return getWeekKey(new Date())
}

/** [start, end] Date for a week key (Mon 00:00 → Sun 23:59 local). */
export function getWeekRange(weekKey: string): [Date, Date] {
  const [yearStr, weekStr] = weekKey.split("-W")
  const year = Number(yearStr)
  const week = Number(weekStr)
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const dow = (simple.getUTCDay() + 6) % 7
  const monday = new Date(simple)
  monday.setUTCDate(simple.getUTCDate() - dow)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)
  return [monday, sunday]
}

/** Human label for a week key, e.g. "7–13 Jul". */
export function formatWeekRange(weekKey: string): string {
  const [start, end] = getWeekRange(weekKey)
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(d)
  return `${fmt(start)}–${fmt(end)}`
}

/** Whole days until this week's deadline (can be negative = overdue). */
export function daysUntilDeadline(now = new Date()): number {
  const d = new Date(now)
  const currentDay = d.getDay() // 0=Sun..6=Sat
  let diff = (WEEKLY_DEADLINE.day - currentDay + 7) % 7
  if (diff === 0) {
    // same weekday — check if we're already past the hour
    const minutesIntoDay = d.getHours() * 60 + d.getMinutes()
    if (minutesIntoDay > WEEKLY_DEADLINE.hour * 60 + WEEKLY_DEADLINE.minute) {
      diff = 7
    }
  }
  return diff
}

/** Human countdown string for the weekly deadline. */
export function deadlineCountdown(now = new Date()): string {
  const days = daysUntilDeadline(now)
  const target = new Date(now)
  target.setDate(target.getDate() + days)
  target.setHours(WEEKLY_DEADLINE.hour, WEEKLY_DEADLINE.minute, 0, 0)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return "Deadline passed — submit now"
  const d = Math.floor(diffMs / 86400000)
  const h = Math.floor((diffMs % 86400000) / 3600000)
  if (d > 0) return `${d}d ${h}h left this week`
  const m = Math.floor((diffMs % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

// ─── Export helpers ───────────────────────────────────────────────

export async function downloadCSV(data: any[], filename: string) {
  const Papa = (await import("papaparse")).default
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

export async function downloadExcel(data: any[], filename: string) {
  const XLSX = await import("xlsx")
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/** Build an .xlsx workbook with multiple named sheets (ideal for monthly reports). */
export async function downloadMultiSheetExcel(sheets: { name: string; data: any[] }[], filename: string) {
  const XLSX = await import("xlsx")
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.data.length ? s.data : [{ "": "No data" }])
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  }
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/** [start, end] covering a calendar month (local time). */
export function getMonthRange(year: number, month: number): [Date, Date] {
  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return [start, end]
}

/** "2026-07" -> { year, monthIndex }. */
export function parseMonthValue(value: string): { year: number; month: number } {
  const [y, m] = value.split("-").map(Number)
  return { year: y, month: m - 1 }
}
