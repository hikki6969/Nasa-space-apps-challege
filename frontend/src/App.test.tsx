import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ApiProvider } from './api/ApiContext'
import { createApiClient } from './api'

// The chart host is exercised through its data table and builders in these
// smoke tests. Plotly itself needs a real browser layout engine.
vi.mock('./components/charts/PlotlyChart', () => ({
  PlotlyChart: () => null,
}))

function renderApp() {
  const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
  return render(
    <ApiProvider handle={handle}>
      <App />
    </ApiProvider>,
  )
}

describe('FireSight app shell', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('renders the overview from the typed mock client', async () => {
    renderApp()

    expect(
      await screen.findByRole('heading', {
        name: /A small, exact corpus/i,
      }),
    ).toBeInTheDocument()
    expect(await screen.findByText('24')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Overview/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('renders context and answers a scope-guarded question as text', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(
      screen.getByRole('tab', { name: /Historical & Earth Applications/i }),
    )
    const contextPanel = await screen.findByRole('tabpanel', {
      name: /Historical & Earth Applications/i,
    })
    expect(
      await within(contextPanel).findByText(
        /Context is separated from evidence/i,
      ),
    ).toBeInTheDocument()
    expect(
      within(contextPanel).getByRole('heading', { name: /^Apollo 1$/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Q&A/i }))
    const qaPanel = await screen.findByRole('tabpanel', { name: /Q&A/i })
    const question = await within(qaPanel).findByLabelText(/^Question$/i)
    await user.type(
      question,
      'Can you analyse rocket-engine propellant combustion stability?',
    )
    await user.click(
      within(qaPanel).getByRole('button', { name: /Ask FireSight/i }),
    )

    expect(
      await within(qaPanel).findByRole('heading', {
        name: /This question is refused/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(qaPanel).getByText(/outside the committed evidence corpus/i),
    ).toBeInTheDocument()
  })

  it('renders one canonical scenario and one ranked result', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('tab', { name: /Investigations/i }))

    const panel = await screen.findByRole('tabpanel', {
      name: /Investigations/i,
    })

    expect(
      await within(panel).findByRole('heading', {
        name: /Ranked investigations/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(panel).getByRole('radio', { name: /Lunar habitat/i }),
    ).toBeChecked()
    const ranked = await within(panel).findByRole('list', {
      name: 'Ranked results',
    })
    expect(within(ranked).getByText('SAFFIRE-I')).toBeInTheDocument()

    expect(window.location.hash).toBe('#investigations')
  })

  it('renders the comparison and observed-map data paths', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('tab', { name: /^Compare/i }))
    const comparePanel = await screen.findByRole('tabpanel', {
      name: /Compare/i,
    })
    expect(
      await within(comparePanel).findByRole('heading', {
        name: /Field-by-field evidence/i,
      }),
    ).toBeInTheDocument()
    expect(within(comparePanel).getByText('Comparison matrix')).toBeInTheDocument()
    expect(
      within(comparePanel).getAllByText('PSI-159').length,
    ).toBeGreaterThan(0)
    expect(
      within(comparePanel).getByRole('table', {
        name: /Comparison matrix for the selected PSI records/i,
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Observed/i }))
    const mapPanel = await screen.findByRole('tabpanel', {
      name: /Observed/i,
    })
    expect(
      await within(mapPanel).findByText(
        'Observed test domain; not a validated flammability boundary.',
      ),
    ).toBeInTheDocument()
    expect(
      within(mapPanel).getByRole('heading', {
        name: /Context that never becomes a measured observation/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(mapPanel).getByText('Excluded from measured plots'),
    ).toBeInTheDocument()
    expect(within(mapPanel).getAllByText('PSI-47').length).toBeGreaterThan(0)
  })
})
