import { describe, expect, it } from 'vitest'
import { createMockApi } from './mockAdapter'

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
].sort()

const CURATED_IDS = [
  'PSI-159',
  'PSI-10',
  'PSI-101',
  'PSI-98',
  'PSI-25',
  'PSI-69',
  'PSI-68',
].sort()

function api() {
  return createMockApi({ latencyMs: 0 })
}

describe('H0 mock adapter', () => {
  it('serves exactly the 24 VF-01 accessions with PSI-47 as instrument context', async () => {
    const catalog = await api().getCatalog()
    const ids = catalog.records.map((record) => record.psi_id).sort()

    expect(ids).toEqual(VF01_IDS)
    expect(new Set(ids).size).toBe(24)
    expect(ids).not.toContain('PSI-181')
    expect(ids).not.toContain('PSI-108')
    expect(catalog.counts.total).toBe(24)
    expect(catalog.counts.curated).toBe(7)

    const daft = catalog.records.find((record) => record.psi_id === 'PSI-47')
    expect(daft?.catalog_role).toBe('instrument_context')

    const curated = catalog.records
      .filter((record) => record.annotation_status === 'verified')
      .map((record) => record.psi_id)
      .sort()
    expect(curated).toEqual(CURATED_IDS)
  })

  it('ranks Scenario A without claiming a direct match or a 30% O2 BASS-II match', async () => {
    const scenarios = await api().getScenarios()
    const scenarioA = scenarios.scenarios.find((scenario) => scenario.id === 'A')
    expect(scenarioA).toBeDefined()
    if (!scenarioA) return

    const rank = await api().rank({ scenario: scenarioA.inputs })

    expect(rank.scenario_id).toBe('A')
    expect(rank.requested_dimensions).toEqual([
      'oxygen',
      'pressure',
      'gravity',
      'phase',
      'theme',
    ])
    expect(rank.requested_dimensions).not.toContain('flow')
    expect(rank.results.length).toBeGreaterThan(0)
    expect(rank.gap_statement).toMatch(/No completed PSI record directly covers/i)

    for (const result of rank.results) {
      expect(result.dimensions).toHaveLength(6)
      expect(result.match_class).not.toBe('direct_match')
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
      expect(result.coverage).toBeGreaterThanOrEqual(0)
      expect(result.coverage).toBeLessThanOrEqual(1)
      expect(result.provenance_refs.length).toBeGreaterThan(0)
    }

    const bass = rank.results.find((result) => result.psi_id === 'PSI-25')
    expect(bass).toBeDefined()
    expect(bass?.limitations).toContain('Not a 30% O₂ match.')
    const bassOxygen = bass?.dimensions.find(
      (dimension) => dimension.name === 'oxygen',
    )
    expect(bassOxygen?.similarity).toBe(0)
    expect(bassOxygen?.present).toBe(true)
  })

  it('keeps context-only IDs out of measured observations and uses the exact disclaimer', async () => {
    const observations = await api().getObservations()
    const observedIds = new Set(
      observations.points.map((point) => point.psi_id),
    )

    expect(observations.disclaimer).toBe(
      'Observed test domain; not a validated flammability boundary.',
    )
    for (const excluded of ['PSI-47', 'PSI-117', 'FM2', 'SoFIE', 'FLARE', 'LUCI']) {
      expect(observedIds.has(excluded)).toBe(false)
    }
    expect(observedIds.has('PSI-25')).toBe(true)
    expect(observedIds.has('PSI-98')).toBe(true)
    expect(observedIds.has('PSI-69')).toBe(true)
    expect(observedIds.has('PSI-68')).toBe(true)
    expect(observations.excluded.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['PSI-47', 'PSI-117', 'FM2']),
    )
  })

  it('compares two records and refuses rocket/propellant questions', async () => {
    const compare = await api().compare({ psi_ids: ['PSI-25', 'PSI-98'] })
    expect(compare.psi_ids).toEqual(['PSI-25', 'PSI-98'])
    expect(compare.records).toHaveLength(2)
    expect(compare.fields.length).toBeGreaterThan(0)
    expect(compare.parallel_axes.length).toBeGreaterThan(0)

    const refusal = await api().ask({
      question: 'Analyse rocket-engine propellant combustion instability.',
    })
    expect(refusal.status).toBe('refused')
    expect(refusal.scope).toBe('out_of_scope')
    expect(refusal.citations).toHaveLength(0)

    const detection = await api().ask({
      question: 'What detection evidence exists for smoke aerosol?',
    })
    expect(detection.status).toBe('answered')
    expect(detection.matched_psi_ids).toContain('PSI-101')
    expect(detection.citations[0]?.psi_id).toBe('PSI-101')
  })
})
