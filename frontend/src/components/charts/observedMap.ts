import type { ObservationPoint } from '../../api/types'
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
  outcome: ObservationPoint['outcome'],
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

export function buildObservedMapTraces(
  points: ObservationPoint[],
  showHull: boolean,
): PlotlyTrace[] {
  const palette = chartPalette()
  const groups = new Map<
    string,
    {
      phase: ObservationPoint['fuel_phase']
      outcome: ObservationPoint['outcome']
      points: ObservationPoint[]
    }
  >()

  for (const point of points) {
    const key = `${point.fuel_phase}:${point.outcome}`
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

  const traces: PlotlyTrace[] = [...groups.values()].map((group) => ({
    type: 'scatter',
    mode: 'markers',
    name: `${PHASE_LABELS[group.phase]} · ${OUTCOME_LABELS[group.outcome]}`,
    x: group.points.map((point) => point.oxygen_fraction),
    y: group.points.map((point) => point.flow_velocity_cms),
    text: group.points.map((point) => `${point.psi_id} · ${point.label}`),
    hovertemplate:
      '%{text}<br>O₂ %{x:.3f} fraction<br>Flow %{y:.2g} cm/s<extra></extra>',
    marker: {
      color: observedOutcomeColor(group.outcome),
      symbol: PHASE_SYMBOLS[group.phase],
      size: 11,
      line: { color: palette.space950, width: 1.5 },
    },
  }))

  if (showHull && points.length >= 3) {
    const hull = convexHull(
      points.map((point) => ({
        x: point.oxygen_fraction,
        y: point.flow_velocity_cms,
      })),
    )
    if (hull.length >= 3) {
      const first = hull[0]
      if (first) {
        traces.push({
          type: 'scatter',
          mode: 'lines',
          name: 'Observed test domain (descriptive)',
          x: [...hull.map((point) => point.x), first.x],
          y: [...hull.map((point) => point.y), first.y],
          fill: 'toself',
          fillcolor: withAlpha(palette.cyan, 0.1),
          line: { color: palette.cyan, width: 1.5, dash: 'dot' },
          hoverinfo: 'skip',
        })
      }
    }
  }

  return traces
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
