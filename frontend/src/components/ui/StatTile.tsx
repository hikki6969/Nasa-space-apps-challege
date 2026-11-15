import { cn } from '../../lib/cn'

interface StatTileProps {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'nav' | 'flame' | 'compare' | 'danger' | 'safe'
}

const TONE_TEXT = {
  default: 'text-ink',
  nav: 'text-nav',
  flame: 'text-flame',
  compare: 'text-compare',
  danger: 'text-danger',
  safe: 'text-safe',
} as const

const TONE_BAR = {
  default: 'bg-edge-strong',
  nav: 'bg-nav',
  flame: 'bg-flame',
  compare: 'bg-compare',
  danger: 'bg-danger',
  safe: 'bg-safe',
} as const

export function StatTile({ label, value, hint, tone = 'default' }: StatTileProps) {
  return (
    <div className="flex h-full min-w-0 flex-col gap-1 bg-space-850 px-3 py-3 transition-colors duration-150 hover:bg-space-800/60 sm:px-4">
      <dt className="flex items-center gap-1.5 font-mono text-[9px] leading-snug font-bold tracking-[0.14em] text-ink-dim uppercase">
        <span
          aria-hidden="true"
          className={cn('h-2.5 w-0.5 shrink-0', TONE_BAR[tone])}
        />
        <span className="min-w-0">{label}</span>
      </dt>
      <dd className={cn('font-mono text-2xl leading-none font-semibold tracking-tight tabular-nums', TONE_TEXT[tone])}>
        {value}
      </dd>
      {hint && <p className="text-[11px] leading-snug text-ink-dim">{hint}</p>}
    </div>
  )
}
