import {
  DIMENSION_ORDER,
  type DimensionName,
  type DimensionScore,
  type MatchClass,
  type RankResponse,
  type RankedResult,
  type ScenarioInputs,
} from '../types'
import { MOCK_SCENARIOS } from './scenarios'

const WEIGHTS: Record<DimensionName, number> = {
  oxygen: 0.3,
  pressure: 0.2,
  gravity: 0.2,
  flow: 0.1,
  phase: 0.1,
  theme: 0.1,
}

interface DimensionSeed {
  name: DimensionName
  requested: boolean
  present?: boolean
  similarity?: number
  scenario_value?: string | number | null
  record_value?: string | number | null
  note?: string | null
}

/**
 * Fixture bookkeeping only. The backend owns ranking; this helper keeps the
 * hand-authored H0 fixture internally consistent so the UI can render the
 * six-slot breakdown, coverage, and score.
 */
function buildDimensions(seeds: DimensionSeed[]): DimensionScore[] {
  return DIMENSION_ORDER.map((name) => {
    const seed = seeds.find((candidate) => candidate.name === name)
    const requested = seed?.requested ?? false
    const present = requested ? (seed?.present ?? false) : false
    return {
      name,
      weight: WEIGHTS[name],
      requested,
      present,
      similarity: requested && present ? (seed?.similarity ?? 0) : 0,
      scenario_value: seed?.scenario_value ?? null,
      record_value: seed?.record_value ?? null,
      note: seed?.note ?? null,
    }
  })
}

