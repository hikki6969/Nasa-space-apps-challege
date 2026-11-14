/// <reference types="node" />
/**
 * Live H2 backend integration tests.
 *
 * These run ONLY when FIRESIGHT_LIVE_API=1 is set and a backend is serving at
 * FIRESIGHT_API_BASE_URL (default http://127.0.0.1:8000/api), e.g.:
 *
 *   python -m uvicorn backend.app.main:app --port 8000   # repo root
 *   $env:FIRESIGHT_LIVE_API='1'; npx vitest run src/features/investigations/liveBackend.integration.test.tsx
 *
 * They are skipped by default so `npm run check` stays hermetic. They assert
 * the behaviours the H2 handoff promised Person B: canonical snapshot health,
 * the 24-record catalog, provenance-carrying detail payloads, the B3/B4
 * catalog and compare surfaces, the observed-domain disclaimer, the scope
 * guard, and the annotation statuses Person A delivered (source_cited).
 */
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InvestigationsPanel from './InvestigationsPanel'
import { ApiProvider, createApiClient, createLiveApi } from '../../api'

const LIVE = process.env.FIRESIGHT_LIVE_API === '1'
const BASE_URL = process.env.FIRESIGHT_API_BASE_URL ?? 'http://127.0.0.1:8000/api'
const describeLive = LIVE ? describe : describe.skip

const api = createLiveApi({ baseUrl: BASE_URL })
const VF01_IDS = [
  'PSI-142', 'PSI-62', 'PSI-60', 'PSI-26', 'PSI-106', 'PSI-98',
  'PSI-117', 'PSI-115', 'PSI-47', 'PSI-100', 'PSI-39', 'PSI-102',
  'PSI-159', 'PSI-101', 'PSI-25', 'PSI-99', 'PSI-22', 'PSI-107',
  'PSI-21', 'PSI-20', 'PSI-23', 'PSI-10', 'PSI-69', 'PSI-68',
]

describeLive('H2 live backend integration', () => {
  it('health reports the verified canonical snapshot without an LLM', async () => {
    const health = await api.getHealth()
    expect(health.status).toBe('ok')
    expect(health.snapshot_loaded).toBe(true)
    expect(health.snapshot_sha256).toBe(
      '596f50c614478bdc08a578fbde6ac6f27d87a30acfb9220e6d401b6e99be146a',
    )
    expect(health.record_count).toBe(24)
    expect(health.index_ready).toBe(true)
    expect(health.use_llm).toBe(false)
  })

  it('catalog hydrates all 24 accessions with exact counts', async () => {
    const catalog = await api.getCatalog()
    expect(catalog.counts.total).toBe(24)
    expect(catalog.counts.instrument_context).toBe(1)
    expect(catalog.counts.curated).toBe(7)
    expect(catalog.counts.metadata_only).toBe(17)
    expect(catalog.counts.anticipated).toBe(1)
    expect(new Set(catalog.records.map((r) => r.psi_id))).toEqual(new Set(VF01_IDS))
    for (const record of catalog.records) {
      expect(record.source_url.length).toBeGreaterThan(0)
    }
    const psi47 = catalog.records.find((r) => r.psi_id === 'PSI-47')
    expect(psi47?.catalog_role).toBe('instrument_context')
    expect(catalog.distributions.evidence_class.length).toBeGreaterThan(0)
  })

  it('detail carries field-level provenance for curated oxygen bounds (PSI-25)', async () => {
    const detail = await api.getInvestigation('PSI-25')
    expect(detail.psi_id).toBe('PSI-25')
    expect(detail.objectives_text).toMatch(/solid/i)
    const oxygen = detail.provenance.oxygen_fraction
    expect(oxygen?.source_url).toMatch(/^https:/)
    expect(oxygen?.excerpt_or_table_ref ?? oxygen?.excerpt).toBeTruthy()
    expect(oxygen?.value_kind).toBe('reported')
    expect(detail.experimental_tables.length).toBeGreaterThan(0)
  })

  it('compares PSI-25 and PSI-10 through the H2 compare surface', async () => {
    const compare = await api.compare({ psi_ids: ['PSI-25', 'PSI-10'] })
    expect(compare.psi_ids).toEqual(['PSI-25', 'PSI-10'])
    expect(compare.records).toHaveLength(2)
    const oxygenField = compare.fields.find((field) => field.key === 'oxygen_fraction')
    expect(oxygenField).toBeDefined()
    expect(compare.shared.safety_themes).toContain('prevention')
    expect(compare.parallel_axes.length).toBeGreaterThan(0)
    for (const axis of compare.parallel_axes) {
      for (const value of Object.values(axis.values)) {
        expect(Number.isFinite(value)).toBe(true)
      }
    }
  })

  it('Scenario A ranks with no direct match, as the ranking rules require (T-017)', async () => {
    const rank = await api.rank({
      scenario: {
        oxygen_fraction: 0.3,
        pressure_psia: 14.7,
        gravity_g: 0.16,
        flow_velocity_cms: null,
        fuel_phase: 'solid',
        safety_theme: 'suppression',
      },
      scenario_id: 'A',
    })
    expect(rank.requested_dimensions).toEqual(['oxygen', 'pressure', 'gravity', 'phase', 'theme'])
    expect(rank.results.length).toBeGreaterThan(0)
    for (const result of rank.results) {
      expect(result.match_class).not.toBe('direct_match')
    }
    expect(rank.gap_statement).toMatch(/flow value is not specified/i)
  })

  it('observations expose only BASS-II oxygen bounds, never FM2/LUCI/PSI-47/PSI-117', async () => {
    const observations = await api.getObservations()
    expect(observations.points).toHaveLength(2)
    for (const point of observations.points) {
      expect(point.psi_id).toBe('PSI-25')
    }
    expect(observations.excluded_psi_ids).toEqual(
      expect.arrayContaining(['PSI-47', 'PSI-117']),
    )
    expect(observations.disclaimer).toBe(
      'Observed test domain; not a validated flammability boundary.',
    )
  })

  it('answers bounded questions with citations and refuses rocket/propellant scope', async () => {
    const answered = await api.ask({ question: 'What detection evidence exists for smoke aerosol?' })
    expect(answered.status).toBe('answered')
    expect(answered.citations.length).toBeGreaterThan(0)
    expect(answered.matched_psi_ids).toContain('PSI-101')

    const refused = await api.ask({ question: 'Analyse rocket-engine propellant combustion instability.' })
    expect(refused.status).toBe('refused')
    expect(refused.scope).toBe('out_of_scope')
    expect(refused.citations).toHaveLength(0)
  })

  it('context separates incidents, Spinoff, programs and instrument context', async () => {
    const context = await api.getContext()
    expect(context.incidents.length).toBeGreaterThanOrEqual(3)
    const fm2 = context.program_context.find((card) => card.id === 'FM2')
    expect(fm2?.status).toBe('anticipated_in_psi')
    expect(context.instrument_context.map((card) => card.id)).toContain('PSI-47')
  })

  it('scenarios expose the four canonical fixtures with documented inputs', async () => {
    const response = await api.getScenarios()
    expect(response.scenarios.map((scenario) => scenario.id)).toEqual(['A', 'B', 'C', 'D'])
    for (const scenario of response.scenarios) {
      expect(scenario.expected_invariants.length).toBeGreaterThan(0)
      expect('fuel_phase' in scenario.inputs).toBe(true)
    }
  })
})

