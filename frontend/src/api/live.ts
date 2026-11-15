import {
  createHttpTransport,
  type FireSightApi,
  type HttpApiOptions,
} from './client'
import type {
  AskCitation,
  AskRequest,
  AskResponse,
  CatalogEntryLive,
  CatalogResponse,
  CompareRequest,
  CompareResponse,
  ContextCard,
  ContextResponse,
  DimensionName,
  DimensionScore,
  EvidenceClass,
  HealthResponse,
  InvestigationDetail,
  InvestigationSummary,
  ObservationPoint,
  ObservationsResponse,
  Provenance,
  RankRequest,
  RankResponse,
  RankedResult,
  RequestOptions,
  ScenarioInputs,
  Scenario,
  ScenariosResponse,
} from './types'
import {
  buildCatalogFromRecords,
  buildCompareFromRecords,
  humanize,
} from './derived'

/**
 * Live H2 adapter. Maps the backend wire format (exercised by the backend
 * contract suite and backend/openapi.json) onto the shapes the UI consumes.
 *
 * Derivation rules worth knowing:
 * - `/api/catalog` returns slim records; the UI needs rich fields (fuels,
 *   hardware, distributions), so each of the 24 accessions is hydrated with
 *   its `/api/investigations/{id}` record. That is 25 calls per catalog load,
 *   against a backend that answers from memory; the result is exact, never
 *   estimated. Nothing is synthesized except:
 *   - `snapshot_sha256`, read from `/api/health` ('unavailable' if it fails),
 *   - `anticipated`, counted from `/api/context` programs with
 *     `data_status = 'anticipated_in_psi'`,
 *   - three always-true warnings (computed client-side, FM2/PSI-47 presence).
 * - `/api/compare` returns full records; the matrix and parallel axes are
 *   built from them with the same code path as the mock adapter. No number is
 *   derived for a record that does not carry one; missing stays missing.
 * - Every `mock_notice` is null. The live path never impersonates the mock
 *   and never displays mock disclosure copy.
 * - Provenance is passed through untouched. A value without provenance is
 *   withheld by the UI, never rendered.
 * - `/api/rank` reports `material_phase` / `safety_theme`; the UI dimension
 *   names are `phase` / `theme`, so they are mapped here. `similarity` is
 *   nullable on the wire; missing stays null and the UI renders it as such.
 */

// ---- Raw wire shapes (structural, not re-exported) -----------------------

interface RawHealth {
  status: 'ok' | 'degraded'
  snapshot: boolean
  snapshot_sha256: string | null
  snapshot_records: number
  index: boolean
  embeddings: boolean
  use_llm: boolean
  messages: string[]
}

interface RawCatalog {
  counts: {
    total: number
    evidence: number
    instrument_context: number
    source_cited: number
    metadata_only: number
    by_evidence_class: Record<string, number>
  }
  records: CatalogEntryLive[]
}

interface RawInvestigation {
  record: InvestigationSummary & {
    objectives_text: string
    approach_text: string
    key_findings_text: string | null
    experimental_tables: TablePreviewRaw[]
    extraction_method?: 'script' | 'manual' | 'script_assisted_manual'
    provenance: Record<string, Provenance>
  }
  table_previews: TablePreviewRaw[]
}

interface TablePreviewRaw {
  file_name: string
  version: number
  columns: string[]
  row_count: number
  rows: Array<Record<string, unknown>>
  download_url: string
  provenance: Provenance
}

interface RawScenarioFixture {
  id: 'A' | 'B' | 'C' | 'D'
  name: string
  description: string
  scenario: ScenarioInputs
  expected_invariant: string
  numeric_inputs_complete: boolean
}

interface RawScenarios {
  scenarios: RawScenarioFixture[]
}

type RawDimensionName = 'oxygen' | 'pressure' | 'gravity' | 'flow' | 'material_phase' | 'safety_theme'

interface RawDimension {
  name: RawDimensionName
  weight: number
  requested: boolean
  present: boolean
  similarity: number | null
  record_value: string | number | null
  scenario_value: string | number | null
  provenance: Provenance | null
  limitation: string | null
}

