interface GapBannerProps {
  statement: string
}

export function GapBanner({ statement }: GapBannerProps) {
  return (
    <aside
      role="note"
      aria-label="Evidence gap"
      className="rounded-tile border border-flame/45 bg-flame/10 p-4"
    >
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[2px] border border-flame/50 bg-flame/15 font-mono text-xs font-bold text-flame"
        >
          !
        </span>
        <div>
          <p className="text-sm font-bold tracking-wide text-flame uppercase">
            Evidence gap
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {statement}
          </p>
        </div>
      </div>
    </aside>
  )
}
