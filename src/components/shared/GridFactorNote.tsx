import { Zap } from "lucide-react";
import { factorCitation, type ResolvedFactor } from "@/lib/emissionFactors";
import { cn } from "@/lib/utils";

export function GridFactorNote({ factor, className }: { factor: ResolvedFactor; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 font-mono text-[0.72rem] leading-snug text-muted-foreground", className)}>
      <Zap className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{factorCitation(factor)}</span>
    </p>
  );
}
