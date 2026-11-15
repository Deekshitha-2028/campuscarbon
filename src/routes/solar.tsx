import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO, subDays } from "date-fns";
import { CalendarDays, CloudRain, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Section } from "@/components/shared/PageHeader";
import { LocationSelect } from "@/components/shared/LocationSelect";
import { ChartSkeleton, ErrorState } from "@/components/shared/QueryStates";
import { StatCard } from "@/components/shared/StatCard";
import { LiveSolarCard } from "@/components/solar/LiveSolarCard";
import {
  CloudVsRadiationChart,
  DailyRadiationChart,
  MonthlyRadiationChart,
  PeakSunChart,
  RecentForecastChart,
} from "@/components/solar/SolarCharts";
import { useCampusLocation } from "@/hooks/useCampusLocation";
import { useArchive, useForecast } from "@/hooks/useSolarData";
import { mjToKWh, type MonthlyRadiation } from "@/lib/calc";
import { dateTime, fixed, num } from "@/lib/format";

const TITLE = "Live solar data explorer — CampusCarbon: Tumakuru";
const DESC =
  "Twelve months of Open-Meteo sunlight for Tumakuru and other Karnataka cities: monthly kWh/m², daily radiation, peak sun hours and cloud cover.";

export const Route = createFileRoute("/solar")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SolarPage,
});

function seasonAvg(monthly: MonthlyRadiation[], months: number[]) {
  const rows = monthly.filter((m) => months.includes(m.month));
  if (!rows.length) return { psh: null, cloud: null };
  const clouds = rows.map((r) => r.cloudCoverMean).filter((c): c is number => c !== null);
  return {
    psh: rows.reduce((a, r) => a + r.peakSunHours, 0) / rows.length,
    cloud: clouds.length ? clouds.reduce((a, c) => a + c, 0) / clouds.length : null,
  };
}

