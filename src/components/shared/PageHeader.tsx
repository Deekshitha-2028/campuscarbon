export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl space-y-2">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {children && <div className="text-base text-muted-foreground">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2" data-print-hide>{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  id,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={className ?? "rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"} data-print-card>
      <div className="mb-4 space-y-1">
        <h2 id={id ? `${id}-title` : undefined} className="text-xl font-bold">
          {title}
        </h2>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      {children}
    </section>
  );
}