interface RawRankedResult {
  psi_id: string
  title: string
  acronym: string | null
  evidence_class: EvidenceClass
  catalog_role: InvestigationSummary['catalog_role']
  annotation_status?: InvestigationSummary['annotation_status']
  score: number
  coverage: number
  match_class: RankedResult['match_class']
  dimensions: RawDimension[]
  justification: string
  matched_conditions: string[]
  missing_dimensions: string[]
  limitations: string[]
  provenance: Record<string, Provenance>
  source_url: string
  data_status: InvestigationSummary['data_status']
}

interface RawRankResponse {
  scenario_id: string | null
  requested_dimensions: RawDimensionName[]
  results: RawRankedResult[]
  gap_statement: string
}

interface RawCompareResponse {
  psi_ids: string[]
  records: InvestigationSummary[]
  shared_fields: string[]
  differing_fields: string[]
  rows: Array<{ name: string; values: Record<string, unknown> }>
}

interface RawObservationPoint {
  psi_id: string
  file_name: string
  row_index: number
  oxygen_fraction: number
  pressure_psia?: number | null
  flow_velocity_cms?: number | null
  gravity_g?: number | null
  fuel_phase?: InvestigationSummary['fuel_phases'][number] | null
  provenance: Provenance
  field_provenance?: Record<string, Provenance>
}

interface RawObservations {
  points: RawObservationPoint[]
  excluded_psi_ids: string[]
  disclaimer: string
}

interface RawContextProgram {
  program_id: string
  title: string
  data_status: 'active_program' | 'anticipated_in_psi'
  source_url: string
  provenance?: Record<string, Provenance>
}

interface RawContextIncident {
  kind: 'incident' | 'spinoff'
  id: string
  title: string
  summary: string
  source_url: string
}

interface RawContextInstrument extends CatalogEntryLive {}

interface RawContext {
  incidents: RawContextIncident[]
  spinoff: RawContextIncident[]
  instruments: RawContextInstrument[]
  programs: RawContextProgram[]
}

interface RawAsk {
  answer: string
  citations: Array<{
    psi_id: string
    title: string
    source_url: string
  }>
  refused: boolean
  refusal_reason: string | null
  scope: 'in_scope' | 'rocket_propellant'
}

// ---- Mapping helpers ------------------------------------------------------

function dimensionName(name: RawDimensionName): DimensionName {
  switch (name) {
    case 'material_phase':
      return 'phase'
    case 'safety_theme':
      return 'theme'
    default:
      return name
  }
}

function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'NASA'
  }
}

function mapSummary(record: InvestigationSummary): InvestigationSummary {
  return { ...record }
}

function mapDimension(dimension: RawDimension): DimensionScore {
  return {
    name: dimensionName(dimension.name),
    weight: dimension.weight,
    requested: dimension.requested,
    present: dimension.present,
    similarity: dimension.similarity ?? null,
    scenario_value: dimension.scenario_value ?? null,
    record_value: dimension.record_value ?? null,
    note: dimension.limitation ?? null,
  }
}

function mapRankedResult(result: RawRankedResult): RankedResult {
  return {
    psi_id: result.psi_id,
    title: result.title,
    acronym: result.acronym,
    evidence_class: result.evidence_class,
    catalog_role: result.catalog_role,
    annotation_status: result.annotation_status,
    score: result.score,
    coverage: result.coverage,
    match_class: result.match_class,
    dimensions: result.dimensions.map(mapDimension),
    justification: result.justification,
    limitations: result.limitations ?? [],
    provenance_refs: Object.keys(result.provenance ?? {}).map(
      (field) => `provenance.${field}`,
    ),
  }
}

const LIVE_WARNINGS = [
  'Live H2 backend normalized client-side: counts and distributions are computed from the 24 hydrated canonical records, never estimated.',
  'FM2 is anticipated program context and is outside the 24-record catalog.',
  'PSI-47 is retained as instrument context and is never a ranked candidate.',
] as const

// ---- The live adapter -----------------------------------------------------

