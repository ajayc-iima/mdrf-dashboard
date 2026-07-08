"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { getFellows, getAllFellowsCourseProgress, getLmsCourses } from "@/lib/firestore"
import { COURSES, PROGRAM_META } from "@/lib/constants"
import type { UserProfile, CourseProgress, LmsCourse, Program } from "@/types"
import { BookOpen, CheckCircle2, Clock, XCircle } from "lucide-react"

interface Props {
  program: Program
}

export function CoordinatorLmsPage({ program }: Props) {
  const [fellows, setFellows] = useState<UserProfile[]>([])
  const [progress, setProgress] = useState<CourseProgress[]>([])
  const [courses, setCourses] = useState<LmsCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getFellows(program),
      getAllFellowsCourseProgress(program),
      getLmsCourses(program),
    ]).then(([f, p, c]) => {
      setFellows(f)
      setProgress(p)
      setCourses(c)
      setLoading(false)
    })
  }, [program])

  const meta = PROGRAM_META[program]

  function getFellowProgress(fellowId: string) {
    return progress.filter(p => p.fellowId === fellowId)
  }

  function getCourseStatus(fellowId: string, courseKey: string) {
    const p = progress.find(p => p.fellowId === fellowId && p.courseKey === courseKey)
    return p?.status || "not_started"
  }

  function getCompletionRate(fellowId: string) {
    const fellowProgress = getFellowProgress(fellowId)
    const completed = fellowProgress.filter(p => p.status === "done").length
    return Math.round((completed / COURSES.length) * 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--green))]" />
      case "in_progress": return <Clock className="h-4 w-4 text-[hsl(var(--orange))]" />
      default: return <XCircle className="h-4 w-4 text-[hsl(var(--text-4))]" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done": return <Badge variant="success" className="text-[10px]">Completed</Badge>
      case "in_progress": return <Badge variant="warning" className="text-[10px]">In Progress</Badge>
      default: return <Badge variant="outline" className="text-[10px]">Not Started</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`${meta.label} LMS Progress`}
        icon={<BookOpen className="h-6 w-6" />}
        description="Track fellow course completion across the programme"
      />

      {fellows.length === 0 ? (
        <EmptyState title="No fellows" description="Fellow LMS progress will appear here." />
      ) : (
        <div className="space-y-4">
          {fellows.map((fellow) => {
            const completionRate = getCompletionRate(fellow.id)
            const fellowProgress = getFellowProgress(fellow.id)
            const completed = fellowProgress.filter(p => p.status === "done").length

            return (
              <Card key={fellow.id}>
                <CardHeader className="border-b border-[hsl(var(--border))]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[15px]">{fellow.name}</CardTitle>
                      <p className="text-[12px] text-[hsl(var(--text-3))]">{fellow.district}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-bold text-[hsl(var(--navy))]">{completionRate}%</p>
                      <p className="text-[11px] text-[hsl(var(--text-4))]">{completed}/{COURSES.length} courses</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-[hsl(var(--bg-muted))]">
                    <div
                      className="h-2 rounded-full bg-[hsl(var(--green))] transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COURSES.map((course) => {
                      const status = getCourseStatus(fellow.id, course.key)
                      return (
                        <div key={course.key} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--bg-muted))]">
                          <div className="flex items-center gap-2 min-w-0">
                            {getStatusIcon(status)}
                            <span className="text-[12px] text-[hsl(var(--text-2))] truncate">{course.title}</span>
                          </div>
                          {getStatusBadge(status)}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