interface ResultInput {
  psi_id: string
  title: string
  acronym: string | null
  evidence_class: RankedResult['evidence_class']
  match_class: MatchClass
  dimensions: DimensionScore[]
  justification: string
  limitations: string[]
  provenance_refs: string[]
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

function buildResult(input: ResultInput): RankedResult {
  const requested = input.dimensions.filter((dimension) => dimension.requested)
  const present = requested.filter((dimension) => dimension.present)
  const weightTotal = requested.reduce(
    (total, dimension) => total + dimension.weight,
    0,
  )
  const weighted = requested.reduce(
    (total, dimension) =>
      total + (dimension.present ? dimension.weight * (dimension.similarity ?? 0) : 0),
    0,
  )
  const coverage = requested.length > 0 ? present.length / requested.length : 0
  const score =
    weightTotal > 0 ? (weighted / weightTotal) * Math.sqrt(coverage) : 0

  return {
    psi_id: input.psi_id,
    title: input.title,
    acronym: input.acronym,
    evidence_class: input.evidence_class,
    catalog_role: 'evidence',
    score: round(score),
    coverage: round(coverage),
    match_class: input.match_class,
    dimensions: input.dimensions,
    justification: input.justification,
    limitations: input.limitations,
    provenance_refs: input.provenance_refs,
  }
}

function requestedDimensions(scenario: ScenarioInputs): DimensionName[] {
  const requested: DimensionName[] = []
  if (scenario.oxygen_fraction !== null) requested.push('oxygen')
  if (scenario.pressure_psia !== null) requested.push('pressure')
  if (scenario.gravity_g !== null) requested.push('gravity')
  if (scenario.flow_velocity_cms !== null) requested.push('flow')
  if (scenario.fuel_phase !== null) requested.push('phase')
  if (scenario.safety_theme !== null) requested.push('theme')
  return requested
}

const scenarioA = (): RankResponse => ({
  scenario_id: 'A',
  requested_dimensions: ['oxygen', 'pressure', 'gravity', 'phase', 'theme'],
  results: [
    buildResult({
      psi_id: 'PSI-98',
      title: 'Spacecraft Fire Safety Experiment-I',
      acronym: 'SAFFIRE-I',
      evidence_class: 'large_scale_demonstration',
      match_class: 'partial_match',
      justification:
        'SAFFIRE-I is a completed large-scale solid-fuel demonstration with primary prevention context. Its oxygen and pressure conditions are not curated, and its microgravity environment does not represent 0.16 g.',
      limitations: [
        'No curated oxygen or pressure condition for the requested environment.',
        'Microgravity demonstration; not partial-gravity evidence.',
        'Large-scale demonstration is not bench flammability evidence.',
      ],
      provenance_refs: ['provenance.safety_theme', 'provenance.gravity'],
      dimensions: buildDimensions([
        { name: 'oxygen', requested: true, present: false, scenario_value: '0.30 fraction' },
        { name: 'pressure', requested: true, present: false, scenario_value: '8.2 psia' },
        {
          name: 'gravity',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: '0.16 g',
          record_value: '0.0 g',
        },
        {
          name: 'phase',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'solid',
          record_value: 'solid',
        },
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'prevention',
          record_value: 'prevention',
        },
      ]),
    }),
    buildResult({
      psi_id: 'PSI-25',
      title: 'Burning and Suppression of Solids-II',
      acronym: 'BASS-II',
      evidence_class: 'bench_flammability',
      match_class: 'partial_match',
      justification:
        'BASS-II contributes solid-fuel and secondary prevention context. Its curated initial oxygen range is 0.136–0.222, so the requested 0.30 O₂ condition is outside that range. Pressure and flow are not curated in this H0 fixture.',
      limitations: [
        'Not a 30% O₂ match.',
        'Microgravity only; does not establish partial-gravity behaviour.',
        'Pressure and flow are not curated.',
      ],
      provenance_refs: [
        'provenance.oxygen_fraction',
        'provenance.fuel_phases',
        'provenance.safety_theme',
      ],
      dimensions: buildDimensions([
        {
          name: 'oxygen',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: '0.30 fraction',
          record_value: '0.136–0.222 fraction',
          note: 'Tolerance window [0.28, 0.32] is disjoint from the record range.',
        },
        { name: 'pressure', requested: true, present: false, scenario_value: '8.2 psia' },
        {
          name: 'gravity',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: '0.16 g',
          record_value: '0.0 g',
        },
        {
          name: 'phase',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'solid',
          record_value: 'solid',
        },
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 0.6,
          scenario_value: 'prevention',
          record_value: 'suppression (primary) · prevention (secondary)',
        },
      ]),
    }),
    buildResult({
      psi_id: 'PSI-159',
      title: 'ACME CFI-G',
      acronym: 'CFI-G',
      evidence_class: 'flame_physics',
      match_class: 'partial_match',
      justification:
        'CFI-G is high-oxygen gas-phase microgravity context. It is not solid-fuel or partial-gravity evidence, and its curated inverse-flame range does not intersect the requested 0.30 O₂ condition.',
      limitations: [
        'Gas-phase evidence; not solid-fuel behaviour.',
        'Microgravity campaign; not lunar partial gravity.',
        'Does not represent the requested oxygen condition.',
      ],
      provenance_refs: [
        'provenance.oxygen_fraction',
        'provenance.gravity',
        'provenance.fuel_phases',
      ],
      dimensions: buildDimensions([
        {
          name: 'oxygen',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: '0.30 fraction',
          record_value: '0.3997–0.85 fraction',
        },
        { name: 'pressure', requested: true, present: false, scenario_value: '8.2 psia' },
        {
          name: 'gravity',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: '0.16 g',
          record_value: '0.0 g',
        },
        {
          name: 'phase',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: 'solid',
          record_value: 'gas',
        },
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'prevention',
          record_value: 'prevention',
        },
      ]),
    }),
    buildResult({
      psi_id: 'PSI-10',
      title: 'Flame Design',
      acronym: 'Flame Design',
      evidence_class: 'flame_physics',
      match_class: 'partial_match',
      justification:
        'Flame Design is high-oxygen gas-phase microgravity context. It is not solid-fuel or partial-gravity evidence, and its curated inverse-flame range does not intersect the requested 0.30 O₂ condition.',
      limitations: [
        'Gas-phase evidence; not solid-fuel behaviour.',
        'Microgravity campaign; not lunar partial gravity.',
        'Does not represent the requested oxygen condition.',
      ],
      provenance_refs: [
        'provenance.oxygen_fraction',
        'provenance.gravity',
        'provenance.fuel_phases',
      ],
      dimensions: buildDimensions([
        {
          name: 'oxygen',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: '0.30 fraction',
          record_value: '0.4–0.849977932 fraction',
        },
        { name: 'pressure', requested: true, present: false, scenario_value: '8.2 psia' },
        {
          name: 'gravity',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: '0.16 g',
          record_value: '0.0 g',
        },
        {
          name: 'phase',
          requested: true,
          present: true,
          similarity: 0,
          scenario_value: 'solid',
          record_value: 'gas',
        },
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'prevention',
          record_value: 'prevention',
        },
      ]),
    }),
  ],
  gap_statement:
    'No completed PSI record directly covers the solid-fuel, 30% O₂, 8.2 psia, 0.16 g combination. Flow is unspecified, so a six-dimension direct match is impossible. High-O₂ gas-phase microgravity context and solid-fuel context are reported separately; FM2 remains anticipated program context.',
  mock_notice: 'H0 representative ranking fixture. The backend owns deterministic scoring.',
})

