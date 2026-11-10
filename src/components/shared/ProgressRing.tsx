import { pct } from "@/lib/format";

export function ProgressRing({ value, size = 180, label = "Offset share" }: { value: number; size?: number; label?: string }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <figure
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${pct(v)} of annual consumption covered by rooftop solar`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="stroke-sun transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <figcaption className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
        <span className="font-display text-4xl font-bold tabular">{pct(v, 0)}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </figcaption>
    </figure>
  );
}
