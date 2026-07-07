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
    const t = setTimeout(() => setVisible(true), 60)
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

  const programs: { key: Program; icon: React.ReactNode }[] = [
    {
      key: "mdrf",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      key: "mlrf",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#f2efe9] text-[#151413] select-none">

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500;1,6..72,600;1,6..72,700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&display=swap');
        .font-display { font-family: 'Newsreader', Georgia, serif; }
        .font-body { font-family: 'DM Sans', system-ui, sans-serif; }
      `}} />

      {/* ── Main content ── */}
      <main className={`flex-1 max-w-[1080px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 flex flex-col justify-center gap-5 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

        {/* ── Header ── */}
        <header className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <AppLogo size={26} />
            <span className="font-body font-semibold text-[16px] tracking-tight text-[#151413]">Research Fellow Connect</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#c5002f]">Sign In</span>
        </header>

        {/* ── Asymmetric Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

          {/* ── Left: Hero Card ── */}
          <div className="md:col-span-3 rounded-[20px] bg-[#151413] text-white p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between min-h-[360px] sm:min-h-[420px]"
            style={{ boxShadow: "0 4px 10px rgba(21,20,19,.07), 0 20px 40px rgba(21,20,19,.12)" }}>

            {/* Decorative concentric rings */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full border border-white/[0.04] flex items-center justify-center">
              <div className="h-48 w-48 rounded-full border border-white/[0.04] flex items-center justify-center">
                <div className="h-32 w-32 rounded-full border border-white/[0.04] flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full border border-white/[0.03]" />
                </div>
              </div>
            </div>

            {/* Subtle grid pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />

            <div className="relative">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[#c5002f] font-bold block mb-7">
                Bharti Institute of Public Policy &middot; ISB
              </span>

              <div className="flex items-center gap-3.5 mb-5">
                <div className="text-[#c5002f]">
                  <AppLogo size={36} />
                </div>
                <h1 className="font-display text-[2.5rem] sm:text-[3.25rem] font-medium tracking-tight leading-none">
                  Research Fellow<br />Connect
                </h1>
              </div>

              <p className="font-display italic text-[15px] sm:text-[17px] text-white/50 leading-relaxed max-w-md mt-5">
                &ldquo;A unified platform connecting Meghalaya&rsquo;s District & Legislative Research Fellows with Coordinators and Directors to drive meaningful governance impact.&rdquo;
              </p>
            </div>

            {/* Bottom stat strip */}
            <div className="relative mt-10 pt-5 border-t border-white/[0.08] grid grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-[#c5002f] uppercase tracking-wider">Fellows</p>
                <p className="text-[9px] text-white/25 mt-0.5">work tracking</p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-[#c5002f] uppercase tracking-wider">Coordinators</p>
                <p className="text-[9px] text-white/25 mt-0.5">oversight & support</p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-[#c5002f] uppercase tracking-wider">Directors</p>
                <p className="text-[9px] text-white/25 mt-0.5">strategic leadership</p>
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="md:col-span-2 flex flex-col gap-5">

            {/* Programs Card */}
            <div className="rounded-[20px] bg-white border border-[#e5e0d5] p-6 flex flex-col"
              style={{ boxShadow: "0 1px 2px rgba(21,20,19,.04), 0 2px 8px rgba(21,20,19,.04)" }}>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#8b7e67] font-bold block mb-4">
                Our Programs
              </span>
              <div className="space-y-3">
                {programs.map(({ key, icon }) => {
                  const meta = PROGRAM_META[key]
                  return (
                    <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-[#faf8f5] border border-[#ebe7df] transition-colors hover:bg-[#f5f2ec]">
                      <div className="mt-0.5 text-[#c5002f] shrink-0">{icon}</div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-[13px] text-[#151413] leading-tight">{meta.app}</p>
                        <p className="text-[11px] text-[#675a44] mt-0.5 leading-snug">{meta.full}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Portal Access Card */}
            <div className="rounded-[20px] bg-white border border-[#e5e0d5] p-6 flex flex-col flex-1"
              style={{ boxShadow: "0 1px 2px rgba(21,20,19,.04), 0 2px 8px rgba(21,20,19,.04)" }}>
              <div className="flex-1">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#8b7e67] font-bold block mb-3">
                  Portal Access
                </span>
                <h3 className="font-display text-[17px] font-bold text-[#151413] leading-snug">
                  Sign in to your dashboard
                </h3>
                <p className="text-[12px] text-[#675a44] mt-2 leading-relaxed">
                  Access your personalized workspace to track progress, collaborate with your team, and submit reports.
                </p>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="group relative w-full h-12 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] select-none flex items-center justify-center gap-2.5 text-white font-bold text-[11px] uppercase tracking-[0.12em]"
                  style={{
                    background: loading ? "#6b3a4a" : "linear-gradient(135deg, #c5002f 0%, #aa0029 100%)",
                    boxShadow: "0 1px 2px rgba(21,20,19,.05), 0 4px 12px rgba(197,0,47,.2)",
                  }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: "0 8px 24px rgba(197,0,47,.3)" }} />

                  <span className="relative flex items-center justify-center gap-2.5">
                    {loading ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )}
                    {loading ? "Signing in..." : "Continue with Google"}
                    {!loading && (
                      <svg className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    )}
                  </span>
                </button>

                {error && (
                  <div className="mt-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] px-4 py-3 text-[11px] text-[#dc2626] text-center leading-relaxed font-medium">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#151413] text-white mt-auto border-t border-white/5">
        <div className="mx-auto max-w-3xl px-5 py-7 text-center">
          <div className="mb-2.5 flex justify-center text-[#c5002f]">
            <AppLogo size={24} />
          </div>
          <p className="font-display italic text-white/25 text-[13px]">
            Research &middot; Governance &middot; Meghalaya
          </p>
          <p className="text-white/15 text-[10px] mt-1 font-semibold tracking-[0.12em] uppercase">
            Bharti Institute of Public Policy &middot; ISB &middot; Government of Meghalaya
          </p>
          <div className="border-t border-white/[0.06] mt-4 pt-3 text-[10px] text-white/10">
            &copy; {new Date().getFullYear()} Indian School of Business. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