const scenarioB = (): RankResponse => ({
  scenario_id: 'B',
  requested_dimensions: ['theme'],
  results: [
    buildResult({
      psi_id: 'PSI-101',
      title: 'Smoke Aerosol Measurement Experiment-Reflight',
      acronym: 'SAME-R',
      evidence_class: 'detection_instrumentation',
      match_class: 'partial_match',
      justification:
        'SAME-R is completed detection-instrumentation evidence. Because the scenario specifies only a safety theme, this is a thematic match, not a direct match.',
      limitations: [
        'Detection evidence is not flame-spread evidence.',
        'A direct match requires all six scenario dimensions.',
      ],
      provenance_refs: ['provenance.safety_theme'],
      dimensions: buildDimensions([
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'detection',
          record_value: 'detection',
        },
      ]),
    }),
  ],
  gap_statement:
    'No completed PSI record provides a direct six-dimension cabin-detection match. SAME-R is thematic detection evidence; DAFT remains instrument context and is excluded from ranking.',
  mock_notice: 'H0 representative ranking fixture.',
})

const scenarioC = (): RankResponse => ({
  scenario_id: 'C',
  requested_dimensions: ['phase', 'theme'],
  results: [
    buildResult({
      psi_id: 'PSI-69',
      title: 'FLEX',
      acronym: 'FLEX',
      evidence_class: 'suppression',
      match_class: 'partial_match',
      justification:
        'FLEX provides completed liquid-droplet suppression evidence. Numeric physical conditions are not specified by the scenario, so no direct match is claimed.',
      limitations: [
        'Numeric oxygen, pressure, gravity, and flow conditions are not requested.',
        'Droplet suppression evidence is not a general material-flammability boundary.',
      ],
      provenance_refs: ['provenance.fuel_phases', 'provenance.safety_theme'],
      dimensions: buildDimensions([
        {
          name: 'phase',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'liquid_droplet',
          record_value: 'liquid_droplet',
        },
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'suppression',
          record_value: 'suppression',
        },
      ]),
    }),
    buildResult({
      psi_id: 'PSI-68',
      title: 'FLEX-2',
      acronym: 'FLEX-2',
      evidence_class: 'flame_physics',
      match_class: 'partial_match',
      justification:
        'FLEX-2 provides completed bi-component droplet-combustion evidence with suppression context. Numeric physical conditions are not specified by the scenario, so no direct match is claimed.',
      limitations: [
        'Numeric oxygen, pressure, gravity, and flow conditions are not requested.',
        'Combustion evidence is not presented as a validated flammability boundary.',
      ],
      provenance_refs: ['provenance.fuel_phases', 'provenance.safety_theme'],
      dimensions: buildDimensions([
        {
          name: 'phase',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'liquid_droplet',
          record_value: 'liquid_droplet',
        },
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'suppression',
          record_value: 'suppression',
        },
      ]),
    }),
  ],
  gap_statement:
    'FLEX and FLEX-2 provide completed droplet/suppression evidence. No six-dimension direct match is claimed. PSI-117 remains modeling-only context with no measured table.',
  mock_notice: 'H0 representative ranking fixture.',
})

