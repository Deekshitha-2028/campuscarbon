import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { MonthlyResult } from "@/lib/calc";
import { num } from "@/lib/format";

const energyConfig = {
  consumption: { label: "Consumption (kWh)", color: "var(--chart-1)" },
  solar: { label: "Solar generation (kWh)", color: "var(--chart-2)" },
} satisfies ChartConfig;

const co2Config = {
  without: { label: "Without solar (kg CO₂)", color: "var(--chart-3)" },
  with: { label: "With solar (kg CO₂)", color: "var(--chart-4)" },
} satisfies ChartConfig;

const shortMonth = (label: string) => label.replace(/ (\d{2})(\d{2})$/, " '$2");

export function EnergyComboChart({ monthly }: { monthly: MonthlyResult[] }) {
  const data = monthly.map((r) => ({
    month: shortMonth(r.label),
    consumption: Math.round(r.consumptionKWh),
    solar: r.solarKWh === null ? null : Math.round(r.solarKWh),
  }));
  const maxC = monthly.reduce((a, r) => (r.consumptionKWh > a.consumptionKWh ? r : a), monthly[0]);
  const maxS = monthly.reduce((a, r) => ((r.solarKWh ?? 0) > (a.solarKWh ?? 0) ? r : a), monthly[0]);
  const summary = `Combo chart of monthly consumption and solar generation. Highest consumption ${maxC?.label}: ${num(maxC?.consumptionKWh)} kWh. Highest solar ${maxS?.label}: ${num(maxS?.solarKWh)} kWh. Full values are in the month-by-month table.`;
  return (
    <figure role="img" aria-label={summary}>
      <ChartContainer config={energyConfig} className="aspect-auto h-[320px] w-full">
        <ComposedChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} width={56} tickFormatter={(v) => num(v)} label={{ value: "kWh", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="consumption" name="Consumption (kWh)" fill="var(--color-consumption)" radius={[4, 4, 0, 0]} />
          <Line dataKey="solar" name="Solar generation (kWh)" stroke="var(--color-solar)" strokeWidth={3} dot={{ r: 3, fill: "var(--color-solar)" }} type="monotone" connectNulls />
        </ComposedChart>
      </ChartContainer>
    </figure>
  );
}

export function Co2Chart({ monthly }: { monthly: MonthlyResult[] }) {
  const data = monthly.map((r) => ({
    month: shortMonth(r.label),
    without: Math.round(r.co2Kg),
    with: Math.round(r.netCo2Kg),
  }));
  const tw = monthly.reduce((a, r) => a + r.co2Kg, 0);
  const tn = monthly.reduce((a, r) => a + r.netCo2Kg, 0);
  return (
    <figure role="img" aria-label={`Monthly CO₂ footprint with and without solar. Annual ${num(tw)} kg without solar, ${num(tn)} kg with solar.`}>
      <ChartContainer config={co2Config} className="aspect-auto h-[300px] w-full">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} width={56} tickFormatter={(v) => num(v)} label={{ value: "kg CO₂", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="without" name="Without solar (kg CO₂)" fill="var(--color-without)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="with" name="With solar (kg CO₂)" fill="var(--color-with)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </figure>
  );
}
