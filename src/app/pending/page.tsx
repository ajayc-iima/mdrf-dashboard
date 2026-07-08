"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ShieldCheck, XCircle, LogOut, Clock } from "lucide-react"

export default function PendingPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (loading || redirecting) return
    if (!user) router.push("/")
    else if (profile?.status === "approved" && profile.role) { setRedirecting(true); router.push(`/${profile.role}`) }
  }, [user, profile, loading, router, redirecting])

  if (loading || redirecting) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--bg-page))]">
        <div className="h-7 w-7 rounded-full border-2 border-[hsl(var(--border))] border-t-[hsl(var(--navy))] animate-spin" />
      </div>
    )
  }

  const isRejected = profile?.status === "rejected"

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-page))] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${isRejected ? "bg-[hsl(var(--red-soft))]" : "bg-[hsl(var(--gold-soft))]"}`}>
          {isRejected ? <XCircle className="h-8 w-8 text-[hsl(var(--red))]" /> : <Clock className="h-8 w-8 text-[hsl(var(--gold))]" />}
        </div>

        <h1 className="text-display-sm text-[hsl(var(--text-1))] mb-2">
          {isRejected ? "Access Denied" : "Awaiting Approval"}
        </h1>
        <p className="text-[14px] text-[hsl(var(--text-3))] mb-6">
          {profile?.email ? `Signed in as ${profile.email}` : "Signed in"}
        </p>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 text-left text-[13px] text-[hsl(var(--text-3))] mb-6 shadow-sm">
          {isRejected ? (
            <>Your access request was declined. Contact the administrator if you believe this is an error.</>
          ) : (
            <>
              <p className="mb-2 flex items-center gap-2 font-semibold text-[hsl(var(--text-1))]">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--green))]" /> Account pending
              </p>
              An administrator will review your request and assign you a role. You can safely close this page.
            </>
          )}
        </div>

        <Button variant="outline" className="w-full" onClick={async () => { await signOut(); router.push("/") }}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  )
}
