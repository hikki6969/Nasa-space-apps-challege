import { ApiError, type FireSightApi } from '../client'
import {
  OBSERVED_DOMAIN_DISCLAIMER,
  type AskResponse,
  type CatalogDistributions,
  type CatalogResponse,
  type CompareField,
  type CompareResponse,
  type ContextResponse,
  type DistributionBucket,
  type EvidenceClass,
  type FuelPhase,
  type HealthResponse,
  type InvestigationSummary,
  type ObservationsResponse,
  type ParallelAxis,
  type Range,
  type RankResponse,
  type RequestOptions,
  type SafetyTheme,
} from '../types'
import { MOCK_CONTEXT } from './context'
import { MOCK_OBSERVATIONS } from './observations'
import { buildRankResponse, requestedDimensions } from './rank'
import { MOCK_DETAILS, MOCK_NOTICE, MOCK_RECORDS } from './records'
import { MOCK_SCENARIOS } from './scenarios'

export interface MockApiOptions {
  /** Small artificial latency so loading states are exercised in the demo. */
  latencyMs?: number
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function humanize(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function countBy(values: string[]): DistributionBucket[] {
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => ({ key, label: humanize(key), count }))
}

function buildDistributions(
  records: InvestigationSummary[],
): CatalogDistributions {
  return {
    evidence_class: countBy(records.map((record) => record.evidence_class)),
    safety_theme: countBy(
      records.map((record) => record.safety_theme ?? 'uncurated'),
    ),
    hardware: countBy(records.flatMap((record) => record.hardware)).slice(0, 8),
    data_status: countBy(records.map((record) => record.data_status)),
  }
}

function buildCatalog(): CatalogResponse {
  return {
    snapshot_sha256: 'h0-mock-not-canonical',
    counts: {
      total: MOCK_RECORDS.length,
      complete: MOCK_RECORDS.filter((record) => record.data_status === 'complete')
        .length,
      partial: MOCK_RECORDS.filter((record) => record.data_status === 'partial')
        .length,
      curated: MOCK_RECORDS.filter(
        (record) => record.annotation_status === 'verified',
      ).length,
      metadata_only: MOCK_RECORDS.filter(
        (record) => record.annotation_status === 'metadata_only',
      ).length,
      instrument_context: MOCK_RECORDS.filter(
        (record) => record.catalog_role === 'instrument_context',
      ).length,
      anticipated: 1,
    },
    distributions: buildDistributions(MOCK_RECORDS),
    records: MOCK_RECORDS,
    warnings: [
      'H0 mock adapter: the 24 IDs match the VF-01 ledger, but field values are representative fixtures, not the canonical snapshot.',
      'FM2 is anticipated program context and is outside the 24-record catalog.',
      'PSI-47 is retained as instrument context and is never a ranked candidate.',
    ],
    mock_notice: MOCK_NOTICE,
  }
}

function formatRange(range: Range | null, digits = 3): string | null {
  if (!range) return null
  const trim = (value: number) => Number(value.toFixed(digits)).toString()
  return `${trim(range.min)}–${trim(range.max)} ${range.unit}`
}

function sameValues<T>(values: T[][]): T[] {
  if (values.length === 0) return []
  const first = values[0] ?? []
  return first.filter((value) =>
    values.every((list) => list.some((candidate) => candidate === value)),
  )
}

function differingValues<T>(values: T[][]): T[] {
  const all = new Set(values.flat())
  return [...all].filter(
    (value) => !values.every((list) => list.some((candidate) => candidate === value)),
  )
}

const FIELD_DEFINITIONS: Array<{
  key: string
  label: string
  unit: string | null
  comparable: boolean
  value: (record: InvestigationSummary) => CompareField['values'][string]
}> = [
  {
    key: 'title',
    label: 'Title',
    unit: null,
    comparable: false,
    value: (record) => record.title,
  },
  {
    key: 'evidence_class',
    label: 'Evidence class',
    unit: null,
    comparable: false,
    value: (record) => record.evidence_class,
  },
  {
    key: 'catalog_role',
    label: 'Catalog role',
    unit: null,
    comparable: false,
    value: (record) => record.catalog_role,
  },
  {
    key: 'project_type',
    label: 'Project type',
    unit: null,
    comparable: false,
    value: (record) => record.project_type,
  },
  {
    key: 'data_status',
    label: 'Data status',
    unit: null,
    comparable: false,
    value: (record) => record.data_status,
  },
  {
    key: 'annotation_status',
    label: 'Annotation status',
    unit: null,
    comparable: false,
    value: (record) => record.annotation_status,
  },
  {
    key: 'safety_theme',
    label: 'Primary safety theme',
    unit: null,
    comparable: false,
    value: (record) => record.safety_theme,
  },
  {
    key: 'secondary_safety_themes',
    label: 'Secondary safety themes',
    unit: null,
    comparable: false,
    value: (record) => record.secondary_safety_themes,
  },
  {
    key: 'fuel',
    label: 'Fuel',
    unit: null,
    comparable: false,
    value: (record) => record.fuel,
  },
  {
    key: 'fuel_phases',
    label: 'Fuel phases',
    unit: null,
    comparable: false,
    value: (record) => record.fuel_phases,
  },
  {
    key: 'oxygen_fraction',
    label: 'Oxygen range',
    unit: 'fraction',
    comparable: true,
    value: (record) => formatRange(record.oxygen_fraction),
  },
  {
    key: 'pressure',
    label: 'Pressure range',
    unit: 'psia',
    comparable: true,
    value: (record) => formatRange(record.pressure),
  },
  {
    key: 'flow_velocity',
    label: 'Flow range',
    unit: 'cm/s',
    comparable: true,
    value: (record) => formatRange(record.flow_velocity),
  },
  {
    key: 'gravity',
    label: 'Gravity range',
    unit: 'g',
    comparable: true,
    value: (record) => formatRange(record.gravity),
  },
  {
    key: 'recorded_gravity_values',
    label: 'Recorded gravity levels',
    unit: 'g',
    comparable: true,
    value: (record) => record.recorded_gravity_values,
  },
  {
    key: 'hardware',
    label: 'Hardware / facility',
    unit: null,
    comparable: false,
    value: (record) => record.hardware,
  },
  {
    key: 'source_url',
    label: 'NASA PSI source',
    unit: null,
    comparable: false,
    value: (record) => record.source_url,
  },
]

const AXIS_DEFINITIONS: Array<{
  key: string
  label: string
  unit: string
  value: (record: InvestigationSummary) => number | null
}> = [
  {
    key: 'oxygen_min',
    label: 'O₂ min',
    unit: 'fraction',
    value: (record) => record.oxygen_fraction?.min ?? null,
  },
  {
    key: 'oxygen_max',
    label: 'O₂ max',
    unit: 'fraction',
    value: (record) => record.oxygen_fraction?.max ?? null,
  },
  {
    key: 'pressure_min',
    label: 'Pressure min',
    unit: 'psia',
    value: (record) => record.pressure?.min ?? null,
  },
  {
    key: 'pressure_max',
    label: 'Pressure max',
    unit: 'psia',
    value: (record) => record.pressure?.max ?? null,
  },
  {
    key: 'flow_min',
    label: 'Flow min',
    unit: 'cm/s',
    value: (record) => record.flow_velocity?.min ?? null,
  },
  {
    key: 'flow_max',
    label: 'Flow max',
    unit: 'cm/s',
    value: (record) => record.flow_velocity?.max ?? null,
  },
  {
    key: 'gravity_min',
    label: 'Gravity min',
    unit: 'g',
    value: (record) => {
      if (record.recorded_gravity_values.length > 0) {
        return Math.min(...record.recorded_gravity_values)
      }
      return record.gravity?.min ?? null
    },
  },
  {
    key: 'gravity_max',
    label: 'Gravity max',
    unit: 'g',
    value: (record) => {
      if (record.recorded_gravity_values.length > 0) {
        return Math.max(...record.recorded_gravity_values)
      }
      return record.gravity?.max ?? null
    },
  },
]

function buildParallelAxes(records: InvestigationSummary[]): ParallelAxis[] {
  return AXIS_DEFINITIONS.flatMap((axis) => {
    const values: Record<string, number> = {}
    for (const record of records) {
      const value = axis.value(record)
      if (value === null) return []
      values[record.psi_id] = value
    }
    return [
      {
        key: axis.key,
        label: axis.label,
        unit: axis.unit,
        values,
      },
    ]
  })
}

function buildCompare(psiIds: string[]): CompareResponse {
  const uniqueIds = [...new Set(psiIds)]
  if (uniqueIds.length < 2 || uniqueIds.length > 4) {
    throw new ApiError(
      400,
      'POST /api/compare',
      'Select between two and four distinct PSI records.',
    )
  }

  const records = uniqueIds.map((psiId) => {
    const found = MOCK_RECORDS.find((record) => record.psi_id === psiId)
    if (!found) {
      throw new ApiError(404, `POST /api/compare`, `Unknown PSI record ${psiId}`)
    }
    return found
  })

  const fields: CompareField[] = FIELD_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    unit: definition.unit,
    comparable: definition.comparable,
    values: Object.fromEntries(
      records.map((record) => [record.psi_id, definition.value(record)]),
    ),
  }))

  const fuelLists = records.map((record) => (record.fuel ? [record.fuel] : []))
  const phaseLists = records.map((record) => record.fuel_phases)
  const themeLists = records.map((record) => [
    ...(record.safety_theme ? [record.safety_theme] : []),
    ...record.secondary_safety_themes,
  ])
  const hardwareLists = records.map((record) => record.hardware)
  const classLists = records.map((record) => [record.evidence_class])

  return {
    psi_ids: uniqueIds,
    records,
    fields,
    shared: {
      fuels: sameValues(fuelLists),
      fuel_phases: sameValues<FuelPhase>(phaseLists),
      safety_themes: sameValues<SafetyTheme>(themeLists),
      hardware: sameValues(hardwareLists),
      evidence_classes: sameValues<EvidenceClass>(classLists),
    },
    differences: {
      fuels: differingValues(fuelLists),
      fuel_phases: differingValues<FuelPhase>(phaseLists),
      safety_themes: differingValues<SafetyTheme>(themeLists),
      hardware: differingValues(hardwareLists),
    },
    parallel_axes: buildParallelAxes(records),
    mock_notice:
      'Parallel axes include only fields with a value for every selected record.',
  }
}

