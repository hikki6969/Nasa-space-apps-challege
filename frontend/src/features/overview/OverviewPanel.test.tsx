import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import OverviewPanel from './OverviewPanel'
import { ApiProvider } from '../../api/ApiContext'
import { createApiClient } from '../../api'

function renderOverview() {
  const handle = createApiClient({ mode: 'mock', latencyMs: 0 })
  return render(
    <ApiProvider handle={handle}>
      <OverviewPanel />
    </ApiProvider>,
  )
}

function tileIn(region: HTMLElement, label: string): HTMLElement {
  const labelNode = within(region).getByText(label)
  const tile = labelNode.closest('div')
  if (!tile) throw new Error(`No stat tile found for ${label}`)
  return tile
}

function bucketCount(
  list: HTMLElement,
  label: string,
): string | null {
  const row = within(list).getByText(label).closest('li')
  return row?.textContent ?? null
}

describe('OverviewPanel corpus overview', () => {
  it('matches the mock API counts and distributions', async () => {
    renderOverview()

    const corpus = await screen.findByRole('region', {
      name: /A small, exact corpus/i,
    })

    expect(tileIn(corpus, 'Catalog records')).toHaveTextContent('24')
    expect(tileIn(corpus, 'Completed')).toHaveTextContent('8')
    expect(tileIn(corpus, 'Curated')).toHaveTextContent('7')
    expect(tileIn(corpus, 'Metadata only')).toHaveTextContent('17')
    expect(tileIn(corpus, 'Instrument context')).toHaveTextContent('1')

    const anticipated = tileIn(corpus, 'Anticipated')
    expect(anticipated).toHaveTextContent('1')
    expect(anticipated).toHaveTextContent(/outside the measured catalog/i)

    const note = within(corpus).getByRole('note', {
      name: /Count interpretation/i,
    })
    expect(note).toHaveTextContent(/not a measured observation/i)
    expect(note).toHaveTextContent(/excluded from the catalog total/i)

    const evidenceClass = within(corpus).getByRole('list', {
      name: 'Evidence class distribution',
    })
    expect(bucketCount(evidenceClass, 'Bench Flammability')).toContain('15')
    expect(bucketCount(evidenceClass, 'Flame Physics')).toContain('4')
    expect(bucketCount(evidenceClass, 'Detection Instrumentation')).toContain(
      '2',
    )

    const themes = within(corpus).getByRole('list', {
      name: 'Safety theme distribution',
    })
    expect(bucketCount(themes, 'Uncurated')).toContain('14')
    expect(bucketCount(themes, 'Prevention')).toContain('4')
    expect(bucketCount(themes, 'Suppression')).toContain('4')

    const hardware = within(corpus).getByRole('list', {
      name: 'Hardware distribution',
    })
    expect(bucketCount(hardware, 'Combustion Integrated Rack')).toContain('2')
    expect(bucketCount(hardware, 'FLEX Facility')).toContain('2')

    const dataStatus = within(corpus).getByRole('list', {
      name: 'Data status distribution',
    })
    expect(bucketCount(dataStatus, 'Complete')).toContain('8')
    expect(bucketCount(dataStatus, 'Partial')).toContain('16')
  })

  it('keeps historical and Spinoff context counts separate from PSI evidence', async () => {
    renderOverview()

    const psi = await screen.findByRole('group', {
      name: 'PSI evidence counts',
    })
    expect(tileIn(psi, 'Ranked evidence candidates')).toHaveTextContent('23')
    expect(tileIn(psi, 'Verified field sets')).toHaveTextContent('7')
    expect(tileIn(psi, 'Metadata only')).toHaveTextContent('17')
    expect(tileIn(psi, 'Instrument context')).toHaveTextContent('1')

    const context = screen.getByRole('group', {
      name: 'Historical and Spinoff context counts',
    })
    expect(tileIn(context, 'Incidents')).toHaveTextContent('3')
    expect(tileIn(context, 'Spinoff applications')).toHaveTextContent('3')
    expect(tileIn(context, 'Program context')).toHaveTextContent('3')

    const anticipated = tileIn(context, 'Anticipated in PSI')
    expect(anticipated).toHaveTextContent('1')
    expect(anticipated).toHaveTextContent(/no measured table/i)

    // Context entries are never added to measured PSI evidence totals.
    expect(context).not.toHaveTextContent('24')
    expect(
      screen.getByText(/The two groups are not summed/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/can never become a ranked candidate/i),
    ).toBeInTheDocument()
  })

  it('shows top completed evidence and coverage warnings for the active scenario', async () => {
    const user = userEvent.setup()
    renderOverview()

    const section = await screen.findByRole('region', {
      name: /Top completed evidence/i,
    })

    expect(
      within(section).getByText(/Active scenario · Scenario A — Lunar habitat/i),
    ).toBeInTheDocument()
    expect(await within(section).findByText('SAFFIRE-I')).toBeInTheDocument()
    expect(
      within(section).getByRole('note', { name: /Evidence gap/i }),
    ).toHaveTextContent(/Flow is unspecified/i)

    const coverage = within(section).getByRole('region', {
      name: /Coverage warnings/i,
    })
    expect(coverage).toHaveTextContent(/Incomplete coverage/i)
    expect(within(coverage).getAllByRole('listitem')).toHaveLength(4)
    expect(coverage).toHaveTextContent(/missing Pressure/i)

    await user.click(
      within(section).getByRole('button', { name: /Cabin detection/i }),
    )

    expect(
      within(section).getByText(
        /Active scenario · Scenario B — Cabin detection/i,
      ),
    ).toBeInTheDocument()
    expect(await within(section).findByText('SAME-R')).toBeInTheDocument()
    expect(
      within(section).getByRole('note', { name: /Evidence gap/i }),
    ).toHaveTextContent(/DAFT remains instrument context/i)
    expect(within(section).getByText(/Full coverage/i)).toBeInTheDocument()
    expect(
      within(section).getByText(/Requested dimensions:/i),
    ).toBeInTheDocument()
  })
})
