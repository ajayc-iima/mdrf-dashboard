interface AppLogoProps {
  size?: number
  variant?: "default" | "compact"
}

export function AppLogo({ size = 48 }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.3">
            <animate attributeName="stopOpacity" values="0.3;0.15;0.3" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="20" fill="url(#logoGlow)" />
      <path
        d="M24 2L6 12v10c0 11.05 7.16 21.46 18 24 10.84-2.54 18-12.95 18-24V12L24 2z"
        fill="currentColor"
        className="text-[hsl(var(--navy))]"
      />
      <path
        d="M24 6L10 14.5v8.5c0 9.15 5.93 17.78 14 20 8.07-2.22 14-10.85 14-20v-8.5L24 6z"
        fill="#fff"
        opacity="0.9"
      />
      <path
        d="M16 20c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v10H16V20z"
        fill="currentColor"
        className="text-[hsl(var(--navy))]"
        opacity="0.15"
      />
      <path
        d="M18 20c0-1.1.9-2 2-2h4v10h-6V20z"
        fill="currentColor"
        className="text-[hsl(var(--navy))]"
        opacity="0.25"
      />
      <path
        d="M24 18h4c1.1 0 2 .9 2 2v8h-6V18z"
        fill="currentColor"
        className="text-[hsl(var(--navy))]"
        opacity="0.25"
      />
      <line x1="24" y1="18" x2="24" y2="28" stroke="currentColor" className="text-[hsl(var(--gold))]" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
      </line>
      <path
        d="M20 14l-3 5v-3l3-2zm8 0l3 5v-3l-3-2zm-4-2l-2 3h4l-2-3z"
        fill="currentColor"
        className="text-[hsl(var(--gold))]"
        opacity="0.8"
      />
      <path
        d="M24 2L6 12v1l18-10 18 10v-1L24 2z"
        fill="currentColor"
        className="text-[hsl(var(--gold))]"
        opacity="0.6"
      />
    </svg>
  )
}

export function AppLogoSmall({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 2L6 12v10c0 11.05 7.16 21.46 18 24 10.84-2.54 18-12.95 18-24V12L24 2z"
        fill="currentColor"
        className="text-[hsl(var(--navy))]"
      />
      <path
        d="M24 6L10 14.5v8.5c0 9.15 5.93 17.78 14 20 8.07-2.22 14-10.85 14-20v-8.5L24 6z"
        fill="#fff"
        opacity="0.9"
      />
      <path
        d="M20 14l-3 5v-3l3-2zm8 0l3 5v-3l-3-2zm-4-2l-2 3h4l-2-3z"
        fill="currentColor"
        className="text-[hsl(var(--gold))]"
        opacity="0.8"
      />
      <path
        d="M24 2L6 12v1l18-10 18 10v-1L24 2z"
        fill="currentColor"
        className="text-[hsl(var(--gold))]"
        opacity="0.6"
      />
    </svg>
  )
}
