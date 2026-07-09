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
    <div className="min-h-screen flex flex-col bg-[#fafafa]">

      {/* ─── Minimal top bar ─── */}
      <header className={`flex items-center justify-between px-8 py-6 transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#0d1f4b" />
            <path d="M8 10h12M8 14h8M8 18h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="text-[13px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">RFC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-[5px] w-[5px]">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
            <span className="relative inline-flex rounded-full h-[5px] w-[5px] bg-emerald-500" />
          </span>
          <span className="text-[11px] text-[#86868b]">Live</span>
        </div>
      </header>

      {/* ─── Main content ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">

        {/* ─── Card ─── */}
        <div className={`w-full max-w-[420px] transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

          {/* Heading */}
          <div className="text-center mb-10">
            <div className={`transition-all duration-500 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b] mb-4">Bharti Institute of Public Policy</p>
            </div>
            <h1 className={`text-[32px] sm:text-[36px] font-semibold text-[#1d1d1f] tracking-[-0.025em] leading-[1.15] transition-all duration-500 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              Research Fellow
              <br />
              <span className="text-[#0d1f4b]">Connect</span>
            </h1>
            <p className={`text-[15px] text-[#86868b] mt-4 leading-relaxed transition-all duration-500 delay-300 ${visible ? "opacity-100" : "opacity-0"}`}>
              Sign in to your dashboard
            </p>
          </div>

          {/* Card body */}
          <div className={`bg-white rounded-2xl p-8 sm:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-500 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

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

          {/* Footer info */}
          <div className={`mt-8 text-center transition-all duration-500 delay-[500ms] ${visible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[11px] text-[#aeaeb2] leading-relaxed">
              By signing in, you agree to the platform&apos;s terms.
              <br />
              Your account will be reviewed before access is granted.
            </p>
          </div>
        </div>
      </main>

      {/* ─── Bottom bar ─── */}
      <footer className={`px-8 py-6 flex items-center justify-between transition-all duration-500 delay-[600ms] ${visible ? "opacity-100" : "opacity-0"}`}>
        <p className="text-[11px] text-[#aeaeb2]">&copy; {new Date().getFullYear()} Bharti Institute of Public Policy</p>
        <div className="flex items-center gap-2 text-[11px] text-[#aeaeb2]">
          <span>Meghalaya</span>
          <span className="w-[3px] h-[3px] rounded-full bg-[#d2d2d7]" />
          <span>India</span>
        </div>
      </footer>
    </div>
  )
}
