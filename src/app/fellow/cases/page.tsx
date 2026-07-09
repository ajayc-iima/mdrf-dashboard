"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { CaseDiscussion } from "@/components/shared/case-discussion"
import { getCaseStudies, addCaseStudy } from "@/lib/firestore"
import { formatDate, formatRelativeTime } from "@/lib/utils"
import { CASE_TYPES, type CaseStudy, type CaseType } from "@/types"
import { BookOpen, Plus, X } from "lucide-react"

export default function FellowCases() {
  const { user, profile } = useAuth()
  const [cases, setCases] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [formType, setFormType] = useState<CaseType>("case_study")
  const [formTitle, setFormTitle] = useState("")
  const [formSummary, setFormSummary] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formTags, setFormTags] = useState("")
  const [formOneDriveLink, setFormOneDriveLink] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function loadCases() {
    if (!profile) return
    getCaseStudies({ authorId: profile.id }).then((c) => {
      setCases(c)
      setLoading(false)
    })
  }

  useEffect(() => { loadCases() }, [profile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !formTitle.trim()) return
    setSubmitting(true)
    await addCaseStudy({
      authorId: profile.id,
      authorName: profile.name,
      district: profile.district,
      program: profile.program,
      type: formType,
      title: formTitle.trim(),
      summary: formSummary.trim(),
      content: formContent.trim(),
      attachmentName: null,
      onedriveLink: formOneDriveLink.trim() || undefined,
      status: "draft",
      tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
    })
    setShowForm(false)
    setFormTitle("")
    setFormSummary("")
    setFormContent("")
    setFormTags("")
    setFormOneDriveLink("")
    setSubmitting(false)
    loadCases()
  }

  const selectedCase = selected ? cases.find((c) => c.id === selected) : null

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />
        ))}
      </div>
    )
  }

  if (selectedCase && user && profile) {
    return (
      <div className="max-w-4xl">
        <CaseDiscussion
          caseStudy={selectedCase}
          currentUserId={user.uid}
          currentUserName={profile.name}
          currentUserRole={profile.role!}
          onBack={() => { setSelected(null); loadCases() }}
          onStatusChange={loadCases}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Studies & Research"
        icon={<BookOpen className="h-6 w-6" />}
        description="Document your field breakthroughs, case studies, and policy briefs."
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showForm ? "Cancel" : "New Submission"}
          </Button>
        }
      />

      {showForm && (
        <Card className="border-[hsl(var(--border))]">
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="text-[15px]">New Submission</CardTitle>
            <CardDescription>Start as draft — you can submit for review once ready.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select value={formType} onValueChange={(v) => setFormType(v as CaseType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Title" required />
              </div>
              <Input value={formSummary} onChange={(e) => setFormSummary(e.target.value)} placeholder="Brief summary (one-liner)" />
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={6} placeholder="Detailed content — methodology, findings, recommendations…" />
              <Input value={formOneDriveLink} onChange={(e) => setFormOneDriveLink(e.target.value)} placeholder="ISB OneDrive link (optional)" />
              <p className="text-[11px] text-[hsl(var(--text-4))] -mt-2">Upload your document to ISB OneDrive and paste the share link here</p>
              <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="Tags (comma separated)" />
              <div className="flex justify-end">
                <Button type="submit" loading={submitting}>Save as Draft</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {cases.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Create your first case study, policy brief, or document a field breakthrough."
          action={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-1.5 h-4 w-4" /> Create First</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((cs) => {
            const type = CASE_TYPES.find((t) => t.value === cs.type)
            return (
              <Card key={cs.id} className="cursor-pointer hover:shadow-card-hover transition-all duration-200" onClick={() => setSelected(cs.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{type?.emoji}</span>
                    <Badge variant={cs.status === "published" ? "success" : cs.status === "submitted" ? "default" : cs.status === "revision" ? "warning" : "outline"}>{cs.status === "revision" ? "Needs Revision" : cs.status}</Badge>
                  </div>
                  <CardTitle className="text-[15px] line-clamp-2">{cs.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {cs.summary && <p className="text-[13px] text-[hsl(var(--text-3))] line-clamp-2 mb-2">{cs.summary}</p>}
                  <p className="text-[11px] text-[hsl(var(--text-3))]">{formatRelativeTime(cs.createdAt)}</p>
                  {cs.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cs.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
