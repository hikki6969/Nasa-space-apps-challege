import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { CatalogExplorer } from '../../components/investigations/CatalogExplorer'
import { CompareDrawer } from '../../components/investigations/CompareDrawer'
import { InvestigationDetailContent } from '../../components/investigations/InvestigationDetailView'
import { ApiProvider } from '../../api/ApiContext'
import { createApiClient } from '../../api'
import { DIMENSION_ORDER } from '../../api/types'
import type {
  InvestigationDetail,
  InvestigationSummary,
  RankedResult,
} from '../../api/types'

const VF01_IDS = [
  'PSI-142',
  'PSI-62',
  'PSI-60',
  'PSI-26',
  'PSI-106',
  'PSI-98',
  'PSI-117',
  'PSI-115',
  'PSI-47',
  'PSI-100',
  'PSI-39',
  'PSI-102',
  'PSI-159',
  'PSI-101',
  'PSI-25',
  'PSI-99',
  'PSI-22',
  'PSI-107',
  'PSI-21',
  'PSI-20',
  'PSI-23',
  'PSI-10',
  'PSI-69',
  'PSI-68',
]

function makeClient() {
  return createApiClient({ mode: 'mock', latencyMs: 0 })
}

async function mockCatalog() {
  return makeClient().api.getCatalog()
}

