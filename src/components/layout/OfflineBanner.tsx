import { WifiOff } from "lucide-react";
import { useCacheFallbackCount, useOnline } from "@/hooks/useSolarData";
import { useHydrated } from "@/hooks/useLocalStore";

export function OfflineBanner() {
  const hydrated = useHydrated();
  const online = useOnline();
  const fallbacks = useCacheFallbackCount();
  if (!hydrated || (online && fallbacks === 0)) return null;
  return (
    <div role="status" data-print-hide className="border-b border-warning/40 bg-warning-soft">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm text-foreground sm:px-6">
        <WifiOff className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span>
          {online
            ? "Couldn't reach Open-Meteo. Showing the last saved solar data."
            : "You're offline. Showing the last saved solar data and your saved buildings."}
        </span>
      </div>
    </div>
  );
}
