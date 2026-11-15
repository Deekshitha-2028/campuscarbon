import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { CEA_SOURCE } from "@/lib/emissionFactors";

const TITLE = "Methodology — CampusCarbon: Tumakuru";
const DESC = "Formulas, data sources and limitations behind CampusCarbon's estimates.";

export const Route = createFileRoute("/methodology")({
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
  component: MethodologyPage,
});

function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
      <PageHeader eyebrow="Methodology" title="Methodology">{DESC}</PageHeader>
      <p className="text-sm text-muted-foreground">
        CO₂ (kg) = kWh × grid factor. Solar E (kWh) = H × A × η × PR. Grid factors:{" "}
        <a href={CEA_SOURCE.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline">{CEA_SOURCE.name}</a>.
      </p>
    </div>
  );
}
