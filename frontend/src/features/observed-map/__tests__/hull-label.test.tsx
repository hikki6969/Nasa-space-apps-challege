import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ObservedMapPanel from '../ObservedMapPanel'
import { ApiProvider } from '../../../api/ApiContext'
import { createApiClient } from '../../../api'

vi.mock('../../../components/charts/PlotlyChart', () => ({
  PlotlyChart: () => null,
}))

function renderObservedMap() {
  const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
  return render(
    <ApiProvider handle={handle}>
      <ObservedMapPanel />
    </ApiProvider>,
  )
}

describe('ObservedMapPanel hull label and domain disclaimer', () => {
  it('renders the exact observed-domain disclaimer string', async () => {
    renderObservedMap()

    const expectedString = 'Observed test domain; not a validated flammability boundary.'
    const disclaimerElements = await screen.findAllByText(new RegExp(expectedString, 'i'))
    expect(disclaimerElements.length).toBeGreaterThanOrEqual(1)

    // Verify exact match
    const exactElement = await screen.findByText(expectedString)
    expect(exactElement).toBeInTheDocument()
  })
})
