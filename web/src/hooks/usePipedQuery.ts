import { useState, useEffect, useRef, useCallback } from 'react'

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePipedQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): QueryState<T> {
  const [state, setState] = useState<Omit<QueryState<T>, 'refetch'>>({
    data: null,
    loading: true,
    error: null,
  })
  const [retryCount, setRetryCount] = useState(0)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })

    fetcherRef.current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setState({ data: null, loading: false, error: message })
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, retryCount])

  const refetch = useCallback(() => setRetryCount((c) => c + 1), [])

  return { ...state, refetch }
}
