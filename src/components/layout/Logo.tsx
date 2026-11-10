export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <circle cx="20" cy="12" r="5" className="fill-sun" />
        <path d="M6 24 L12 17 L16 21 L26 11" className="stroke-primary-foreground" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-lg font-bold leading-none tracking-tight text-foreground">
        CampusCarbon
        <span className="ml-1 font-sans text-sm font-medium text-muted-foreground">Tumakuru</span>
      </span>
    </span>
  );
}
