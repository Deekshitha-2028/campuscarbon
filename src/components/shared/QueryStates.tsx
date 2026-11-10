import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div role="status" aria-label="Loading data" className="space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load solar data",
  message,
  onRetry,
  retrying,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 bg-emission-soft p-5">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
        {title}
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={retrying ? "animate-spin" : undefined} aria-hidden="true" />
          {retrying ? "Retrying…" : "Retry"}
        </Button>
      )}
    </div>
  );
}
