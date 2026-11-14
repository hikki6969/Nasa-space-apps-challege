import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'nav'
  | 'flame'
  | 'compare'
  | 'danger'
  | 'safe'
  | 'cyan'

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-edge-strong/80 bg-space-700/65 text-ink-muted',
  nav: 'border-nav/40 bg-nav/10 text-nav',
  flame: 'border-flame/40 bg-flame/10 text-flame',
  compare: 'border-compare/40 bg-compare/10 text-compare',
  danger: 'border-danger/45 bg-danger/10 text-danger',
  safe: 'border-safe/40 bg-safe/10 text-safe',
  cyan: 'border-compare/40 bg-compare/10 text-compare',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.09em] uppercase',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
