import { useState, useEffect, useRef } from 'react'
import { useSetFocus } from '../hooks/useSetFocus'
import { usePipedQuery } from '../hooks/usePipedQuery'
import { search } from '../api/piped'
import TVKeyboard from '../components/keyboard/TVKeyboard'
import VideoGrid from '../components/grid/VideoGrid'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { TrendingVideo, SearchItem } from '../api/types'

function isStream(item: SearchItem): item is SearchItem & TrendingVideo {
  return item.type === 'stream'
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setFocus = useSetFocus()

  useEffect(() => {
    setFocus('TV_KEYBOARD')
  }, [setFocus])

  const handleKey = (key: string) => {
    setQuery((prev) => {
      let next: string
      if (key === 'BACKSPACE') {
        next = prev.slice(0, -1)
      } else if (key === 'SPACE') {
        next = prev + ' '
      } else if (key === 'SEARCH') {
        setDebouncedQuery(prev)
        return prev
      } else {
        next = prev + key
      }

      // Debounce auto-search
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => setDebouncedQuery(next), 500)

      return next
    })
  }

  const { data, loading } = usePipedQuery(
    () => search(debouncedQuery),
    [debouncedQuery]
  )

  const videoResults: TrendingVideo[] = debouncedQuery && data
    ? (data.items.filter(isStream) as unknown as TrendingVideo[])
    : []

  return (
    <div className="page search-page">
      <div className="search-query-display">
        {query || <span className="search-placeholder">Start typing...</span>}
        <span className="search-cursor">|</span>
      </div>
      <TVKeyboard onKeyPress={handleKey} focusKey="TV_KEYBOARD" />
      {loading && debouncedQuery && <LoadingSpinner />}
      {videoResults.length > 0 && (
        <VideoGrid videos={videoResults} focusKey="SEARCH_RESULTS" />
      )}
    </div>
  )
}
