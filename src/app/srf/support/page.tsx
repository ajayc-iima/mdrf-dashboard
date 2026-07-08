"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { addSupportRequest, getSupportRequests } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { SUPPORT_CATEGORIES, type SupportCategory, type Urgency } from "@/types"
import { LifeBuoy, Send } from "lucide-react"

export default function SrfSupportPage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<SupportCategory>("knowledge")
  const [urgency, setUrgency] = useState<Urgency>("medium")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function load() {
    if (!profile) return
    getSupportRequests({ fellowId: profile.id }).then((r) => {
      setRequests(r)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [profile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !description.trim()) return
    setSubmitting(true)
    await addSupportRequest({
      fellowId: profile.id,
      fellowName: profile.name,
      district: profile.district,
      program: profile.program,
      category,
      description: description.trim(),
      urgency,
      status: "open",
    })
    setDescription("")
    setSubmitting(false)
    load()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Get Help"
        icon={<LifeBuoy className="h-6 w-6" />}
        description="Raise support requests"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle>New Support Request</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select value={category} onValueChange={(v) => setCategory(v as SupportCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what you need help with..."
                required
              />
              <Button type="submit" size="sm" loading={submitting}>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Submit
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle>My Requests</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3 max-h-96 overflow-auto">
              {requests.length === 0 ? (
                <EmptyState title="No requests yet" description="Submit your first support request." />
              ) : (
                requests.map((r) => (
                  <div key={r.id} className="rounded-xl border border-[hsl(var(--border))] p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant={r.urgency === "high" ? "destructive" : r.urgency === "medium" ? "warning" : "secondary"}>
                        {r.urgency}
                      </Badge>
                      <Badge variant={r.status === "resolved" ? "success" : r.status === "in_progress" ? "default" : "outline"}>
                        {r.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-[hsl(var(--text-2))]">{r.description}</p>
                    <p className="mt-1 text-[11px] text-[hsl(var(--text-3))]">{formatRelativeTime(r.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
