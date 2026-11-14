import type { DistributionBucket } from '../../api/types'
import { formatPercent } from '../../lib/format'

interface BarListProps {
  buckets: DistributionBucket[]
  total: number
  label: string
  emptyLabel?: string
}

export function BarList({
  buckets,
  total,
  label,
  emptyLabel = 'No curated values',
}: BarListProps) {
  if (buckets.length === 0) {
    return <p className="text-sm text-ink-dim">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2.5" aria-label={label}>
      {buckets.map((bucket) => {
        const share = total > 0 ? bucket.count / total : 0
        return (
          <li key={bucket.key} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
            <span className="truncate text-sm text-ink-muted">{bucket.label}</span>
            <span className="font-mono text-xs text-ink">
              {bucket.count}
              <span className="ml-1 text-ink-dim">({formatPercent(share)})</span>
            </span>
            <div
              className="col-span-2 h-1.5 overflow-hidden rounded-full bg-space-700"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-nav/80"
                style={{ width: `${Math.max(share * 100, bucket.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
