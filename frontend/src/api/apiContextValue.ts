import { createContext } from 'react'
import type { ApiClientHandle } from './client'

export const ApiContext = createContext<ApiClientHandle | null>(null)
