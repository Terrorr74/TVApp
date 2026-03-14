import { useState, useEffect, useRef } from 'react'
import { useSetFocus } from '../hooks/useSetFocus'
import { search, searchNextPage } from '../api/piped'
import TVKeyboard from '../components/keyboard/TVKeyboard'
import VideoGrid from '../components/grid/VideoGrid'
import LoadingSpinner from '../components/common/LoadingSpinner'
import FocusableButton from '../components/common/FocusableButton'
import type { TrendingVideo, SearchItem } from '../api/types'

function isStream(item: SearchItem): item is SearchItem & TrendingVideo {
  return item.type === 'stream'
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setFocus = useSetFocus()

  const [items, setItems] = useState<TrendingVideo[]>([])
  const [nextpageToken, setNextpageToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFocus('TV_KEYBOARD')
  }, [setFocus])

  useEffect(() => {
    setItems([])
    setNextpageToken(null)
  }, [debouncedQuery])

  useEffect(() => {
    if (!debouncedQuery) return
    setLoading(true)
    search(debouncedQuery)
      .then((result) => {
        setItems(result.items.filter(isStream) as unknown as TrendingVideo[])
        setNextpageToken(result.nextpage ?? null)
      })
      .finally(() => setLoading(false))
  }, [debouncedQuery])

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

  const handleLoadMore = () => {
    if (!nextpageToken) return
    searchNextPage(debouncedQuery, nextpageToken).then((result) => {
      setItems((prev) => [...prev, ...(result.items.filter(isStream) as unknown as TrendingVideo[])])
      setNextpageToken(result.nextpage ?? null)
    })
  }

  return (
    <div className="page search-page">
      <div className="search-query-display">
        {query || <span className="search-placeholder">Start typing...</span>}
        <span className="search-cursor">|</span>
      </div>
      <TVKeyboard onKeyPress={handleKey} focusKey="TV_KEYBOARD" />
      {loading && debouncedQuery && <LoadingSpinner />}
      {!loading && debouncedQuery && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">No results for "{debouncedQuery}"</div>
        </div>
      )}
      {items.length > 0 && (
        <VideoGrid videos={items} focusKey="SEARCH_RESULTS" />
      )}
      {nextpageToken && (
        <FocusableButton focusKey="SEARCH_LOAD_MORE" onSelect={handleLoadMore}>
          Load more
        </FocusableButton>
      )}
    </div>
  )
}
