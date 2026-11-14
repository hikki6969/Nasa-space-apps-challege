import { useMemo, useState } from 'react'
import { useApi } from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { ChartFrame } from '../../components/charts/ChartFrame'
import { PlotlyChart } from '../../components/charts/PlotlyChart'
import {
  buildObservedMapTraces,
  observedMapLayout,
} from '../../components/charts/observedMap'
import { Badge } from '../../components/ui/Badge'
import { MockNotice } from '../../components/ui/MockNotice'
import { Panel } from '../../components/ui/Panel'
import {
  ErrorBlock,
  LoadingBlock,
} from '../../components/ui/States'
import { formatFraction, formatNumber } from '../../lib/format'
import { OUTCOME_LABELS, PHASE_LABELS } from '../../lib/labels'

export default function ObservedMapPanel() {
  const api = useApi()
  const [showHull, setShowHull] = useState(true)

  const observations = useAsyncData(
    (signal) => api.getObservations({ signal }),
    [api],
  )

  const points = useMemo(
    () => observations.data?.points ?? [],
    [observations.data],
  )

  const traces = useMemo(
    () => buildObservedMapTraces(points, showHull),
    [points, showHull],
  )

  const layout = useMemo(() => observedMapLayout(), [])

  if (observations.status === 'loading' && !observations.data) {
    return <LoadingBlock label="Loading measured observations…" rows={4} />
  }

  if (observations.status === 'error' && observations.error) {
    return (
      <ErrorBlock
        title="Could not load measured observations"
        error={observations.error}
        onRetry={observations.reload}
      />
    )
  }

  const data = observations.data
  if (!data) return null

  return (
    <div className="space-y-5">
      <Panel
        eyebrow="Observed flammability map"
        title="Measured points only"
        description="Oxygen fraction against flow velocity for completed, ranked-eligible evidence records. No fitted curve, probability, confidence interval, extrapolation, or predictive legend is drawn."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="flame">No predictive model</Badge>
            <Badge tone="safe">Measured tables only</Badge>
          </div>
        }
      >
        <p
          role="note"
          className="rounded-tile border border-flame/45 bg-flame/10 px-3 py-2.5 text-sm font-semibold text-flame"
        >
          {data.disclaimer}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={showHull}
              onChange={(event) => setShowHull(event.target.checked)}
              className="size-4 accent-[var(--accent-cyan)]"
            />
            Show translucent observed-domain hull
          </label>
          <p className="text-xs text-ink-dim">
            The hull encloses the plotted points. It is descriptive, never a
            validated flammability boundary.
          </p>
        </div>

        <div className="mt-4">
          <ChartFrame
            title="Oxygen fraction vs. flow velocity"
            description="Marker shape distinguishes material phase; marker colour distinguishes outcome. Exact values remain in the data table."
            summary={`${data.disclaimer} Points come only from records with measured tables.`}
            footnote={
              <div className="space-y-1">
                <ul
                  aria-label="Outcome colours"
                  className="flex flex-wrap gap-x-4 gap-y-1"
                >
                  {[
                    ['Ignition', 'var(--accent-amber)'],
                    ['Extinction', 'var(--accent-cyan)'],
                    ['Suppression', 'var(--accent-green)'],
                    ['No ignition', 'var(--accent-blue)'],
                  ].map(([label, color]) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {label}
                    </li>
                  ))}
                </ul>
                <ul
                  aria-label="Material phase marker shapes"
                  className="flex flex-wrap gap-x-4 gap-y-1"
                >
                  {[
                    ['●', 'Solid'],
                    ['◆', 'Liquid droplet'],
                    ['▲', 'Gas'],
                  ].map(([glyph, label]) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <span aria-hidden="true">{glyph}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            }
            table={
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Measured observation points behind the flammability map
                </caption>
                <thead>
                  <tr className="border-b border-edge-strong">
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">
                      Observation
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">
                      PSI
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">
                      Phase
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">
                      O₂
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">
                      Flow
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">
                      Outcome
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.points.map((point) => (
                    <tr key={point.id} className="border-b border-edge/60">
                      <th scope="row" className="px-2 py-1.5 text-ink-muted">
                        {point.label}
                      </th>
                      <td className="px-2 py-1.5 font-mono text-ink">
                        {point.psi_id}
                      </td>
                      <td className="px-2 py-1.5 text-ink-muted">
                        {PHASE_LABELS[point.fuel_phase]}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-ink">
                        {formatFraction(point.oxygen_fraction, 2)}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-ink">
                        {formatNumber(point.flow_velocity_cms)} cm/s
                      </td>
                      <td className="px-2 py-1.5 text-ink-muted">
                        {OUTCOME_LABELS[point.outcome]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <PlotlyChart
              data={traces}
              layout={layout}
              title="Measured oxygen fraction and flow velocity points"
              minHeight={420}
            />
          </ChartFrame>
        </div>

        <MockNotice notice={data.mock_notice} className="mt-4" />
      </Panel>

      <Panel
        eyebrow="Excluded from measured plots"
        title="Context that never becomes a measured observation"
        description="These entries are absent from the observation endpoint and from every measured chart."
      >
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.excluded.map((entry) => (
            <li
              key={entry.id}
              className="rounded-tile border border-edge bg-space-900/55 px-3 py-2"
            >
              <p className="font-mono text-xs font-semibold text-ink">
                {entry.id}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-dim">
                {entry.reason}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
