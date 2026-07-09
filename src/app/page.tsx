"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  sendOtpToEmail, isOtpRedirect, completeOtpSignIn,
  signInWithGoogle, getRoleHome, validateIsbEmail,
} from "@/lib/auth"
import { getUserProfile, createUserProfile } from "@/lib/firestore"
import { PROGRAM_META } from "@/lib/constants"
import type { Program } from "@/types"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [otpEmail, setOtpEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  async function handleOtpRedirect() {
    if (!isOtpRedirect()) return
    setLoading("otp")
    try {
      const user = await completeOtpSignIn()
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
      setError(err.message || "Sign in failed. Please request a new OTP.")
      localStorage.removeItem("emailForSignIn")
    } finally { setLoading(null) }
  }

  useEffect(() => { handleOtpRedirect() }, [])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const email = otpEmail.trim()
    const validationError = validateIsbEmail(email)
    if (validationError) { setError(validationError); return }
    setLoading("otp")
    try {
      await sendOtpToEmail(email)
      setOtpSent(true)
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Try again.")
    } finally { setLoading(null) }
  }

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

  async function handleSignIn(provider: "google") {
    setError("")
    setLoading(provider)
    try {
      const user = await signInWithGoogle()
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

      {/* ═══════════════════════════════════════════════════════════════
          HERO PANEL
      ═══════════════════════════════════════════════════════════════ */}
      <div className={`relative bg-[#0a1628] overflow-hidden transition-all duration-1000 ${visible ? "opacity-100" : "opacity-0"} lg:w-[54%] lg:min-h-screen`}>

        {/* ── Animated background grid ── */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          animation: visible ? "gridShift 20s linear infinite" : "none",
        }} />

        {/* ── Floating orbs ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Orb 1 — large, slow drift */}
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07]"
            style={{
              background: "radial-gradient(circle, #80edd9 0%, transparent 70%)",
              top: "10%",
              left: "15%",
              animation: visible ? "orbFloat1 12s ease-in-out infinite" : "none",
            }}
          />
          {/* Orb 2 — medium, counter-drift */}
          <div
            className="absolute w-[350px] h-[350px] rounded-full opacity-[0.05]"
            style={{
              background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)",
              bottom: "15%",
              right: "10%",
              animation: visible ? "orbFloat2 15s ease-in-out infinite" : "none",
            }}
          />
          {/* Orb 3 — small, gentle pulse */}
          <div
            className="absolute w-[200px] h-[200px] rounded-full opacity-[0.08]"
            style={{
              background: "radial-gradient(circle, #80edd9 0%, transparent 70%)",
              top: "55%",
              left: "60%",
              animation: visible ? "orbPulse 8s ease-in-out infinite" : "none",
            }}
          />
        </div>

        {/* ── Floating geometric shapes ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Diamond 1 */}
          <div
            className="absolute w-16 h-16 border border-white/[0.06] rotate-45 rounded-sm"
            style={{ top: "15%", right: "20%", animation: visible ? "shapeFloat 10s ease-in-out infinite" : "none" }}
          />
          {/* Diamond 2 */}
          <div
            className="absolute w-10 h-10 border border-[#80edd9]/[0.08] rotate-45 rounded-sm"
            style={{ top: "65%", left: "12%", animation: visible ? "shapeFloat 12s ease-in-out infinite reverse" : "none" }}
          />
          {/* Circle 1 */}
          <div
            className="absolute w-24 h-24 border border-white/[0.04] rounded-full"
            style={{ top: "35%", right: "8%", animation: visible ? "shapeDrift 14s ease-in-out infinite" : "none" }}
          />
          {/* Circle 2 */}
          <div
            className="absolute w-3 h-3 rounded-full bg-[#80edd9]/20"
            style={{ top: "25%", left: "45%", animation: visible ? "dotBlink 3s ease-in-out infinite" : "none" }}
          />
          {/* Circle 3 */}
          <div
            className="absolute w-2 h-2 rounded-full bg-white/15"
            style={{ top: "70%", right: "35%", animation: visible ? "dotBlink 4s ease-in-out 1s infinite" : "none" }}
          />
          {/* Line accent */}
          <div
            className="absolute w-px h-32 bg-gradient-to-b from-transparent via-[#80edd9]/15 to-transparent"
            style={{ top: "20%", left: "30%", animation: visible ? "linePulse 6s ease-in-out infinite" : "none" }}
          />
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[420px] lg:min-h-screen p-8 sm:p-10 lg:p-10 xl:p-14">

          {/* Top bar */}
          <div className={`flex items-center justify-between transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
            <div className="flex items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.1" />
                <path d="M8 11h16M8 16h11M8 21h13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-white tracking-[-0.01em]">RFC</span>
                <span className="text-[10px] font-medium text-white/35 tracking-wide hidden sm:block">Research Fellow Connect</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.06]">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#80edd9] opacity-40 animate-ping" />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-[#80edd9]" />
              </span>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.1em]">Live</span>
            </div>
          </div>

          {/* Hero content */}
          <div className={`flex-1 flex flex-col justify-center max-w-xl transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

            {/* Overline */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-[2px] rounded-full bg-[#80edd9]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#80edd9]/70">
                Bharti Institute of Public Policy &middot; ISB
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-8">
              <span className="block text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem] xl:text-[4rem] font-semibold text-white leading-[1.08] tracking-[-0.03em]">
                Research
              </span>
              <span className="block text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem] xl:text-[4rem] font-semibold leading-[1.08] tracking-[-0.03em]">
                <span className="text-[#80edd9]">Fellow</span>
                <span className="text-white/90"> Connect</span>
              </span>
            </h1>

            {/* Separator */}
            <div className="w-12 h-px bg-gradient-to-r from-[#80edd9]/50 to-transparent mb-8" />

            {/* Description */}
            <p className="text-[15px] lg:text-[16px] text-white/45 leading-relaxed max-w-md">
              Connecting Meghalaya&apos;s District & Legislative Research Fellows with Coordinators and Directors to drive meaningful governance impact.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-10">
              {[
                { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Work tracking" },
                { icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", label: "Alerts" },
                { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: "Secure access" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm"
                  style={{ animation: visible ? `fadeUp 0.5s ease-out ${0.8 + i * 0.1}s both` : "none" }}
                >
                  <svg className="w-3.5 h-3.5 text-[#80edd9]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                  <span className="text-[12px] font-medium text-white/45">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`hidden lg:flex items-center justify-between transition-all duration-500 delay-300 ${visible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[11px] text-white/25 font-medium">&copy; {new Date().getFullYear()} Bharti Institute of Public Policy</p>
            <div className="flex items-center gap-2.5 text-[11px] text-white/25">
              <span>Meghalaya</span>
              <span className="w-[3px] h-[3px] rounded-full bg-white/15" />
              <span>India</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SIGN IN PANEL
      ═══════════════════════════════════════════════════════════════ */}
      <div className={`flex-1 flex flex-col justify-center items-center px-6 sm:px-10 py-10 lg:py-0 bg-[#fafafa] transition-all duration-700 delay-100 ${visible ? "opacity-100" : "opacity-0"}`}>

        <div className="w-full max-w-[400px]">

          {/* Card */}
          <div className={`bg-white rounded-2xl p-8 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] border border-black/[0.03] transition-all duration-500 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="#0d1f4b" />
                <path d="M8 10h12M8 14h8M8 18h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="text-[13px] font-semibold text-[#1d1d1f]">RFC</span>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b] mb-3">Welcome back</p>
              <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-[-0.02em] leading-[1.2]">Sign in to continue</h2>
            </div>

            {/* Programme pills */}
            <div className="flex gap-2 mb-8">
              {([
                { key: "mdrf" as Program },
                { key: "mlrf" as Program },
              ]).map(({ key }) => {
                const meta = PROGRAM_META[key]
                return (
                  <div key={key} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#f5f5f7] border border-transparent hover:border-[#d2d2d7] transition-all duration-200 cursor-default">
                    <span className="text-[12px] font-semibold text-[#1d1d1f]">{meta.label}</span>
                    <span className="text-[11px] text-[#86868b] hidden sm:inline">&middot;</span>
                    <span className="text-[11px] text-[#86868b] hidden sm:inline">{meta.short}</span>
                  </div>
                )
              })}
            </div>

            {/* Email OTP form */}
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[12px] text-red-600 text-center font-medium">
                    {error}
                  </div>
                )}
                <div>
                  <input
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="name@isb.edu"
                    autoComplete="email"
                    className="w-full h-[50px] rounded-xl border border-[#d2d2d7] bg-white px-4 text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none focus:border-[#0d1f4b] focus:ring-4 focus:ring-[#0d1f4b]/[0.08] transition-all duration-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading === "otp"}
                  className="w-full h-[50px] rounded-xl bg-[#0d1f4b] text-white font-semibold text-[15px] tracking-[-0.01em] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] flex items-center justify-center gap-2.5 hover:bg-[#131f70]"
                >
                  {loading === "otp" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-20" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  )}
                  <span>{loading === "otp" ? "Sending..." : "Continue with Email"}</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f7]">
                  <svg className="w-7 h-7 text-[#0d1f4b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <p className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">Check your email</p>
                <p className="text-[13px] text-[#86868b] mt-2 leading-relaxed">
                  We sent a sign-in link to
                </p>
                <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{otpEmail}</p>
                <p className="text-[11px] text-[#86868b] mt-3 leading-relaxed">
                  Also check your <span className="font-semibold">Junk Email</span> folder if you don&apos;t see it.
                </p>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setError("") }}
                  className="mt-5 text-[13px] font-semibold text-[#0d1f4b] hover:underline underline-offset-2"
                >
                  Use a different email
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#d2d2d7]/60" />
              <span className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-[0.1em]">or</span>
              <div className="flex-1 h-px bg-[#d2d2d7]/60" />
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={() => handleSignIn("google")}
              disabled={loading !== null}
              className="w-full h-[50px] rounded-xl bg-white border border-[#d2d2d7] text-[#1d1d1f] font-semibold text-[15px] tracking-[-0.01em] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] flex items-center justify-center gap-3 hover:bg-[#f5f5f7] hover:border-[#c7c7cc]"
            >
              {loading === "google" ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-20" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Terms */}
          <div className={`mt-8 text-center transition-all duration-500 delay-[500ms] ${visible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[11px] text-[#aeaeb2] leading-relaxed">
              By signing in, you agree to the platform&apos;s terms.
              <br />
              Your account will be reviewed before access is granted.
            </p>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-[11px] text-[#aeaeb2]">&copy; {new Date().getFullYear()} Bharti Institute of Public Policy</p>
          </div>
        </div>
      </div>

      {/* ── Keyframe animations ── */}
      <style jsx>{`
        @keyframes gridShift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(48px, 48px); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.08); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.08; }
          50% { transform: scale(1.15); opacity: 0.12; }
        }
        @keyframes shapeFloat {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-20px) rotate(45deg); }
        }
        @keyframes shapeDrift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, -15px); }
          75% { transform: translate(-15px, 10px); }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.3); }
        }
        @keyframes linePulse {
          0%, 100% { opacity: 0; transform: scaleY(0.5); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
