import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, CloudSun, Factory, Receipt, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SunGridIllustration } from "@/components/home/SunGridIllustration";
import { LiveSolarCard } from "@/components/solar/LiveSolarCard";
import { LATEST_FACTOR } from "@/lib/emissionFactors";
import { exampleInput } from "@/lib/buildings";
import type { MonthlyRadiation } from "@/lib/calc";
import { fixed, num, tonnes } from "@/lib/format";
import { useCampusLocation } from "@/hooks/useCampusLocation";
import { useArchive } from "@/hooks/useSolarData";

const TITLE = "CampusCarbon: Tumakuru — your building's carbon vs. its rooftop sun";
const DESC =
  "See the CO₂ behind a campus building's electricity bill and how much rooftop solar in Tumakuru could offset, using CEA grid factors and live Open-Meteo data.";

export const Route = createFileRoute("/")({
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
  component: Home,
});

const STEPS = [
  {
    icon: Receipt,
    title: "Read the bill",
    body: "Enter 12 months of units consumed (kWh) for a hostel, department, library, lab or admin block.",
  },
  {
    icon: Factory,
    title: "Apply the grid factor",
    body: `Multiply by CEA's all-India weighted average, ${LATEST_FACTOR.value} kg CO₂/kWh for FY ${LATEST_FACTOR.fy}. That's the Scope 2 footprint.`,
  },
  {
    icon: SunMedium,
    title: "Put the roof to work",
    body: "Real Tumakuru sunlight from Open-Meteo × roof area × panel efficiency × performance ratio = solar kWh.",
  },
];

const exampleKWh = exampleInput().months.reduce((a, m) => a + (m.kWh ?? 0), 0);

function Home() {
  const latest = LATEST_FACTOR;
  const { location } = useCampusLocation();
  const archive = useArchive(location.id);
  const best = (archive.data?.data.monthly ?? []).reduce<MonthlyRadiation | null>(
    (b, m) => (!b || m.peakSunHours > b.peakSunHours ? m : b),
    null,
  );
  return (
    <>
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-grid-paper opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="eyebrow">Scope 2 · Tumakuru, Karnataka · 13.34° N</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Every kWh on your bill emitted CO₂ at a power station{" "}
              <span className="relative whitespace-nowrap text-primary">
                you never see.
                <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 h-3 w-full" aria-hidden="true" preserveAspectRatio="none">
                  <path d="M2 8 Q50 2 100 7 T198 5" className="stroke-sun" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              CampusCarbon puts a campus building's electricity footprint right next to the sunshine landing on its own
              roof. Real CEA emission factors, real Tumakuru sunlight, and every formula shown.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/calculator">
                  <Calculator aria-hidden="true" /> Calculate a building
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/solar">
                  <CloudSun aria-hidden="true" /> Explore solar data
                </Link>
              </Button>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Grid factor: {latest.value} kg CO₂/kWh · CEA CO₂ Baseline Database {latest.version}, FY {latest.fy}
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-card backdrop-blur">
              <SunGridIllustration />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-6 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <LiveSolarCard />
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <p className="eyebrow">Why it matters</p>
            <h2 className="mt-1 text-2xl font-bold">
              Our sample 300-bed hostel emits about {tonnes(exampleKWh * latest.value, 0)} tonnes of CO₂ a year
            </h2>
            <p className="mt-3 text-muted-foreground">
              Purchased electricity is a campus's biggest Scope 2 source. India's grid is still mostly coal, so each unit
              carries roughly two-thirds of a kilogram of CO₂. Tumakuru's flat terraces and clear February-to-May skies
              mean a good share of that can be generated on the roof instead.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-emission-soft p-3">
                <p className="font-display text-2xl font-bold tabular">{latest.value}</p>
                <p className="text-xs text-muted-foreground">kg CO₂ per kWh</p>
              </div>
              <div className="rounded-xl bg-sun-soft p-3">
                <p className="font-display text-2xl font-bold tabular">{best ? fixed(best.peakSunHours, 1) : "…"}</p>
                <p className="text-xs text-muted-foreground">
                  peak sun h/day{best ? `, ${best.label}` : ""}
                </p>
              </div>
              <div className="rounded-xl bg-leaf-soft p-3">
                <p className="font-display text-2xl font-bold tabular">0.2</p>
                <p className="text-xs text-muted-foreground">kWp per m² at 20%</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Peak sun hours: the sunniest month in {location.name} over the last 12 months (Open-Meteo). The sample
              hostel uses {num(exampleKWh)} kWh/year.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-title" className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <p className="eyebrow">How it works</p>
        <h2 id="how-title" className="mt-1 text-3xl font-bold">
          Three steps, all of them visible
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
              <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-muted" aria-hidden="true">
                {i + 1}
              </span>
              <s.icon className="h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold">Got last year's electricity bills?</h3>
            <p className="text-primary-foreground/80">Or load the sample hostel and see the numbers in under a minute.</p>
          </div>
          <Button asChild variant="sun" size="lg">
            <Link to="/calculator">
              Start the calculator <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
