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

export function StatTile({ label, value, hint, tone = 'default' }: StatTileProps) {
  return (
    <div className="rounded-tile border border-edge bg-space-900/70 px-4 py-3">
      <dt className="text-[11px] font-semibold tracking-[0.08em] text-ink-dim uppercase">
        {label}
      </dt>
      <dd className={cn('font-mono text-2xl leading-tight font-semibold', TONE_TEXT[tone])}>
        {value}
      </dd>
      {hint && <p className="mt-1 text-xs leading-snug text-ink-dim">{hint}</p>}
    </div>
  )
}
