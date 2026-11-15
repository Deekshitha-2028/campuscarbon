import { AlertTriangle, Calculator as CalcIcon, Copy, Receipt } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { InfoTip } from "@/components/shared/InfoTip";
import { LocationSelect } from "@/components/shared/LocationSelect";
import { BUILDING_TYPES, type BuildingType } from "@/lib/buildings";
import { installedCapacityKWp } from "@/lib/calc";
import { CEA_FACTORS, CEA_SOURCE, CUSTOM_FACTOR_ID } from "@/lib/emissionFactors";
import { fixed, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { parseNumber, type FormState, type StepIssues } from "./formState";

type Props = {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  issues: StepIssues;
  showErrors: boolean;
};

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-1 text-sm font-medium text-destructive">
      {msg}
    </p>
  );
}

function FieldWarning({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-1 flex items-center gap-1 text-xs font-medium text-warning">
      <AlertTriangle className="h-3 w-3" aria-hidden="true" /> {msg}
    </p>
  );
}

export function StepBuilding({ form, update, issues, showErrors }: Props) {
  const err = showErrors ? issues.errors : {};
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="b-name">Building name</Label>
        <Input
          id="b-name"
          className="mt-1.5"
          value={form.name}
          maxLength={100}
          placeholder="e.g. Hostel A, CSE Department"
          onChange={(e) => update({ name: e.target.value })}
          aria-invalid={!!err.name}
          aria-describedby={err.name ? "b-name-err" : undefined}
          autoComplete="off"
        />
        <FieldError id="b-name-err" msg={err.name} />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Building type</legend>
        <RadioGroup
          value={form.type}
          onValueChange={(v) => update({ type: v as BuildingType })}
          className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5"
        >
          {BUILDING_TYPES.map((t) => (
            <Label
              key={t.id}
              htmlFor={`type-${t.id}`}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                form.type === t.id && "border-primary bg-secondary",
              )}
            >
              <RadioGroupItem id={`type-${t.id}`} value={t.id} />
              {t.label}
            </Label>
          ))}
        </RadioGroup>
      </fieldset>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="b-location">Campus location (for sunlight data)</Label>
          <LocationSelect id="b-location" value={form.locationId} onChange={(v) => update({ locationId: v })} className="mt-1.5 w-full" />
        </div>
      </div>
      <div>
        <Label htmlFor="b-notes">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="b-notes"
          className="mt-1.5"
          rows={3}
          value={form.notes}
          maxLength={600}
          placeholder="Meter number, roof condition, who gave you the bills…"
          onChange={(e) => update({ notes: e.target.value })}
          aria-invalid={!!err.notes}
          aria-describedby="b-notes-count"
        />
        <p id="b-notes-count" className="mt-1 text-xs text-muted-foreground">
          {form.notes.length}/500
        </p>
        <FieldError id="b-notes-err" msg={err.notes} />
      </div>
    </div>
  );
}

