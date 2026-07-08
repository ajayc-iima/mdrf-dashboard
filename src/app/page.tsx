"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithGoogle, signInWithMicrosoft, getRoleHome } from "@/lib/auth"
import { getUserProfile, createUserProfile } from "@/lib/firestore"
import { PROGRAM_META } from "@/lib/constants"
import { AppLogo } from "@/components/shared/app-logo"
import type { Program } from "@/types"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

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

  async function handleSignIn(provider: "google" | "microsoft") {
    setError("")
    setLoading(provider)
    try {
      const fn = provider === "google" ? signInWithGoogle : signInWithMicrosoft
      const user = await fn()
      let profile = await getUserProfile(user.uid)
      if (!profile) {
        await createUserProfile(user.uid, {
          name: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email || "",
        })
        profile = await getUserProfile(user.uid)
      }
      if (!profile) { setError("Profile not found. Contact the administrator."); return }
      if (profile.status === "pending" || profile.status === "rejected") router.push("/pending")
      else if (profile.role) router.push(getRoleHome(profile.role))
      else router.push("/pending")
    } catch (err: any) {
      if (err?.code === 'offline') setError(err.message)
      else if (err?.code !== 'auth/popup-closed-by-user') setError("Sign in failed. Please try again.")
    } finally { setLoading(null) }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── Hero Panel ─── */}
      <div className={`relative bg-[#0d1f4b] overflow-hidden transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"} lg:w-[52%] lg:min-h-screen`}>

        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        {/* Topographic accent lines */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.04]" viewBox="0 0 800 900" fill="none">
          <path d="M-100 200 C200 150, 400 300, 800 250" stroke="white" strokeWidth="1" />
          <path d="M-100 300 C200 250, 400 400, 800 350" stroke="white" strokeWidth="1" />
          <path d="M-100 400 C200 350, 400 500, 800 450" stroke="white" strokeWidth="1" />
          <path d="M-100 500 C200 450, 400 600, 800 550" stroke="white" strokeWidth="1" />
          <path d="M-100 600 C200 550, 400 700, 800 650" stroke="white" strokeWidth="1" />
          <path d="M-100 700 C200 650, 400 800, 800 750" stroke="white" strokeWidth="1" />
        </svg>

        {/* Gradient glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] rounded-full bg-[#80edd9]/[0.06] blur-[100px] lg:blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-white/[0.02] blur-[80px] lg:blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[340px] lg:min-h-screen p-8 sm:p-10 lg:p-10 xl:p-14">

          {/* Top: Logo + Badge */}
          <div className={`flex items-center justify-between transition-all duration-500 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            <div className="flex items-center gap-3">
              <AppLogo size={28} />
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-white tracking-tight">RFC</span>
                <span className="text-[10px] font-medium text-white/40 tracking-wide hidden sm:block">Research Fellow Connect</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#80edd9] opacity-40 animate-ping" />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-[#80edd9]" />
              </span>
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.1em]">Live</span>
            </div>
          </div>

          {/* Center: Hero */}
          <div className={`flex-1 flex flex-col justify-center max-w-lg transition-all duration-600 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

            {/* Institution label */}
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="w-8 h-[2px] rounded-full bg-[#80edd9]" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#80edd9]/80">
                Bharti Institute of Public Policy &middot; ISB
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 lg:mb-8">
              <span className="block text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem] xl:text-[3.5rem] font-editorial font-bold text-white leading-[1.08] tracking-[-0.02em]">
                Research
              </span>
              <span className="block text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem] xl:text-[3.5rem] font-editorial font-bold leading-[1.08] tracking-[-0.02em]">
                <span className="text-[#80edd9] italic">Fellow</span>
                <span className="text-white/90"> Connect</span>
              </span>
            </h1>

            {/* Separator */}
            <div className="w-16 h-px bg-gradient-to-r from-[#80edd9]/60 to-transparent mb-6 lg:mb-8" />

            {/* Description */}
            <p className="text-[14px] lg:text-[15px] text-white/55 leading-relaxed max-w-md">
              Connecting Meghalaya&apos;s District & Legislative Research Fellows with Coordinators and Directors to drive meaningful governance impact.
            </p>

            {/* Feature highlights */}
            <div className="flex flex-col gap-4 mt-8 lg:mt-12">
              {[
                { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Weekly work tracking & reporting" },
                { icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", label: "Real-time alerts & notifications" },
                { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: "Secure & role-based access" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#80edd9]/[0.1] shrink-0">
                    <svg className="w-4 h-4 text-[#80edd9]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-white/50">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Footer */}
          <div className={`hidden lg:flex items-center justify-between transition-all duration-500 delay-300 ${visible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[11px] text-white/30 font-medium">&copy; {new Date().getFullYear()} Indian School of Business</p>
            <div className="flex items-center gap-3 text-[11px] text-white/30">
              <span>Meghalaya</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>India</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sign In Panel ─── */}
      <div className={`flex-1 flex flex-col justify-center items-center px-6 sm:px-10 py-10 lg:py-0 bg-[#f7f9fc] transition-all duration-700 delay-100 ${visible ? "opacity-100" : "opacity-0"}`}>

        <div className="w-full max-w-[400px]">

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] border border-black/[0.04] p-8 sm:p-10">

            {/* Welcome text */}
            <div className={`mb-8 transition-all duration-500 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#0d1f4b] mb-3">Welcome</p>
              <h2 className="text-[22px] font-bold text-[#0d1f4b] tracking-[-0.01em]">Sign in to continue</h2>
              <p className="text-[13px] text-[#5d6f7a] mt-2 leading-relaxed">Access your research dashboard and collaborate with your team.</p>
            </div>

            {/* Programme cards */}
            <div className={`space-y-2.5 mb-8 transition-all duration-500 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {([
                { key: "mdrf" as Program, icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
                { key: "mlrf" as Program, icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
              ]).map(({ key, icon }) => {
                const meta = PROGRAM_META[key]
                return (
                  <div key={key} className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#f7f9fc] border border-black/[0.04] transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0d1f4b]/[0.05] text-[#0d1f4b]/40 shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#0d1f4b]">{meta.app}</p>
                      <p className="text-[11px] text-[#7c8698] mt-[1px]">{meta.full}</p>
                    </div>
                    <svg className="w-4 h-4 text-[#bcc3cf] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                )
              })}
            </div>

            {/* Divider */}
            <div className={`relative mb-8 transition-all duration-500 delay-[400ms] ${visible ? "opacity-100" : "opacity-0"}`}>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-black/[0.06]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#bcc3cf]">Sign In</span>
                <div className="flex-1 h-px bg-black/[0.06]" />
              </div>
            </div>

            {/* Google button */}
            <div className={`transition-all duration-500 delay-[500ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <button
                type="button"
                onClick={() => handleSignIn("google")}
                disabled={loading !== null}
                className="group relative w-full h-[48px] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none flex items-center justify-center gap-3 bg-[#0d1f4b] text-white font-semibold text-[13px] hover:bg-[#131f70] shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(13,31,75,0.25)]"
              >
                {loading === "google" ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-20" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                <span>{loading === "google" ? "Signing in..." : "Continue with Google"}</span>
              </button>

              {/* Microsoft / ISB SSO button */}
              <button
                type="button"
                onClick={() => handleSignIn("microsoft")}
                disabled={loading !== null}
                className="group relative w-full h-[48px] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none flex items-center justify-center gap-3 bg-white text-[#0d1f4b] font-semibold text-[13px] border border-black/[0.08] hover:border-black/[0.12] hover:bg-[#f7f9fc] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] mt-3"
              >
                {loading === "microsoft" ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-20" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none">
                    <path d="M0 0h10.9v10.9H0V0z" fill="#F25022" />
                    <path d="M12.1 0H23v10.9H12.1V0z" fill="#7FBA00" />
                    <path d="M0 12.1h10.9V23H0V12.1z" fill="#00A4EF" />
                    <path d="M12.1 12.1H23V23H12.1V12.1z" fill="#FFB900" />
                  </svg>
                )}
                <span>{loading === "microsoft" ? "Signing in..." : "Sign in with ISB Microsoft"}</span>
              </button>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[12px] text-red-600 text-center font-medium" style={{ animation: "heroFadeIn 0.3s ease-out" }}>
                  {error}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className={`mt-8 transition-all duration-500 delay-[600ms] ${visible ? "opacity-100" : "opacity-0"}`}>
              <p className="text-[11px] text-[#bcc3cf] leading-relaxed text-center">
                By signing in, you agree to the platform&apos;s terms. Your account will be reviewed by an administrator before access is granted.
              </p>
            </div>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-[11px] text-[#7c8698]">&copy; {new Date().getFullYear()} Indian School of Business</p>
          </div>
        </div>
      </div>
    </div>
  )
}