function citation(psiId: string, field: string, value: string) {
  const record = MOCK_RECORDS.find((candidate) => candidate.psi_id === psiId)
  if (!record) return null
  return {
    psi_id: record.psi_id,
    title: record.title,
    field,
    value,
    source_url: record.source_url,
  }
}

function buildAskAnswer(question: string): AskResponse {
  const normalized = question.toLowerCase()

  if (
    /rocket|propellant|engine|nozzle|thrust|combustion instability/.test(
      normalized,
    )
  ) {
    return {
      status: 'refused',
      scope: 'out_of_scope',
      answer:
        'FireSight is scoped to NASA PSI spacecraft fire-safety evidence. Rocket-engine and propellant-combustion questions are outside the committed evidence corpus, so I cannot answer this from FireSight. No ranking or measured observation was produced.',
      citations: [],
      matched_psi_ids: [],
      limitations: [
        'Rocket-engine and propellant-combustion analysis is a non-goal.',
        'No evidence in the 24-record PSI corpus is used for this refusal.',
      ],
      mock_notice: 'H0 template scope-guard fixture.',
    }
  }

  if (/detect|smoke|aerosol|daft/.test(normalized)) {
    return {
      status: 'answered',
      scope: 'in_scope',
      answer:
        'SAME-R is the completed detection-instrumentation evidence in this catalog. It measures smoke aerosol behaviour; it is not flame-spread evidence. DAFT remains instrument context and is excluded from ranked results.',
      citations: [
        citation(
          'PSI-101',
          'evidence_class',
          'detection_instrumentation',
        ),
      ].filter((item) => item !== null),
      matched_psi_ids: ['PSI-101'],
      limitations: [
        'Detection evidence is not flame-spread evidence.',
        'DAFT is instrument context, never a ranked candidate.',
      ],
      mock_notice: 'H0 cited-template fixture.',
    }
  }

  if (/droplet|suppress|flex/.test(normalized)) {
    return {
      status: 'answered',
      scope: 'in_scope',
      answer:
        'FLEX and FLEX-2 provide completed liquid-droplet combustion and suppression evidence. PSI-117 is modeling-only and has no measured table, so it is not a measured observation.',
      citations: [
        citation('PSI-69', 'safety_theme', 'suppression'),
        citation('PSI-68', 'fuel_phases', 'liquid_droplet'),
      ].filter((item) => item !== null),
      matched_psi_ids: ['PSI-69', 'PSI-68'],
      limitations: [
        'Droplet evidence is not a general material-flammability boundary.',
        'PSI-117 is contextual modeling only.',
      ],
      mock_notice: 'H0 cited-template fixture.',
    }
  }

  if (/oxygen|flammab|lunar|o2/.test(normalized)) {
    return {
      status: 'answered',
      scope: 'in_scope',
      answer:
        'The catalog contains high-oxygen gas-phase microgravity context (CFI-G and Flame Design) and solid-fuel evidence (BASS-II and SAFFIRE-I). BASS-II initial oxygen is 0.136–0.222, so it does not cover a 30% O₂ lunar-habitat condition. No completed record directly covers the full scenario.',
      citations: [
        citation('PSI-25', 'oxygen_fraction', '0.136–0.222 fraction'),
        citation('PSI-159', 'oxygen_fraction', '0.3997–0.85 fraction'),
        citation('PSI-10', 'oxygen_fraction', '0.4–0.849977932 fraction'),
      ].filter((item) => item !== null),
      matched_psi_ids: ['PSI-25', 'PSI-159', 'PSI-10'],
      limitations: [
        'Physical proximity is not applicability.',
        'High-oxygen gas-phase evidence is not solid-fuel evidence.',
        'No fitted flammability model is provided.',
      ],
      mock_notice: 'H0 cited-template fixture.',
    }
  }

  return {
    status: 'answered',
    scope: 'in_scope',
    answer:
      'This bounded demo answers questions about the 24-record combustion-science catalog, the four canonical scenarios, measured observations, and NASA context. Try a preset question about oxygen, detection, or droplet suppression.',
    citations: [],
    matched_psi_ids: [],
    limitations: ['The H0 mock adapter has a fixed template set.'],
    mock_notice: 'H0 cited-template fixture.',
  }
}