function ExplorerHarness({ rankedResults }: { rankedResults: RankedResult[] }) {
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  return (
    <>
      <CatalogExplorer
        rankedResults={rankedResults}
        scenarioName="Lunar habitat"
        compareIds={compareIds}
        onToggleCompare={(psiId: string) =>
          setCompareIds((previous) => {
            if (previous.includes(psiId)) {
              return previous.filter((id) => id !== psiId)
            }
            return previous.length >= 4 ? previous : [...previous, psiId]
          })
        }
        onOpenCompare={() => setCompareOpen(true)}
      />
      {compareOpen && compareIds.length >= 1 && (
        <CompareDrawer
          ids={compareIds}
          rankedResults={rankedResults}
          scenarioName="Lunar habitat"
          onRemove={(psiId) =>
            setCompareIds((previous) =>
              previous.filter((id) => id !== psiId),
            )
          }
          onClear={() => {
            setCompareIds([])
            setCompareOpen(false)
          }}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </>
  )
}

function renderExplorer(rankedResults: RankedResult[] = []) {
  const handle = makeClient()
  return render(
    <ApiProvider handle={handle}>
      <ExplorerHarness rankedResults={rankedResults} />
    </ApiProvider>,
  )
}

async function findCatalogTable() {
  return await screen.findByRole('table', { name: 'Catalog records' })
}

function showingText(): string {
  const region = document.querySelector('[aria-live="polite"]')
  return (region?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function visibleIds(table: HTMLElement): string[] {
  const matches = table.textContent?.match(/PSI-\d+/g) ?? []
  const seen = new Set<string>()
  const ids: string[] = []
  for (const match of matches) {
    if (!seen.has(match)) {
      seen.add(match)
      ids.push(match)
    }
  }
  return ids
}

function rankedResult(
  psiId: string,
  title: string,
  score: number,
  coverage: number,
): RankedResult {
  return {
    psi_id: psiId,
    title,
    acronym: null,
    evidence_class: 'bench_flammability',
    catalog_role: 'evidence',
    score,
    coverage,
    match_class: 'partial_match',
    dimensions: DIMENSION_ORDER.map((name) => ({
      name,
      weight: 1,
      requested: true,
      present: true,
      similarity: 1,
      scenario_value: null,
      record_value: null,
      note: null,
    })),
    justification: 'Test ranked result.',
    limitations: [],
    provenance_refs: [],
  }
}

describe('CatalogExplorer — 24 record reachability', () => {
  it('renders every one of the 24 accessions with a ranked/unranked cell each', async () => {
    renderExplorer()

    const table = await findCatalogTable()
    expect(within(table).getAllByRole('row')).toHaveLength(25) // header + 24 records
    for (const id of VF01_IDS) {
      expect(within(table).getByText(id)).toBeInTheDocument()
    }
    expect(showingText()).toBe('Showing 24 of 24 catalog records')
  })

  it('serves every one of the 24 accessions through the typed API client', async () => {
    const client = makeClient()
    const catalog = await client.api.getCatalog()
    const ids = catalog.records.map((record) => record.psi_id).sort()
    expect(ids).toEqual([...VF01_IDS].sort())

    const details = await Promise.all(
      catalog.records.map((record) => client.api.getInvestigation(record.psi_id)),
    )
    for (const detail of details) {
      expect(detail.psi_id).toMatch(/PSI-\d+/)
      expect(detail.objectives_text.length).toBeGreaterThan(0)
      expect(typeof detail.source_url).toBe('string')
    }
  })
})

describe('CatalogExplorer — search', () => {
  it('narrows the catalog by investigation ID', async () => {
    const user = userEvent.setup()
    renderExplorer()

    const table = await findCatalogTable()
    await user.type(screen.getByLabelText('Search catalog'), 'PSI-25')

    await waitFor(() =>
      expect(showingText()).toBe('Showing 1 of 24 catalog records'),
    )
    expect(visibleIds(table)).toEqual(['PSI-25'])
  })

  it('matches objectives text for metadata-only records once loaded', async () => {
    const user = userEvent.setup()
    renderExplorer()

    const table = await findCatalogTable()
    await user.type(
      screen.getByLabelText('Search catalog'),
      'H1 annotation package',
    )

    await waitFor(() =>
      expect(showingText()).toBe('Showing 17 of 24 catalog records'),
    )
    expect(within(table).queryByText('PSI-25')).toBeNull()
    expect(within(table).getByText('PSI-142')).toBeInTheDocument()
  })

  it('matches objectives text for source-cited records once loaded', async () => {
    const user = userEvent.setup()
    renderExplorer()

    const table = await findCatalogTable()
    await user.type(
      screen.getByLabelText('Search catalog'),
      'characterize the combustion',
    )

    await waitFor(() =>
      expect(showingText()).toBe('Showing 7 of 24 catalog records'),
    )
    expect(within(table).queryByText('PSI-142')).toBeNull()
    expect(within(table).getByText('PSI-25')).toBeInTheDocument()
  })
})

const FILTER_CASES: Array<{
  name: string
  label: RegExp
  value: string
  test: (record: InvestigationSummary) => boolean
  present: string
  absent: string
}> = [
  {
    name: 'safety theme',
    label: /Safety theme/i,
    value: 'detection',
    test: (record) => record.safety_theme === 'detection',
    present: 'PSI-47',
    absent: 'PSI-25',
  },
  {
    name: 'fuel phase',
    label: /Fuel phase/i,
    value: 'gas',
    test: (record) => record.fuel_phases.includes('gas'),
    present: 'PSI-159',
    absent: 'PSI-25',
  },
  {
    name: 'evidence class',
    label: /Evidence class/i,
    value: 'flame_physics',
    test: (record) => record.evidence_class === 'flame_physics',
    present: 'PSI-159',
    absent: 'PSI-25',
  },
  {
    name: 'data status',
    label: /Data status/i,
    value: 'complete',
    test: (record) => record.data_status === 'complete',
    present: 'PSI-25',
    absent: 'PSI-99',
  },
  {
    name: 'annotation status',
    label: /Annotation status/i,
    value: 'source_cited',
    test: (record) => record.annotation_status === 'source_cited',
    present: 'PSI-25',
    absent: 'PSI-142',
  },
  {
    name: 'catalog role',
    label: /Catalog role/i,
    value: 'instrument_context',
    test: (record) => record.catalog_role === 'instrument_context',
    present: 'PSI-47',
    absent: 'PSI-25',
  },
]

describe('CatalogExplorer — filters', () => {
  for (const filterCase of FILTER_CASES) {
    it(`narrows the catalog to the matching ${filterCase.name} records`, async () => {
      const user = userEvent.setup()
      renderExplorer()

      const catalog = await mockCatalog()
      const expected = catalog.records.filter(filterCase.test)
      const table = await findCatalogTable()

      await user.selectOptions(
        screen.getByLabelText(filterCase.label),
        filterCase.value,
      )

      expect(showingText()).toBe(`Showing ${expected.length} of 24 catalog records`)
      const ids = visibleIds(table)
      for (const record of expected) {
        expect(ids).toContain(record.psi_id)
      }
      expect(ids).toContain(filterCase.present)
      expect(ids).not.toContain(filterCase.absent)
    })
  }

  it('project type microgravity keeps all 24; ground yields a honest empty state', async () => {
    const user = userEvent.setup()
    renderExplorer()

    await findCatalogTable()
    const projectType = screen.getByLabelText(/Project type/i)

    await user.selectOptions(projectType, 'microgravity')
    expect(showingText()).toBe('Showing 24 of 24 catalog records')

    await user.selectOptions(projectType, 'ground')
    expect(showingText()).toBe('Showing 0 of 24 catalog records')
    expect(
      screen.getByText('No catalog record matches these filters'),
    ).toBeInTheDocument()
  })

  it('counts active filters and resets them with one click', async () => {
    const user = userEvent.setup()
    renderExplorer()

    await findCatalogTable()
    await user.selectOptions(
      screen.getByLabelText(/Safety theme/i),
      'detection',
    )
    await user.selectOptions(
      screen.getByLabelText(/Annotation status/i),
      'source_cited',
    )
    await user.type(screen.getByLabelText('Search catalog'), 'DAFT')

    expect(screen.getByText('3 active')).toBeInTheDocument()
    expect(showingText()).toBe('Showing 0 of 24 catalog records')

    await user.click(
      screen.getByRole('button', { name: /Clear search and filters/i }),
    )
    expect(showingText()).toBe('Showing 24 of 24 catalog records')
    expect(screen.queryByText(/^\d+ active$/)).toBeNull()
    expect(screen.getByLabelText('Search catalog')).toHaveValue('')
  })
})

describe('CatalogExplorer — sorting', () => {
  const ranked = [
    rankedResult('PSI-25', 'Burning and Suppression of Solids-II', 0.9, 0.3),
    rankedResult('PSI-10', 'Flame Design', 0.7, 0.9),
    rankedResult('PSI-159', 'ACME CFI-G', 0.5, 0.6),
  ]

  async function bodyOrder(table: HTMLElement): Promise<string[]> {
    return visibleIds(table)
  }

  it('defaults to title A–Z and supports Title Z–A', async () => {
    const user = userEvent.setup()
    renderExplorer()

    const table = await findCatalogTable()
    expect(screen.getByLabelText(/Sort by/i)).toHaveValue('title_asc')
    const asc = await bodyOrder(table)
    const catalog = await mockCatalog()
    const expectedAsc = [...catalog.records].sort((left, right) =>
      left.title.localeCompare(right.title),
    )
    expect(asc).toEqual(expectedAsc.map((record) => record.psi_id))

    await user.selectOptions(screen.getByLabelText(/Sort by/i), 'title_desc')
    const desc = await bodyOrder(table)
    const expectedDesc = [...expectedAsc].reverse().map((record) => record.psi_id)
    expect(desc).toEqual(expectedDesc)
  })

  it('sorts by physical score high→low with ranked records before non-ranked ones', async () => {
    const user = userEvent.setup()
    renderExplorer(ranked)

    const table = await findCatalogTable()
    await user.selectOptions(screen.getByLabelText(/Sort by/i), 'score_desc')

    const ids = visibleIds(table)
    expect(ids.slice(0, 3)).toEqual(['PSI-25', 'PSI-10', 'PSI-159'])
    const noneRanked = ids.findIndex(
      (id) => !['PSI-25', 'PSI-10', 'PSI-159'].includes(id),
    )
    expect(noneRanked).toBe(3) // ranked group first; non-ranked never interleave
  })

  it('sorts by physical score low→high', async () => {
    const user = userEvent.setup()
    renderExplorer(ranked)

    const table = await findCatalogTable()
    await user.selectOptions(screen.getByLabelText(/Sort by/i), 'score_asc')

    const ids = visibleIds(table)
    expect(ids.slice(0, 3)).toEqual(['PSI-159', 'PSI-10', 'PSI-25'])
  })

  it('sorts by coverage high→low and low→high', async () => {
    const user = userEvent.setup()
    renderExplorer(ranked)

    const table = await findCatalogTable()
    const sortBy = screen.getByLabelText(/Sort by/i)

    await user.selectOptions(sortBy, 'coverage_desc')
    expect(visibleIds(table).slice(0, 3)).toEqual(['PSI-10', 'PSI-159', 'PSI-25'])

    await user.selectOptions(sortBy, 'coverage_asc')
    expect(visibleIds(table).slice(0, 3)).toEqual(['PSI-25', 'PSI-159', 'PSI-10'])
  })

  it('marks metadata-only and instrument-context records as visibly non-ranked', async () => {
    const catalog = await mockCatalog()
    const metadataOnlyCount = catalog.records.filter(
      (record) =>
        record.catalog_role !== 'instrument_context' &&
        record.annotation_status === 'metadata_only',
    ).length

    renderExplorer(ranked)

    const table = await findCatalogTable()
    expect(
      within(table).getAllByText('Not ranked · metadata only'),
    ).toHaveLength(metadataOnlyCount)
    expect(
      within(table).getByText('Not ranked · instrument context'),
    ).toBeInTheDocument()
    // Ranked results show a numeric score; non-ranked rows never do.
    const metadataOnlyBadges = within(table).getAllByText(
      'Not ranked · metadata only',
    )
    for (const badge of metadataOnlyBadges) {
      expect(badge.textContent).not.toMatch(/\d\.\d{3}/)
    }
  })

  it('falls back to title order and discloses it when no scenario is ranked', async () => {
    const user = userEvent.setup()
    renderExplorer([])

    const table = await findCatalogTable()
    await user.selectOptions(screen.getByLabelText(/Sort by/i), 'score_desc')

    expect(
      screen.getByText(/No active ranking. Score and coverage sorts fall back to title./i),
    ).toBeInTheDocument()
    const catalog = await mockCatalog()
    const expectedOrder = [...catalog.records]
      .sort((left, right) => left.title.localeCompare(right.title))
      .map((record) => record.psi_id)
    expect(visibleIds(table)).toEqual(expectedOrder)
  })
})

describe('CatalogExplorer — detail view', () => {
  it('opens a detail with objectives, approach, findings, source links, and a table preview', async () => {
    const user = userEvent.setup()
    renderExplorer()

    await findCatalogTable()
    await user.click(
      screen.getByRole('button', { name: /Burning and Suppression of Solids-II/i }),
    )

    expect(
      await screen.findByRole('heading', { name: /Field-level provenance/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Objectives' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Approach' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Key findings' }),
    ).toBeInTheDocument()

    // Source link + table preview for the seeded BASS-II fixture.
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('rel')).toMatch(/noopener/)
    }
    expect(screen.getByText('psi25_bass2_ignition_limits.csv')).toBeInTheDocument()
    expect(screen.getByText('SAMPLE-A')).toBeInTheDocument()
    expect(screen.getByText('SAMPLE-B')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Download source table/i }),
    ).toBeInTheDocument()

    // PSI-25 carries curated numeric values with field-level provenance.
    expect(screen.getByText('Oxygen range')).toBeInTheDocument()
    expect(
      screen.getByText(/H0 representative fixture for oxygen_fraction/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Close detail/i }))
    expect(screen.queryByRole('heading', { name: /Field-level provenance/i })).toBeNull()
  })

  it('shows the visibly non-ranked state and withholds physical values for a metadata-only record', async () => {
    const user = userEvent.setup()
    renderExplorer()

    await findCatalogTable()
    await user.click(screen.getByRole('button', { name: /PSI-142 catalog record/i }))

    const note = await screen.findByRole('note', { name: /Non-ranked record/i })
    expect(within(note).getByText(/metadata only/i)).toBeInTheDocument()
    expect(
      screen.getByText(/No physical values are curated for this record./i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Close detail/i }))
  })

  it('shows the instrument-context non-ranked state for PSI-47', async () => {
    const user = userEvent.setup()
    renderExplorer()

    await findCatalogTable()
    await user.click(screen.getByRole('button', { name: /DAFT/i }))

    const note = await screen.findByRole('note', { name: /Non-ranked record/i })
    expect(within(note).getByText(/instrument context/i)).toBeInTheDocument()
  })
})

