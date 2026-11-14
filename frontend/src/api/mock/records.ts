import type {
  DataStatus,
  EvidenceClass,
  FuelPhase,
  InvestigationDetail,
  InvestigationSummary,
  ProjectType,
  Range,
  SafetyTheme,
} from '../types'

export const MOCK_NOTICE =
  'H0 mock adapter — representative fixture data, not the canonical NASA PSI snapshot.'

const PSI_DETAIL = 'https://psi.nasa.gov/geode-py/ws/repo/investigations'

function range(
  min: number,
  max: number,
  unit: Range['unit'],
  notes: string,
): Range {
  return { min, max, unit, notes }
}

interface RecordInput {
  psi_id: string
  title: string
  acronym?: string | null
  project_type?: ProjectType
  evidence_class?: EvidenceClass
  safety_theme?: SafetyTheme | null
  secondary_safety_themes?: SafetyTheme[]
  fuel?: string | null
  fuel_phases?: FuelPhase[]
  oxygen_fraction?: Range | null
  pressure?: Range | null
  flow_velocity?: Range | null
  gravity?: Range | null
  recorded_gravity_values?: number[]
  recorded_flow_values?: number[]
  hardware?: string[]
  data_status?: DataStatus
  annotation_status?: 'verified' | 'metadata_only'
  catalog_role?: 'evidence' | 'instrument_context'
}

function record(input: RecordInput): InvestigationSummary {
  return {
    psi_id: input.psi_id,
    title: input.title,
    acronym: input.acronym ?? null,
    research_area: 'Combustion Science',
    project_type: input.project_type ?? 'microgravity',
    catalog_role: input.catalog_role ?? 'evidence',
    evidence_class: input.evidence_class ?? 'bench_flammability',
    safety_theme: input.safety_theme ?? null,
    secondary_safety_themes: input.secondary_safety_themes ?? [],
    fuel: input.fuel ?? null,
    fuel_phases: input.fuel_phases ?? [],
    oxygen_fraction: input.oxygen_fraction ?? null,
    pressure: input.pressure ?? null,
    flow_velocity: input.flow_velocity ?? null,
    gravity: input.gravity ?? null,
    recorded_gravity_values: input.recorded_gravity_values ?? [],
    recorded_flow_values: input.recorded_flow_values ?? [],
    hardware: input.hardware ?? [],
    orientation: [],
    data_status: input.data_status ?? 'partial',
    annotation_status: input.annotation_status ?? 'metadata_only',
    doi: null,
    license: null,
    source_url: `${PSI_DETAIL}/${input.psi_id}`,
  }
}

/**
 * Exactly the 24 accessions in VF-01. Seven records are the deeply curated
 * H0 representatives; the rest are visibly metadata-only.
 */
