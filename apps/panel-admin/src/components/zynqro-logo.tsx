import React from "react"

interface ZynqroLogoProps extends React.SVGProps<SVGSVGElement> {
  // Optional flag to show text. Default is true.
  showText?: boolean
}

export function ZynqroLogo({ showText = true, className, style, ...props }: ZynqroLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showText ? "0 0 350 100" : "0 0 100 100"}
      className={`zynqro-logo ${className || ""}`}
      style={{ maxWidth: showText ? "175px" : "40px", ...style }}
      {...props}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');
            
            .zynqro-logo {
              --logo-stop-top-start: #4F46E5;
              --logo-stop-top-end: #6366F1;
              --logo-stop-bot-start: #06B6D4;
              --logo-stop-bot-end: #22D3EE;
              --logo-dot-1: #6366F1;
              --logo-dot-2: #0EA5E9;
              --logo-dot-3: #06B6D4;
            }
            
            .dark .zynqro-logo,
            :root.dark .zynqro-logo,
            [data-theme='dark'] .zynqro-logo {
              --logo-stop-top-start: #818CF8;
              --logo-stop-top-end: #6366F1;
              --logo-stop-bot-start: #22D3EE;
              --logo-stop-bot-end: #06B6D4;
              --logo-dot-1: #818CF8;
              --logo-dot-2: #38BDF8;
              --logo-dot-3: #22D3EE;
            }
          `}
        </style>
        
        {/* Dynamic gradients using CSS variables */}
        <linearGradient id="logo-grad-top" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--logo-stop-top-start)" />
          <stop offset="100%" stopColor="var(--logo-stop-top-end)" />
        </linearGradient>
        <linearGradient id="logo-grad-bot" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--logo-stop-bot-start)" />
          <stop offset="100%" stopColor="var(--logo-stop-bot-end)" />
        </linearGradient>
      </defs>

      <g transform={showText ? "translate(10, 10)" : "translate(5, 10)"}>
        {/* Barra Superior */}
        <path d="M 20 25 L 70 25" fill="none" stroke="url(#logo-grad-top)" strokeWidth="14" strokeLinecap="round" />
        
        {/* Tres Puntos de Sincronización */}
        <circle cx="60" cy="37.5" r="7" fill="var(--logo-dot-1)" />
        <circle cx="50" cy="50" r="7" fill="var(--logo-dot-2)" />
        <circle cx="40" cy="62.5" r="7" fill="var(--logo-dot-3)" />

        {/* Barra Inferior */}
        <path d="M 30 75 L 80 75" fill="none" stroke="url(#logo-grad-bot)" strokeWidth="14" strokeLinecap="round" />
      </g>

      {showText && (
        <text x="115" y="65" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="44" fontWeight="800" fill="currentColor" className="text-foreground" letterSpacing="-1">
          Zynqro
        </text>
      )}
    </svg>
  )
}
