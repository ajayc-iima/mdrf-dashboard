"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { addSupportRequest } from "@/lib/firestore"
import { REQUEST_TYPES, type RequestType, type Urgency } from "@/types"
import { Send, HelpCircle } from "lucide-react"

export default function SubmitSupportPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [requestType, setRequestType] = useState<RequestType>("data_analysis")
  const [urgency, setUrgency] = useState<Urgency>("medium")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !description.trim()) return
    setSubmitting(true)
    try {
      await addSupportRequest({
        fellowId: profile.id,
        fellowName: profile.name,
        district: profile.district,
        program: profile.program,
        category: "knowledge",
        requestType,
        description: description.trim(),
        urgency,
        status: "open",
      })
      router.push("/fellow/support")
    } catch {
      setSubmitting(false)
    }
  }

  if (!profile) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Submit Support Request"
        icon={<HelpCircle className="h-6 w-6" />}
        description="Request help from Data Scientists or Coordinators"
      />

      <Card>
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <CardTitle>New Request</CardTitle>
          <CardDescription>Tell us what you need help with</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                <SelectTrigger><SelectValue placeholder="Urgency" /></SelectTrigger>
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
              maxLength={500}
              placeholder="Describe the challenge, what you need, and any context…"
              required
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[hsl(var(--text-3))]">{description.length}/500</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" loading={submitting}>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Submit
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