export function StepConsumption({ form, update, issues, showErrors }: Props) {
  const [bulk, setBulk] = useState("");
  const err = showErrors ? issues.errors : {};
  const bulkVal = parseNumber(bulk);
  const bulkOk = bulkVal !== null && !Number.isNaN(bulkVal);
  const total = form.months.reduce((a, m) => {
    const n = parseNumber(m.value);
    return a + (n !== null && !Number.isNaN(n) ? n : 0);
  }, 0);
  const missing = form.months.filter((m) => m.value.trim() === "").length;

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-xl border border-border bg-sun-soft p-4 text-sm">
        <Receipt className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <p>
          <strong>Where to find kWh:</strong> on a BESCOM (or other ESCOM) bill, look for <em>Units consumed</em>,
          calculated as present reading minus previous reading. One unit = 1 kWh. For HT connections, use the kWh line,
          not kVAh or kVA demand.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="bulk">Same value every month (shortcut)</Label>
          <Input
            id="bulk"
            inputMode="decimal"
            className="mt-1.5"
            placeholder="e.g. 30000"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={!bulkOk}
          onClick={() => update({ months: form.months.map((m) => ({ ...m, value: String(bulkVal) })) })}
        >
          <Copy aria-hidden="true" /> Fill all 12 months
        </Button>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-medium">Monthly consumption (kWh), last 12 complete months</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {form.months.map((m, i) => {
            const e = err[`m-${m.key}`];
            const w = issues.warnings[`m-${m.key}`];
            return (
              <div key={m.key}>
                <Label htmlFor={`m-${m.key}`} className="text-xs text-muted-foreground">
                  {m.label}
                </Label>
                <div className="relative mt-1">
                  <Input
                    id={`m-${m.key}`}
                    inputMode="decimal"
                    value={m.value}
                    placeholder="kWh"
                    className="pr-12 tabular"
                    aria-invalid={!!e}
                    aria-describedby={e ? `m-${m.key}-err` : w ? `m-${m.key}-warn` : undefined}
                    onChange={(ev) => {
                      const months = form.months.slice();
                      months[i] = { ...m, value: ev.target.value };
                      update({ months });
                    }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                    kWh
                  </span>
                </div>
                <FieldError id={`m-${m.key}-err`} msg={e} />
                <FieldWarning id={`m-${m.key}-warn`} msg={w} />
              </div>
            );
          })}
        </div>
        <FieldError id="months-err" msg={err.months} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <p>
          Annual total: <strong className="tabular">{num(total)} kWh</strong>
        </p>
        {missing > 0 && missing < 12 && (
          <p className="text-warning">
            {missing} month{missing > 1 ? "s" : ""} left blank. They count as 0 kWh and are flagged in the results.
          </p>
        )}
      </div>
    </div>
  );
}

export function StepRooftop({ form, update, issues, showErrors }: Props) {
  const err = showErrors ? issues.errors : {};
  const L = parseNumber(form.length);
  const W = parseNumber(form.width);
  const lw = L !== null && W !== null && !Number.isNaN(L) && !Number.isNaN(W) ? L * W : null;
  const eff = parseNumber(form.efficiencyPct);
  const pr = parseNumber(form.pr);
  const area = parseNumber(form.area);
  const kwp = area && eff && !Number.isNaN(area) && !Number.isNaN(eff) ? installedCapacityKWp(area, eff / 100) : null;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1">
          <Label htmlFor="area">Usable rooftop area</Label>
          <InfoTip label="Usable rooftop area (A)">
            The shade-free part of the roof where panels can actually go. Leave out water tanks, staircase rooms,
            parapet shadows and walkways. A rough rule: 60–75% of a flat terrace is usable.
          </InfoTip>
        </div>
        <div className="relative mt-1.5 max-w-xs">
          <Input
            id="area"
            inputMode="decimal"
            className="pr-10 tabular"
            value={form.area}
            onChange={(e) => update({ area: e.target.value })}
            aria-invalid={!!err.area}
            aria-describedby={err.area ? "area-err" : undefined}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">m²</span>
        </div>
        <FieldError id="area-err" msg={err.area} />

        <div className="mt-3 rounded-xl border border-dashed border-border p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <CalcIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> Area helper: length × width
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="len" className="text-xs text-muted-foreground">Length (m)</Label>
              <Input id="len" inputMode="decimal" className="mt-1 w-28" value={form.length} onChange={(e) => update({ length: e.target.value })} />
            </div>
            <span className="pb-2 text-muted-foreground" aria-hidden="true">×</span>
            <div>
              <Label htmlFor="wid" className="text-xs text-muted-foreground">Width (m)</Label>
              <Input id="wid" inputMode="decimal" className="mt-1 w-28" value={form.width} onChange={(e) => update({ width: e.target.value })} />
            </div>
            <p className="pb-2 text-sm tabular" aria-live="polite">= {lw !== null ? `${fixed(lw, 1)} m²` : "—"}</p>
            <Button type="button" variant="secondary" size="sm" className="mb-0.5" disabled={lw === null || lw <= 0} onClick={() => lw && update({ area: String(Math.round(lw * 10) / 10) })}>
              Use this area
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-1">
            <Label htmlFor="eff">Panel efficiency (η)</Label>
            <InfoTip label="Panel efficiency (η)">
              The fraction of sunlight hitting the panel that comes out as DC electricity. Commercial silicon modules are
              about 18–22%. Default 20%.
            </InfoTip>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Slider
              aria-label="Panel efficiency slider"
              min={15}
              max={23}
              step={0.5}
              value={[eff !== null && !Number.isNaN(eff) ? Math.min(23, Math.max(15, eff)) : 20]}
              onValueChange={(vals) => update({ efficiencyPct: String(vals[0] ?? 20) })}
            />
            <div className="relative w-24 shrink-0">
              <Input id="eff" inputMode="decimal" className="pr-7 tabular" value={form.efficiencyPct} onChange={(e) => update({ efficiencyPct: e.target.value })} aria-invalid={!!err.efficiencyPct} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Range 15–23%</p>
          <FieldError id="eff-err" msg={err.efficiencyPct} />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <Label htmlFor="pr">Performance ratio (PR)</Label>
            <InfoTip label="Performance ratio (PR)">
              Real-world losses lumped together: heat (−0.3 to −0.5% per °C above 25 °C), dust, wiring, inverter
              conversion, shading, mismatch and ageing. 0.75 means 25% is lost between panel rating and the meter.
            </InfoTip>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Slider
              aria-label="Performance ratio slider"
              min={0.65}
              max={0.85}
              step={0.01}
              value={[pr !== null && !Number.isNaN(pr) ? Math.min(0.85, Math.max(0.65, pr)) : 0.75]}
              onValueChange={(vals) => update({ pr: (vals[0] ?? 0.75).toFixed(2) })}
            />
            <Input id="pr" inputMode="decimal" className="w-24 shrink-0 tabular" value={form.pr} onChange={(e) => update({ pr: e.target.value })} aria-invalid={!!err.pr} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Range 0.65–0.85</p>
          <FieldError id="pr-err" msg={err.pr} />
        </div>
      </div>

      <p className="rounded-lg bg-leaf-soft px-4 py-3 text-sm">
        Installed capacity estimate:{" "}
        <strong className="tabular">{kwp !== null ? `${fixed(kwp, 1)} kWp` : "—"}</strong>
        <span className="text-muted-foreground"> (area × η × 1 kW/m²)</span>
      </p>
    </div>
  );
}