export function createLiveApi(options: HttpApiOptions = {}): FireSightApi {
  const transport = createHttpTransport(options)

  async function fetchSummary(
    psiId: string,
    requestOptions?: RequestOptions,
  ): Promise<InvestigationSummary> {
    const detail = await transport.get<RawInvestigation>(
      `/investigations/${encodeURIComponent(psiId)}`,
      requestOptions,
    )
    return mapSummary(detail.record)
  }

  return {
    async getHealth(requestOptions): Promise<HealthResponse> {
      const raw = await transport.get<RawHealth>('/health', requestOptions)
      return {
        status: raw.status,
        snapshot_loaded: raw.snapshot,
        snapshot_sha256: raw.snapshot_sha256,
        record_count: raw.snapshot_records,
        index_ready: raw.index && raw.embeddings,
        use_llm: raw.use_llm,
        mock: false,
      }
    },

    async getCatalog(requestOptions): Promise<CatalogResponse> {
      const [rawCatalog, shaProbe, programs] = await Promise.all([
        transport.get<RawCatalog>('/catalog', requestOptions),
        transport
          .get<{ snapshot_sha256: string | null }>('/health', requestOptions)
          .then((health) => health.snapshot_sha256 ?? 'unavailable')
          .catch(() => 'unavailable'),
        transport
          .get<{ programs: RawContextProgram[] }>('/context', requestOptions)
          .then((context) => context.programs)
          .catch(() => null),
      ])

      const records = await Promise.all(
        rawCatalog.records.map((entry) => fetchSummary(entry.psi_id, requestOptions)),
      )

      const warnings: string[] = [...LIVE_WARNINGS]
      let anticipated = 0
      if (programs === null) {
        warnings.push(
          'Context endpoint unavailable; anticipated program count unavailable.',
        )
      } else {
        anticipated = programs.filter(
          (program) => program.data_status === 'anticipated_in_psi',
        ).length
      }

      return buildCatalogFromRecords(records, {
        snapshotSha256: shaProbe,
        anticipated,
        warnings,
        mockNotice: null,
      })
    },

    async getInvestigation(
      psiId: string,
      requestOptions?: RequestOptions,
    ): Promise<InvestigationDetail> {
      const raw = await transport.get<RawInvestigation>(
        `/investigations/${encodeURIComponent(psiId)}`,
        requestOptions,
      )
      const { record, table_previews: tablePreviews } = raw
      return {
        ...record,
        key_findings_text: record.key_findings_text ?? null,
        experimental_tables: (tablePreviews ?? []).map((preview) => ({
          psi_id: record.psi_id,
          file_name: preview.file_name,
          version: preview.version,
          columns: preview.columns,
          rows: preview.rows,
          download_url: preview.download_url,
          provenance: preview.provenance,
        })),
      }
    },

    async getScenarios(requestOptions): Promise<ScenariosResponse> {
      const raw = await transport.get<RawScenarios>('/scenarios', requestOptions)
      const scenarios: Scenario[] = raw.scenarios.map((fixture) => ({
        id: fixture.id,
        name: fixture.name,
        short_name: `Scenario ${fixture.id}`,
        summary: fixture.description,
        inputs: fixture.scenario,
        expected_invariants: fixture.expected_invariant
          ? [fixture.expected_invariant]
          : [],
      }))
      return { scenarios, mock_notice: null }
    },

    async rank(
      request: RankRequest,
      requestOptions?: RequestOptions,
    ): Promise<RankResponse> {
      const raw = await transport.post<RawRankResponse>(
        '/rank',
        { scenario: request.scenario, scenario_id: request.scenario_id ?? null, limit: 10 },
        requestOptions,
      )
      return {
        scenario_id: raw.scenario_id,
        requested_dimensions: raw.requested_dimensions.map(dimensionName),
        results: raw.results.map(mapRankedResult),
        gap_statement: raw.gap_statement,
        mock_notice: null,
      }
    },

    async compare(
      request: CompareRequest,
      requestOptions?: RequestOptions,
    ): Promise<CompareResponse> {
      const raw = await transport.post<RawCompareResponse>(
        '/compare',
        { psi_ids: request.psi_ids },
        requestOptions,
      )
      // The H2 matrix records carry full canonical payloads; derive the same
      // shared/different/axis view the mock adapter derives from fixtures.
      const records = (raw.records ?? []).map(mapSummary)
      return buildCompareFromRecords(request.psi_ids, records, {
        mockNotice: null,
      })
    },

    async getObservations(
      requestOptions?: RequestOptions,
    ): Promise<ObservationsResponse> {
      const raw = await transport.get<RawObservations>(
        '/observations',
        requestOptions,
      )
      const points: ObservationPoint[] = raw.points.map((point) => ({
        psi_id: point.psi_id,
        file_name: point.file_name,
        row_index: point.row_index,
        oxygen_fraction: point.oxygen_fraction,
        pressure_psia: point.pressure_psia ?? null,
        flow_velocity_cms: point.flow_velocity_cms ?? null,
        gravity_g: point.gravity_g ?? null,
        fuel_phase: point.fuel_phase ?? null,
        provenance: point.provenance,
        field_provenance: point.field_provenance ?? {},
      }))
      return {
        points,
        excluded_psi_ids: raw.excluded_psi_ids ?? [],
        disclaimer: raw.disclaimer,
        mock_notice: null,
      }
    },

    async getContext(requestOptions?: RequestOptions): Promise<ContextResponse> {
      const raw = await transport.get<RawContext>('/context', requestOptions)

      const narrative = (
        card: RawContextIncident,
        kind: 'incident' | 'spinoff',
      ): ContextCard => ({
        id: card.id,
        kind,
        title: card.title,
        summary: card.summary,
        source_url: card.source_url,
        source_label: sourceLabel(card.source_url),
        status: null,
        link_kind: 'thematic',
        evidence_scope: 'context_only',
      })

      const instrumentCards: ContextCard[] = raw.instruments.map((entry) => ({
        id: entry.psi_id,
        kind: 'instrument',
        title: entry.title,
        summary: `${humanize(entry.evidence_class ?? 'detection_instrumentation')} context retained outside physical ranking. PSI-47 is instrument context, never a ranked candidate.`,
        source_url: entry.source_url,
        source_label: sourceLabel(entry.source_url),
        status: 'instrument_context',
        link_kind: 'thematic',
        evidence_scope: 'context_only',
      }))

      const programCards: ContextCard[] = raw.programs.map((program) => ({
        id: program.program_id,
        kind: 'program',
        title: program.title,
        summary:
          program.data_status === 'anticipated_in_psi'
            ? 'Anticipated in PSI. Program context, not a measured observation and not a ranked candidate.'
            : 'Active NASA combustion program with no record in the 24-record corpus. Not a measured observation.',
        source_url: program.source_url,
        source_label: sourceLabel(program.source_url),
        status: program.data_status,
        link_kind: 'thematic',
        evidence_scope: 'context_only',
      }))

      return {
        incidents: raw.incidents.map((card) => narrative(card, 'incident')),
        spinoff: raw.spinoff.map((card) => narrative(card, 'spinoff')),
        program_context: programCards,
        instrument_context: instrumentCards,
        mock_notice: null,
      }
    },

    async ask(
      request: AskRequest,
      requestOptions?: RequestOptions,
    ): Promise<AskResponse> {
      const raw = await transport.post<RawAsk>(
        '/ask',
        { question: request.question },
        requestOptions,
      )
      const citations: AskCitation[] = raw.citations.map((citation) => ({
        psi_id: citation.psi_id,
        title: citation.title,
        source_url: citation.source_url,
      }))
      const matched = [...new Set(citations.map((citation) => citation.psi_id))]
      return {
        status: raw.refused ? 'refused' : 'answered',
        scope: raw.refused ? 'out_of_scope' : 'in_scope',
        answer: raw.answer,
        citations,
        matched_psi_ids: matched,
        limitations:
          raw.refused && raw.refusal_reason ? [raw.refusal_reason] : [],
        mock_notice: null,
      }
    },
  }
}
