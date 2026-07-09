"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { addCaseComment, getCaseComments, setCaseStatus } from "@/lib/firestore"
import { formatRelativeTime, cn } from "@/lib/utils"
import { CASE_TYPES } from "@/types"
import type { CaseStudy, CaseComment, CaseStatus, UserRole } from "@/types"
import { MessageSquare, Send, ArrowLeft } from "lucide-react"

interface Props { caseStudy: CaseStudy; currentUserId: string; currentUserName: string; currentUserRole: UserRole; onBack: () => void; onStatusChange?: () => void }

export function CaseDiscussion({ caseStudy, currentUserId, currentUserName, currentUserRole, onBack, onStatusChange }: Props) {
  const [comments, setComments] = useState<CaseComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [action, setAction] = useState<"discuss" | "publish" | "analyze">("discuss")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCaseComments(caseStudy.id)
      .then((c) => { setComments(c) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [caseStudy.id])

  async function handleSubmit() {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await addCaseComment({ caseId: caseStudy.id, authorId: currentUserId, authorName: currentUserName, authorRole: currentUserRole, content: newComment.trim(), action })
      setComments(await getCaseComments(caseStudy.id))
      setNewComment("")
    } catch (err) {
      console.error("Failed to submit comment:", err)
    } finally {
      setSubmitting(false)
    }
  }

  async function changeStatus(status: CaseStatus) { await setCaseStatus(caseStudy.id, status); onStatusChange?.() }

  const csType = CASE_TYPES.find((t) => t.value === caseStudy.type)
  const isAuthor = currentUserId === caseStudy.authorId
  const canPublish = ["srf", "mdrf-coordinator", "mlrf-coordinator", "director", "admin"].includes(currentUserRole)

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium text-[hsl(var(--text-3))] hover:text-[hsl(var(--text-1))] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <Card>
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="text-[11px]">{csType?.label}</Badge>
                <Badge variant={caseStudy.status === "published" ? "success" : caseStudy.status === "submitted" ? "default" : "outline"}>{caseStudy.status}</Badge>
              </div>
              <CardTitle className="text-[16px]">{caseStudy.title}</CardTitle>
              <p className="text-[12px] text-[hsl(var(--text-3))] mt-0.5">{caseStudy.authorName} · {caseStudy.program === "mlrf" ? "" : caseStudy.district + " · "}{formatRelativeTime(caseStudy.createdAt)}</p>
            </div>
            {canPublish && !isAuthor && caseStudy.status !== "published" && <Button size="sm" onClick={() => changeStatus("published")}>Publish</Button>}
            {isAuthor && caseStudy.status === "draft" && <Button size="sm" onClick={() => changeStatus("submitted")}>Submit</Button>}
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {caseStudy.content ? <div className="prose prose-sm max-w-none text-[hsl(var(--text-2))] whitespace-pre-wrap">{caseStudy.content}</div> : <p className="text-[13px] text-[hsl(var(--text-4))]">No content yet.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <CardTitle className="flex items-center gap-2.5 text-[14px]"><MessageSquare className="h-4 w-4 text-[hsl(var(--blue))]" /> Discussion ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {loading ? <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[hsl(var(--bg-muted))]" />)}</div>
            : comments.length === 0 ? <p className="py-6 text-center text-[13px] text-[hsl(var(--text-4))]">No comments yet.</p>
            : comments.map((c) => (
              <div key={c.id} className={cn("rounded-xl border p-3.5", c.action === "publish" ? "border-[hsl(var(--green))]/20 bg-[hsl(var(--green-soft))]" : "border-[hsl(var(--border))]")}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px]">{c.authorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <span className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{c.authorName}</span>
                  <Badge variant="outline" className="text-[10px]">{c.authorRole}</Badge>
                  {c.action !== "discuss" && <Badge variant={c.action === "publish" ? "success" : "default"} className="text-[10px]">{c.action}</Badge>}
                  <span className="ml-auto text-[11px] text-[hsl(var(--text-4))]">{formatRelativeTime(c.createdAt)}</span>
                </div>
                <p className="text-[13px] text-[hsl(var(--text-2))]">{c.content}</p>
              </div>
            ))}
          <div className="space-y-2.5 border-t border-[hsl(var(--border))] pt-3">
            <div className="flex gap-1.5">
              {(["discuss", "publish", "analyze"] as const).map((a) => (
                <button key={a} onClick={() => setAction(a)}
                  className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    action === a ? "border-[hsl(var(--navy))]/20 bg-[hsl(var(--navy))]/[0.06] text-[hsl(var(--navy))]" : "border-[hsl(var(--border))] text-[hsl(var(--text-4))] hover:text-[hsl(var(--text-2))]")}>
                  {a}
                </button>
              ))}
            </div>
            <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} maxLength={1000} placeholder="Comment..." />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()} loading={submitting}><Send className="mr-1.5 h-3.5 w-3.5" /> Post</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