describe('InvestigationDetailContent — safe text rendering', () => {
  function detailWithRemoteText(): InvestigationDetail {
    return {
      psi_id: 'PSI-999',
      title: 'Remote text probe',
      acronym: null,
      research_area: 'Combustion Science',
      project_type: 'ground',
      catalog_role: 'evidence',
      evidence_class: 'modeling',
      safety_theme: null,
      secondary_safety_themes: [],
      fuel: null,
      fuel_phases: [],
      oxygen_fraction: null,
      pressure: null,
      flow_velocity: null,
      gravity: null,
      recorded_gravity_values: [],
      recorded_flow_values: [],
      hardware: [],
      orientation: [],
      data_status: 'complete',
      annotation_status: 'source_cited',
      doi: null,
      license: null,
      source_url: 'https://psi.nasa.gov/detail?id=PSI-999',
      objectives_text: '<img src=x onerror=alert(1)>',
      approach_text: '<script>alert(1)</script>',
      key_findings_text: '<b>not bold</b>',
      experimental_tables: [],
      provenance: {},
    }
  }

  it('renders remote HTML-looking strings as literal text, never as markup', () => {
    const { container } = render(
      <InvestigationDetailContent detail={detailWithRemoteText()} />,
    )

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    expect(
      screen.getByText('<img src=x onerror=alert(1)>'),
    ).toBeInTheDocument()
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
    expect(screen.getByText('<b>not bold</b>')).toBeInTheDocument()
  })
})