export const MOCK_RECORDS: InvestigationSummary[] = [
  record({
    psi_id: 'PSI-159',
    title: 'ACME CFI-G',
    acronym: 'CFI-G',
    evidence_class: 'flame_physics',
    safety_theme: 'prevention',
    fuel: 'gaseous fuel',
    fuel_phases: ['gas'],
    oxygen_fraction: range(
      0.3997,
      0.85,
      'fraction',
      'Inverse-flame XO2 reaches 0.85; normal-flame initial O2 max is 0.3997 (VF-07).',
    ),
    gravity: range(0, 0, 'g', 'Microgravity campaign.'),
    recorded_gravity_values: [0],
    hardware: ['Combustion Integrated Rack'],
    data_status: 'complete',
    annotation_status: 'verified',
  }),
  record({
    psi_id: 'PSI-10',
    title: 'Flame Design',
    acronym: 'Flame Design',
    evidence_class: 'flame_physics',
    safety_theme: 'prevention',
    fuel: 'gaseous fuel',
    fuel_phases: ['gas'],
    oxygen_fraction: range(
      0.4,
      0.849977932,
      'fraction',
      'Inverse-flame XO2 max 0.849977932; normal-flame initial O2 max 0.4 (VF-08).',
    ),
    gravity: range(0, 0, 'g', 'Microgravity campaign.'),
    recorded_gravity_values: [0],
    hardware: ['Combustion Integrated Rack'],
    data_status: 'complete',
    annotation_status: 'verified',
  }),
  record({
    psi_id: 'PSI-101',
    title: 'Smoke Aerosol Measurement Experiment-Reflight',
    acronym: 'SAME-R',
    evidence_class: 'detection_instrumentation',
    safety_theme: 'detection',
    hardware: ['SAME-R instrument'],
    data_status: 'complete',
    annotation_status: 'verified',
  }),
  record({
    psi_id: 'PSI-98',
    title: 'Spacecraft Fire Safety Experiment-I',
    acronym: 'SAFFIRE-I',
    evidence_class: 'large_scale_demonstration',
    safety_theme: 'prevention',
    secondary_safety_themes: ['suppression'],
    fuel: 'fabric sample',
    fuel_phases: ['solid'],
    gravity: range(0, 0, 'g', 'Microgravity demonstration.'),
    recorded_gravity_values: [0],
    hardware: ['Cygnus spacecraft'],
    data_status: 'complete',
    annotation_status: 'verified',
  }),
  record({
    psi_id: 'PSI-25',
    title: 'Burning and Suppression of Solids-II',
    acronym: 'BASS-II',
    evidence_class: 'bench_flammability',
    safety_theme: 'suppression',
    secondary_safety_themes: ['prevention'],
    fuel: 'solid fuel samples',
    fuel_phases: ['solid'],
    oxygen_fraction: range(
      0.136,
      0.222,
      'fraction',
      'Calibrated initial O2 minimum 13.6% and maximum 22.2% by volume (VF-06). Final outliers are stored separately.',
    ),
    gravity: range(0, 0, 'g', 'Microgravity campaign.'),
    recorded_gravity_values: [0],
    hardware: ['BASS-II facility'],
    data_status: 'complete',
    annotation_status: 'verified',
  }),
  record({
    psi_id: 'PSI-69',
    title: 'FLEX',
    acronym: 'FLEX',
    evidence_class: 'suppression',
    safety_theme: 'suppression',
    fuel: 'liquid droplet',
    fuel_phases: ['liquid_droplet'],
    gravity: range(0, 0, 'g', 'Microgravity campaign.'),
    recorded_gravity_values: [0],
    hardware: ['FLEX facility'],
    data_status: 'complete',
    annotation_status: 'verified',
  }),
  record({
    psi_id: 'PSI-68',
    title: 'FLEX-2',
    acronym: 'FLEX-2',
    evidence_class: 'flame_physics',
    safety_theme: 'suppression',
    secondary_safety_themes: ['prevention'],
    fuel: 'bi-component liquid droplet',
    fuel_phases: ['liquid_droplet'],
    gravity: range(0, 0, 'g', 'Microgravity campaign.'),
    recorded_gravity_values: [0],
    hardware: ['FLEX facility'],
    data_status: 'complete',
    annotation_status: 'verified',
  }),
  record({
    psi_id: 'PSI-117',
    title:
      'Effect of External Thermo-Convective Perturbation on Cool Flame Dynamics: A Multidimensional Multi-Physics CFD Analysis',
    evidence_class: 'modeling',
    safety_theme: 'suppression',
    project_type: 'microgravity',
    data_status: 'partial',
    annotation_status: 'metadata_only',
  }),
  record({
    psi_id: 'PSI-47',
    title:
      'Dust and Aerosol Measurement Feasibility Test / Dust and Aerosol Measurement Feasibility Test-2',
    acronym: 'DAFT / DAFT-2',
    evidence_class: 'detection_instrumentation',
    safety_theme: 'detection',
    catalog_role: 'instrument_context',
    hardware: ['DAFT instrument'],
    data_status: 'complete',
    annotation_status: 'metadata_only',
  }),
  record({
    psi_id: 'PSI-106',
    title: 'SLICE',
    acronym: 'SLICE',
    evidence_class: 'flame_physics',
    safety_theme: 'prevention',
    fuel: 'gaseous fuel',
    fuel_phases: ['gas'],
  }),
  record({ psi_id: 'PSI-142', title: 'PSI-142 catalog record' }),
  record({ psi_id: 'PSI-62', title: 'PSI-62 catalog record' }),
  record({ psi_id: 'PSI-60', title: 'PSI-60 catalog record' }),
  record({ psi_id: 'PSI-26', title: 'PSI-26 catalog record' }),
  record({ psi_id: 'PSI-115', title: 'PSI-115 catalog record' }),
  record({ psi_id: 'PSI-100', title: 'PSI-100 catalog record' }),
  record({ psi_id: 'PSI-39', title: 'PSI-39 catalog record' }),
  record({ psi_id: 'PSI-102', title: 'PSI-102 catalog record' }),
  record({ psi_id: 'PSI-99', title: 'PSI-99 catalog record' }),
  record({ psi_id: 'PSI-22', title: 'PSI-22 catalog record' }),
  record({ psi_id: 'PSI-107', title: 'PSI-107 catalog record' }),
  record({ psi_id: 'PSI-21', title: 'PSI-21 catalog record' }),
  record({ psi_id: 'PSI-20', title: 'PSI-20 catalog record' }),
  record({ psi_id: 'PSI-23', title: 'PSI-23 catalog record' }),
]

function objectiveFor(record: InvestigationSummary): string {
  if (record.annotation_status === 'metadata_only') {
    return 'Catalog-visible record. The H1 annotation package replaces this representative H0 objective text.'
  }
  return `Representative H0 objective for ${record.acronym ?? record.psi_id}: characterize the combustion or fire-safety behaviour described by the catalog metadata.`
}

function approachFor(record: InvestigationSummary): string {
  if (record.annotation_status === 'metadata_only') {
    return 'No field-level physical annotations are present in the H0 fixture.'
  }
  return 'Representative microgravity investigation approach; field-level provenance is supplied in H1.'
}

function provenanceFor(record: InvestigationSummary, field: string) {
  return {
    source_url: record.source_url,
    source_kind: 'psi_narrative' as const,
    excerpt: `H0 representative fixture for ${field}; the verified H1 excerpt replaces this text.`,
    note: 'Mock adapter only. Do not treat as a canonical annotation.',
    value_kind: 'reported' as const,
  }
}

export function buildDetail(record: InvestigationSummary): InvestigationDetail {
  const physicalFields = [
    'oxygen_fraction',
    'pressure',
    'flow_velocity',
    'gravity',
    'fuel',
    'fuel_phases',
    'safety_theme',
    'recorded_gravity_values',
    'recorded_flow_values',
  ] as const

  const provenance = Object.fromEntries(
    physicalFields.map((field) => [field, provenanceFor(record, field)]),
  )

  return {
    ...record,
    objectives_text: objectiveFor(record),
    approach_text: approachFor(record),
    key_findings_text:
      record.annotation_status === 'verified'
        ? 'Representative H0 finding. The backend template justification remains authoritative for wording and scope.'
        : null,
    experimental_tables: [],
    provenance,
  }
}

export const MOCK_DETAILS: Record<string, InvestigationDetail> =
  Object.fromEntries(
    MOCK_RECORDS.map((recordItem) => [
      recordItem.psi_id,
      buildDetail(recordItem),
    ]),
  )
