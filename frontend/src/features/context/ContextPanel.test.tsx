import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ContextPanel from './ContextPanel'
import { ApiProvider, createApiClient } from '../../api'

function renderPanel() {
  const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
  return render(
    <ApiProvider handle={handle}>
      <ContextPanel />
    </ApiProvider>,
  )
}

describe('ContextPanel — incidents and Spinoff context', () => {
  it('renders Apollo 1, Mir, and Apollo 13 cards with official NASA source links', async () => {
    renderPanel()

    const incidents = await screen.findByRole('region', {
      name: /Historical fire-safety precedents/i,
    })
    for (const title of ['Apollo 1', 'Mir fire', 'Apollo 13']) {
      expect(within(incidents).getByText(title)).toBeInTheDocument()
    }
    const links = within(incidents).getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(3)
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^https:\/\/(sma\.nasa\.gov|www\.nasa\.gov|psi\.nasa\.gov)/)
      expect(link.getAttribute('rel')).toMatch(/noopener/)
    }
  })

  it('renders Spinoff cards with official spinoff.nasa.gov links', async () => {
    renderPanel()

    const spinoff = await screen.findByRole('region', {
      name: /Earth applications/i,
    })
    const links = within(spinoff).getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(3)
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^https:\/\/spinoff\.nasa\.gov/)
      expect(link.getAttribute('rel')).toMatch(/noopener/)
    }
  })

  it('labels every thematic link as thematic — no card claims direct lineage', async () => {
    renderPanel()

    const articles = await screen.findAllByRole('article')
    expect(articles.length).toBeGreaterThanOrEqual(10)
    for (const article of articles) {
      expect(within(article).getAllByText(/thematic/i).length).toBeGreaterThanOrEqual(1)
      expect(within(article).queryByText(/direct lineage/i)).toBeNull()
    }
  })

  it('marks every card as context-only — never ranked, never observed', async () => {
    renderPanel()

    const cards = await screen.findAllByText('Context only')
    expect(cards.length).toBeGreaterThanOrEqual(10)
    for (const region of await screen.findAllByRole('article')) {
      expect(region).toHaveTextContent('Context only')
      expect(region).toHaveTextContent(/thematic/i)
    }
  })
})

describe('ContextPanel — program and instrument context', () => {
  it('keeps FM2, SoFIE and FLARE outside ranking as program context', async () => {
    renderPanel()

    const programs = await screen.findByRole('region', {
      name: /Current and anticipated NASA combustion work/i,
    })
    expect(within(programs).getByRole('heading', { name: /FM2/ })).toBeInTheDocument()
    expect(within(programs).getByRole('heading', { name: /SoFIE/ })).toBeInTheDocument()
    expect(within(programs).getByRole('heading', { name: /FLARE/ })).toBeInTheDocument()
    expect(within(programs).getByText('Anticipated in PSI')).toBeInTheDocument()
    expect(within(programs).getAllByText('Active program').length).toBe(2)
  })

  it('retains PSI-47 as instrument context, never a ranked candidate', async () => {
    renderPanel()

    const instruments = await screen.findByRole('region', {
      name: /Retained but never ranked/i,
    })
    expect(within(instruments).getByText(/DAFT/i)).toBeInTheDocument()
    expect(
      within(instruments).getAllByText('Instrument context').length,
    ).toBeGreaterThanOrEqual(1)
  })
})
