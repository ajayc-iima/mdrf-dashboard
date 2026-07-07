"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { addLmsCourse, deleteLmsCourse, getAllLmsCourses } from "@/lib/firestore"
import { formatDate } from "@/lib/utils"
import { PROGRAM_META } from "@/lib/constants"
import type { LmsCourse, Program } from "@/types"
import { BookOpen, Plus, Trash2, ExternalLink } from "lucide-react"

export default function AdminLmsPage() {
  const [courses, setCourses] = useState<LmsCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [program, setProgram] = useState<Program | "all">("all")
  const [submitting, setSubmitting] = useState(false)

  function load() {
    setLoading(true)
    getAllLmsCourses().then((c) => { setCourses(c); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    setSubmitting(true)
    await addLmsCourse({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      program: program === "all" ? null : program,
    })
    setTitle("")
    setUrl("")
    setDescription("")
    setProgram("all")
    setSubmitting(false)
    load()
  }

  async function handleDelete(id: string) {
    await deleteLmsCourse(id)
    load()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manage LMS Courses" icon={<BookOpen className="h-6 w-6" />} description="Add external course links for fellows to access." />

      <Card>
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Course Link</CardTitle>
          <CardDescription>Fellows will see these links in their LMS page</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" required />
              <Select value={program} onValueChange={(v) => setProgram(v as Program | "all")}>
                <SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="mdrf">{PROGRAM_META.mdrf.label}</SelectItem>
                  <SelectItem value="mlrf">{PROGRAM_META.mlrf.label}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." type="url" required />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Short description" />
            <div className="flex justify-end">
              <Button type="submit" loading={submitting}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Course</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <CardTitle>All Course Links ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[hsl(var(--bg-muted))]" />)}
            </div>
          ) : courses.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[hsl(var(--text-3))]">No courses added yet.</p>
          ) : (
            <div className="space-y-2">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--bg-muted))]/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[14px] text-[hsl(var(--text-1))]">{c.title}</span>
                      {c.program && <Badge variant="secondary" className="text-[10px]">{PROGRAM_META[c.program].label}</Badge>}
                      {!c.program && <Badge variant="outline" className="text-[10px]">All</Badge>}
                    </div>
                    {c.description && <p className="text-[12px] text-[hsl(var(--text-3))] mt-0.5">{c.description}</p>}
                    <p className="text-[11px] text-[hsl(var(--text-4))] mt-0.5">{c.url} · Added {formatDate(c.createdAt)}</p>
                  </div>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-[hsl(var(--text-4))] hover:text-[hsl(var(--text-1))] hover:bg-[hsl(var(--bg-muted))] transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-[hsl(var(--text-4))] hover:text-[hsl(var(--red))] hover:bg-[hsl(var(--red))]/[0.08] transition-colors" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
