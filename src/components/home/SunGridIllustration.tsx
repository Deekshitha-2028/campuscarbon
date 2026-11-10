/** Animated SVG: a coal power station far away vs the sun over a campus rooftop. */
export function SunGridIllustration() {
  return (
    <svg viewBox="0 0 480 340" className="h-auto w-full" role="img" aria-labelledby="illus-title illus-desc">
      <title id="illus-title">Grid electricity versus rooftop solar</title>
      <desc id="illus-desc">
        A distant power station sends electricity and smoke along transmission lines to a campus building, while the sun
        shines directly onto solar panels on the building's roof.
      </desc>

      {/* ground */}
      <path d="M0 290 Q240 270 480 290 L480 340 L0 340 Z" className="fill-secondary" />

      {/* sun */}
      <g transform="translate(360 78)">
        <circle r="62" className="animate-sun-pulse fill-sun-soft" />
        <g className="animate-sun-spin">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x="-3" y="-58" width="6" height="16" rx="3" className="fill-sun" transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle r="34" className="fill-sun" />
      </g>

      {/* sun rays to roof */}
      <g className="stroke-sun" strokeWidth="3" strokeLinecap="round">
        <line x1="330" y1="120" x2="300" y2="196" className="animate-flow" />
        <line x1="352" y1="128" x2="340" y2="196" className="animate-flow" />
        <line x1="374" y1="126" x2="380" y2="196" className="animate-flow" />
      </g>

      {/* power station */}
      <g transform="translate(40 170)">
        <rect x="0" y="50" width="96" height="70" rx="4" className="fill-muted-foreground/50" />
        <rect x="18" y="0" width="18" height="60" className="fill-muted-foreground/70" />
        <rect x="52" y="14" width="18" height="46" className="fill-muted-foreground/70" />
        <circle cx="27" cy="-6" r="9" className="animate-smoke fill-emission/50" />
        <circle cx="61" cy="8" r="8" className="animate-smoke fill-emission/40" style={{ animationDelay: "1.2s" }} />
        <circle cx="30" cy="-10" r="7" className="animate-smoke fill-emission/40" style={{ animationDelay: "2.1s" }} />
        <text x="48" y="140" textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
          coal · gas · hydro · RE
        </text>
      </g>

      {/* transmission line */}
      <g className="stroke-foreground/50" strokeWidth="2" fill="none">
        <path d="M150 210 L170 150 L190 210 M158 180 L182 180" />
        <path d="M136 206 Q200 230 252 214" strokeDasharray="0" />
      </g>
      <path d="M136 206 Q200 230 252 214" className="animate-flow stroke-emission" strokeWidth="3" fill="none" />

      {/* campus building */}
      <g transform="translate(250 196)">
        <rect x="0" y="12" width="180" height="88" rx="4" className="fill-card stroke-border" strokeWidth="2" />
        {[0, 1, 2, 3, 4].map((c) =>
          [0, 1].map((r) => (
            <rect key={`${c}-${r}`} x={16 + c * 32} y={30 + r * 30} width="18" height="18" rx="2" className="fill-sky/30" />
          )),
        )}
        {/* panels */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${14 + i * 40} 0) skewX(-18)`}>
            <rect width="34" height="12" rx="1.5" className="fill-primary" />
            <line x1="11" y1="0" x2="11" y2="12" className="stroke-primary-foreground/40" />
            <line x1="22" y1="0" x2="22" y2="12" className="stroke-primary-foreground/40" />
          </g>
        ))}
        <text x="90" y="118" textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
          your campus building
        </text>
      </g>
    </svg>
  );
}
