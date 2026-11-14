import { cn } from '../../lib/cn'

interface MockNoticeProps {
  notice: string | null
  className?: string
}

/**
 * Persistent H0 disclosure. The mock adapter must never be mistaken for the
 * canonical NASA PSI snapshot, so this stays visible on every data surface.
 */
export function MockNotice({ notice, className }: MockNoticeProps) {
  if (!notice) return null
  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-1 rounded-tile border border-flame/30 bg-flame/5 px-3 py-2 text-xs leading-relaxed text-ink-muted',
        className,
      )}
    >
      <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-flame uppercase">
        H0 mock · not canonical
      </span>
      <span>{notice}</span>
    </p>
  )
}
