"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { CaseDiscussion } from "@/components/shared/case-discussion"
import { EmptyState } from "@/components/shared/empty-state"
import { useCaseStudies } from "@/hooks/useQueries"
import { formatRelativeTime } from "@/lib/utils"
import { CASE_TYPES, type CaseStudy } from "@/types"
import { BookOpen, Clock, CheckCircle2, AlertCircle } from "lucide-react"

export default function MLRFCoordinatorCasesPage() {
  const { profile } = useAuth()
  const { cases, loading } = useCaseStudies({ program: "mlrf" })
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null)
  const [tab, setTab] = useState<"all" | "pending" | "reviewed" | "published">("all")

  if (selectedCase && profile) {
    return (
      <CaseDiscussion
        caseStudy={selectedCase}
        currentUserId={profile.id}
        currentUserName={profile.name}
        currentUserRole={profile.role!}
        onBack={() => setSelectedCase(null)}
        onStatusChange={() => setSelectedCase(null)}
      />
    )
  }

  const pendingReview = cases.filter((c) => c.status === "submitted" || c.status === "revision")
  const underReview = cases.filter((c) => c.status === "under_review")
  const approved = cases.filter((c) => c.status === "approved")
  const published = cases.filter((c) => c.status === "published")

  const filteredCases = tab === "pending"
    ? [...pendingReview, ...underReview]
    : tab === "reviewed"
    ? approved
    : tab === "published"
    ? published
    : cases

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted": return <Badge variant="default"><Clock className="h-3 w-3 mr-1" /> Pending Review</Badge>
      case "under_review": return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Under Review</Badge>
      case "approved": return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>
      case "published": return <Badge variant="success">Published</Badge>
      case "revision": return <Badge variant="warning"><AlertTriangle className="h-3 w-3 mr-1" /> Revision</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="MLRF Case Studies"
        icon={<BookOpen className="h-6 w-6" />}
        description="Review case studies from fellows and track approval status"
      />

      {/* Review Pipeline Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-card-hover transition-all" onClick={() => setTab("pending")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[hsl(var(--text-4))] uppercase">Pending</p>
                <p className="text-[24px] font-bold text-[hsl(var(--orange))]">{pendingReview.length}</p>
              </div>
              <Clock className="h-5 w-5 text-[hsl(var(--orange))]" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-card-hover transition-all" onClick={() => setTab("all")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[hsl(var(--text-4))] uppercase">Under Review</p>
                <p className="text-[24px] font-bold text-[hsl(var(--blue))]">{underReview.length}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-[hsl(var(--blue))]" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-card-hover transition-all" onClick={() => setTab("reviewed")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[hsl(var(--text-4))] uppercase">Approved</p>
                <p className="text-[24px] font-bold text-[hsl(var(--green))]">{approved.length}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--green))]" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-card-hover transition-all" onClick={() => setTab("published")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[hsl(var(--text-4))] uppercase">Published</p>
                <p className="text-[24px] font-bold text-[hsl(var(--text-2))]">{published.length}</p>
              </div>
              <BookOpen className="h-5 w-5 text-[hsl(var(--text-2))]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "reviewed", "published"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />)}</div>
      ) : filteredCases.length === 0 ? (
        <EmptyState title="No case studies" description={tab === "all" ? "No case studies submitted yet." : `No ${tab} case studies.`} />
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c) => {
            const csType = CASE_TYPES.find((t) => t.value === c.type)
            return (
              <div key={c.id} onClick={() => setSelectedCase(c)} className="cursor-pointer rounded-2xl border border-[hsl(var(--border))] bg-white p-4 hover:shadow-card-hover transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{csType?.emoji}</span>
                      <Badge variant="secondary" className="text-[10px]">{csType?.label}</Badge>
                      {getStatusBadge(c.status)}
                    </div>
                    <h3 className="text-sm font-semibold text-[hsl(var(--text-1))]">{c.title}</h3>
                    {c.summary && <p className="mt-1 text-xs text-[hsl(var(--text-3))] line-clamp-2">{c.summary}</p>}
                    <p className="mt-1 text-xs text-[hsl(var(--text-3))]">{c.authorName} · {c.district} · {formatRelativeTime(c.createdAt)}</p>
                    {c.reviewedByName && (
                      <p className="mt-1 text-xs text-[hsl(var(--green))]">
                        Reviewed by {c.reviewedByName} · {c.reviewedAt ? formatRelativeTime(c.reviewedAt) : ""}
                      </p>
                    )}
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
