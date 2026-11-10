import { pct } from "@/lib/format";

export function ProgressRing({ value, size = 180, label = "Offset share" }: { value: number; size?: number; label?: string }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <figure className="flex flex-col items-center" role="img" aria-label={`${label}: ${pct(v)} of annual consumption covered by rooftop solar`}>
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
      <div className="-mt-[calc(50%+1.6rem)] mb-[calc(50%-2.4rem)] text-center" style={{ marginTop: -size / 2 - 26, marginBottom: size / 2 - 38 }}>
        <p className="font-display text-4xl font-bold tabular">{pct(v, 0)}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </figure>
  );
}
