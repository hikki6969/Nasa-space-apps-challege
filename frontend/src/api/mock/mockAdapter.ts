import { ApiError, type FireSightApi } from '../client'
import {
  OBSERVED_DOMAIN_DISCLAIMER,
  type AskResponse,
  type CatalogResponse,
  type CompareResponse,
  type ContextResponse,
  type HealthResponse,
  type ObservationsResponse,
  type RankResponse,
  type RequestOptions,
} from '../types'
import { MOCK_CONTEXT } from './context'
import { MOCK_OBSERVATIONS } from './observations'
import { buildRankResponse, requestedDimensions } from './rank'
import { MOCK_DETAILS, MOCK_NOTICE, MOCK_RECORDS } from './records'
import { MOCK_SCENARIOS } from './scenarios'
import {
  buildCatalogFromRecords,
  buildCompareFromRecords,
} from '../derived'

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

function buildCatalog(): CatalogResponse {
  return buildCatalogFromRecords(MOCK_RECORDS, {
    snapshotSha256: 'h0-mock-not-canonical',
    anticipated: 1,
    warnings: [
      'H0 mock adapter: the 24 IDs match the VF-01 ledger, but field values are representative fixtures, not the canonical snapshot.',
      'FM2 is anticipated program context and is outside the 24-record catalog.',
      'PSI-47 is retained as instrument context and is never a ranked candidate.',
    ],
    mockNotice: MOCK_NOTICE,
  })
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
    /rocket|propellant|engine|nozzle|thrust|combustion instability|rp-1|lox|turbopump|combustion chamber/.test(
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
        'The catalog contains high-oxygen gas-phase microgravity context (CFI-G and Flame Design) and solid-fuel evidence (BASS-II and SAFFIRE-I). BASS-II initial oxygen is 0.136â€“0.222, so it does not cover a 30% Oâ‚‚ lunar-habitat condition. No completed record directly covers the full scenario.',
      citations: [
        citation('PSI-25', 'oxygen_fraction', '0.136â€“0.222 fraction'),
        citation('PSI-159', 'oxygen_fraction', '0.3997â€“0.85 fraction'),
        citation('PSI-10', 'oxygen_fraction', '0.4â€“0.849977932 fraction'),
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
        () =>
          buildCompareFromRecords(request.psi_ids, MOCK_RECORDS, {
            mockNotice:
              'Parallel axes include only fields with a value for every selected record.',
          }),
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
