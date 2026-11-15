import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { MonthlyRadiation } from "@/lib/calc";
import { fixed, num, shortDate } from "@/lib/format";

const shortMonth = (label: string) => label.replace(/ (\d{2})(\d{2})$/, " '$2");
const axis = { tickLine: false, axisLine: false, fontSize: 11 } as const;

function extreme<T>(rows: T[], f: (r: T) => number | null, dir: 1 | -1): T | undefined {
  return rows.reduce<T | undefined>((best, r) => {
    const v = f(r);
    if (v === null) return best;
    const b = best ? f(best) : null;
    return b === null || (dir === 1 ? v > b : v < b) ? r : best;
  }, undefined);
}

const monthlyConfig = { radiation: { label: "Radiation (kWh/m²)", color: "var(--chart-2)" } } satisfies ChartConfig;

export function MonthlyRadiationChart({ monthly }: { monthly: MonthlyRadiation[] }) {
  const data = monthly.map((m) => ({ month: shortMonth(m.label), radiation: Math.round(m.radiationKWhM2 * 10) / 10 }));
  const hi = extreme(monthly, (m) => m.radiationKWhM2, 1);
  const lo = extreme(monthly, (m) => m.radiationKWhM2, -1);
  const total = monthly.reduce((a, m) => a + m.radiationKWhM2, 0);
  return (
    <figure
      role="img"
      aria-label={`Monthly solar radiation on a horizontal surface. Total ${num(total)} kWh/m² over 12 months. Highest ${hi?.label}: ${fixed(hi?.radiationKWhM2, 1)} kWh/m². Lowest ${lo?.label}: ${fixed(lo?.radiationKWhM2, 1)} kWh/m².`}
    >
      <ChartContainer config={monthlyConfig} className="aspect-auto h-[300px] w-full">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" {...axis} interval="preserveStartEnd" />
          <YAxis {...axis} width={48} label={{ value: "kWh/m²", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="radiation" name="Radiation (kWh/m²)" fill="var(--color-radiation)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </figure>
  );
}

const dailyConfig = { radiation: { label: "Radiation (kWh/m²/day)", color: "var(--chart-2)" } } satisfies ChartConfig;

export function DailyRadiationChart({ rows }: { rows: { date: string; radiation: number | null }[] }) {
  const data = rows.map((r) => ({ day: shortDate(r.date), radiation: r.radiation === null ? null : Math.round(r.radiation * 100) / 100 }));
  const valid = rows.filter((r) => r.radiation !== null) as { date: string; radiation: number }[];
  const avg = valid.length ? valid.reduce((a, r) => a + r.radiation, 0) / valid.length : null;
  const hi = extreme(valid, (r) => r.radiation, 1);
  const lo = extreme(valid, (r) => r.radiation, -1);
  return (
    <figure
      role="img"
      aria-label={`Daily solar radiation for ${rows.length} days. Average ${fixed(avg, 2)} kWh/m²/day. Highest ${hi ? shortDate(hi.date) : "—"}: ${fixed(hi?.radiation, 2)}. Lowest ${lo ? shortDate(lo.date) : "—"}: ${fixed(lo?.radiation, 2)}.`}
    >
      <ChartContainer config={dailyConfig} className="aspect-auto h-[280px] w-full">
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" {...axis} minTickGap={24} />
          <YAxis {...axis} width={48} domain={[0, "auto"]} label={{ value: "kWh/m²/day", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area dataKey="radiation" name="Radiation (kWh/m²/day)" type="monotone" stroke="var(--color-radiation)" fill="var(--color-radiation)" fillOpacity={0.25} strokeWidth={2} connectNulls />
        </AreaChart>
      </ChartContainer>
    </figure>
  );
}

const pshConfig = {
  psh: { label: "Peak sun hours (h/day)", color: "var(--chart-4)" },
  sunshine: { label: "Bright sunshine (h/day)", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function PeakSunChart({ monthly }: { monthly: MonthlyRadiation[] }) {
  const data = monthly.map((m) => ({
    month: shortMonth(m.label),
    psh: Math.round(m.peakSunHours * 100) / 100,
    sunshine: m.sunshineHoursPerDay === null ? null : Math.round(m.sunshineHoursPerDay * 10) / 10,
  }));
  const hi = extreme(monthly, (m) => m.peakSunHours, 1);
  const lo = extreme(monthly, (m) => m.peakSunHours, -1);
  return (
    <figure role="img" aria-label={`Average peak sun hours per day by month. Highest ${hi?.label}: ${fixed(hi?.peakSunHours, 2)} h. Lowest ${lo?.label}: ${fixed(lo?.peakSunHours, 2)} h.`}>
      <ChartContainer config={pshConfig} className="aspect-auto h-[280px] w-full">
        <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" {...axis} interval="preserveStartEnd" />
          <YAxis {...axis} width={40} domain={[0, "auto"]} label={{ value: "hours/day", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line dataKey="psh" name="Peak sun hours (h/day)" stroke="var(--color-psh)" strokeWidth={3} dot={{ r: 3 }} type="monotone" />
          <Line dataKey="sunshine" name="Bright sunshine (h/day)" stroke="var(--color-sunshine)" strokeWidth={2} strokeDasharray="5 4" dot={false} type="monotone" connectNulls />
        </LineChart>
      </ChartContainer>
    </figure>
  );
}

const cloudConfig = {
  radiation: { label: "Radiation (kWh/m²)", color: "var(--chart-2)" },
  cloud: { label: "Mean cloud cover (%)", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function CloudVsRadiationChart({ monthly }: { monthly: MonthlyRadiation[] }) {
  const data = monthly.map((m) => ({
    month: shortMonth(m.label),
    radiation: Math.round(m.radiationKWhM2 * 10) / 10,
    cloud: m.cloudCoverMean === null ? null : Math.round(m.cloudCoverMean),
  }));
  const cloudiest = extreme(monthly, (m) => m.cloudCoverMean, 1);
  const clearest = extreme(monthly, (m) => m.cloudCoverMean, -1);
  return (
    <figure
      role="img"
      aria-label={`Monthly radiation (bars) against mean cloud cover (line). Cloudiest ${cloudiest?.label}: ${num(cloudiest?.cloudCoverMean)}% cloud, ${fixed(cloudiest?.radiationKWhM2, 1)} kWh/m². Clearest ${clearest?.label}: ${num(clearest?.cloudCoverMean)}% cloud, ${fixed(clearest?.radiationKWhM2, 1)} kWh/m².`}
    >
      <ChartContainer config={cloudConfig} className="aspect-auto h-[300px] w-full">
        <ComposedChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" {...axis} interval="preserveStartEnd" />
          <YAxis yAxisId="rad" {...axis} width={48} label={{ value: "kWh/m²", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <YAxis yAxisId="cloud" orientation="right" {...axis} width={40} domain={[0, 100]} label={{ value: "cloud %", angle: 90, position: "insideRight", fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="rad" dataKey="radiation" name="Radiation (kWh/m²)" fill="var(--color-radiation)" radius={[4, 4, 0, 0]} />
          <Line yAxisId="cloud" dataKey="cloud" name="Mean cloud cover (%)" stroke="var(--color-cloud)" strokeWidth={3} dot={{ r: 3 }} type="monotone" connectNulls />
        </ComposedChart>
      </ChartContainer>
    </figure>
  );
}

const recentConfig = {
  past: { label: "Measured (kWh/m²)", color: "var(--chart-2)" },
  forecast: { label: "Forecast (kWh/m²)", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function RecentForecastChart({ daily }: { daily: { date: string; radiationKWhM2: number | null; isForecast: boolean }[] }) {
  const data = daily.map((d) => {
    const v = d.radiationKWhM2 === null ? null : Math.round(d.radiationKWhM2 * 100) / 100;
    return { day: shortDate(d.date), past: d.isForecast ? null : v, forecast: d.isForecast ? v : null };
  });
  const past = daily.filter((d) => !d.isForecast && d.radiationKWhM2 !== null);
  const fut = daily.filter((d) => d.isForecast && d.radiationKWhM2 !== null);
  const avg = (a: typeof daily) => (a.length ? a.reduce((s, d) => s + (d.radiationKWhM2 ?? 0), 0) / a.length : null);
  return (
    <figure role="img" aria-label={`Daily radiation for the past ${past.length} days (average ${fixed(avg(past), 2)} kWh/m²/day) and the next ${fut.length} days forecast (average ${fixed(avg(fut), 2)} kWh/m²/day).`}>
      <ChartContainer config={recentConfig} className="aspect-auto h-[240px] w-full">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" {...axis} minTickGap={12} />
          <YAxis {...axis} width={40} domain={[0, "auto"]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar stackId="d" dataKey="past" name="Measured (kWh/m²)" fill="var(--color-past)" radius={[4, 4, 0, 0]} />
          <Bar stackId="d" dataKey="forecast" name="Forecast (kWh/m²)" fill="var(--color-forecast)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </figure>
  );
}