export function createMockApi(options: MockApiOptions = {}): FireSightApi {
  const latencyMs = options.latencyMs ?? 160

  async function respond<T>(
    build: () => T,
    requestOptions?: RequestOptions,
  ): Promise<T> {
    await wait(latencyMs, requestOptions?.signal)
    return clone(build())
  }

  return {
    getHealth(requestOptions): Promise<HealthResponse> {
      return respond(
        () => ({
          status: 'ok',
          snapshot_loaded: true,
          snapshot_sha256: 'h0-mock-not-canonical',
          record_count: MOCK_RECORDS.length,
          index_ready: false,
          use_llm: false,
          mock: true,
        }),
        requestOptions,
      )
    },

    getCatalog(requestOptions): Promise<CatalogResponse> {
      return respond(buildCatalog, requestOptions)
    },

    getInvestigation(psiId, requestOptions) {
      return respond(() => {
        const detail = MOCK_DETAILS[psiId]
        if (!detail) {
          throw new ApiError(
            404,
            `GET /api/investigations/${psiId}`,
            `Unknown PSI record ${psiId}`,
          )
        }
        return detail
      }, requestOptions)
    },

    getScenarios(requestOptions) {
      return respond(
        () => ({
          scenarios: MOCK_SCENARIOS,
          mock_notice: MOCK_NOTICE,
        }),
        requestOptions,
      )
    },

    rank(request, requestOptions): Promise<RankResponse> {
      return respond(() => {
        const response = buildRankResponse(request.scenario)
        if (response) return response
        return {
          scenario_id: null,
          requested_dimensions: requestedDimensions(request.scenario),
          results: [],
          gap_statement:
            'The H0 mock adapter serves only the four canonical scenario fixtures. Connect the H2 backend for arbitrary scenario inputs.',
          mock_notice: 'H0 mock adapter limitation.',
        }
      }, requestOptions)
    },

    compare(request, requestOptions): Promise<CompareResponse> {
      return respond(
        () => buildCompare(request.psi_ids),
        requestOptions,
      )
    },

    getObservations(requestOptions): Promise<ObservationsResponse> {
      return respond(
        () => ({
          ...MOCK_OBSERVATIONS,
          disclaimer: OBSERVED_DOMAIN_DISCLAIMER,
        }),
        requestOptions,
      )
    },

    getContext(requestOptions): Promise<ContextResponse> {
      return respond(() => MOCK_CONTEXT, requestOptions)
    },

    ask(request, requestOptions): Promise<AskResponse> {
      return respond(() => buildAskAnswer(request.question), requestOptions)
    },
  }
}