const scenarioD = (): RankResponse => ({
  scenario_id: 'D',
  requested_dimensions: ['theme'],
  results: [
    buildResult({
      psi_id: 'PSI-159',
      title: 'ACME CFI-G',
      acronym: 'CFI-G',
      evidence_class: 'flame_physics',
      match_class: 'partial_match',
      justification:
        'CFI-G is high-oxygen gas-phase microgravity context. It is thematically relevant to prevention but is not an Apollo 1 reconstruction.',
      limitations: [
        'Gas-phase microgravity evidence, not the Apollo 1 environment.',
        'Thematic context only; no direct lineage to the incident.',
      ],
      provenance_refs: ['provenance.safety_theme'],
      dimensions: buildDimensions([
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'prevention',
          record_value: 'prevention',
        },
      ]),
    }),
    buildResult({
      psi_id: 'PSI-10',
      title: 'Flame Design',
      acronym: 'Flame Design',
      evidence_class: 'flame_physics',
      match_class: 'partial_match',
      justification:
        'Flame Design is high-oxygen gas-phase microgravity context. It is thematically relevant to prevention but is not an Apollo 1 reconstruction.',
      limitations: [
        'Gas-phase microgravity evidence, not the Apollo 1 environment.',
        'Thematic context only; no direct lineage to the incident.',
      ],
      provenance_refs: ['provenance.safety_theme'],
      dimensions: buildDimensions([
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'prevention',
          record_value: 'prevention',
        },
      ]),
    }),
    buildResult({
      psi_id: 'PSI-98',
      title: 'Spacecraft Fire Safety Experiment-I',
      acronym: 'SAFFIRE-I',
      evidence_class: 'large_scale_demonstration',
      match_class: 'partial_match',
      justification:
        'SAFFIRE-I is solid-fuel, large-scale prevention context. It is not an Apollo 1 reconstruction and does not represent a 100% oxygen environment.',
      limitations: [
        'Not a 100% O₂ environment.',
        'Large-scale demonstration, not bench flammability evidence.',
      ],
      provenance_refs: ['provenance.safety_theme'],
      dimensions: buildDimensions([
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 1,
          scenario_value: 'prevention',
          record_value: 'prevention',
        },
      ]),
    }),
    buildResult({
      psi_id: 'PSI-25',
      title: 'Burning and Suppression of Solids-II',
      acronym: 'BASS-II',
      evidence_class: 'bench_flammability',
      match_class: 'partial_match',
      justification:
        'BASS-II is solid-fuel context with prevention as a secondary theme. It is not an Apollo 1 reconstruction and is not a 100% oxygen environment.',
      limitations: [
        'Secondary prevention theme.',
        'Microgravity only; not the Apollo 1 environment.',
      ],
      provenance_refs: ['provenance.safety_theme'],
      dimensions: buildDimensions([
        {
          name: 'theme',
          requested: true,
          present: true,
          similarity: 0.6,
          scenario_value: 'prevention',
          record_value: 'suppression (primary) · prevention (secondary)',
        },
      ]),
    }),
  ],
  gap_statement:
    'No completed PSI record is an Apollo 1 reconstruction. High-O₂ gas-phase microgravity evidence (CFI-G, Flame Design) and solid-fuel evidence (BASS-II, SAFFIRE-I) are shown separately. Apollo 1 remains explanatory context.',
  mock_notice: 'H0 representative ranking fixture.',
})

const RANK_BY_SCENARIO: Record<string, () => RankResponse> = {
  A: scenarioA,
  B: scenarioB,
  C: scenarioC,
  D: scenarioD,
}

export function canonicalScenarioId(scenario: ScenarioInputs): string | null {
  const match = MOCK_SCENARIOS.find((candidate) =>
    inputsEqual(scenario, candidate.inputs),
  )
  return match?.id ?? null
}

export function inputsEqual(left: ScenarioInputs, right: ScenarioInputs): boolean {
  return (Object.keys(left) as Array<keyof ScenarioInputs>).every(
    (key) => left[key] === right[key],
  )
}

export function buildRankResponse(scenario: ScenarioInputs): RankResponse | null {
  const id = canonicalScenarioId(scenario)
  if (!id) return null
  const factory = RANK_BY_SCENARIO[id]
  return factory ? factory() : null
}

export { requestedDimensions }
