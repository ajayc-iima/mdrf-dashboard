"use client"

import { useAuth } from "@/hooks/useAuth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { useFellowData } from "@/hooks/useQueries"
import { formatRelativeTime } from "@/lib/utils"
import { ClipboardList } from "lucide-react"

export default function SrfHistoryPage() {
  const { profile } = useAuth()
  const { logs } = useFellowData(profile?.id)

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Work History"
        icon={<ClipboardList className="h-6 w-6" />}
        description="Your activity logs and submissions"
      />

      {logs.length === 0 ? (
        <EmptyState title="No activity yet" description="Your work logs will appear here." />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-[hsl(var(--border))] bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--bg-muted))]">{log.category}</span>
                <span className="text-[11px] text-[hsl(var(--text-4))]">{formatRelativeTime(log.createdAt)}</span>
              </div>
              <p className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{log.activityDescription}</p>
              {log.outputDeliverable && <p className="text-[12px] text-[hsl(var(--text-3))] mt-1">{log.outputDeliverable}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
