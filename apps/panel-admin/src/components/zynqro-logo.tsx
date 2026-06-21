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
              --logo-stop-top-start: #818CF8;
              --logo-stop-top-end: #4F46E5;
              --logo-stop-diag-start: #4F46E5;
              --logo-stop-diag-end: #06B6D4;
              --logo-stop-bot-start: #06B6D4;
              --logo-stop-bot-end: #67E8F9;
              --logo-dot-color: #06B6D4;
              --logo-shadow-color: #0F172A;
              --logo-shadow-opacity: 0.20;
              --logo-shadow-blur: 3px;
            }
            
            .dark .zynqro-logo,
            :root.dark .zynqro-logo,
            [data-theme='dark'] .zynqro-logo {
              --logo-stop-top-start: #A5B4FC;
              --logo-stop-top-end: #6366F1;
              --logo-stop-diag-start: #6366F1;
              --logo-stop-diag-end: #22D3EE;
              --logo-stop-bot-start: #22D3EE;
              --logo-stop-bot-end: #A5F3FC;
              --logo-dot-color: #22D3EE;
              --logo-shadow-color: #000000;
              --logo-shadow-opacity: 0.60;
              --logo-shadow-blur: 4px;
            }
          `}
        </style>
        
        {/* Dynamic shadow filter */}
        <filter id="fold-shadow-dynamic" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow 
            dx="2" 
            dy="4" 
            stdDeviation="var(--logo-shadow-blur)" 
            floodColor="var(--logo-shadow-color)" 
            floodOpacity="var(--logo-shadow-opacity)" 
          />
        </filter>
        
        {/* Dynamic gradients using CSS variables */}
        <linearGradient id="logo-grad-top" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--logo-stop-top-start)" />
          <stop offset="100%" stopColor="var(--logo-stop-top-end)" />
        </linearGradient>
        <linearGradient id="logo-grad-diag" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-stop-diag-start)" />
          <stop offset="100%" stopColor="var(--logo-stop-diag-end)" />
        </linearGradient>
        <linearGradient id="logo-grad-bot" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--logo-stop-bot-start)" />
          <stop offset="100%" stopColor="var(--logo-stop-bot-end)" />
        </linearGradient>
      </defs>

      <g transform={showText ? "translate(10, 10)" : "translate(5, 10)"}>
        {/* Capa 1 (Fondo): Barra Inferior */}
        <path d="M 25 75 L 78 75" fill="none" stroke="url(#logo-grad-bot)" strokeWidth="16" strokeLinecap="round" />
        
        {/* Capa 2 (Medio): Diagonal */}
        <path d="M 75 25 L 25 75" fill="none" stroke="url(#logo-grad-diag)" strokeWidth="16" strokeLinecap="round" filter="url(#fold-shadow-dynamic)" />

        {/* Capa 3 (Frente): Barra Superior */}
        <path d="M 22 25 L 75 25" fill="none" stroke="url(#logo-grad-top)" strokeWidth="16" strokeLinecap="round" filter="url(#fold-shadow-dynamic)" />
        
        {/* Nodos (Mimetizados con el fondo) */}
        <circle cx="22" cy="25" r="4" fill="currentColor" className="text-background" />
        <circle cx="78" cy="75" r="4" fill="currentColor" className="text-background" />
      </g>

      {showText && (
        <text x="115" y="65" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="44" fontWeight="800" fill="currentColor" className="text-foreground" letterSpacing="-1">
          Zynqro<tspan fill="var(--logo-dot-color)">.</tspan>
        </text>
      )}
    </svg>
  )
}
