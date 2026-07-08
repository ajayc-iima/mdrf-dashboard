"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { getCaseStudies, updateCaseStudy } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { CASE_TYPES, type CaseStudy } from "@/types"
import { BookOpen, Check, X, Clock, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react"

export default function SrfCasesPage() {
  const { profile } = useAuth()
  const [cases, setCases] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending")

  function loadCases() {
    if (!profile) return
    getCaseStudies({ program: profile.program }).then((c) => {
      setCases(c)
      setLoading(false)
    })
  }

  useEffect(() => { loadCases() }, [profile])

  async function handleStartReview(caseId: string) {
    await updateCaseStudy(caseId, {
      status: "under_review",
      reviewedBy: profile?.id,
      reviewedByName: profile?.name,
      reviewedAt: new Date(),
    })
    loadCases()
    setSelectedCase(cases.find((c) => c.id === caseId) || null)
  }

  async function handleApprove(caseId: string) {
    await updateCaseStudy(caseId, {
      status: "approved",
      reviewedBy: profile?.id,
      reviewedByName: profile?.name,
      reviewedAt: new Date(),
      reviewComments: reviewComment.trim() || undefined,
    })
    setReviewComment("")
    loadCases()
    setSelectedCase(null)
  }

  async function handleReject(caseId: string) {
    await updateCaseStudy(caseId, {
      status: "submitted",
      reviewedBy: profile?.id,
      reviewedByName: profile?.name,
      reviewedAt: new Date(),
      reviewComments: reviewComment.trim() || "Returned for revisions",
    })
    setReviewComment("")
    loadCases()
    setSelectedCase(null)
  }

  const pendingCases = cases.filter((c) => c.status === "submitted")
  const underReviewCases = cases.filter((c) => c.status === "under_review")
  const approvedCases = cases.filter((c) => c.status === "approved")

  const filteredCases = tab === "pending"
    ? [...pendingCases, ...underReviewCases]
    : tab === "approved"
    ? approvedCases
    : cases

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted": return <Badge variant="default"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
      case "under_review": return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Under Review</Badge>
      case "approved": return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>
      case "published": return <Badge variant="success">Published</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (selectedCase) {
    const csType = CASE_TYPES.find((t) => t.value === selectedCase.type)
    const isPending = selectedCase.status === "submitted"
    const isUnderReview = selectedCase.status === "under_review"

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { setSelectedCase(null); setReviewComment("") }}>← Back</Button>
          <h2 className="text-[18px] font-bold text-[hsl(var(--text-1))]">Review Case Study</h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span>{csType?.emoji}</span>
              <Badge variant="outline">{csType?.label}</Badge>
              {getStatusBadge(selectedCase.status)}
            </div>

            <h3 className="text-[18px] font-bold text-[hsl(var(--text-1))] mb-2">{selectedCase.title}</h3>
            <p className="text-[13px] text-[hsl(var(--text-3))] mb-4">
              By {selectedCase.authorName} · {selectedCase.district} · {formatRelativeTime(selectedCase.createdAt)}
            </p>

            {selectedCase.summary && (
              <div className="mb-4">
                <p className="text-[12px] font-semibold text-[hsl(var(--text-2))] mb-1">Summary</p>
                <p className="text-[14px] text-[hsl(var(--text-2))]">{selectedCase.summary}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-[12px] font-semibold text-[hsl(var(--text-2))] mb-1">Content</p>
              <p className="text-[14px] text-[hsl(var(--text-2))] whitespace-pre-wrap">{selectedCase.content}</p>
            </div>

            {selectedCase.onedriveLink && (
              <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--blue))]/[0.05] border border-[hsl(var(--blue))]/20">
                <p className="text-[12px] font-semibold text-[hsl(var(--blue))] mb-1">📎 Document Link</p>
                <a href={selectedCase.onedriveLink} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[hsl(var(--navy))] hover:underline break-all">
                  {selectedCase.onedriveLink}
                </a>
              </div>
            )}

            {selectedCase.reviewComments && (
              <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--bg-muted))]">
                <p className="text-[12px] font-semibold text-[hsl(var(--text-2))] mb-1">Previous Review Comments</p>
                <p className="text-[13px] text-[hsl(var(--text-2))]">{selectedCase.reviewComments}</p>
              </div>
            )}

            {/* Review Actions */}
            {(isPending || isUnderReview) && (
              <div className="mt-6 p-4 rounded-xl border-2 border-[hsl(var(--gold))]/20 bg-[hsl(var(--gold))]/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-[hsl(var(--gold))]" />
                  <p className="text-[13px] font-semibold text-[hsl(var(--text-1))]">Review Actions</p>
                </div>

                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder="Add review comments (optional)..."
                  className="mb-3"
                />

                <div className="flex gap-3">
                  <Button onClick={() => handleApprove(selectedCase.id)}>
                    <Check className="h-4 w-4 mr-1.5" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => handleReject(selectedCase.id)}>
                    <X className="h-4 w-4 mr-1.5" /> Return to Fellow
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Case Studies for Review"
        icon={<BookOpen className="h-6 w-6" />}
        description="Review case studies submitted by MDRF fellows"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:shadow-card-hover transition-all" onClick={() => setTab("pending")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[hsl(var(--text-4))] uppercase">Pending</p>
                <p className="text-[24px] font-bold text-[hsl(var(--orange))]">{pendingCases.length + underReviewCases.length}</p>
              </div>
              <Clock className="h-5 w-5 text-[hsl(var(--orange))]" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-card-hover transition-all" onClick={() => setTab("approved")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[hsl(var(--text-4))] uppercase">Approved</p>
                <p className="text-[24px] font-bold text-[hsl(var(--green))]">{approvedCases.length}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--green))]" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-card-hover transition-all" onClick={() => setTab("all")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[hsl(var(--text-4))] uppercase">All Cases</p>
                <p className="text-[24px] font-bold text-[hsl(var(--text-2))]">{cases.length}</p>
              </div>
              <BookOpen className="h-5 w-5 text-[hsl(var(--text-2))]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["pending", "approved", "all"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />)}</div>
      ) : filteredCases.length === 0 ? (
        <EmptyState title="No case studies" description={tab === "pending" ? "All caught up! No pending reviews." : "No case studies found."} />
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
                      <Badge variant="outline" className="text-[10px]">{csType?.label}</Badge>
                      {getStatusBadge(c.status)}
                    </div>
                    <h3 className="text-sm font-semibold text-[hsl(var(--text-1))]">{c.title}</h3>
                    {c.summary && <p className="mt-1 text-xs text-[hsl(var(--text-3))] line-clamp-2">{c.summary}</p>}
                    <p className="mt-1 text-xs text-[hsl(var(--text-3))]">{c.authorName} · {c.district} · {formatRelativeTime(c.createdAt)}</p>
                    {c.reviewComments && (
                      <p className="mt-1 text-xs text-[hsl(var(--text-4))] italic line-clamp-1">&ldquo;{c.reviewComments}&rdquo;</p>
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