describeLive('H2 live UI run-through (B3/B4 against live data)', () => {
  it('renders the catalog from the live backend and searches canonical text', async () => {
    const user = userEvent.setup()
    const handle = createApiClient({ mode: 'http', baseUrl: BASE_URL })
    render(
      <ApiProvider handle={handle}>
        <InvestigationsPanel />
      </ApiProvider>,
    )

    const table = await screen.findByLabelText(
      'Catalog records',
      {},
      { timeout: 15000 },
    )
    expect(within(table).getAllByRole('row')).toHaveLength(25) // header + 24 records
    expect(within(table).getByText(/Burning and Suppression of Solids - II$/)).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: /Search catalog/i }), 'BASS')
    expect(await within(table).findByText(/BASS-II/i)).toBeInTheDocument()
    expect(within(table).queryByText('PSI-142')).toBeNull()

    // Live facet: only source-cited records remain once the annotation filter is set.
    await user.clear(screen.getByRole('searchbox', { name: /Search catalog/i }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Annotation status/i }),
      'source_cited',
    )
    expect(within(table).getAllByRole('row')).toHaveLength(8) // header + 7 source_cited
    expect(within(table).getByText('PSI-25')).toBeInTheDocument()
    expect(within(table).queryByText('PSI-142')).toBeNull()
  })

  it('opens the live detail view with field-level provenance', async () => {
    const user = userEvent.setup()
    const handle = createApiClient({ mode: 'http', baseUrl: BASE_URL })
    render(
      <ApiProvider handle={handle}>
        <InvestigationsPanel />
      </ApiProvider>,
    )

    const table = await screen.findByLabelText('Catalog records', {}, { timeout: 15000 })
    const title = within(table).getByText(/Burning and Suppression of Solids - II$/)
    const detailButton = title.closest('button')
    if (!detailButton) throw new Error('PSI-25 detail button not found')
    await user.click(detailButton)

    expect(
      await screen.findByRole('heading', { name: /Field-level provenance/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Objectives' }),
    ).toBeInTheDocument()
  }, 20000)

  it('compares two live records side-by-side with provenance', async () => {
    const user = userEvent.setup()
    const handle = createApiClient({ mode: 'http', baseUrl: BASE_URL })
    render(
      <ApiProvider handle={handle}>
        <InvestigationsPanel />
      </ApiProvider>,
    )

    await screen.findByLabelText('Catalog records', {}, { timeout: 15000 })
    for (const psiId of ['PSI-25', 'PSI-10']) {
      await user.click(
        screen.getByRole('checkbox', { name: `Mark ${psiId} for comparison` }),
      )
    }
    await user.click(
      screen.getByRole('button', { name: /Compare selected \(2\)/i }),
    )

    const drawer = await screen.findByRole('region', {
      name: /Side-by-side: 2 records/i,
    })
    expect(
      await within(drawer).findByText('PSI-25', {}, { timeout: 10000 }),
    ).toBeInTheDocument()
    expect(within(drawer).getByText('PSI-10')).toBeInTheDocument()
    expect(
      within(drawer).getAllByRole('link', { name: /provenance/i }).length,
    ).toBeGreaterThanOrEqual(4)
  }, 20000)
})
