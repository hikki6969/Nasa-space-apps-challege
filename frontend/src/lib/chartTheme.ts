import type { PlotlyLayout, PlotlyTrace } from 'plotly.js-dist-min'

export interface ChartPalette {
  space950: string
  space900: string
  space800: string
  space700: string
  edge: string
  edgeStrong: string
  ink: string
  inkMuted: string
  inkDim: string
  blue: string
  amber: string
  cyan: string
  green: string
  red: string
}

const FALLBACK_PALETTE: ChartPalette = {
  space950: '#0a0c10',
  space900: '#10131a',
  space800: '#1b212b',
  space700: '#28303e',
  edge: '#2c3442',
  edgeStrong: '#424c5e',
  ink: '#edf1f7',
  inkMuted: '#a3adbc',
  inkDim: '#97a2b0',
  blue: '#8ab4e6',
  amber: '#f59e0b',
  cyan: '#c3ccd9',
  green: '#34d399',
  red: '#f87171',
}

export const SERIES_COLORS = [
  FALLBACK_PALETTE.blue,
  FALLBACK_PALETTE.amber,
  FALLBACK_PALETTE.cyan,
  FALLBACK_PALETTE.green,
] as const

export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return hex
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function chartPalette(): ChartPalette {
  if (typeof document === 'undefined') return FALLBACK_PALETTE

  const styles = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string): string =>
    styles.getPropertyValue(name).trim() || fallback

  return {
    space950: read('--space-950', FALLBACK_PALETTE.space950),
    space900: read('--space-900', FALLBACK_PALETTE.space900),
    space800: read('--space-800', FALLBACK_PALETTE.space800),
    space700: read('--space-700', FALLBACK_PALETTE.space700),
    edge: read('--edge', FALLBACK_PALETTE.edge),
    edgeStrong: read('--edge-strong', FALLBACK_PALETTE.edgeStrong),
    ink: read('--ink', FALLBACK_PALETTE.ink),
    inkMuted: read('--ink-muted', FALLBACK_PALETTE.inkMuted),
    inkDim: read('--ink-dim', FALLBACK_PALETTE.inkDim),
    blue: read('--accent-blue', FALLBACK_PALETTE.blue),
    amber: read('--accent-amber', FALLBACK_PALETTE.amber),
    cyan: read('--accent-cyan', FALLBACK_PALETTE.cyan),
    green: read('--accent-green', FALLBACK_PALETTE.green),
    red: read('--accent-red', FALLBACK_PALETTE.red),
  }
}

const MONO_STACK =
  "'JetBrains Mono', ui-monospace, 'Cascadia Code', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace"

function axisStyle(palette: ChartPalette): Record<string, unknown> {
  return {
    gridcolor: palette.edge,
    zerolinecolor: palette.edge,
    linecolor: palette.edgeStrong,
    tickcolor: palette.edgeStrong,
    tickfont: { family: MONO_STACK, color: palette.inkMuted, size: 10 },
    title: {
      font: { family: MONO_STACK, color: palette.inkMuted, size: 11 },
    },
    automargin: true,
  }
}

export function baseLayout(overrides: PlotlyLayout = {}): PlotlyLayout {
  const palette = chartPalette()
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: MONO_STACK,
      color: palette.ink,
      size: 11,
    },
    margin: { l: 58, r: 24, t: 28, b: 56 },
    hoverlabel: {
      bgcolor: palette.space800,
      bordercolor: palette.edgeStrong,
      font: { family: MONO_STACK, color: palette.ink, size: 11 },
    },
    legend: {
      bgcolor: 'rgba(0,0,0,0)',
      font: { family: MONO_STACK, color: palette.inkMuted, size: 10 },
      orientation: 'h',
      y: -0.22,
      x: 0,
    },
    xaxis: axisStyle(palette),
    yaxis: axisStyle(palette),
    ...overrides,
  }
}

export function transparentConfig(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    displayModeBar: false,
    responsive: true,
    displaylogo: false,
    ...overrides,
  }
}

export type { PlotlyLayout, PlotlyTrace }
