import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ChartFrameProps {
  title: string
  description: string
  summary: string
  children: ReactNode
  table?: ReactNode
  footnote?: ReactNode
  className?: string
}

export function ChartFrame({
  title,
  description,
  summary,
  children,
  table,
  footnote,
  className,
}: ChartFrameProps) {
  return (
    <figure className={cn('surface-raised p-4 sm:p-5', className)}>
      <figcaption className="mb-3">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">{description}</p>
      </figcaption>
      {children}
      <p className="mt-3 text-xs leading-relaxed text-ink-dim">{summary}</p>
      {footnote && <div className="mt-2 text-xs text-ink-dim">{footnote}</div>}
      {table && (
        <details className="mt-4 rounded-tile border border-edge bg-space-900/55">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink">
            View chart data table
          </summary>
          <div className="max-h-80 overflow-auto border-t border-edge p-3">
            {table}
          </div>
        </details>
      )}
    </figure>
  )
}
