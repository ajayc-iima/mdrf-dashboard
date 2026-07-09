"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { useCaseStudies } from "@/hooks/useQueries"
import { addCaseStudy } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { CASE_TYPES, type CaseType, type CaseStudy } from "@/types"
import { BarChart3, Plus, Send } from "lucide-react"

export default function DataScientistAnalysisPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { cases, loading } = useCaseStudies({ authorId: profile?.id })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", summary: "", content: "", type: "case_study" as CaseType, onedriveLink: "" })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !form.title.trim()) return
    setSubmitting(true)
    await addCaseStudy({
      authorId: profile.id,
      authorName: profile.name,
      district: profile.district,
      program: profile.program,
      type: form.type,
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      attachmentName: null,
      onedriveLink: form.onedriveLink.trim() || undefined,
      status: "draft",
      tags: [],
    })
    setForm({ title: "", summary: "", content: "", type: "case_study", onedriveLink: "" })
    setShowForm(false)
    setSubmitting(false)
    router.refresh()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Analysis Reports"
        icon={<BarChart3 className="h-6 w-6" />}
        description="Submit data analysis reports, visualizations, and statistical findings"
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Analysis
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle>New Analysis Report</CardTitle>
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
              <div>
                <Input value={form.onedriveLink} onChange={(e) => setForm({ ...form, onedriveLink: e.target.value })} placeholder="ISB OneDrive link (optional)" />
                <p className="text-[11px] text-[hsl(var(--text-4))] mt-1">Upload your analysis to ISB OneDrive and paste the share link here</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" loading={submitting}><Send className="mr-1.5 h-3.5 w-3.5" /> Submit</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />)}</div>
      ) : cases.length === 0 ? (
        <EmptyState title="No analysis reports" description="Create your first analysis report to get started." />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const csType = CASE_TYPES.find((t) => t.value === c.type)
            return (
              <div key={c.id} className="rounded-2xl border border-[hsl(var(--border))] bg-white p-4 hover:shadow-card-hover transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{csType?.emoji}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--bg-muted))]">{csType?.label}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[hsl(var(--text-1))]">{c.title}</h3>
                    {c.summary && <p className="mt-1 text-xs text-[hsl(var(--text-3))] line-clamp-2">{c.summary}</p>}
                    <p className="mt-1 text-xs text-[hsl(var(--text-3))]">{formatRelativeTime(c.createdAt)}</p>
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
