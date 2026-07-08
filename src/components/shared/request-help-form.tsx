"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { sendNotification } from "@/lib/firestore"
import { Send, MessageSquare } from "lucide-react"

interface Props {
  onSuccess?: () => void
}

export function RequestHelpForm({ onSuccess }: Props) {
  const { profile } = useAuth()
  const [toRole, setToRole] = useState<"data-scientist" | "srf">("data-scientist")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !title.trim() || !message.trim()) return
    setSubmitting(true)
    await sendNotification({
      fromId: profile.id,
      fromName: profile.name,
      fromRole: profile.role!,
      toRole,
      type: "help_request",
      title: title.trim(),
      message: message.trim(),
    })
    setSubmitting(false)
    setSent(true)
    setTitle("")
    setMessage("")
    onSuccess?.()
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <Card>
      <CardHeader className="border-b border-[hsl(var(--border))]">
        <CardTitle className="flex items-center gap-2 text-[15px]">
          <MessageSquare className="h-4 w-4 text-[hsl(var(--gold))]" />
          Request Help from Expert
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {sent ? (
          <div className="py-6 text-center">
            <p className="text-[14px] font-semibold text-[hsl(var(--green))]">Request sent successfully!</p>
            <p className="text-[12px] text-[hsl(var(--text-3))] mt-1">You&apos;ll be notified when they respond</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[hsl(var(--text-2))] mb-1.5">Send to</label>
              <Select value={toRole} onValueChange={(v) => setToRole(v as "data-scientist" | "srf")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="data-scientist">Data Scientist</SelectItem>
                  <SelectItem value="srf">Senior Research Fellow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[hsl(var(--text-2))] mb-1.5">Subject</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you need help with?" required />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[hsl(var(--text-2))] mb-1.5">Details</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Describe your question or request..." required />
            </div>
            <Button type="submit" size="sm" disabled={submitting || !title.trim() || !message.trim()}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitting ? "Sending..." : "Send Request"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
