import type {
  AskRequest,
  AskResponse,
  CatalogResponse,
  CompareRequest,
  CompareResponse,
  ContextResponse,
  HealthResponse,
  InvestigationDetail,
  ObservationsResponse,
  RankRequest,
  RankResponse,
  RequestOptions,
  ScenariosResponse,
} from './types'

/**
 * The single typed surface the UI consumes. The HTTP adapter and the H0 mock
 * adapter implement the same interface, so feature views never import mock
 * data directly.
 */
export type ApiMode = 'mock' | 'http'

export interface ApiClientHandle {
  api: FireSightApi
  mode: ApiMode
  baseUrl: string
}

export interface FireSightApi {
  getHealth(options?: RequestOptions): Promise<HealthResponse>
  getCatalog(options?: RequestOptions): Promise<CatalogResponse>
  getInvestigation(
    psiId: string,
    options?: RequestOptions,
  ): Promise<InvestigationDetail>
  getScenarios(options?: RequestOptions): Promise<ScenariosResponse>
  rank(request: RankRequest, options?: RequestOptions): Promise<RankResponse>
  compare(
    request: CompareRequest,
    options?: RequestOptions,
  ): Promise<CompareResponse>
  getObservations(options?: RequestOptions): Promise<ObservationsResponse>
  getContext(options?: RequestOptions): Promise<ContextResponse>
  ask(request: AskRequest, options?: RequestOptions): Promise<AskResponse>
}

export class ApiError extends Error {
  readonly status: number
  readonly path: string
  readonly detail: string

  constructor(status: number, path: string, detail: string) {
    super(
      status > 0
        ? `API ${status} for ${path}: ${detail}`
        : `Network error for ${path}: ${detail}`,
    )
    this.name = 'ApiError'
    this.status = status
    this.path = path
    this.detail = detail
  }
}

export interface HttpApiOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function createHttpApi(options: HttpApiOptions = {}): FireSightApi {
  const baseUrl = (options.baseUrl ?? '/api').replace(/\/+$/, '')
  const fetchImpl = options.fetchImpl ?? fetch

  async function request<T>(
    path: string,
    init: RequestInit = {},
    requestOptions?: RequestOptions,
  ): Promise<T> {
    let response: Response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...init.headers,
        },
        signal: requestOptions?.signal,
      })
    } catch (error) {
      if (isAbortError(error)) throw error
      throw new ApiError(
        0,
        path,
        error instanceof Error ? error.message : 'Network request failed',
      )
    }

    if (!response.ok) {
      let detail = response.statusText
      try {
        const text = await response.text()
        if (text.trim()) detail = text.trim()
      } catch {
        // Keep the status text if the error body cannot be read.
      }
      throw new ApiError(response.status, path, detail)
    }

    // JSON is an untrusted boundary. The response generic is the contract
    // checked by the H0 schema tests and the backend OpenAPI document.
    return (await response.json()) as T
  }

  function post<T>(
    path: string,
    body: unknown,
    requestOptions?: RequestOptions,
  ): Promise<T> {
    return request<T>(
      path,
      { method: 'POST', body: JSON.stringify(body) },
      requestOptions,
    )
  }

  return {
    getHealth(requestOptions) {
      return request<HealthResponse>('/health', {}, requestOptions)
    },
    getCatalog(requestOptions) {
      return request<CatalogResponse>('/catalog', {}, requestOptions)
    },
    getInvestigation(psiId, requestOptions) {
      return request<InvestigationDetail>(
        `/investigations/${encodeURIComponent(psiId)}`,
        {},
        requestOptions,
      )
    },
    getScenarios(requestOptions) {
      return request<ScenariosResponse>('/scenarios', {}, requestOptions)
    },
    rank(requestBody, requestOptions) {
      return post<RankResponse>('/rank', requestBody, requestOptions)
    },
    compare(requestBody, requestOptions) {
      return post<CompareResponse>('/compare', requestBody, requestOptions)
    },
    getObservations(requestOptions) {
      return request<ObservationsResponse>('/observations', {}, requestOptions)
    },
    getContext(requestOptions) {
      return request<ContextResponse>('/context', {}, requestOptions)
    },
    ask(requestBody, requestOptions) {
      return post<AskResponse>('/ask', requestBody, requestOptions)
    },
  }
}
