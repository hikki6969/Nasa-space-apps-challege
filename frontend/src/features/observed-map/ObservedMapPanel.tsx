import { useMemo, useState } from 'react'
import {
  useApi,
  type ObservationPoint,
} from '../../api'
import { useAsyncData } from '../../hooks/useAsyncData'
import { ChartFrame } from '../../components/charts/ChartFrame'
import { PlotlyChart } from '../../components/charts/PlotlyChart'
import {
  buildObservedMapTraces,
  buildObservedStripTraces,
  hasFlowAxis,
  observedMapLayout,
  observedMapStripLayout,
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

/** Exclusion reasons are documented here; the endpoint reports accessions only. */
const EXCLUDED_REASONS: Record<string, string> = {
  'PSI-47': 'instrument_context; never a measured observation',
  'PSI-117': 'modeling-only; no experimental table',
  FM2: 'anticipated_in_psi program context; outside the 24-record catalog',
  SoFIE: 'active_program context; no current PSI record',
  FLARE: 'active_program context; no current PSI record',
  LUCI: 'unverified program context; not plotted',
}

function pressureDisplay(point: ObservationPoint): string {
  return point.pressure_psia === null ? '—' : `${formatNumber(point.pressure_psia)} psia`
}

function flowDisplay(point: ObservationPoint): string {
  return point.flow_velocity_cms === null
    ? '—'
    : `${formatNumber(point.flow_velocity_cms)} cm/s`
}

function phaseDisplay(point: ObservationPoint): string {
  return point.fuel_phase ? PHASE_LABELS[point.fuel_phase] : '—'
}

function outcomeDisplay(point: ObservationPoint): string {
  return point.outcome ? OUTCOME_LABELS[point.outcome] : 'Not reported'
}

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

  const twoDimensional = useMemo(() => hasFlowAxis(points), [points])

  const traces = useMemo(
    () =>
      twoDimensional
        ? buildObservedMapTraces(points, showHull)
        : buildObservedStripTraces(points),
    [points, twoDimensional, showHull],
  )

  const layout = useMemo(
    () => (twoDimensional ? observedMapLayout() : observedMapStripLayout()),
    [twoDimensional],
  )

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

  const outcomeLegend = points
    .map((point) => point.outcome)
    .filter((outcome): outcome is NonNullable<typeof outcome> => outcome != null)
  const hasOutcomes = outcomeLegend.length > 0
  const hasPhases = points.some((point) => point.fuel_phase !== null)
  const uniqueOutcomes = [...new Set(outcomeLegend)]

  const chartTitle = twoDimensional
    ? 'Oxygen fraction vs. flow velocity'
    : 'Measured oxygen bounds'
  const chartDescription = twoDimensional
    ? 'Marker shape distinguishes material phase; marker colour distinguishes outcome. Exact values remain in the data table.'
    : 'The live endpoint reports oxygen bounds from the measured tables; no flow or outcome is attached to these rows.'

  return (
    <div className="space-y-5">
      <Panel
        eyebrow="Observed flammability map"
        title="Measured points only"
        description="Oxygen fraction for completed, ranked-eligible evidence records. No fitted curve, probability, confidence interval, extrapolation, or predictive legend is drawn."
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

        {twoDimensional ? (
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
        ) : null}

        <div className="mt-4">
          <ChartFrame
            title={chartTitle}
            description={chartDescription}
            summary={`${data.disclaimer} Points come only from records with measured tables.`}
            footnote={
              <div className="space-y-1">
                {hasOutcomes && (
                  <ul
                    aria-label="Outcome colours"
                    className="flex flex-wrap gap-x-4 gap-y-1"
                  >
                    {(
                      [
                        ['ignition', 'var(--accent-amber)'],
                        ['extinction', 'var(--accent-cyan)'],
                        ['suppression', 'var(--accent-green)'],
                        ['no_ignition', 'var(--accent-blue)'],
                      ] as const
                    )
                      .filter(([key]) => uniqueOutcomes.includes(key))
                      .map(([key, color]) => (
                        <li key={key} className="flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className="inline-block size-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {OUTCOME_LABELS[key]}
                        </li>
                      ))}
                  </ul>
                )}
                {hasPhases && (
                  <ul
                    aria-label="Material phase marker shapes"
                    className="flex flex-wrap gap-x-4 gap-y-1"
                  >
                    {(
                      [
                        ['●', 'solid'],
                        ['◆', 'liquid_droplet'],
                        ['▲', 'gas'],
                      ] as const
                    ).map(([glyph, phase]) => (
                      <li key={phase} className="flex items-center gap-1.5">
                        <span aria-hidden="true">{glyph}</span>
                        {PHASE_LABELS[phase]}
                      </li>
                    ))}
                  </ul>
                )}
                {!hasOutcomes && (
                  <p className="text-xs text-ink-dim">
                    The live endpoint reports no outcome for these rows; no colour
                    encodes one.
                  </p>
                )}
              </div>
            }
            table={
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Measured observation points behind the flammability map
                </caption>
                <thead>
                  <tr className="border-b border-edge-strong">
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">Observation</th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">PSI</th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">Phase</th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">O₂</th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">Pressure</th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">Flow</th>
                    <th scope="col" className="px-2 py-1.5 text-ink-muted">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={`${point.file_name}-${point.row_index}`} className="border-b border-edge/60">
                      <th scope="row" className="px-2 py-1.5 text-ink-muted">
                        {point.file_name}#{point.row_index}
                      </th>
                      <td className="px-2 py-1.5 font-mono text-ink">
                        {point.psi_id}
                      </td>
                      <td className="px-2 py-1.5 text-ink-muted">
                        {phaseDisplay(point)}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-ink">
                        {formatFraction(point.oxygen_fraction, 2)}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-ink">
                        {pressureDisplay(point)}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-ink">
                        {flowDisplay(point)}
                      </td>
                      <td className="px-2 py-1.5 text-ink-muted">
                        {outcomeDisplay(point)}
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
              title={chartTitle}
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
          {data.excluded_psi_ids.map((psiId) => (
            <li
              key={psiId}
              className="rounded-tile border border-edge bg-space-900/55 px-3 py-2"
            >
              <p className="font-mono text-xs font-semibold text-ink">
                {psiId}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-dim">
                {EXCLUDED_REASONS[psiId] ?? 'Excluded by the observation endpoint.'}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
