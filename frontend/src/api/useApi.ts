import { useContext } from 'react'
import type { ApiClientHandle, FireSightApi } from './client'
import { ApiContext } from './apiContextValue'

export function useApiHandle(): ApiClientHandle {
  const handle = useContext(ApiContext)
  if (!handle) {
    throw new Error('useApiHandle must be used inside <ApiProvider>')
  }
  return handle
}

export function useApi(): FireSightApi {
  return useApiHandle().api
}
