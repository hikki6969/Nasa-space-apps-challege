import type { ObservationPoint } from '../../api/types'
import { OBSERVED_DOMAIN_DISCLAIMER } from '../../api/types'
import {
  baseLayout,
  chartPalette,
  withAlpha,
  type PlotlyLayout,
  type PlotlyTrace,
} from '../../lib/chartTheme'
import { convexHull } from '../../lib/geometry'
import { OUTCOME_LABELS, PHASE_LABELS } from '../../lib/labels'

const PHASE_SYMBOLS = {
  solid: 'circle',
  liquid_droplet: 'diamond',
  gas: 'triangle-up',
} as const

export function observedOutcomeColor(
  outcome: NonNullable<ObservationPoint['outcome']>,
): string {
  const palette = chartPalette()
  switch (outcome) {
    case 'ignition':
      return palette.amber
    case 'extinction':
      return palette.cyan
    case 'no_ignition':
      return palette.blue
    case 'suppression':
      return palette.green
  }
}

function markerName(
  phase: ObservationPoint['fuel_phase'],
  outcome: ObservationPoint['outcome'],
): string {
  const phaseLabel = phase ? PHASE_LABELS[phase] : 'Unreported phase'
  const outcomeLabel = outcome ? OUTCOME_LABELS[outcome] : 'Outcome not reported'
  return `${phaseLabel} · ${outcomeLabel}`
}

function markerSymbol(
  phase: ObservationPoint['fuel_phase'],
): string {
  return phase ? PHASE_SYMBOLS[phase] : 'circle'
}

function markerColor(outcome: ObservationPoint['outcome']): string {
  return outcome ? observedOutcomeColor(outcome) : chartPalette().cyan
}

function markerTraces(points: ObservationPoint[]): PlotlyTrace[] {
  const groups = new Map<
    string,
    {
      phase: ObservationPoint['fuel_phase']
      outcome: ObservationPoint['outcome']
      points: ObservationPoint[]
    }
  >()

  for (const point of points) {
    const key = `${point.fuel_phase ?? 'unknown'}:${point.outcome ?? 'unreported'}`
    const group = groups.get(key)
    if (group) {
      group.points.push(point)
    } else {
      groups.set(key, {
        phase: point.fuel_phase,
        outcome: point.outcome,
        points: [point],
      })
    }
  }

  return [...groups.values()].map((group) => ({
    type: 'scatter',
    mode: 'markers',
    name: markerName(group.phase, group.outcome),
    x: group.points.map((point) => point.oxygen_fraction),
    y: group.points.map((point) => point.flow_velocity_cms),
    text: group.points.map(
      (point) => `${point.psi_id} · ${point.file_name}#${point.row_index}`,
    ),
    hovertemplate:
      '%{text}<br>O₂ %{x:.3f} fraction<br>Flow %{y:.2g} cm/s<extra></extra>',
    marker: {
      color: markerColor(group.outcome),
      symbol: markerSymbol(group.phase),
      size: 11,
      line: { color: chartPalette().space950, width: 1.5 },
    },
  }))
}

export function buildObservedMapTraces(
  points: ObservationPoint[],
  showHull: boolean,
): PlotlyTrace[] {
  const traces: PlotlyTrace[] = markerTraces(points)

  if (showHull && points.length >= 3) {
    const hull = convexHull(
      points.map((point) => ({
        x: point.oxygen_fraction,
        y: point.flow_velocity_cms ?? 0,
      })),
    )
    if (hull.length >= 3) {
      const first = hull[0]
      if (first) {
        traces.push({
          type: 'scatter',
          mode: 'lines',
          name: OBSERVED_DOMAIN_DISCLAIMER,
          x: [...hull.map((point) => point.x), first.x],
          y: [...hull.map((point) => point.y), first.y],
          fill: 'toself',
          fillcolor: withAlpha(chartPalette().cyan, 0.1),
          line: { color: chartPalette().cyan, width: 1.5, dash: 'dot' },
          hoverinfo: 'skip',
        })
      }
    }
  }

  return traces
}

/** True when every point reports a flow velocity, enabling the 2-D map. */
export function hasFlowAxis(points: ObservationPoint[]): boolean {
  return points.length > 0 && points.every(
    (point) => point.flow_velocity_cms !== null,
  )
}

/**
 * Single-lane layout used when the live H2 endpoint reports no flow values:
 * measured oxygen bounds on one axis, never a fabricated second axis.
 */
export function buildObservedStripTraces(points: ObservationPoint[]): PlotlyTrace[] {
  const sorted = [...points].sort((a, b) => a.oxygen_fraction - b.oxygen_fraction)
  return [
    {
      type: 'scatter',
      mode: 'markers',
      name: 'Measured table bounds',
      x: sorted.map((point) => point.oxygen_fraction),
      y: sorted.map(() => 0),
      text: sorted.map(
        (point) => `${point.psi_id} · ${point.file_name}#${point.row_index}`,
      ),
      hovertemplate:
        '%{text}<br>O₂ %{x:.3f} fraction<extra></extra>',
      marker: {
        color: chartPalette().cyan,
        symbol: 'circle',
        size: 14,
        line: { color: chartPalette().space950, width: 2 },
      },
    },
  ]
}

export function observedMapLayout(): PlotlyLayout {
  const palette = chartPalette()
  const base = baseLayout()
  const xaxis = base.xaxis as Record<string, unknown>
  const yaxis = base.yaxis as Record<string, unknown>

  return {
    ...base,
    margin: { l: 64, r: 24, t: 28, b: 76 },
    hovermode: 'closest',
    xaxis: {
      ...xaxis,
      title: {
        text: 'Oxygen fraction',
        font: { color: palette.inkMuted, size: 12 },
      },
      range: [0, 1],
      tickformat: '.0%',
    },
    yaxis: {
      ...yaxis,
      title: {
        text: 'Flow velocity (cm/s)',
        font: { color: palette.inkMuted, size: 12 },
      },
      rangemode: 'tozero',
    },
  }
}

export function observedMapStripLayout(): PlotlyLayout {
  const palette = chartPalette()
  const base = baseLayout()
  const xaxis = base.xaxis as Record<string, unknown>

  return {
    ...base,
    margin: { l: 24, r: 24, t: 28, b: 76 },
    hovermode: 'closest',
    xaxis: {
      ...xaxis,
      title: {
        text: 'Oxygen fraction (measured table bounds)',
        font: { color: palette.inkMuted, size: 12 },
      },
      range: [0, 1],
      tickformat: '.0%',
    },
    yaxis: {
      visible: false,
      range: [-0.5, 0.5],
      showgrid: false,
      zeroline: false,
    },
    showlegend: false,
  }
}
