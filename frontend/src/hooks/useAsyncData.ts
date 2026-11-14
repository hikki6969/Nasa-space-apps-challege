import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from 'react'

export type AsyncStatus = 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | null
  error: Error | null
}

export interface AsyncResult<T> extends AsyncState<T> {
  reload: () => void
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * Minimal typed request lifecycle. The loader receives an AbortSignal; deps
 * identify the request. The mock and HTTP adapters share this path.
 */
export function useAsyncData<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'loading',
    data: null,
    error: null,
  })
  const [revision, setRevision] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setState((previous) => ({
      status: 'loading',
      data: previous.data,
      error: null,
    }))

    loaderRef
      .current(controller.signal)
      .then((data) => {
        if (!active) return
        setState({ status: 'success', data, error: null })
      })
      .catch((error: unknown) => {
        if (!active || isAbortError(error)) return
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      })

    return () => {
      active = false
      controller.abort()
    }
    // The caller supplies the request identity through `deps`.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, revision])

  const reload = useCallback(() => {
    setRevision((value) => value + 1)
  }, [])

  return { ...state, reload }
}
