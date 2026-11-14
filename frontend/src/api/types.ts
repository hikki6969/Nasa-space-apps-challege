/**
 * H0 API contract types.
 *
 * These mirror the frozen product data contract (docs/00_PRODUCT_SPEC.md §4
 * and §9) and are the only types the UI should use. Field names are the
 * frontend's H0 interpretation; Person A's published OpenAPI remains
 * authoritative once supplied.
 */

export type RangeUnit = 'fraction' | 'psia' | 'cm/s' | 'g'
export type FuelPhase = 'solid' | 'liquid_droplet' | 'gas'
export type SafetyTheme = 'prevention' | 'detection' | 'suppression'
export type EvidenceClass =
  | 'bench_flammability'
  | 'large_scale_demonstration'
  | 'flame_physics'
  | 'detection_instrumentation'
  | 'suppression'
  | 'modeling'
export type ProjectType = 'microgravity' | 'ground'
export type CatalogRole = 'evidence' | 'instrument_context'
export type DataStatus = 'complete' | 'partial'
export type ProgramContextStatus = 'active_program' | 'anticipated_in_psi'
export type AnnotationStatus = 'source_cited' | 'metadata_only'
export type ExtractionMethod = 'script' | 'manual' | 'script_assisted_manual'
export type MatchClass =
  | 'direct_match'
  | 'partial_match'
  | 'contextual_only'
  | 'anticipated_in_psi'
export type SourceKind =
  | 'psi_narrative'
  | 'psi_table'
  | 'publication'
  | 'nasa_program'
export type ValueKind = 'reported' | 'safely_derived'

export const DIMENSION_ORDER = [
  'oxygen',
  'pressure',
  'gravity',
  'flow',
  'phase',
  'theme',
] as const

export type DimensionName = (typeof DIMENSION_ORDER)[number]

export const OBSERVED_DOMAIN_DISCLAIMER =
  'Observed test domain; not a validated flammability boundary.'

export interface Range {
  min: number
  max: number
  unit: RangeUnit
  notes: string | null
}

export interface Provenance {
  source_url: string
  source_kind: SourceKind
  excerpt_or_table_ref?: string
  excerpt?: string
  note: string | null
  value_kind: ValueKind
  extraction_method?: ExtractionMethod
}

export interface ExperimentalTable {
  psi_id: string
  file_name: string
  version: number
  s3_version_id: string
  download_url: string
  columns: string[]
  rows: Array<Record<string, unknown>>
  provenance: Provenance
}

export interface InvestigationSummary {
  psi_id: string
  title: string
  acronym: string | null
  research_area: string
  project_type: ProjectType
  catalog_role: CatalogRole
  evidence_class: EvidenceClass
  safety_theme: SafetyTheme | null
  secondary_safety_themes: SafetyTheme[]
  fuel: string | null
  fuel_phases: FuelPhase[]
  oxygen_fraction: Range | null
  pressure: Range | null
  flow_velocity: Range | null
  gravity: Range | null
  recorded_gravity_values: number[]
  recorded_flow_values: number[]
  hardware: string[]
  orientation: string[]
  data_status: DataStatus
  annotation_status: AnnotationStatus
  doi: string | null
  license: string | null
  source_url: string
}

export interface InvestigationDetail extends InvestigationSummary {
  objectives_text: string
  approach_text: string
  key_findings_text: string | null
  experimental_tables: ExperimentalTable[]
  provenance: Record<string, Provenance>
}

export interface CatalogCounts {
  total: number
  complete: number
  partial: number
  curated: number
  metadata_only: number
  instrument_context: number
  anticipated: number
}

export interface DistributionBucket {
  key: string
  label: string
  count: number
}

export interface CatalogDistributions {
  evidence_class: DistributionBucket[]
  safety_theme: DistributionBucket[]
  hardware: DistributionBucket[]
  data_status: DistributionBucket[]
}

export interface CatalogResponse {
  snapshot_sha256: string
  counts: CatalogCounts
  distributions: CatalogDistributions
  records: InvestigationSummary[]
  warnings: string[]
  mock_notice: string | null
}

export interface ScenarioInputs {
  oxygen_fraction: number | null
  pressure_psia: number | null
  gravity_g: number | null
  flow_velocity_cms: number | null
  fuel_phase: FuelPhase | null
  safety_theme: SafetyTheme | null
}