describe('Compare mode — catalog selection and side-by-side view', () => {
  const scoreRanked = [
    rankedResult('PSI-25', 'Burning and Suppression of Solids-II', 0.9, 0.3),
    rankedResult('PSI-10', 'Flame Design', 0.7, 0.9),
  ]

  async function openComparison() {
    const user = userEvent.setup()
    renderExplorer(scoreRanked)
    await findCatalogTable()
    await user.click(
      screen.getByRole('checkbox', { name: 'Mark PSI-25 for comparison' }),
    )
    await user.click(
      screen.getByRole('checkbox', { name: 'Mark PSI-10 for comparison' }),
    )
    await user.click(
      screen.getByRole('button', { name: /Compare selected \(2\)/i }),
    )
    return user
  }

  it('keeps the compare button disabled until two records are pinned, then builds the matrix', async () => {
    const user = userEvent.setup()
    renderExplorer(scoreRanked)

    await findCatalogTable()
    const compareButton = screen.getByRole('button', {
      name: /Compare selected/i,
    })
    expect(compareButton).toBeDisabled()

    await user.click(
      screen.getByRole('checkbox', { name: 'Mark PSI-25 for comparison' }),
    )
    expect(
      screen.getByRole('button', { name: /Compare selected \(1\)/i }),
    ).toBeDisabled()

    await user.click(
      screen.getByRole('checkbox', { name: 'Mark PSI-10 for comparison' }),
    )
    expect(
      screen.getByRole('button', { name: /Compare selected \(2\)/i }),
    ).toBeEnabled()
  })

  it('builds a side-by-side view with scores, coverage, approach, and provenance', async () => {
    await openComparison()

    const drawer = await screen.findByRole('region', {
      name: /Side-by-side: 2 records/i,
    })
    expect(within(drawer).getByText('0.900')).toBeInTheDocument()
    expect(within(drawer).getByText('0.700')).toBeInTheDocument()
    expect(within(drawer).getByText('30%')).toBeInTheDocument()
    expect(within(drawer).getByText('90%')).toBeInTheDocument()
    expect(
      within(drawer).getAllByText(
        /Representative microgravity investigation approach/,
      ).length,
    ).toBeGreaterThanOrEqual(2)

    const provenanceLinks = within(drawer).getAllByRole('link', {
      name: /reported provenance/i,
    })
    expect(provenanceLinks.length).toBeGreaterThanOrEqual(4)
    for (const link of provenanceLinks) {
      expect(link.getAttribute('rel')).toMatch(/noopener/)
    }
  })

  it('compares key findings, withholding them when the record has none', async () => {
    const user = userEvent.setup()
    renderExplorer([
      rankedResult('PSI-25', 'Burning and Suppression of Solids-II', 0.9, 0.3),
    ])

    await findCatalogTable()
    await user.click(
      screen.getByRole('checkbox', { name: 'Mark PSI-25 for comparison' }),
    )
    await user.click(
      screen.getByRole('checkbox', { name: 'Mark PSI-142 for comparison' }),
    )
    await user.click(
      screen.getByRole('button', { name: /Compare selected \(2\)/i }),
    )

    const drawer = await screen.findByRole('region', {
      name: /Side-by-side: 2 records/i,
    })
    expect(
      within(drawer).getByText(
        'Representative H0 finding. The backend template justification remains authoritative for wording and scope.',
      ),
    ).toBeInTheDocument()
    expect(
      within(drawer).getByText(
        'No key-findings text is available for this record.',
      ),
    ).toBeInTheDocument()
  })

  it('shows non-ranked badges instead of scores for metadata-only selections', async () => {
    const user = userEvent.setup()
    renderExplorer([
      rankedResult('PSI-25', 'Burning and Suppression of Solids-II', 0.9, 0.3),
    ])

    await findCatalogTable()
    await user.click(
      screen.getByRole('checkbox', { name: 'Mark PSI-25 for comparison' }),
    )
    await user.click(
      screen.getByRole('checkbox', { name: 'Mark PSI-142 for comparison' }),
    )
    await user.click(
      screen.getByRole('button', { name: /Compare selected \(2\)/i }),
    )

    const drawer = await screen.findByRole('region', {
      name: /Side-by-side: 2 records/i,
    })
    expect(
      within(drawer).getByText('Not ranked · metadata only'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('note', {
        name: /Non-ranked records in comparison/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(drawer).getByText(
        'No physical values are curated for this record.',
      ),
    ).toBeInTheDocument()
    // The ranked selection keeps its score; the badge never replaces it.
    expect(within(drawer).getByText('0.900')).toBeInTheDocument()
  })

  it('limits pins to four records and disables a fifth checkbox', async () => {
    const user = userEvent.setup()
    renderExplorer(scoreRanked)

    await findCatalogTable()
    for (const psiId of ['PSI-142', 'PSI-47', 'PSI-25', 'PSI-10']) {
      await user.click(
        screen.getByRole('checkbox', {
          name: `Mark ${psiId} for comparison`,
        }),
      )
    }

    expect(
      screen.getByRole('checkbox', { name: 'Mark PSI-159 for comparison' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /Compare selected \(4\)/i }),
    ).toBeEnabled()
  })

  it('removing one pinned record updates the open comparison', async () => {
    const user = await openComparison()

    const drawer = await screen.findByRole('region', {
      name: /Side-by-side: 2 records/i,
    })
    const removeButtons = within(drawer).getAllByRole('button', {
      name: /Remove from comparison/i,
    })
    const flameDesignRemove = removeButtons.find((button) =>
      button.closest('th')?.textContent?.includes('PSI-10'),
    )
    expect(flameDesignRemove).toBeDefined()
    if (!flameDesignRemove) throw new Error('PSI-10 remove button not found')
    await user.click(flameDesignRemove)

    const updated = await screen.findByRole('region', {
      name: /Side-by-side: 1 record/i,
    })
    expect(within(updated).queryByText('PSI-10')).toBeNull()
  })

  it('clearing the comparison empties the selection and closes the view', async () => {
    const user = await openComparison()

    const drawer = await screen.findByRole('region', {
      name: /Side-by-side: 2 records/i,
    })
    await user.click(
      within(drawer).getByRole('button', { name: /Clear comparison/i }),
    )

    expect(
      screen.queryByRole('region', { name: /Side-by-side/i }),
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: /Compare selected \(0\)/i }),
    ).toBeDisabled()
  })
})
