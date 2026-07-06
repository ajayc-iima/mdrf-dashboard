"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { CaseDiscussion } from "@/components/shared/case-discussion"
import { EmptyState } from "@/components/shared/empty-state"
import { useCaseStudies } from "@/hooks/useQueries"
import { addCaseStudy } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { CASE_TYPES, type CaseType, type CaseStudy } from "@/types"
import { BookOpen, Plus, Send } from "lucide-react"

export default function MDRFCoordinatorCasesPage() {
  const { profile } = useAuth()
  const { cases, loading } = useCaseStudies({ program: "mdrf" })
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", summary: "", content: "", type: "case_study" as CaseType })
  const [submitting, setSubmitting] = useState(false)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !form.title.trim()) return
    setSubmitting(true)
    await addCaseStudy({
      authorId: profile.id,
      authorName: profile.name,
      district: profile.district,
      program: "mdrf",
      type: form.type,
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      attachmentName: null,
      status: "draft",
      tags: [],
    })
    setForm({ title: "", summary: "", content: "", type: "case_study" })
    setShowForm(false)
    setSubmitting(false)
    window.location.reload()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="MDRF Case Studies"
        icon={<BookOpen className="h-6 w-6" />}
        description="Case studies, policy briefs, and field breakthroughs"
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1.5 h-4 w-4" /> New
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader className="border-b border-[#E5E0DA]">
            <CardTitle>New Case Study</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CaseType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Short summary" />
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Full content..." />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" loading={submitting}><Send className="mr-1.5 h-3.5 w-3.5" /> Submit</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : cases.length === 0 ? (
        <EmptyState title="No case studies" description="Create your first case study to get started." />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const csType = CASE_TYPES.find((t) => t.value === c.type)
            return (
              <div key={c.id} onClick={() => setSelectedCase(c)} className="cursor-pointer rounded-xl border border-[#E5E0DA] bg-white p-4 hover:bg-[#F8F6F3]/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{csType?.emoji}</span>
                      <Badge variant="secondary" className="text-[10px]">{csType?.label}</Badge>
                      <Badge variant={c.status === "published" ? "success" : c.status === "submitted" ? "default" : "outline"}>{c.status}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-[#161618]">{c.title}</h3>
                    {c.summary && <p className="mt-1 text-xs text-[#98989D] line-clamp-2">{c.summary}</p>}
                    <p className="mt-1 text-xs text-[#98989D]">{c.authorName} · {c.district} · {formatRelativeTime(c.createdAt)}</p>
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
