import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calculator,
  Check,
  Cloud,
  Download,
  Factory,
  FlaskConical,
  Gauge,
  Leaf,
  Pencil,
  Printer,
  Ruler,
  Save,
  SunMedium,
  Trees,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, Section } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { GridFactorNote } from "@/components/shared/GridFactorNote";
import { ChartSkeleton, ErrorState } from "@/components/shared/QueryStates";
import { Co2Chart, EnergyComboChart } from "@/components/results/ResultsCharts";
import { FormulaPanel } from "@/components/results/FormulaPanel";
import { MonthlyTable } from "@/components/results/MonthlyTable";
import { toForm, draftStore } from "@/components/calculator/formState";
import { useHydrated, useLocalStore } from "@/hooks/useLocalStore";
import { useBuildingResults } from "@/hooks/useBuildingResults";
import {
  buildingsStore,
  buildingTypeLabel,
  currentCalcStore,
  exampleInput,
  saveBuilding,
  type CurrentCalc,
} from "@/lib/buildings";
import { getLocation } from "@/lib/locations";
import { dateTime, fixed, num, pct, tonnes } from "@/lib/format";
import { downloadText, printLight, resultsCsv, slug } from "@/lib/csv";

const TITLE = "Results: footprint vs rooftop solar — CampusCarbon: Tumakuru";
const DESC =
  "Annual and monthly Scope 2 CO₂, rooftop solar generation, offset share, trees equivalent and installed kWp for a campus building.";

export const Route = createFileRoute("/results")({
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
  component: ResultsPage,
});

function ResultsPage() {
  const hydrated = useHydrated();
  const current = useLocalStore(currentCalcStore);
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6" role="status" aria-label="Loading results">
        <Skeleton className="h-12 w-2/3" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }
  if (!current) return <EmptyResults />;
  return <ResultsView current={current} />;
}

function EmptyResults() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <p className="eyebrow">Results</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">No calculation yet</h1>
      <p className="mt-3 text-muted-foreground">
        Run the calculator for a building, open one from My Buildings, or try the sample 300-bed hostel.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="hero" size="lg">
          <Link to="/calculator">
            <Calculator aria-hidden="true" /> Open the calculator
          </Link>
        </Button>
        <Button
          variant="sun"
          size="lg"
          onClick={() => {
            currentCalcStore.set({ input: exampleInput(), savedId: null, computedAt: Date.now() });
            navigate({ to: "/results" });
          }}
        >
          <FlaskConical aria-hidden="true" /> Show the sample hostel
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/buildings">My buildings</Link>
        </Button>
      </div>
    </div>
  );
}

