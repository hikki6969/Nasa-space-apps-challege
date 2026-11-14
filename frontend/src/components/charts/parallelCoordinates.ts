import type { ParallelAxis } from '../../api/types'
import {
  SERIES_COLORS,
  chartPalette,
  type PlotlyTrace,
} from '../../lib/chartTheme'

/**
 * Plotly parallel coordinates for fields that have a value for every selected
 * record. Missing or incompatible fields are excluded before this builder runs.
 */
export function buildParallelCoordinates(
  axes: ParallelAxis[],
  psiIds: string[],
): PlotlyTrace[] {
  if (axes.length < 2 || psiIds.length < 2) return []

  const palette = chartPalette()
  const dimensions = []

  for (const axis of axes) {
    const values = psiIds
      .map((psiId) => axis.values[psiId])
      .filter((value): value is number => typeof value === 'number')
    if (values.length !== psiIds.length) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding =
      min === max ? Math.max(Math.abs(min) * 0.05, 0.05) : 0
    dimensions.push({
      label: `${axis.label} (${axis.unit})`,
      values,
      range: [min - padding, max + padding],
      labelfont: { color: palette.ink, size: 11 },
      tickfont: { color: palette.inkMuted, size: 10 },
      rangefont: { color: palette.inkDim, size: 10 },
    })
  }

  return [
    {
      type: 'parcoords',
      dimensions,
      line: {
        color: psiIds.map(
          (_, index) => SERIES_COLORS[index % SERIES_COLORS.length],
        ),
        showscale: false,
      },
      labelfont: { color: palette.ink, size: 11 },
      tickfont: { color: palette.inkMuted, size: 10 },
      hoverfont: { color: palette.ink, size: 12 },
      domain: { x: [0, 1], y: [0, 1] },
    },
  ]
}
