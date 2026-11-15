import type { DimensionScore } from '../../api/types'
import { formatPercent } from '../../lib/format'
import {
  DIMENSION_LABELS,
  DIMENSION_STATUS_LABELS,
  dimensionStatus,
  type DimensionStatus,
} from '../../lib/labels'
import { cn } from '../../lib/cn'
import { Badge, type BadgeTone } from '../ui/Badge'

const STATUS_TONES: Record<DimensionStatus, BadgeTone> = {
  not_requested: 'neutral',
  missing: 'danger',
  zero: 'flame',
  partial: 'compare',
  match: 'safe',
}

function dimensionDetail(dimension: DimensionScore): string {
  const parts: string[] = []
  if (dimension.record_value !== null) {
    parts.push(`Record: ${String(dimension.record_value)}`)
  }
  if (dimension.scenario_value !== null) {
    parts.push(`Scenario: ${String(dimension.scenario_value)}`)
  }
  return parts.join(' · ')
}

/**
 * Short legend shown once above result cards. Missing (no record value) and
 * zero-similarity (value present, no match) are deliberately different states
 * and must never collapse into one visual treatment.
 */
export function DimensionStatusLegend() {
  return (
    <div
      role="note"
      aria-label="Dimension status legend"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-tile border border-edge bg-space-900/40 px-3 py-2 text-[11px] text-ink-dim"
    >
      <span className="font-bold tracking-[0.1em] uppercase">
        Dimension states
      </span>
      <span className="flex items-center gap-1.5">
        <Badge tone="neutral">Not requested</Badge>
        outside Q(S)
      </span>
      <span className="flex items-center gap-1.5">
        <Badge tone="danger">Missing</Badge>
        no record value; weight stays
      </span>
      <span className="flex items-center gap-1.5">
        <Badge tone="flame">0 similarity</Badge>
        value exists; no match
      </span>
      <span className="flex items-center gap-1.5">
        <Badge tone="compare">Partial</Badge>
        between 0 and 1
      </span>
      <span className="flex items-center gap-1.5">
        <Badge tone="safe">Match</Badge>
        1.0
      </span>
    </div>
  )
}

export function DimensionBreakdown({
  dimensions,
}: {
  dimensions: DimensionScore[]
}) {
  return (
    <ul className="grid gap-2 lg:grid-cols-2" aria-label="Six dimension breakdown">
      {dimensions.map((dimension) => {
        const status = dimensionStatus(dimension)
        const detail = dimensionDetail(dimension)
        return (
          <li
            key={dimension.name}
            className={cn(
              'rounded-tile border px-3 py-2.5',
              status === 'missing'
                ? 'border-dashed border-danger/40 bg-danger/5'
                : status === 'zero'
                  ? 'border-edge border-l-2 border-l-flame bg-space-900/55'
                  : 'border-edge bg-space-900/55',
              status === 'not_requested' && 'opacity-70',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">
                  {DIMENSION_LABELS[dimension.name]}
                </span>
                <span className="font-mono text-[10px] text-ink-dim">
                  w {dimension.weight.toFixed(2)}
                </span>
              </div>
              <Badge tone={STATUS_TONES[status]}>
                {DIMENSION_STATUS_LABELS[status]}
              </Badge>
            </div>

            {status === 'not_requested' ? (
              <p className="mt-1.5 text-xs text-ink-dim">
                Outside the requested set Q(S); it does not reduce coverage.
              </p>
            ) : status === 'missing' ? (
              <>
                <p className="mt-1.5 text-xs text-ink-muted">
                  No curated record value. The weight stays in Q(S) and
                  contributes zero; it is not redistributed.
                </p>
                {dimension.scenario_value !== null && (
                  <p className="mt-1 text-[11px] leading-snug text-ink-dim">
                    Requested: {String(dimension.scenario_value)}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-[2px] bg-space-700"
                    aria-hidden="true"
                  >
                    <div
                      className={cn(
                        'h-full rounded-[2px]',
                        status === 'match' && 'bg-safe',
                        status === 'partial' && 'bg-compare',
                        status === 'zero' && 'bg-flame',
                      )}
                      style={{ width: `${Math.max((dimension.similarity ?? 0) * 100, 1)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-ink">
                    {formatPercent(dimension.similarity ?? 0)}
                  </span>
                </div>
                {status === 'zero' && (
                  <p className="mt-1 text-[11px] leading-snug text-flame">
                    A curated record value exists; similarity is zero.
                  </p>
                )}
                {detail && (
                  <p className="mt-1 text-[11px] leading-snug text-ink-dim">
                    {detail}
                  </p>
                )}
                {dimension.note && (
                  <p className="mt-1 text-[11px] leading-snug text-ink-dim">
                    {dimension.note}
                  </p>
                )}
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
