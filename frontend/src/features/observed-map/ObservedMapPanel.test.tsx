import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ObservedMapPanel from './ObservedMapPanel'
import {
  buildObservedMapTraces,
  observedOutcomeColor,
} from '../../components/charts/observedMap'
import { ApiProvider, createApiClient, OBSERVED_DOMAIN_DISCLAIMER } from '../../api'
import { MOCK_OBSERVATIONS } from '../../api/mock/observations'
import { convexHull } from '../../lib/geometry'

const EXCLUDED_IDS = ['PSI-47', 'PSI-117', 'FM2', 'SoFIE', 'FLARE', 'LUCI'] as const
const PLOTTED_PSI_IDS = ['PSI-25', 'PSI-98', 'PSI-69', 'PSI-68', 'PSI-159', 'PSI-10'] as const

function renderPanel() {
  const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
  return render(
    <ApiProvider handle={handle}>
      <ObservedMapPanel />
    </ApiProvider>,
  )
}

describe('ObservedMapPanel — measured points only', () => {
  it('displays the exact observed-domain disclaimer required by the spec', async () => {
    renderPanel()

    const disclaimer = await screen.findByRole('note')
    expect(disclaimer).toHaveTextContent(
      'Observed test domain; not a validated flammability boundary.',
    )
    expect(OBSERVED_DOMAIN_DISCLAIMER).toBe(
      'Observed test domain; not a validated flammability boundary.',
    )
  })

  it('plots exactly the API-returned measured points — nothing else', async () => {
    renderPanel()

    const table = (
      await screen.findByRole('table', {
        name: /Measured observation points behind the flammability map/i,
      })
    ).closest('table')
    if (!table) throw new Error('Observation table not found')

    expect(within(table).getAllByRole('row')).toHaveLength(
      MOCK_OBSERVATIONS.points.length + 1,
    )
    for (const psiId of PLOTTED_PSI_IDS) {
      expect(within(table).getAllByText(psiId).length).toBeGreaterThanOrEqual(1)
    }
    for (const excluded of EXCLUDED_IDS) {
      expect(within(table).queryByText(excluded)).toBeNull()
    }
  })

  it('lists every excluded record with its reason — never as a point', async () => {
    renderPanel()

    const excludedPanel = await screen.findByRole('region', {
      name: /Context that never becomes a measured observation/i,
    })
    for (const excluded of EXCLUDED_IDS) {
      expect(within(excludedPanel).getByText(excluded)).toBeInTheDocument()
    }
    expect(within(excludedPanel).getByText(/instrument_context/)).toBeInTheDocument()
    expect(within(excludedPanel).getByText(/modeling-only/)).toBeInTheDocument()
  })

  it('encodes outcome by colour and material phase by shape, with an accessible key', async () => {
    renderPanel()

    const outcomeLegend = await screen.findByRole('list', {
      name: 'Outcome colours',
    })
    for (const outcome of ['Ignition', 'Extinction', 'Suppression', 'No ignition']) {
      expect(within(outcomeLegend).getByText(outcome)).toBeInTheDocument()
    }

    const phaseLegend = screen.getByRole('list', {
      name: 'Material phase marker shapes',
    })
    for (const phase of ['Solid', 'Liquid droplet', 'Gas']) {
      expect(within(phaseLegend).getByText(phase)).toBeInTheDocument()
    }
  })

  it('offers the translucent hull as an opt-out checkbox, on by default', async () => {
    const user = userEvent.setup()
    renderPanel()

    const toggle = await screen.findByRole('checkbox', {
      name: /Show translucent observed-domain hull/i,
    })
    expect(toggle).toBeChecked()
    await user.click(toggle)
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
  })

  it('keeps the mock-fixture notice visible', async () => {
    renderPanel()

    expect(
      await screen.findByText(/H0 representative observation fixture/i),
    ).toBeInTheDocument()
  })
})

