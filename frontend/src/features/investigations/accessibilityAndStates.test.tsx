import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogExplorer } from '../../components/investigations/CatalogExplorer'
import ComparePanel from '../../features/compare/ComparePanel'
import {
  ApiProvider,
  createApiClient,
  type FireSightApi,
} from '../../api'
import cssRaw from '../../index.css?raw'

/** Minimal part-stub: only the endpoints a test needs to reach. */
function stubApi(overrides: Partial<FireSightApi>): {
  api: FireSightApi
  mode: 'mock'
  baseUrl: string
} {
  const unused = () => Promise.reject(new Error('not exercised'))
  return {
    api: {
      getHealth: unused,
      getCatalog: unused,
      getInvestigation: unused,
      getScenarios: unused,
      rank: unused,
      compare: unused,
      getObservations: unused,
      getContext: unused,
      ask: unused,
      ...overrides,
    },
    mode: 'mock',
    baseUrl: '/api',
  }
}

describe('Loading and error states', () => {
  it('shows an accessible live-polite loading block while the catalog is pending', () => {
    const pending = new Promise<never>(() => {})
    render(
      <ApiProvider handle={stubApi({ getCatalog: () => pending as never })}>
        <ComparePanel />
      </ApiProvider>,
    )

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent(/Loading comparable records/i)
  })

  it('surfaces a retryable error block when the catalog request fails', async () => {
    const getCatalog = vi
      .fn()
      .mockRejectedValueOnce(new Error('simulated upstream failure'))
      .mockRejectedValueOnce(new Error('simulated upstream failure'))

    render(
      <ApiProvider handle={stubApi({ getCatalog })}>
        <ComparePanel />
      </ApiProvider>,
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Could not load the comparison catalog/i)
    expect(alert).toHaveTextContent(/simulated upstream failure/i)

    const retry = within(alert).getByRole('button', { name: /Retry request/i })
    await userEvent.click(retry)
    expect(getCatalog).toHaveBeenCalledTimes(2)
  })

  it('renders an empty state when filters match nothing and recovers on reset', async () => {
    const user = userEvent.setup()
    const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
    render(
      <ApiProvider handle={handle}>
        <CatalogExplorer
          rankedResults={[]}
          scenarioName={null}
          compareIds={[]}
          onToggleCompare={() => {}}
          onOpenCompare={() => {}}
        />
      </ApiProvider>,
    )

    await user.type(await screen.findByLabelText('Search catalog'), 'zzz-no-such-record')
    expect(
      await screen.findByText(/No catalog record matches these filters/i),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Clear search and filters/i }),
    )
    expect(
      screen.queryByText(/No catalog record matches these filters/i),
    ).toBeNull()
    expect(screen.getByRole('table', { name: /Catalog records/i })).toBeInTheDocument()
  })
})

describe('Contrast conformance (computed, not eyeballed)', () => {
  // Parse the design tokens straight from index.css so the test fails if the
  // palette ever drifts out of WCAG AA.
  const css = cssRaw
  const token = (name: string) => {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))
    if (!match?.[1]) throw new Error(`token not found: ${name}`)
    return match[1]
  }
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const luminance = (hex: string) => {
    const value = hex.replace('#', '')
    const full =
      value.length === 3
        ? value.split('').map((c) => c + c).join('')
        : value
    const n = Number.parseInt(full, 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }
  const ratio = (a: string, b: string) => {
    const la = luminance(a)
    const lb = luminance(b)
    const [hi, lo] = la > lb ? [la, lb] : [lb, la]
    return (hi + 0.05) / (lo + 0.05)
  }

  const space950 = token('space-950')
  const ink = token('ink')
  const inkMuted = token('ink-muted')
  const inkDim = token('ink-dim')

  it('primary text passes WCAG AAA (7.0)', () => {
    expect(ratio(ink, space950)).toBeGreaterThanOrEqual(7)
  })

  it('secondary text passes WCAG AA (4.5)', () => {
    expect(ratio(inkMuted, space950)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(inkMuted, '#0c1526')).toBeGreaterThanOrEqual(4.5) // on space-800
  })

  it('dim labels pass WCAG AA (4.5) on the deepest background', () => {
    expect(ratio(inkDim, space950)).toBeGreaterThanOrEqual(4.5)
  })

  it('accent and focus tokens used as text pass WCAG AA (4.5)', () => {
    for (const name of [
      'accent-blue',
      'accent-amber',
      'accent-cyan',
      'accent-green',
      'accent-red',
      'focus',
    ]) {
      expect(
        ratio(token(name), space950),
        `--${name} falls below AA on --space-950`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('Offline guarantee — no remote asset hosts anywhere in src', () => {
  const sources = Object.entries(
    import.meta.glob('/src/**/*.{ts,tsx,css,html}', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  )
  const forbidden =
    /fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fastly\.jsdelivr\.net|use\.typekit\.net|esm\.sh/

  it('no source file references a CDN host', () => {
    expect(sources.length).toBeGreaterThan(0)
    for (const [path, source] of sources) {
      expect(forbidden.test(source), `${path} references a CDN host`).toBe(false)
    }
  })
})