function SolarPage() {
  const { location, setLocationId } = useCampusLocation();
  const archive = useArchive(location.id);
  const forecast = useForecast(location.id);
  const data = archive.data?.data;
  const monthly = data?.monthly ?? [];

  const totals = useMemo(() => {
    if (!monthly.length) return null;
    const annual = monthly.reduce((a, m) => a + m.radiationKWhM2, 0);
    const days = monthly.reduce((a, m) => a + m.daysInMonth, 0);
    const best = monthly.reduce((b, m) => (m.peakSunHours > b.peakSunHours ? m : b));
    const worst = monthly.reduce((b, m) => (m.peakSunHours < b.peakSunHours ? m : b));
    return { annual, avgPsh: annual / days, best, worst };
  }, [monthly]);

  const dry = seasonAvg(monthly, [2, 3, 4, 5]);
  const monsoon = seasonAvg(monthly, [6, 7, 8, 9]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Solar data · Open-Meteo"
        title={`Sunlight in ${location.name}`}
        actions={<LocationSelect value={location.id} onChange={setLocationId} id="solar-location" className="w-52" />}
      >
        Measured shortwave radiation on a horizontal surface, converted from MJ/m² to kWh/m² (÷ 3.6). Archive data runs
        to about a week ago; the live card and 14-day chart use the forecast service.
      </PageHeader>

      {archive.isError && !data && (
        <ErrorState message={archive.error.message} onRetry={() => archive.refetch()} retrying={archive.isFetching} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="12-month total" value={totals ? num(totals.annual) : "…"} unit="kWh/m²" icon={Sun} tone="sun" />
        <StatCard label="Average peak sun hours" value={totals ? fixed(totals.avgPsh, 2) : "…"} unit="h/day" icon={Sun} />
        <StatCard label="Sunniest month" value={totals ? totals.best.label : "…"} hint={totals ? `${fixed(totals.best.peakSunHours, 2)} kWh/m²/day` : undefined} icon={Sun} tone="leaf" />
        <StatCard label="Dullest month" value={totals ? totals.worst.label : "…"} hint={totals ? `${fixed(totals.worst.peakSunHours, 2)} kWh/m²/day` : undefined} icon={CloudRain} tone="emission" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <LiveSolarCard showSelector={false} />
        <Section id="recent" title="Last 7 days and next 7 days" description="Daily radiation in kWh/m², measured and forecast.">
          {forecast.isPending ? (
            <ChartSkeleton height={220} />
          ) : forecast.isError ? (
            <ErrorState message={forecast.error.message} onRetry={() => forecast.refetch()} retrying={forecast.isFetching} />
          ) : (
            <RecentForecastChart daily={forecast.data.data.daily} />
          )}
        </Section>
      </div>

      <Section
        id="monthly"
        title="Monthly radiation, last 12 complete months"
        description={data ? `${data.startDate} to ${data.endDate} · fetched ${dateTime(archive.data?.fetchedAt)} IST${archive.data?.fromCache ? " · saved copy" : ""}` : "Loading…"}
      >
        {archive.isPending ? <ChartSkeleton /> : monthly.length ? <MonthlyRadiationChart monthly={monthly} /> : null}
      </Section>

      <Section id="daily" title="Daily radiation" description="Pick any range inside the last 12 months.">
        {archive.isPending ? <ChartSkeleton /> : data ? <DailyExplorer daily={data.daily} start={data.startDate} end={data.endDate} /> : null}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section id="psh" title="Average peak sun hours by month" description="Peak sun hours = daily kWh/m² (hours of 1 kW/m² sun). Dashed: hours of bright sunshine.">
          {archive.isPending ? <ChartSkeleton /> : monthly.length ? <PeakSunChart monthly={monthly} /> : null}
        </Section>
        <Section id="cloud" title="Cloud cover against radiation" description="More cloud, less energy reaching the roof.">
          {archive.isPending ? <ChartSkeleton /> : monthly.length ? <CloudVsRadiationChart monthly={monthly} /> : null}
        </Section>
      </div>

      <Section id="season" title={`Why ${location.name}'s output changes by season`}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl bg-sun-soft p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Sun className="h-5 w-5 text-warning" aria-hidden="true" /> February to May: clearest skies
            </h3>
            <p className="text-sm">
              Dry winds and few clouds let most of the sunlight through, and the sun climbs high over the Deccan plateau
              as it moves north towards the Tropic of Cancer. Radiation peaks in March and April.
            </p>
            <p className="font-mono text-sm tabular">
              Average {fixed(dry.psh, 2)} kWh/m²/day · cloud {num(dry.cloud)}%
            </p>
          </div>
          <div className="space-y-3 rounded-xl bg-muted p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <CloudRain className="h-5 w-5 text-sky" aria-hidden="true" /> June to September: monsoon
            </h3>
            <p className="text-sm">
              The south-west monsoon brings thick, persistent cloud. Even on dry days the sky is hazy, so less sunlight
              reaches the panels and output drops. Cooler panels recover only a small part of that loss.
            </p>
            <p className="font-mono text-sm tabular">
              Average {fixed(monsoon.psh, 2)} kWh/m²/day · cloud {num(monsoon.cloud)}%
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          October to January sits in between: the north-east monsoon adds some cloud in October and November, and the
          lower winter sun and shorter days trim output in December. Hot April afternoons also cost a little, because
          panels lose roughly 0.3–0.5% of their output for every °C above 25 °C.
        </p>
      </Section>

      {monthly.length > 0 && (
        <Section id="data-table" title="Monthly data table">
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-[640px] text-sm">
              <TableCaption className="sr-only">Monthly sunlight values for {location.name}</TableCaption>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead scope="col">Month</TableHead>
                  <TableHead scope="col" className="text-right">Radiation (kWh/m²)</TableHead>
                  <TableHead scope="col" className="text-right">Peak sun hours (h/day)</TableHead>
                  <TableHead scope="col" className="text-right">Sunshine (h/day)</TableHead>
                  <TableHead scope="col" className="text-right">Cloud cover (%)</TableHead>
                  <TableHead scope="col" className="text-right">Mean temp (°C)</TableHead>
                  <TableHead scope="col" className="text-right">Days with data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular">
                {monthly.map((m) => (
                  <TableRow key={m.key}>
                    <TableHead scope="row" className="font-medium text-foreground">{m.label}</TableHead>
                    <TableCell className="text-right">{fixed(m.radiationKWhM2, 1)}</TableCell>
                    <TableCell className="text-right">{fixed(m.peakSunHours, 2)}</TableCell>
                    <TableCell className="text-right">{fixed(m.sunshineHoursPerDay, 1)}</TableCell>
                    <TableCell className="text-right">{num(m.cloudCoverMean)}</TableCell>
                    <TableCell className="text-right">{fixed(m.temperatureMean, 1)}</TableCell>
                    <TableCell className="text-right">
                      {m.daysWithData}/{m.daysInMonth}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Section>
      )}
    </div>
  );
}

function DailyExplorer({ daily, start, end }: { daily: { date: string; radiationMJ: number | null }[]; start: string; end: string }) {
  const minDate = parseISO(start);
  const maxDate = parseISO(end);
  const [range, setRange] = useState<DateRange | undefined>({ from: subDays(maxDate, 29), to: maxDate });
  const [open, setOpen] = useState(false);

  const from = range?.from ? format(range.from, "yyyy-MM-dd") : start;
  const to = range?.to ? format(range.to, "yyyy-MM-dd") : from;
  const rows = daily
    .filter((d) => d.date >= from && d.date <= to)
    .map((d) => ({ date: d.date, radiation: d.radiationMJ === null ? null : mjToKWh(d.radiationMJ) }));

  const preset = (days: number) => setRange({ from: days ? subDays(maxDate, days - 1) : minDate, to: maxDate });
  const label = range?.from
    ? `${format(range.from, "d MMM yyyy")} – ${format(range.to ?? range.from, "d MMM yyyy")}`
    : "Pick dates";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" data-print-hide>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-label={`Date range: ${label}`}>
              <CalendarDays aria-hidden="true" /> {label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={setRange}
              defaultMonth={range?.from ?? maxDate}
              startMonth={minDate}
              endMonth={maxDate}
              disabled={{ before: minDate, after: maxDate }}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="sm" onClick={() => preset(7)}>7 days</Button>
        <Button variant="ghost" size="sm" onClick={() => preset(30)}>30 days</Button>
        <Button variant="ghost" size="sm" onClick={() => preset(90)}>90 days</Button>
        <Button variant="ghost" size="sm" onClick={() => preset(0)}>All 12 months</Button>
      </div>
      {rows.length ? (
        <DailyRadiationChart rows={rows} />
      ) : (
        <p className="text-sm text-muted-foreground">No data in that range. Pick dates between {start} and {end}.</p>
      )}
    </div>
  );
}
