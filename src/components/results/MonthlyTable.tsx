import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MonthlyResult, Totals } from "@/lib/calc";
import { fixed, num, pct } from "@/lib/format";

export function MonthlyTable({ monthly, totals }: { monthly: MonthlyResult[]; totals: Totals }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table className="min-w-[760px] text-sm">
        <TableCaption className="sr-only">Month-by-month consumption, solar generation and CO₂</TableCaption>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead scope="col">Month</TableHead>
            <TableHead scope="col" className="text-right">Consumption (kWh)</TableHead>
            <TableHead scope="col" className="text-right">H (kWh/m²)</TableHead>
            <TableHead scope="col" className="text-right">Solar (kWh)</TableHead>
            <TableHead scope="col" className="text-right">Offset</TableHead>
            <TableHead scope="col" className="text-right">CO₂ (kg)</TableHead>
            <TableHead scope="col" className="text-right">Avoided (kg CO₂)</TableHead>
            <TableHead scope="col" className="text-right">Net CO₂ (kg)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular">
          {monthly.map((r) => (
            <TableRow key={r.key}>
              <TableHead scope="row" className="font-medium text-foreground">
                {r.label}
              </TableHead>
              <TableCell className="text-right">
                {num(r.consumptionKWh)}
                {r.consumptionMissing && (
                  <span className="ml-1 rounded bg-warning-soft px-1 text-[0.65rem] font-medium text-warning" title="Left blank, counted as 0">
                    blank
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">{fixed(r.radiationKWhM2, 1)}</TableCell>
              <TableCell className="text-right">{num(r.solarKWh)}</TableCell>
              <TableCell className="text-right">{pct(r.offsetPct, 0)}</TableCell>
              <TableCell className="text-right">{num(r.co2Kg)}</TableCell>
              <TableCell className="text-right">{num(r.co2AvoidedKg)}</TableCell>
              <TableCell className="text-right">{num(r.netCo2Kg)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="tabular">
          <TableRow className="font-semibold">
            <TableHead scope="row" className="text-foreground">Year</TableHead>
            <TableCell className="text-right">{num(totals.consumptionKWh)}</TableCell>
            <TableCell className="text-right">{fixed(totals.radiationKWhM2, 0)}</TableCell>
            <TableCell className="text-right">{totals.hasSolar ? num(totals.solarKWh) : "—"}</TableCell>
            <TableCell className="text-right">{totals.hasSolar ? pct(totals.offsetPct, 0) : "—"}</TableCell>
            <TableCell className="text-right">{num(totals.co2Kg)}</TableCell>
            <TableCell className="text-right">{totals.hasSolar ? num(totals.co2AvoidedKg) : "—"}</TableCell>
            <TableCell className="text-right">{num(totals.netCo2Kg)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
