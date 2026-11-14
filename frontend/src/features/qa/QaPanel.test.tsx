import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import QaPanel from './QaPanel'
import { ApiProvider, createApiClient } from '../../api'

function renderPanel() {
  const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
  return render(
    <ApiProvider handle={handle}>
      <QaPanel />
    </ApiProvider>,
  )
}

describe('QaPanel — bounded questions with linked PSI citations', () => {
  it('renders the four preset questions including the scope guard', () => {
    renderPanel()

    for (const preset of [
      'Oxygen context',
      'Detection evidence',
      'Droplet suppression',
      'Scope guard',
    ]) {
      expect(
        screen.getByRole('button', { name: preset }),
      ).toBeInTheDocument()
    }
  })

  it('answers a preset question with template answer, matched records and linked citations', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: 'Oxygen context' }))

    expect(
      await screen.findByRole('heading', { name: /Template answer with citations/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Answered')).toBeInTheDocument()
    expect(screen.getByText('In scope')).toBeInTheDocument()

    const citations = screen.getAllByRole('link')
    expect(citations.length).toBeGreaterThanOrEqual(3)
    for (const link of citations) {
      expect(link.getAttribute('rel')).toMatch(/noopener/)
      expect(link.getAttribute('href')).toMatch(/^https:\/\/psi\.nasa\.gov/)
    }

    expect(screen.getByText('Matched records')).toBeInTheDocument()
    for (const psiId of ['PSI-25', 'PSI-159', 'PSI-10']) {
      expect(screen.getAllByText(psiId).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('refuses rocket-engine and propellant questions clearly, without citing anything', async () => {
    const user = userEvent.setup()
    const { container } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Scope guard' }))

    expect(
      await screen.findByRole('heading', { name: /This question is refused/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Refused')).toBeInTheDocument()
    expect(screen.getAllByText('Out of scope').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('a[href^="http"]')).toBeNull()
    expect(screen.getAllByText(/Rocket-engine and propellant-combustion/i).length).toBeGreaterThanOrEqual(1)
  })

  it('submits a typed question through the form', async () => {
    const user = userEvent.setup()
    renderPanel()

    const question = screen.getByRole('textbox', { name: /Question/i })
    await user.type(question, 'What detection evidence exists?')
    await user.click(screen.getByRole('button', { name: /Ask FireSight/i }))

    expect(
      await screen.findByRole('heading', { name: /Template answer with citations/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('PSI-101').length).toBeGreaterThanOrEqual(1)
  })

  it('renders answers as plain text — no HTML injection path', async () => {
    const user = userEvent.setup()
    const { container } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Droplet suppression' }))
    expect(
      await screen.findByRole('heading', { name: /Template answer/i }),
    ).toBeInTheDocument()

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('shows a cited-fields list and limitations for in-scope answers', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: 'Droplet suppression' }))

    expect(await screen.findByText('Matched records')).toBeInTheDocument()
    const limitations = screen.getByRole('heading', { name: /Limitations/i })
    expect(limitations).toBeInTheDocument()
    expect(within(limitations.closest('div') as HTMLElement).getAllByRole('listitem').length).toBeGreaterThan(0)
  })
})
