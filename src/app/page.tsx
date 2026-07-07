"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithGoogle, getRoleHome } from "@/lib/auth"
import { getUserProfile, createUserProfile } from "@/lib/firestore"
import { PROGRAM_META } from "@/lib/constants"
import { AppLogo } from "@/components/shared/app-logo"
import type { Program } from "@/types"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
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

  async function handleGoogleSignIn() {
    setError("")
    setLoading(true)
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
      if (err?.code !== "auth/popup-closed-by-user") setError("Sign in failed. Please try again.")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--navy))] relative overflow-hidden select-none">

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&display=swap');
        .font-editorial { font-family: 'Playfair Display', Georgia, serif; }
        .font-body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroFadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes lineGrow {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}} />

      {/* ═══ Background atmosphere ═══ */}
      {/* Large gradient wash */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[hsl(var(--gold))]/[0.04] blur-[160px]" />
        <div className="absolute bottom-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-[hsl(var(--blue))]/[0.05] blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-[hsl(var(--navy-light))]/30 blur-[100px]" />
      </div>

      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.035]" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      {/* Thin horizontal accent lines */}
      <div className="absolute top-[25%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      <div className="absolute top-[75%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

      {/* Vertical accent line */}
      <div className="hidden lg:block absolute top-0 bottom-0 left-[52%] w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />


      {/* ═══ Main content ═══ */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">

        {/* ─── Left: Editorial hero ─── */}
        <div className={`lg:w-[58%] flex flex-col justify-between p-6 sm:p-8 lg:p-12 xl:p-16 2xl:p-20 transition-all duration-1000 ease-out ${visible ? "opacity-100" : "opacity-0"}`}>

          {/* Top bar */}
          <div className={`flex items-center justify-between transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-3">
              <AppLogo size={28} />
              <span className="font-body font-semibold text-[14px] text-white/80">RFC</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--gold))] opacity-40" style={{ animation: "subtlePulse 3s ease-in-out infinite" }} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--gold))]" />
              </span>
              <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Live Platform</span>
            </div>
          </div>

          {/* Hero content — editorial style */}
          <div className="flex-1 flex flex-col justify-center max-w-2xl mt-12 lg:mt-0">

            {/* Overline */}
            <div className={`flex items-center gap-3 mb-6 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
              <div className="w-8 h-px bg-[hsl(var(--gold))]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                Bharti Institute of Public Policy · ISB
              </span>
            </div>

            {/* Main headline — serif editorial */}
            <h1 className={`transition-all duration-900 delay-[400ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <span className="block font-editorial text-[2.5rem] sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight">
                Research
              </span>
              <span className="block font-editorial text-[2.5rem] sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem] font-bold leading-[1.05] tracking-tight">
                <span className="text-[hsl(var(--gold))] italic">Fellow</span>
                <span className="text-white/90"> Connect</span>
              </span>
            </h1>

            {/* Thin line separator */}
            <div className={`my-6 lg:my-8 overflow-hidden transition-all duration-700 delay-[600ms] ${visible ? "opacity-100" : "opacity-0"}`}>
              <div className="h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent" style={{ animation: visible ? "lineGrow 1s ease-out 0.8s both" : "none" }} />
            </div>

            {/* Subtitle */}
            <p className={`font-body text-[14px] sm:text-[15px] lg:text-[16px] text-white/35 leading-relaxed max-w-lg transition-all duration-700 delay-[700ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Connecting Meghalaya&apos;s District & Legislative Research Fellows with Coordinators and Directors to drive meaningful governance impact.
            </p>

            {/* Feature grid — minimal */}
            <div className={`grid grid-cols-3 gap-4 lg:gap-6 mt-8 lg:mt-12 transition-all duration-700 delay-[800ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {[
                { num: "01", label: "Fellows", desc: "work tracking" },
                { num: "02", label: "Coordinators", desc: "oversight" },
                { num: "03", label: "Directors", desc: "leadership" },
              ].map((item, i) => (
                <div key={item.num} className="group">
                  <span className="block text-[10px] font-bold text-[hsl(var(--gold))]/60 mb-1.5" style={{ animation: visible ? `dotBlink 2s ease-in-out ${1.5 + i * 0.3}s infinite` : "none" }}>
                    {item.num}
                  </span>
                  <p className="text-[13px] font-semibold text-white/70">{item.label}</p>
                  <p className="text-[11px] text-white/25 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`hidden lg:flex items-center justify-between transition-all duration-700 delay-[900ms] ${visible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[11px] text-white/[0.12] font-medium">&copy; {new Date().getFullYear()} Indian School of Business</p>
            <div className="flex items-center gap-3 text-[11px] text-white/[0.12]">
              <span>Meghalaya</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span>India</span>
            </div>
          </div>
        </div>


        {/* ─── Right: Sign-in panel ─── */}
        <div className={`lg:w-[42%] flex flex-col justify-center p-6 sm:p-8 lg:p-12 xl:p-16 transition-all duration-1000 delay-200 ${visible ? "opacity-100" : "opacity-0"}`}>

          <div className="w-full max-w-[380px] mx-auto lg:mx-0">

            {/* Mobile logo */}
            <div className={`lg:hidden flex items-center gap-3 mb-10 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <AppLogo size={32} />
              <span className="font-body font-bold text-[16px] text-white">Research Fellow Connect</span>
            </div>

            {/* Section label */}
            <div className={`flex items-center gap-2 mb-6 transition-all duration-700 delay-[400ms] ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Portal Access</span>
            </div>

            {/* Programs */}
            <div className={`space-y-3 mb-8 transition-all duration-700 delay-[500ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {([
                { key: "mdrf" as Program, icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" },
                { key: "mlrf" as Program, icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
              ]).map(({ key, icon }) => {
                const meta = PROGRAM_META[key]
                return (
                  <div key={key} className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.1] transition-all duration-300 cursor-default">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-white/40 group-hover:bg-[hsl(var(--gold))]/[0.12] group-hover:text-[hsl(var(--gold))] transition-all duration-300 shrink-0">
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-white/80">{meta.app}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{meta.full}</p>
                    </div>
                    <svg className="w-4 h-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                )
              })}
            </div>

            {/* Divider with label */}
            <div className={`relative mb-8 transition-all duration-700 delay-[600ms] ${visible ? "opacity-100" : "opacity-0"}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20">Sign In</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </div>

            {/* Google sign-in button */}
            <div className={`transition-all duration-700 delay-[700ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative w-full h-[52px] rounded-xl transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none flex items-center justify-center gap-3 bg-white text-[hsl(var(--navy))] font-bold text-[13px] hover:bg-white/95 shadow-[0_2px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.25)]"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-20" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                <span>{loading ? "Signing in..." : "Continue with Google"}</span>
                {!loading && (
                  <svg className="w-4 h-4 opacity-40 group-hover:translate-x-0.5 group-hover:opacity-70 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                )}
              </button>

              {/* Error message */}
              {error && (
                <div className="mt-4 rounded-xl bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/20 px-4 py-3 text-[12px] text-[hsl(var(--red))] text-center font-medium" style={{ animation: "heroFadeIn 0.3s ease-out" }}>
                  {error}
                </div>
              )}
            </div>

            {/* Bottom info */}
            <div className={`mt-10 transition-all duration-700 delay-[800ms] ${visible ? "opacity-100" : "opacity-0"}`}>
              <p className="text-[11px] text-white/15 leading-relaxed text-center lg:text-left">
                By signing in, you agree to the platform&apos;s terms. Your account will be reviewed by an administrator before access is granted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