function ResultsView({ current }: { current: CurrentCalc }) {
  const navigate = useNavigate();
  const buildings = useLocalStore(buildingsStore);
  const { input } = current;
  const saved = current.savedId ? (buildings.find((b) => b.id === current.savedId) ?? null) : null;
  const { archive, evaluation, radiation, source, fetchedAt } = useBuildingResults(input, saved);
  const { monthly, totals, factor } = evaluation;
  const location = getLocation(input.locationId);
  const solarLoading = archive.isPending && source === "none";
  const isSaved = !!saved && JSON.stringify(saved.input) === JSON.stringify(input);

  const s = (v: string) => (solarLoading ? "…" : totals.hasSolar ? v : "—");

  const onSave = () => {
    const b = saveBuilding(input, radiation, fetchedAt, saved?.id);
    currentCalcStore.set({ ...current, savedId: b.id });
    toast.success(saved ? `Updated "${input.building.name}" in My Buildings.` : `Saved "${input.building.name}" to My Buildings.`);
  };

  const onCsv = () => {
    const csv = resultsCsv({
      buildingName: input.building.name,
      locationName: location.name,
      areaM2: input.rooftop.areaM2,
      efficiency: input.rooftop.efficiency,
      performanceRatio: input.rooftop.performanceRatio,
      factor,
      monthly,
      totals,
    });
    downloadText(`campuscarbon-${slug(input.building.name)}.csv`, csv);
    toast.success("CSV downloaded.");
  };

  const onEdit = () => {
    draftStore.set({ form: toForm(input), step: 0, editId: current.savedId });
    navigate({ to: "/calculator", search: {} });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow={`Results · ${buildingTypeLabel(input.building.type)} · ${location.name}`}
        title={input.building.name || "Untitled building"}
        actions={
          <>
            <Button variant={isSaved ? "outline" : "hero"} onClick={onSave} disabled={isSaved}>
              {isSaved ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}
              {isSaved ? "Saved" : saved ? "Update saved building" : "Save to My Buildings"}
            </Button>
            <Button variant="outline" onClick={onCsv}>
              <Download aria-hidden="true" /> Export CSV
            </Button>
            <Button variant="outline" onClick={printLight}>
              <Printer aria-hidden="true" /> Print / PDF
            </Button>
            <Button variant="ghost" onClick={onEdit}>
              <Pencil aria-hidden="true" /> Edit inputs
            </Button>
          </>
        }
      >
        <p>
          {num(input.rooftop.areaM2, 1)} m² usable roof · η {fixed(input.rooftop.efficiency * 100, 1)}% · PR{" "}
          {fixed(input.rooftop.performanceRatio, 2)} · {input.months[0]?.label} to {input.months[11]?.label}
        </p>
        {input.building.notes && <p className="mt-1 text-sm italic">{input.building.notes}</p>}
        <GridFactorNote factor={factor} className="mt-2" />
      </PageHeader>

      <Notices
        missingMonths={totals.missingMonths}
        zeroConsumption={totals.consumptionKWh === 0}
        monthsWithoutRadiation={solarLoading ? 0 : totals.monthsWithoutRadiation}
        source={source}
        fetchedAt={fetchedAt}
        fromCache={!!archive.data?.fromCache}
      />

      {archive.isError && source === "none" && (
        <ErrorState
          title="Couldn't load sunlight data, so solar figures are missing"
          message={`${archive.error.message} The CO₂ footprint below is still correct.`}
          onRetry={() => archive.refetch()}
          retrying={archive.isFetching}
        />
      )}

      <section aria-labelledby="summary-title" className="space-y-3">
        <h2 id="summary-title" className="sr-only">
          Summary
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Annual consumption" value={num(totals.consumptionKWh)} unit="kWh" icon={Zap} />
          <StatCard label="Annual CO₂ footprint" value={tonnes(totals.co2Kg, 1)} unit="t CO₂" icon={Factory} tone="emission" hint={`${num(totals.co2Kg)} kg CO₂`} />
          <StatCard label="Solar generation" value={s(num(totals.solarKWh))} unit="kWh/yr" icon={SunMedium} tone="sun" />
          <StatCard label="Offset share" value={s(pct(totals.offsetPct, 1))} icon={Gauge} tone="sun" hint="Capped at 100%" />
          <StatCard label="CO₂ avoided" value={s(tonnes(totals.co2AvoidedKg, 1))} unit="t CO₂/yr" icon={Leaf} tone="leaf" hint={totals.hasSolar ? `${num(totals.co2AvoidedKg)} kg CO₂` : undefined} />
          <StatCard label="Net CO₂ after solar" value={s(tonnes(totals.netCo2Kg, 1))} unit="t CO₂/yr" icon={Cloud} tone="emission" hint={totals.hasSolar ? `${num(totals.netGridKWh)} kWh still from the grid` : undefined} />
          <StatCard label="Trees equivalent" value={s(num(totals.trees))} unit="trees" icon={Trees} tone="leaf" hint="Approx., at 21 kg CO₂ per tree per year" />
          <StatCard label="Installed capacity" value={fixed(totals.kWp, 1)} unit="kWp" icon={Ruler} hint="Area × η × 1 kW/m²" />
        </div>
        <GridFactorNote factor={factor} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Section id="ring" title="Offset share" description="Annual solar kWh as a share of annual consumption.">
          <div className="flex flex-col items-center gap-4">
            {solarLoading ? <Skeleton className="h-[180px] w-[180px] rounded-full" /> : <ProgressRing value={totals.hasSolar ? totals.offsetPct : 0} />}
            <dl className="w-full space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Roof area for 100% offset</dt>
                <dd className="font-semibold tabular">{s(`${num(totals.areaFor100)} m²`)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Your usable roof</dt>
                <dd className="font-semibold tabular">{num(input.rooftop.areaM2, 1)} m²</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Annual sunlight H</dt>
                <dd className="font-semibold tabular">{s(`${num(totals.radiationKWhM2)} kWh/m²`)}</dd>
              </div>
            </dl>
            {totals.hasSolar && totals.areaFor100 > input.rooftop.areaM2 && (
              <p className="text-xs text-muted-foreground">
                The roof covers {pct(totals.offsetPct, 0)}. Reaching 100% would need about{" "}
                {num(totals.areaFor100 - input.rooftop.areaM2)} m² more panel area, or cutting consumption.
              </p>
            )}
          </div>
        </Section>
        <Section id="energy" title="Consumption vs solar generation" description="Bars: monthly grid consumption (kWh). Line: estimated rooftop solar (kWh).">
          {solarLoading ? <ChartSkeleton height={300} /> : <EnergyComboChart monthly={monthly} />}
        </Section>
      </div>

      <Section id="co2" title="Monthly CO₂ footprint, with and without solar" description={<GridFactorNote factor={factor} />}>
        {solarLoading ? <ChartSkeleton height={280} /> : <Co2Chart monthly={monthly} />}
      </Section>

      <Section id="table" title="Month by month" description={<GridFactorNote factor={factor} />}>
        <MonthlyTable monthly={monthly} totals={totals} />
      </Section>

      <FormulaPanel
        monthly={monthly}
        areaM2={input.rooftop.areaM2}
        efficiency={input.rooftop.efficiency}
        performanceRatio={input.rooftop.performanceRatio}
        factor={factor.value}
      />

      <p className="text-xs text-muted-foreground">
        Sunlight: Open-Meteo historical archive for {location.name}, horizontal-plane shortwave radiation
        {fetchedAt ? `, fetched ${dateTime(fetchedAt)} IST` : ""}. Calculated {dateTime(current.computedAt)} IST. Estimates
        for education. Not an engineering or financial design. See the{" "}
        <Link to="/methodology" className="font-medium text-primary underline underline-offset-4">
          methodology
        </Link>
        .
      </p>
    </div>
  );
}

function Notices({
  missingMonths,
  zeroConsumption,
  monthsWithoutRadiation,
  source,
  fetchedAt,
  fromCache,
}: {
  missingMonths: number;
  zeroConsumption: boolean;
  monthsWithoutRadiation: number;
  source: "live" | "snapshot" | "none";
  fetchedAt: number | null;
  fromCache: boolean;
}) {
  const items: string[] = [];
  if (zeroConsumption) items.push("Consumption is 0 kWh for the whole year, so the footprint is zero and any solar counts as a 100% offset.");
  else if (missingMonths > 0)
    items.push(`${missingMonths} month${missingMonths > 1 ? "s were" : " was"} left blank and counted as 0 kWh. Totals are lower than a full year.`);
  if (monthsWithoutRadiation > 0 && source !== "none")
    items.push(`${monthsWithoutRadiation} month${monthsWithoutRadiation > 1 ? "s have" : " has"} no sunlight data, so solar for those months is not counted.`);
  if (source === "snapshot") items.push(`Live sunlight data isn't available, so this uses the copy saved with the building${fetchedAt ? ` on ${dateTime(fetchedAt)}` : ""}.`);
  else if (fromCache) items.push(`Open-Meteo couldn't be reached. Using the last saved sunlight data${fetchedAt ? ` from ${dateTime(fetchedAt)}` : ""}.`);
  if (!items.length) return null;
  return (
    <div role="status" className="space-y-1 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm" data-print-card>
      {items.map((t) => (
        <p key={t} className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          {t}
        </p>
      ))}
    </div>
  );
}
