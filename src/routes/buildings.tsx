import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useHydrated, useLocalStore } from "@/hooks/useLocalStore";
import { buildingsStore, buildingTypeLabel, currentCalcStore, deleteBuilding } from "@/lib/buildings";
import { num } from "@/lib/format";

const TITLE = "My buildings — CampusCarbon: Tumakuru";
const DESC = "Campus buildings you saved on this device, ready to reopen or remove.";

export const Route = createFileRoute("/buildings")({
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
  component: BuildingsPage,
});

function BuildingsPage() {
  const hydrated = useHydrated();
  const list = useLocalStore(buildingsStore);
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <PageHeader eyebrow="Saved on this device" title="My buildings" />
      {hydrated && list.length === 0 && (
        <p className="text-muted-foreground">
          No saved buildings yet. <Link to="/calculator" className="font-medium text-primary underline">Run the calculator</Link> and press "Save to My Buildings".
        </p>
      )}
      <ul className="grid gap-3">
        {list.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div>
              <p className="font-semibold">{b.input.building.name}</p>
              <p className="text-sm text-muted-foreground">
                {buildingTypeLabel(b.input.building.type)} · {num(b.input.months.reduce((a, m) => a + (m.kWh ?? 0), 0))} kWh/yr
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  currentCalcStore.set({ input: b.input, savedId: b.id, computedAt: Date.now() });
                  navigate({ to: "/results" });
                }}
              >
                Open
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteBuilding(b.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