export interface Scenario {
  id: string
  name: string
  short_name: string
  summary: string
  inputs: ScenarioInputs
  expected_invariants: string[]
}

export interface ScenariosResponse {
  scenarios: Scenario[]
  mock_notice: string | null
}

export interface DimensionScore {
  name: DimensionName
  weight: number
  /** True when the scenario explicitly supplied this dimension. */
  requested: boolean
  /** True when the record carries a curated value for this dimension. */
  present: boolean
  /** 0..1; always 0 when the dimension is missing or not requested. */
  similarity: number
  scenario_value: string | number | null
  record_value: string | number | null
  note: string | null
}

export interface RankedResult {
  psi_id: string
  title: string
  acronym: string | null
  evidence_class: EvidenceClass
  catalog_role: CatalogRole
  annotation_status?: AnnotationStatus
  /** Deterministic physical proximity score, 0..1. Not applicability. */
  score: number
  /** Share of requested dimensions present in the record, 0..1. */
  coverage: number
  match_class: MatchClass
  dimensions: DimensionScore[]
  justification: string
  limitations: string[]
  provenance_refs: string[]
}

export interface RankRequest {
  scenario: ScenarioInputs
}

export interface RankResponse {
  scenario_id: string | null
  requested_dimensions: DimensionName[]
  results: RankedResult[]
  gap_statement: string
  mock_notice: string | null
}

export type CompareCell = string | number | string[] | number[] | null

export interface CompareField {
  key: string
  label: string
  unit: string | null
  values: Record<string, CompareCell>
  comparable: boolean
}

export interface ParallelAxis {
  key: string
  label: string
  unit: string
  values: Record<string, number>
}

export interface CompareShared {
  fuels: string[]
  fuel_phases: FuelPhase[]
  safety_themes: SafetyTheme[]
  hardware: string[]
  evidence_classes: EvidenceClass[]
}

export interface CompareDifferences {
  fuels: string[]
  fuel_phases: FuelPhase[]
  safety_themes: SafetyTheme[]
  hardware: string[]
}

export interface CompareRequest {
  psi_ids: string[]
}

export interface CompareResponse {
  psi_ids: string[]
  records: InvestigationSummary[]
  fields: CompareField[]
  shared: CompareShared
  differences: CompareDifferences
  parallel_axes: ParallelAxis[]
  mock_notice: string | null
}

export type ObservationOutcome =
  | 'ignition'
  | 'extinction'
  | 'no_ignition'
  | 'suppression'

export interface ObservationPoint {
  id: string
  psi_id: string
  label: string
  oxygen_fraction: number
  flow_velocity_cms: number
  fuel_phase: FuelPhase
  outcome: ObservationOutcome
  source_table: string
}

export interface ObservationAxis {
  key: 'oxygen_fraction' | 'flow_velocity_cms'
  label: string
  unit: string
}

export interface ObservationsResponse {
  points: ObservationPoint[]
  axes: {
    x: ObservationAxis
    y: ObservationAxis
  }
  excluded: Array<{ id: string; reason: string }>
  disclaimer: string
  mock_notice: string | null
}

export type ContextKind = 'incident' | 'spinoff' | 'program' | 'instrument'

export interface ContextCard {
  id: string
  kind: ContextKind
  title: string
  summary: string
  source_url: string
  source_label: string
  status: ProgramContextStatus | 'instrument_context' | null
  link_kind: 'thematic' | 'direct_lineage'
  evidence_scope: 'context_only'
}

export interface ContextResponse {
  incidents: ContextCard[]
  spinoff: ContextCard[]
  program_context: ContextCard[]
  instrument_context: ContextCard[]
  mock_notice: string | null
}

export interface AskRequest {
  question: string
}

export interface AskCitation {
  psi_id: string
  title: string
  field: string
  value: string
  source_url: string
}

export interface AskResponse {
  status: 'answered' | 'refused'
  scope: 'in_scope' | 'out_of_scope'
  answer: string
  citations: AskCitation[]
  matched_psi_ids: string[]
  limitations: string[]
  mock_notice: string | null
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  snapshot_loaded: boolean
  snapshot_sha256: string | null
  record_count: number
  index_ready: boolean
  use_llm: boolean
  mock: boolean
}

export interface RequestOptions {
  signal?: AbortSignal
}
