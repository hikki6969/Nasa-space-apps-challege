import type { ReactNode } from 'react'
import type { ApiClientHandle } from './client'
import { ApiContext } from './apiContextValue'

interface ApiProviderProps {
  handle: ApiClientHandle
  children: ReactNode
}

export function ApiProvider({ handle, children }: ApiProviderProps) {
  return <ApiContext.Provider value={handle}>{children}</ApiContext.Provider>
}
