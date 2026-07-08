"use client"

import { useAuth } from "@/hooks/useAuth"
import { useCaseStudies } from "@/hooks/useQueries"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { formatRelativeTime } from "@/lib/utils"
import { CASE_TYPES } from "@/types"
import { BookOpen } from "lucide-react"

export default function DataScientistCasesPage() {
  const { profile } = useAuth()
  const { cases, loading } = useCaseStudies({ authorId: profile?.id })

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Case Studies"
        icon={<BookOpen className="h-6 w-6" />}
        description="Case studies, policy briefs, and field breakthroughs"
      />

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />)}</div>
      ) : cases.length === 0 ? (
        <EmptyState title="No case studies" description="Case studies you create will appear here." />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const csType = CASE_TYPES.find((t) => t.value === c.type)
            return (
              <div key={c.id} className="rounded-2xl border border-[hsl(var(--border))] bg-white p-4 hover:shadow-card-hover transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <span>{csType?.emoji}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--bg-muted))]">{csType?.label}</span>
                </div>
                <h3 className="text-sm font-semibold text-[hsl(var(--text-1))]">{c.title}</h3>
                {c.summary && <p className="mt-1 text-xs text-[hsl(var(--text-3))] line-clamp-2">{c.summary}</p>}
                <p className="mt-1 text-xs text-[hsl(var(--text-3))]">{formatRelativeTime(c.createdAt)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