export function StepGrid({ form, update, issues, showErrors }: Props) {
  const err = showErrors ? issues.errors : {};
  const isCustom = form.factorId === CUSTOM_FACTOR_ID;
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1">
          <Label htmlFor="factor">Grid emission factor</Label>
          <InfoTip label="Grid emission factor">
            The average kg of CO₂ emitted per kWh generated across all grid-connected Indian power stations, weighted by
            net generation and including renewables. CEA publishes a new value every year.
          </InfoTip>
        </div>
        <Select value={form.factorId} onValueChange={(v) => update({ factorId: v })}>
          <SelectTrigger id="factor" className="mt-1.5 w-full sm:w-[420px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CEA_FACTORS.map((f, i) => (
              <SelectItem key={f.id} value={f.id}>
                FY {f.fy}: {f.value.toFixed(3)} kg CO₂/kWh (CEA {f.version}
                {f.published ? `, ${f.published}` : ""}){i === 0 ? " · latest" : ""}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_FACTOR_ID}>Custom factor…</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isCustom && (
        <div>
          <Label htmlFor="custom">Custom factor</Label>
          <div className="relative mt-1.5 max-w-xs">
            <Input
              id="custom"
              inputMode="decimal"
              className="pr-28 tabular"
              placeholder="e.g. 0.82"
              value={form.customFactor}
              onChange={(e) => update({ customFactor: e.target.value })}
              aria-invalid={!!err.customFactor}
              aria-describedby={err.customFactor ? "custom-err" : "custom-help"}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">kg CO₂/kWh</span>
          </div>
          <p id="custom-help" className="mt-1 text-xs text-muted-foreground">
            Use this for a state-specific, combined-margin or supplier-specific factor. Results will be labelled as a custom override.
          </p>
          <FieldError id="custom-err" msg={err.customFactor} />
        </div>
      )}
      <div className="rounded-xl border border-border bg-muted p-4 text-sm">
        <p className="font-medium">Source</p>
        <p className="text-muted-foreground">
          {CEA_SOURCE.name}, "{CEA_SOURCE.title}". {CEA_SOURCE.metric}.{" "}
          <a href={CEA_SOURCE.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4">
            cea.nic.in
          </a>
        </p>
      </div>
    </div>
  );
}
