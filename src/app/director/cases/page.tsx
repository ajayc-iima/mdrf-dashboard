"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { CaseDiscussion } from "@/components/shared/case-discussion"
import { EmptyState } from "@/components/shared/empty-state"
import { useCaseStudies } from "@/hooks/useQueries"
import { setCaseStatus } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { CASE_TYPES, type Program, type CaseStudy } from "@/types"
import { BookOpen } from "lucide-react"

export default function DirectorCasesPage() {
  const { profile } = useAuth()
  const [programFilter, setProgramFilter] = useState<"all" | Program>("all")
  const { cases, loading } = useCaseStudies({ program: programFilter === "all" ? undefined : programFilter })
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null)

  if (selectedCase && profile) {
    return <CaseDiscussion caseStudy={selectedCase} currentUserId={profile.id} currentUserName={profile.name} currentUserRole={profile.role!} onBack={() => setSelectedCase(null)} onStatusChange={() => setSelectedCase(null)} />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Case Studies" icon={<BookOpen className="h-6 w-6" />} description="All case studies across MDRF & MLRF" />
      <div className="flex gap-2">
        {(["all", "mdrf", "mlrf"] as const).map((p) => (
          <Button key={p} variant={programFilter === p ? "default" : "outline"} size="sm" onClick={() => setProgramFilter(p)}>
            {p === "all" ? "All" : p.toUpperCase()}
          </Button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />)}</div>
      ) : cases.length === 0 ? (
        <EmptyState title="No case studies" description="No case studies found for this filter." />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const csType = CASE_TYPES.find((t) => t.value === c.type)
            return (
              <div key={c.id} onClick={() => setSelectedCase(c)} className="cursor-pointer rounded-2xl border border-[hsl(var(--border))] bg-white p-4 hover:shadow-card-hover transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span>{csType?.emoji}</span>
                      <Badge variant="secondary" className="text-[10px]">{csType?.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{c.program.toUpperCase()}</Badge>
                      <Badge variant={c.status === "published" ? "success" : c.status === "submitted" ? "default" : "outline"}>{c.status}</Badge>
                    </div>
                    <h3 className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{c.title}</h3>
                    {c.summary && <p className="mt-1 text-[12px] text-[hsl(var(--text-3))] line-clamp-2">{c.summary}</p>}
                    <p className="mt-1 text-[11px] text-[hsl(var(--text-3))]">{c.authorName} · {c.program === "mlrf" ? "—" : c.district} · {formatRelativeTime(c.createdAt)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
