import { Cloud, Sun, Thermometer } from "lucide-react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationSelect } from "@/components/shared/LocationSelect";
import { ErrorState } from "@/components/shared/QueryStates";
import { useCampusLocation } from "@/hooks/useCampusLocation";
import { useForecast } from "@/hooks/useSolarData";
import { dateTime, num } from "@/lib/format";

const config = { irradianceWm2: { label: "Irradiance (W/m²)", color: "var(--chart-2)" } } satisfies ChartConfig;

function irradianceLabel(w: number | null): string {
  if (w === null) return "No reading";
  if (w < 5) return "Night / no sun";
  if (w < 200) return "Low sun";
  if (w < 600) return "Moderate sun";
  return "Strong sun";
}

export function LiveSolarCard({ showSelector = true }: { showSelector?: boolean }) {
  const { location, setLocationId } = useCampusLocation();
  const q = useForecast(location.id);
  const d = q.data?.data;
  const cur = d?.current;
  const hourly = (d?.hourlyToday ?? []).map((h) => ({ ...h, hour: h.time.slice(11, 16) }));
  const peak = hourly.reduce((m, h) => Math.max(m, h.irradianceWm2 ?? 0), 0);

  return (
    <section aria-labelledby="live-title" className="rounded-2xl border border-border bg-card p-5 shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
            </span>
            Right now
          </p>
          <h2 id="live-title" className="text-lg font-bold">
            {location.name} solar
          </h2>
        </div>
        {showSelector && <LocationSelect value={location.id} onChange={setLocationId} id="live-location" className="w-44" />}
      </div>

      {q.isPending ? (
        <div className="mt-4 space-y-3" role="status" aria-label="Loading live solar data">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-28" />
        </div>
      ) : q.isError ? (
        <div className="mt-4">
          <ErrorState message={q.error.message} onRetry={() => q.refetch()} retrying={q.isFetching} />
        </div>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-sun-soft p-3">
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sun className="h-3.5 w-3.5" aria-hidden="true" /> Irradiance
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular">
                {num(cur?.irradianceWm2)}
                <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">W/m²</span>
              </dd>
              <dd className="text-xs text-muted-foreground">{irradianceLabel(cur?.irradianceWm2 ?? null)}</dd>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cloud className="h-3.5 w-3.5" aria-hidden="true" /> Cloud cover
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular">
                {num(cur?.cloudCover)}
                <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">%</span>
              </dd>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <Thermometer className="h-3.5 w-3.5" aria-hidden="true" /> Temperature
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular">
                {num(cur?.temperature, 1)}
                <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">°C</span>
              </dd>
            </div>
          </dl>
          {hourly.length > 0 && (
            <figure className="mt-4">
              <figcaption className="mb-1 text-xs text-muted-foreground">
                Today's hourly irradiance, peak {num(peak)} W/m²
              </figcaption>
              <ChartContainer config={config} className="aspect-auto h-28 w-full">
                <AreaChart data={hourly} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} interval={5} fontSize={10} />
                  <YAxis hide domain={[0, "auto"]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="irradianceWm2" type="monotone" stroke="var(--color-irradianceWm2)" fill="var(--color-irradianceWm2)" fillOpacity={0.3} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </figure>
          )}
          <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground">
            Open-Meteo · local time {cur?.time?.slice(11, 16) || "—"} IST · fetched {dateTime(q.data?.fetchedAt)}
            {q.data?.fromCache ? " · saved copy" : ""}
          </p>
        </>
      )}
    </section>
  );
}
