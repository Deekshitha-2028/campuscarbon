import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Accessible info tooltip: opens on click/Enter (works on touch and keyboard). */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={`About ${label}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm leading-relaxed" side="top">
        <p className="mb-1 font-semibold">{label}</p>
        <div className="text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
