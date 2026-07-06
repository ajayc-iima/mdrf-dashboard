"use client"

import { useState, useEffect } from "react"
import { getWorkLogs, getTasks, getSupportRequests, getCaseStudies, getCourseProgress, getFellows } from "@/lib/firestore"
import { getCurrentWeekKey } from "@/lib/utils"
import type { WorkLog, Task, SupportRequest, CaseStudy, CourseProgress, UserProfile, Program } from "@/types"

/** Returns the current week's log count for a fellow. */
export function useWeekLogCount(fellowId?: string) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!fellowId) return
    getWorkLogs({ fellowId, weekKey: getCurrentWeekKey(), limitCount: 50 }).then((l) => setCount(l.length))
  }, [fellowId])
  return count
}

/** Returns [logs, tasks] for a fellow. */
export function useFellowData(fellowId?: string) {
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fellowId) { setLoading(false); return }
    Promise.all([
      getWorkLogs({ fellowId, limitCount: 50 }),
      getTasks(fellowId),
    ]).then(([l, t]) => { setLogs(l); setTasks(t); setLoading(false) })
  }, [fellowId])

  return { logs, tasks, loading }
}

/** Returns all fellows in a programme. */
export function useFellows(program?: Program) {
  const [fellows, setFellows] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getFellows(program).then((f) => { setFellows(f); setLoading(false) })
  }, [program])
  return { fellows, loading }
}

/** Returns open support requests. */
export function useOpenRequests(program?: Program) {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getSupportRequests({ program, status: "open" }).then((r) => { setRequests(r); setLoading(false) })
  }, [program])
  return { requests, loading }
}

/** Returns case studies with optional filters. */
export function useCaseStudies(filters?: { program?: Program; authorId?: string }) {
  const [cases, setCases] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getCaseStudies(filters).then((c) => { setCases(c); setLoading(false) })
  }, [filters?.program, filters?.authorId])
  return { cases, loading }
}

/** Returns course progress for a fellow. */
export function useCourseProgress(fellowId?: string) {
  const [progress, setProgress] = useState<CourseProgress[]>([])
  useEffect(() => {
    if (!fellowId) return
    getCourseProgress(fellowId).then(setProgress)
  }, [fellowId])
  return progress
}
