import { Link } from "@tanstack/react-router";
import { CEA_SOURCE } from "@/lib/emissionFactors";
import { OPEN_METEO } from "@/lib/openMeteo";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            A campus building's electricity footprint, set beside the sunlight falling on its own roof. Built for
            engineering students in Tumakuru, Karnataka.
          </p>
          <p className="rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-sm font-medium text-foreground">
            Estimates for education. Not an engineering or financial design.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          <Link to="/calculator" className="text-muted-foreground hover:text-foreground">Calculator</Link>
          <Link to="/results" className="text-muted-foreground hover:text-foreground">Results</Link>
          <Link to="/solar" className="text-muted-foreground hover:text-foreground">Solar data</Link>
          <Link to="/buildings" className="text-muted-foreground hover:text-foreground">My buildings</Link>
          <Link to="/learn" className="text-muted-foreground hover:text-foreground">Learn</Link>
          <Link to="/methodology" className="text-muted-foreground hover:text-foreground">Methodology</Link>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="eyebrow">Data sources</p>
          <p>
            <a href={CEA_SOURCE.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
              Central Electricity Authority (cea.nic.in)
            </a>
            <span className="block text-muted-foreground">{CEA_SOURCE.title}</span>
          </p>
          <p>
            <a href={OPEN_METEO.site} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
              Open-Meteo weather API
            </a>
            <span className="block text-muted-foreground">Data licensed {OPEN_METEO.licence}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
