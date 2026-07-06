"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithGoogle, getRoleHome } from "@/lib/auth"
import { getUserProfile, createUserProfile } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { AppLogo } from "@/components/shared/app-logo"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let active = true
    ;(async () => {
      const { onAuthChange } = await import("@/lib/auth")
      onAuthChange(async (firebaseUser) => {
        if (!active || !firebaseUser) return
        const profile = await getUserProfile(firebaseUser.uid)
        if (!profile) return
        if (profile.status === "pending" || profile.status === "rejected") router.push("/pending")
        else if (profile.role) router.push(getRoleHome(profile.role))
      })
    })()
    return () => { active = false }
  }, [router])

  async function handleGoogleSignIn() {
    setError("")
    setLoading(true)
    try {
      const user = await signInWithGoogle()
      let profile = await getUserProfile(user.uid)
      if (!profile) {
        await createUserProfile(user.uid, { name: user.displayName || user.email?.split("@")[0] || "User", email: user.email || "" })
        profile = await getUserProfile(user.uid)
      }
      if (!profile) { setError("Profile not found. Contact the administrator."); return }
      if (profile.status === "pending" || profile.status === "rejected") router.push("/pending")
      else if (profile.role) router.push(getRoleHome(profile.role))
      else router.push("/pending")
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") setError("Sign in failed. Please try again.")
    } finally { setLoading(false) }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">

      {/* Rich animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220_40%_18%)] via-[hsl(38_60%_55%/0.08)] to-[hsl(220_40%_14%)] animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_60%_55%/0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(220_40%_20%/0.3),transparent_50%)]" />

      {/* Geometric pattern overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="hsl(var(--gold))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Animated floating orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[hsl(var(--gold))/0.06] blur-3xl animate-drift-slow" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-[hsl(var(--navy-light))/0.15] blur-3xl animate-drift-medium" />

      {/* Decorative floating geometric elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute -top-32 -right-32 w-[450px] h-[450px] opacity-[0.06] animate-drift-slow" viewBox="0 0 500 500" fill="none">
          <circle cx="250" cy="250" r="250" fill="hsl(var(--gold))" />
        </svg>
        <svg className="absolute -bottom-32 -left-32 w-[350px] h-[350px] opacity-[0.05] animate-drift-medium" viewBox="0 0 400 400" fill="none">
          <rect x="50" y="50" width="300" height="300" rx="60" stroke="hsl(var(--gold))" strokeWidth="2" />
        </svg>
        <svg className="absolute top-1/3 right-[8%] w-[100px] h-[100px] opacity-[0.04] animate-float1" viewBox="0 0 200 200" fill="none" style={{ animationDelay: "0.5s" }}>
          <path d="M100 0L200 100L100 200L0 100L100 0z" fill="hsl(var(--gold))" />
        </svg>
        <svg className="absolute bottom-1/3 left-[8%] w-[80px] h-[80px] opacity-[0.04] animate-float2" viewBox="0 0 100 100" fill="none" style={{ animationDelay: "1.2s" }}>
          <circle cx="50" cy="50" r="50" fill="hsl(var(--navy-light))" />
        </svg>
      </div>

      {/* Gold border accents */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[hsl(var(--gold))/0.7] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[hsl(var(--gold))/0.7] to-transparent" />
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[hsl(var(--gold))/0.2] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[hsl(var(--gold))/0.2] to-transparent" />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Crest + Title */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex items-center justify-center">
            <div className="relative" style={{ animation: "float1 5s ease-in-out infinite" }}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--gold))/0.25] to-[hsl(var(--gold))/0.05] blur-2xl animate-pulse-glow" />
              <div className="absolute inset-0 rounded-full bg-[hsl(var(--navy))] blur-[2px] opacity-30 scale-110" />
              <div className="relative">
                <AppLogo size={60} />
              </div>
            </div>
          </div>
          <h1 className="text-[28px] sm:text-display-md font-bold text-white tracking-tight drop-shadow-sm">
            MDRF/MLRF CONNECT
          </h1>
          <p className="mt-1.5 text-[15px] text-white/90 font-semibold tracking-wide">
            Meghalaya Research Fellows
          </p>
        </div>

        {/* Sign-in Card */}
        <div className="rounded-2xl border border-white/10 bg-white/95 backdrop-blur-md shadow-2xl shadow-black/10 transition-all duration-300 hover:shadow-3xl">
          <div className="p-6 sm:p-8">
            <h2 className="text-[15px] font-semibold text-[hsl(var(--text-1))] text-center mb-5">
              Sign in to your account
            </h2>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              loading={loading}
              variant="outline"
              className="w-full h-12 text-[14px] font-medium border-[hsl(var(--border-strong))] hover:border-[hsl(var(--navy))] hover:bg-[hsl(var(--navy))/0.03] hover:shadow-md transition-all duration-200 active:scale-[0.99]"
              size="lg"
            >
              {!loading && (
                <svg className="mr-2.5 h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </Button>

            {error && (
              <div className="mt-4 rounded-lg bg-[hsl(var(--red-soft))] px-3 py-2.5 text-[13px] text-[hsl(var(--red))] text-center leading-relaxed">
                {error}
              </div>
            )}

            <p className="mt-5 text-[12px] text-[hsl(var(--text-4))] text-center leading-relaxed">
              Role assigned by administrator after sign-in
            </p>

            <div className="mt-5 pt-5 border-t border-[hsl(var(--border))]">
              <p className="text-[11px] text-[hsl(var(--text-4))] text-center leading-relaxed">
                Powered by <span className="font-semibold text-[hsl(var(--text-3))]">ISB</span> in partnership with{" "}
                <span className="font-semibold text-[hsl(var(--text-3))]">Govt. of Meghalaya</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
