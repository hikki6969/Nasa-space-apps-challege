import {
  createHttpApi,
  type ApiClientHandle,
  type ApiMode,
} from './client'
import { createMockApi } from './mock/mockAdapter'

export interface CreateApiClientOptions {
  mode?: ApiMode
  baseUrl?: string
  latencyMs?: number
}

function envMode(): ApiMode {
  return import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'
}

function envLatency(): number {
  const parsed = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? '160')
  return Number.isFinite(parsed) ? parsed : 160
}

export function createApiClient(
  options: CreateApiClientOptions = {},
): ApiClientHandle {
  const mode = options.mode ?? envMode()
  const baseUrl = options.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? '/api'

  if (mode === 'http') {
    return { api: createHttpApi({ baseUrl }), mode, baseUrl }
  }

  return {
    api: createMockApi({ latencyMs: options.latencyMs ?? envLatency() }),
    mode,
    baseUrl,
  }
}

export { ApiError, createHttpApi } from './client'
export type {
  ApiClientHandle,
  ApiMode,
  FireSightApi,
  HttpApiOptions,
} from './client'
export { ApiProvider } from './ApiContext'
export { useApi, useApiHandle } from './useApi'
export * from './types'
