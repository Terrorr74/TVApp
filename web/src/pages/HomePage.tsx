import { useEffect } from 'react'
import { usePipedQuery } from '../hooks/usePipedQuery'
import { useSetFocus } from '../hooks/useSetFocus'
import { getTrending } from '../api/piped'
import VideoGrid from '../components/grid/VideoGrid'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorScreen from '../components/common/ErrorScreen'

export default function HomePage() {
  const { data, loading, error } = usePipedQuery(() => getTrending('US'), [])
  const setFocus = useSetFocus()

  useEffect(() => {
    setFocus('HOME_GRID')
  }, [setFocus])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorScreen message={error} />
  if (!data) return null

  return (
    <div className="page home-page">
      <h1 className="page-title">Trending</h1>
      <VideoGrid videos={data} focusKey="HOME_GRID" />
    </div>
  )
}
