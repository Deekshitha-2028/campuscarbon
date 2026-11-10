import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "sun" | "emission" | "leaf";

const toneClasses: Record<Tone, string> = {
  default: "bg-card",
  sun: "bg-sun-soft",
  emission: "bg-emission-soft",
  leaf: "bg-leaf-soft",
};
const iconTone: Record<Tone, string> = {
  default: "text-muted-foreground",
  sun: "text-warning",
  emission: "text-emission",
  leaf: "text-leaf",
};

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div data-print-card className={cn("rounded-xl border border-border p-4 shadow-card", toneClasses[tone])}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className={cn("h-4 w-4", iconTone[tone])} aria-hidden="true" />}
      </div>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-display text-2xl font-bold tabular text-foreground sm:text-3xl">{value}</span>
        {unit && <span className="font-mono text-xs text-muted-foreground">{unit}</span>}
      </p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
