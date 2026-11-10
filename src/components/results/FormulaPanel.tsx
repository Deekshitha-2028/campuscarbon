import { ChevronDown, Sigma } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MonthlyResult } from "@/lib/calc";
import { MJ_PER_KWH } from "@/lib/calc";
import { fixed, num, pct } from "@/lib/format";

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-mono text-sm leading-relaxed">{children}</p>
    </div>
  );
}

export function FormulaPanel({
  monthly,
  areaM2,
  efficiency,
  performanceRatio,
  factor,
}: {
  monthly: MonthlyResult[];
  areaM2: number;
  efficiency: number;
  performanceRatio: number;
  factor: number;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(monthly[monthly.length - 1]?.key ?? "");
  const r = monthly.find((m) => m.key === key) ?? monthly[0];
  if (!r) return null;
  const H = r.radiationKWhM2;
  const days = Number(r.key.slice(5, 7)) ? new Date(Number(r.key.slice(0, 4)), Number(r.key.slice(5, 7)), 0).getDate() : 30;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border border-border bg-card shadow-card" data-print-card>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6">
        <span className="flex items-center gap-2">
          <Sigma className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display text-xl font-bold">Formula used</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">— actual numbers for one month</span>
        </span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent data-print-open>
        <div className="space-y-4 border-t border-border p-5 sm:p-6">
          <div className="max-w-xs" data-print-hide>
            <Label htmlFor="formula-month">Month</Label>
            <Select value={r.key} onValueChange={setKey}>
              <SelectTrigger id="formula-month" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthly.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Line label="1. Footprint (Scope 2, location-based)">
              CO₂ = kWh × EF = {num(r.consumptionKWh)} kWh × {fixed(factor, 3)} kg/kWh = <strong>{num(r.co2Kg, 1)} kg CO₂</strong>
            </Line>
            <Line label="2a. Radiation unit conversion">
              {H === null ? (
                "No radiation data for this month."
              ) : (
                <>
                  H = Σ daily MJ/m² ÷ {MJ_PER_KWH} = {fixed(H * MJ_PER_KWH, 1)} MJ/m² ÷ 3.6 = <strong>{fixed(H, 2)} kWh/m²</strong>{" "}
                  ({fixed(H / days, 2)} kWh/m²/day × {days} days)
                </>
              )}
            </Line>
            <Line label="2b. Solar generation">
              {H === null ? (
                "Not available."
              ) : (
                <>
                  E = H × A × η × PR = {fixed(H, 2)} × {num(areaM2, 1)} m² × {fixed(efficiency, 3)} × {fixed(performanceRatio, 2)} ={" "}
                  <strong>{num(r.solarKWh, 1)} kWh</strong>
                </>
              )}
            </Line>
            <Line label="3. Offset share and CO₂ avoided">
              {r.solarKWh === null ? (
                "Not available."
              ) : (
                <>
                  min(100, {num(r.solarKWh, 1)} ÷ {num(r.consumptionKWh)} × 100) = <strong>{pct(r.offsetPct)}</strong>
                  <br />
                  Avoided = {num(r.solarKWh, 1)} kWh × {fixed(factor, 3)} = <strong>{num(r.co2AvoidedKg, 1)} kg CO₂</strong>
                </>
              )}
            </Line>
            <Line label="4. Net grid electricity and net CO₂">
              Net kWh = max(0, {num(r.consumptionKWh)} − {num(r.solarKWh ?? 0, 1)}) = {num(r.netGridKWh, 1)} kWh
              <br />
              Net CO₂ = {num(r.netGridKWh, 1)} × {fixed(factor, 3)} = <strong>{num(r.netCo2Kg, 1)} kg CO₂</strong>
            </Line>
            <Line label="Installed capacity">
              kWp = A × η × 1 kW/m² = {num(areaM2, 1)} × {fixed(efficiency, 3)} × 1 = <strong>{fixed(areaM2 * efficiency, 1)} kWp</strong>
            </Line>
          </div>
          {r.consumptionMissing && (
            <p className="text-sm text-warning">This month's consumption was left blank and is counted as 0 kWh.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
