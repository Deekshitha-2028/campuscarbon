import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, FlaskConical, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StepBuilding, StepConsumption, StepGrid, StepRooftop } from "@/components/calculator/Steps";
import { blankForm, draftStore, refreshMonths, STEPS, toForm, toInput, validateStep, type FormState } from "@/components/calculator/formState";
import { buildingsStore, currentCalcStore, exampleInput } from "@/lib/buildings";
import { locationStore } from "@/hooks/useCampusLocation";
import { cn } from "@/lib/utils";

const TITLE = "Carbon & solar calculator — CampusCarbon: Tumakuru";
const DESC =
  "Enter a campus building's 12 months of kWh, rooftop area and panel settings to estimate its Scope 2 CO₂ and rooftop solar offset.";

export const Route = createFileRoute("/calculator")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } =>
    typeof s.edit === "string" && s.edit ? { edit: s.edit } : {},
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
  component: CalculatorPage,
});

function CalculatorPage() {
  const { edit } = Route.useSearch();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(() => blankForm());
  const [step, setStep] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [ready, setReady] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Load: an explicit edit target, otherwise the saved draft.
  useEffect(() => {
    if (edit) {
      const b = buildingsStore.get().find((x) => x.id === edit);
      if (b) {
        setForm(refreshMonths(toForm(b.input)));
        setEditId(b.id);
        setStep(0);
      } else {
        toast.error("That saved building wasn't found on this device.");
      }
    } else {
      const d = draftStore.get();
      if (d) {
        setForm(refreshMonths(d.form));
        setStep(Math.min(3, Math.max(0, d.step)));
        setEditId(d.editId);
      } else {
        setForm((f) => ({ ...f, locationId: locationStore.get() }));
      }
    }
    setReady(true);
  }, [edit]);

  useEffect(() => {
    if (ready) draftStore.set({ form, step, editId });
  }, [form, step, editId, ready]);

  const issues = useMemo(() => validateStep(step, form), [step, form]);
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const goTo = (s: number) => {
    setStep(s);
    setShowErrors(false);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = () => {
    if (Object.keys(issues.errors).length) {
      setShowErrors(true);
      const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    if (step < 3) goTo(step + 1);
    else submit();
  };

  const submit = () => {
    for (let s = 0; s < 4; s++) {
      if (Object.keys(validateStep(s, form).errors).length) {
        goTo(s);
        setShowErrors(true);
        toast.error(`Please fix the ${(STEPS[s] ?? "").toLowerCase()} step first.`);
        return;
      }
    }
    const input = toInput(form);
    currentCalcStore.set({ input, savedId: editId, computedAt: Date.now() });
    locationStore.set(input.locationId);
    draftStore.clear();
    navigate({ to: "/results" });
  };

  const loadExample = () => {
    setForm(toForm(exampleInput()));
    setEditId(null);
    setShowErrors(false);
    toast.success("Loaded the sample hostel. Step through or jump to the last step.");
  };

  const reset = () => {
    setForm({ ...blankForm(), locationId: locationStore.get() });
    setEditId(null);
    setShowErrors(false);
    goTo(0);
  };

  const StepView = [StepBuilding, StepConsumption, StepRooftop, StepGrid][step] ?? StepBuilding;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow={editId ? "Editing a saved building" : "Calculator"}
        title="Footprint & rooftop solar"
        actions={
          <>
            <Button variant="sun" onClick={loadExample}>
              <FlaskConical aria-hidden="true" /> Load example data
            </Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw aria-hidden="true" /> Start over
            </Button>
          </>
        }
      >
        Four short steps. Your entries are kept on this device as you type.
      </PageHeader>

      <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => (i <= step ? goTo(i) : undefined)}
                disabled={i > step}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "group flex w-full flex-col gap-2 text-left disabled:cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full bg-muted transition-colors",
                    (done || current) && "bg-primary",
                  )}
                />
                <span className="flex items-center gap-1.5 text-xs font-medium sm:text-sm">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border border-border font-mono text-[0.65rem]",
                      current && "border-primary bg-primary text-primary-foreground",
                      done && "border-primary bg-secondary text-secondary-foreground",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn("hidden sm:inline", !current && "text-muted-foreground")}>{s}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <form
        className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        noValidate
      >
        <h2 ref={headingRef} tabIndex={-1} className="mb-6 text-2xl font-bold outline-none">
          <span className="mr-2 font-mono text-sm font-normal text-muted-foreground">Step {step + 1} of 4</span>
          {STEPS[step]}
        </h2>
        {ready ? (
          <StepView form={form} update={update} issues={issues} showErrors={showErrors} />
        ) : (
          <div className="h-60" aria-hidden="true" />
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
          {showErrors && Object.keys(issues.errors).length > 0 && (
            <p role="alert" className="text-sm font-medium text-destructive">
              Fix the highlighted fields to continue.
            </p>
          )}
          <Button type="submit" variant={step === 3 ? "hero" : "default"} size={step === 3 ? "lg" : "default"}>
            {step === 3 ? (
              <>
                Calculate results <Check aria-hidden="true" />
              </>
            ) : (
              <>
                Next: {STEPS[step + 1]} <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
