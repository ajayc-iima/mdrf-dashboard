"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { getCaseStudies, getFellows } from "@/lib/firestore"
import { useWeekLogCount } from "@/hooks/useQueries"
import { formatRelativeTime, getCurrentWeekKey } from "@/lib/utils"
import { WEEKLY_LOG_TARGET } from "@/lib/constants"
import type { CaseStudy, UserProfile } from "@/types"
import { BookOpen, FileText, Users, TrendingUp, Award } from "lucide-react"
import Link from "next/link"

export default function SrfHomePage() {
  const { profile } = useAuth()
  const [cases, setCases] = useState<CaseStudy[]>([])
  const [fellows, setFellows] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const weekKey = getCurrentWeekKey()
  const logCount = useWeekLogCount(profile?.id)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      getCaseStudies({ program: profile.program }),
      getFellows(profile.program),
    ]).then(([c, f]) => {
      setCases(c)
      setFellows(f)
      setLoading(false)
    })
  }, [profile])

  if (!profile) return null

  const recentCases = cases.slice(0, 3)
  const silentFellows = fellows.filter((f) =>
    !f.lastLogDate || (Date.now() - f.lastLogDate.getTime()) / 86400000 > 3
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Senior Research Fellow Dashboard"
        icon={<Award className="h-6 w-6" />}
        description={`Welcome back, ${profile.name}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 stagger-children">
        <StatCard title="This Week" value={`${logCount}/${WEEKLY_LOG_TARGET}`} icon={<FileText className="h-4 w-4" />} variant={logCount >= WEEKLY_LOG_TARGET ? "success" : "default"} />
        <StatCard title="Research Submissions" value={cases.length} icon={<BookOpen className="h-4 w-4" />} variant="accent" />
        <StatCard title="MDRF Fellows" value={fellows.length} icon={<Users className="h-4 w-4" />} variant="default" />
        <StatCard title="Need Guidance" value={silentFellows.length} icon={<TrendingUp className="h-4 w-4" />} variant={silentFellows.length > 0 ? "destructive" : "success"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="text-[15px]">Recent Research</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentCases.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[hsl(var(--text-3))]">No research submissions yet</p>
            ) : (
              <div className="space-y-3">
                {recentCases.map((c) => (
                  <div key={c.id} className="rounded-xl border border-[hsl(var(--border))] p-3 hover:bg-[hsl(var(--bg-muted))] transition-colors">
                    <p className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{c.title}</p>
                    <p className="text-[11px] text-[hsl(var(--text-3))]">{c.type.replace(/_/g, " ")} · {formatRelativeTime(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/srf/cases" className="mt-3 block text-center text-[12px] font-semibold text-[hsl(var(--navy))] hover:underline">View all →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="text-[15px]">Fellows Needing Guidance</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {silentFellows.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[hsl(var(--text-3))]">All fellows active</p>
            ) : (
              <div className="space-y-3">
                {silentFellows.slice(0, 5).map((f) => (
                  <div key={f.id} className="rounded-xl border border-[hsl(var(--red))]/[0.12] bg-[hsl(var(--red))]/[0.02] p-3">
                    <p className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{f.name}</p>
                    <p className="text-[11px] text-[hsl(var(--text-3))]">{f.district} · {f.lastLogDate ? formatRelativeTime(f.lastLogDate) : "Never active"}</p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/srf/fellows" className="mt-3 block text-center text-[12px] font-semibold text-[hsl(var(--navy))] hover:underline">View all fellows →</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
