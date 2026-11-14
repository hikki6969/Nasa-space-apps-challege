import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import InvestigationsPanel from './InvestigationsPanel'
import { ApiProvider, createApiClient } from '../../api'

/**
 * End-to-end tests for the four canonical scenarios, run against the
 * offline mock fixtures so `npm run check` stays hermetic. The live
 * equivalents are covered by liveBackend.integration.test.tsx.
 */
function renderPanel() {
  const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
  return render(
    <ApiProvider handle={handle}>
      <InvestigationsPanel />
    </ApiProvider>,
  )
}

async function loadScenario(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await screen.findByRole('radio', { name: /Lunar habitat/i }, { timeout: 10000 })
  await user.click(screen.getByRole('radio', { name }))
}

describe('Canonical scenario end-to-end flow', () => {
  it('Scenario A: no direct match; unspecified flow is an explicit gap (T-017)', async () => {
    const user = userEvent.setup()
    renderPanel()

    await loadScenario(user, /Lunar habitat/i)

    const gap = await screen.findByRole('note', { name: /Evidence gap/i })
    expect(gap).toHaveTextContent(/Flow is unspecified/i)
    expect(gap).toHaveTextContent(/No completed PSI record directly covers/i)
    expect(gap).toHaveTextContent(/FM2 remains anticipated/i)
  })

  it('Scenario B: SAME-R appears as detection evidence; DAFT stays instrument context', async () => {
    const user = userEvent.setup()
    renderPanel()

    await loadScenario(user, /Cabin detection/i)

    const gap = await screen.findByRole('note', { name: /Evidence gap/i })
    expect(gap).toHaveTextContent(/SAME-R is thematic detection evidence/i)
    expect(gap).toHaveTextContent(/DAFT remains instrument context/i)
    const ranked = screen.getByRole('list', { name: 'Ranked results' })
    expect(within(ranked).getAllByText(/SAME-R/i).length).toBeGreaterThanOrEqual(1)
    // PSI-47 (DAFT) never appears as a ranked candidate; SAME-R's card may mention it textually.
    expect(within(ranked).queryByText('PSI-47')).toBeNull()
  })

  it('Scenario C: FLEX and FLEX-2 appear; PSI-117 is modeling-only context', async () => {
    const user = userEvent.setup()
    renderPanel()

    await loadScenario(user, /Droplet suppression/i)

    const gap = await screen.findByRole('note', { name: /Evidence gap/i })
    expect(gap).toHaveTextContent(/FLEX and FLEX-2 provide completed/i)
    expect(gap).toHaveTextContent(/PSI-117 remains modeling-only/i)
    const ranked = screen.getByRole('list', { name: 'Ranked results' })
    expect(within(ranked).getAllByText(/FLEX/i).length).toBeGreaterThanOrEqual(2)
  })

  it('Scenario D: no Apollo 1 reconstruction claim; Apollo 1 stays out of rankings', async () => {
    const user = userEvent.setup()
    renderPanel()

    await loadScenario(user, /Apollo 1 reconstruction/i)

    const gap = await screen.findByRole('note', { name: /Evidence gap/i })
    expect(gap).toHaveTextContent(/No completed PSI record is an Apollo 1 reconstruction/i)
    expect(gap).toHaveTextContent(/Apollo 1 remains explanatory context/i)
    const ranked = screen.getByRole('list', { name: 'Ranked results' })
    // Apollo 1 is discussed *in* evidence cards but never appears as a candidate title.
    expect(within(ranked).queryByRole('heading', { name: /Apollo 1/i })).toBeNull()
  })
})
