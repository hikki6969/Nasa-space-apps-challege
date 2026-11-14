import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import InvestigationsPanel from './InvestigationsPanel'
import { ApiProvider } from '../../api/ApiContext'
import { createApiClient } from '../../api'

function renderInvestigations() {
  const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
  return render(
    <ApiProvider handle={handle}>
      <InvestigationsPanel />
    </ApiProvider>,
  )
}

describe('InvestigationsPanel scenario controls and results', () => {
  it('renders controls for all six dimensions and keeps unspecified values explicit', async () => {
    renderInvestigations()

    expect(
      await screen.findByRole('heading', { name: /Scenario controls/i }),
    ).toBeInTheDocument()

    expect(screen.getByLabelText('Oxygen')).toHaveValue(0.3)
    expect(screen.getByLabelText('Pressure')).toHaveValue(8.2)
    expect(screen.getByLabelText('Gravity')).toHaveValue(0.16)
    expect(screen.getByLabelText('Flow')).toHaveValue(null)
    expect(screen.getByLabelText('Material phase')).toHaveValue('solid')
    expect(screen.getByLabelText('Safety theme')).toHaveValue('prevention')

    const flow = screen.getByLabelText('Flow')
    expect(flow).toHaveAttribute('placeholder', 'Not specified')
    expect(screen.queryByLabelText('Mark Flow unspecified')).toBeNull()
    expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0)

    // Flow is unspecified, so it must not appear in the draft requested set.
    expect(
      screen.getByText(
        'Oxygen · Pressure · Gravity · Material phase · Safety theme',
      ),
    ).toBeInTheDocument()
  })

  it('produces visibly different, explainable results for all four canonical scenarios', async () => {
    const user = userEvent.setup()
    renderInvestigations()

    // Scenario A — lunar habitat.
    expect(await screen.findByText('SAFFIRE-I')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(
      screen.getByText(/Flow is unspecified, so a six-dimension direct match/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/requested set Q\(S\): Oxygen · Pressure · Gravity · Phase · Theme/i),
    ).toBeInTheDocument()

    // Scenario B — cabin detection.
    await user.click(
      screen.getByRole('radio', { name: /Cabin detection/i }),
    )
    expect(await screen.findByText('SAME-R')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      within(
        screen.getByRole('note', { name: /Evidence gap/i }),
      ).getByText(/DAFT remains instrument context/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/requested set Q\(S\): Theme/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Theme: Detection/)).toBeInTheDocument()
    expect(screen.queryByText('BASS-II')).not.toBeInTheDocument()

    // Scenario C — droplet suppression.
    await user.click(
      screen.getByRole('radio', { name: /Droplet suppression/i }),
    )
    expect(
      await screen.findByRole('heading', { name: 'FLEX-2' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'FLEX' })).toBeInTheDocument()
    expect(screen.getByText(/PSI-117 remains modeling-only context/i)).toBeInTheDocument()
    expect(
      screen.getByText(/requested set Q\(S\): Phase · Theme/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Theme: Suppression/)).toBeInTheDocument()

    // Scenario D — Apollo 1 reconstruction.
    await user.click(
      screen.getByRole('radio', { name: /Apollo 1 reconstruction/i }),
    )
    expect(
      await screen.findByText(/Apollo 1 remains explanatory context/i),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(screen.getByText('CFI-G')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Flame Design' }),
    ).toBeInTheDocument()
    expect(screen.getByText('SAFFIRE-I')).toBeInTheDocument()
    expect(screen.getByText('BASS-II')).toBeInTheDocument()
    expect(screen.getByText(/Theme: Prevention/)).toBeInTheDocument()
  })

  it('distinguishes a missing record value from a zero-similarity value', async () => {
    renderInvestigations()

    const card = await screen.findByRole('article', { name: /SAFFIRE-I/i })

    expect(within(card).getAllByText('Missing').length).toBeGreaterThan(0)
    expect(within(card).getByText('0 similarity')).toBeInTheDocument()
    expect(
      within(card).getAllByText(/No curated record value/i).length,
    ).toBeGreaterThan(0)
    expect(
      within(card).getByText(/A curated record value exists; similarity is zero/i),
    ).toBeInTheDocument()
  })

  it('keeps cleared inputs outside Q(S) and reports the mock limitation honestly', async () => {
    const user = userEvent.setup()
    renderInvestigations()

    await screen.findByText('SAFFIRE-I')

    await user.click(
      screen.getByRole('button', { name: /Mark Oxygen unspecified/i }),
    )
    expect(
      screen.getByText(/Draft edits not ranked yet/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Rank scenario/i }))

    expect(
      await screen.findByText(
        /serves only the four canonical scenario fixtures/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /requested set Q\(S\): Pressure · Gravity · Phase · Theme/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/requested set Q\(S\): Oxygen/i),
    ).not.toBeInTheDocument()
  })

  it('rejects an out-of-range oxygen fraction without silently clamping it', async () => {
    const user = userEvent.setup()
    renderInvestigations()

    const oxygen = await screen.findByLabelText('Oxygen')
    await user.clear(oxygen)
    await user.type(oxygen, '1.4')
    await user.click(screen.getByRole('button', { name: /Rank scenario/i }))

    expect(
      screen.getByText(/Enter an oxygen mole fraction from 0 to 1/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Fix the highlighted field/i,
    )
    // The invalid draft is not ranked; the previous results remain visible.
    expect(screen.getByText('SAFFIRE-I')).toBeInTheDocument()
  })
})