describe('buildObservedMapTraces — no forbidden chart elements', () => {
  const points = MOCK_OBSERVATIONS.points
  const traces = buildObservedMapTraces(points, true)
  const markerTraces = traces.filter((trace) => trace.mode === 'markers')
  const lineTraces = traces.filter((trace) => trace.mode === 'lines')

  it('creates scatter traces only — no model, trendline, or fit trace kind', () => {
    for (const trace of traces) {
      expect(trace.type).toBe('scatter')
    }
    expect(lineTraces).toHaveLength(1)
    expect(lineTraces[0]?.fill).toBe('toself')
  })

  it('labels the hull with exactly the required disclaimer and closes the polygon', () => {
    const hull = lineTraces[0]
    expect(hull?.name).toBe(OBSERVED_DOMAIN_DISCLAIMER)
    const hullX = hull?.x as number[]
    expect(hullX[0]).toBe(hullX[hullX.length - 1])
  })

  it('omits the hull entirely when the toggle is off or points are insufficient', () => {
    expect(
      buildObservedMapTraces(points, false).filter((t) => t.mode === 'lines'),
    ).toHaveLength(0)
    expect(
      buildObservedMapTraces(points.slice(0, 2), true).filter(
        (t) => t.mode === 'lines',
      ),
    ).toHaveLength(0)
  })

  it('keeps one marker trace per phase·outcome group with matching symbol and colour', () => {
    for (const trace of markerTraces) {
      const [phase, ...outcomeParts] = String(trace.name).split(' · ')
      const outcomeLabel = outcomeParts.join(' · ')
      const outcomeKey = Object.entries({
        Ignition: 'ignition',
        Extinction: 'extinction',
        Suppression: 'suppression',
        'No ignition': 'no_ignition',
      }).find(([label]) => label === outcomeLabel)?.[1]
      expect(outcomeKey, `unmapped outcome label: ${String(trace.name)}`).toBeDefined()
      const marker = trace.marker as
        | { symbol?: string; color?: string }
        | undefined
      expect(marker?.symbol).toBe(
        phase === 'Solid' ? 'circle' : phase === 'Liquid droplet' ? 'diamond' : 'triangle-up',
      )
      expect(marker?.color).toBe(
        observedOutcomeColor(outcomeKey as Parameters<typeof observedOutcomeColor>[0]),
      )
    }
  })

  it('gives each of the four outcomes a distinct colour', () => {
    const colours = new Set(
      (['ignition', 'extinction', 'suppression', 'no_ignition'] as const).map(
        observedOutcomeColor,
      ),
    )
    expect(colours.size).toBe(4)
  })

  it('contains no fitted curve, probability, confidence interval, risk tier, or extrapolation', () => {
    const serialized = JSON.stringify(traces)
    expect(serialized).not.toMatch(
      /logistic|trendline|polyfit|lowess|fitted|confidence|interval|p[-_ ]?value|probabilit|extrapolat|risk tier|regression|predict/i,
    )
  })
})

describe('convexHull — encloses observed points, never fits them', () => {
  it('returns the corner points of a square and excludes interior points', () => {
    const hull = convexHull([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 5, y: 5 },
    ])
    expect(hull).toHaveLength(4)
    expect(hull).not.toContainEqual({ x: 5, y: 5 })
  })

  it('handles duplicate and collinear points without fabricating vertices', () => {
    const hull = convexHull([
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ])
    expect(hull.length).toBeLessThanOrEqual(2)
  })

  it('returns all points when two or fewer are distinct', () => {
    expect(convexHull([])).toHaveLength(0)
    expect(convexHull([{ x: 7, y: 7 }])).toEqual([{ x: 7, y: 7 }])
  })
})

describe('Observed-map source regression — forbidden model implementations', () => {
  const chartSources = Object.entries(
    import.meta.glob(
      [
        '../../components/charts/observedMap.ts',
        './ObservedMapPanel.tsx',
        '../../lib/geometry.ts',
      ],
      { query: '?raw', import: 'default', eager: true },
    ) as Record<string, string>,
  )

  it('chart-drawing modules implement no statistical model', () => {
    const forbidden = [
      'logistic',
      'polyfit',
      'lowess',
      'trendline',
      'confidence_interval',
      'pvalue',
      'p_value',
      'r_squared',
      'rsquared',
      'z_score',
      'quartile',
      'ttest',
      'kde',
      'autoregression',
    ]
    for (const [relativePath, source] of chartSources) {
      const lower = source.toLowerCase()
      for (const token of forbidden) {
        expect(
          lower.includes(token),
          `${relativePath} contains forbidden model token "${token}"`,
        ).toBe(false)
      }
    }
  })

  it('keeps the exact disclaimer string as the only observed-domain boundary copy', () => {
    for (const [, source] of chartSources) {
      expect(source).not.toMatch(/validated flammability boundary(?!\.)/i)
    }
  })
})
