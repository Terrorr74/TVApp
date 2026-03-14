import { useEffect, useState } from 'react'
import { useSetFocus } from '../hooks/useSetFocus'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { getChannel, parseRelativeDate } from '../api/piped'
import { getMySubscriptions } from '../api/youtubeApi'
import VideoGrid from '../components/grid/VideoGrid'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { TrendingVideo, Subscription } from '../api/types'

async function fetchBatch(channelIds: string[]): Promise<TrendingVideo[]> {
  const results = await Promise.allSettled(channelIds.map((id) => getChannel(id)))
  const videos: TrendingVideo[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      videos.push(...(result.value.relatedStreams as unknown as TrendingVideo[]))
    }
  }
  return videos
}

function sortByDate(videos: TrendingVideo[]): TrendingVideo[] {
  return [...videos].sort((a, b) =>
    parseRelativeDate(a.uploadedDate) - parseRelativeDate(b.uploadedDate)
  )
}

export default function SubscriptionsPage() {
  const { subscriptions: localSubs } = useSubscriptions()
  const { isSignedIn } = useGoogleAuth()
  const setFocus = useSetFocus()
  const [videos, setVideos] = useState<TrendingVideo[]>([])
  const [loading, setLoading] = useState(false)

  // Merge local subs with YouTube subs (deduped by channelId) when signed in
  const [mergedSubs, setMergedSubs] = useState<Subscription[]>(localSubs)
  useEffect(() => {
    if (!isSignedIn) { setMergedSubs(localSubs); return }
    getMySubscriptions()
      .then((ytSubs) => {
        const seen = new Set(localSubs.map((s) => s.channelId))
        const combined = [...localSubs, ...ytSubs.filter((s) => !seen.has(s.channelId))]
        setMergedSubs(combined)
      })
      .catch(() => setMergedSubs(localSubs))
  }, [isSignedIn, localSubs])

  const subscriptions = mergedSubs

  useEffect(() => {
    if (subscriptions.length === 0) return

    setLoading(true)
    const channelIds = subscriptions.map((s) => s.channelId)
    const batches: string[][] = []
    for (let i = 0; i < channelIds.length; i += 4) {
      batches.push(channelIds.slice(i, i + 4))
    }

    let cancelled = false
    ;(async () => {
      try {
        const allVideos: TrendingVideo[] = []
        for (const batch of batches) {
          if (cancelled) return
          const batchVideos = await fetchBatch(batch)
          allVideos.push(...batchVideos)
        }
        if (!cancelled) setVideos(sortByDate(allVideos))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [subscriptions])

  useEffect(() => {
    setFocus('SUBS_GRID')
  }, [setFocus])

  if (subscriptions.length === 0) {
    return (
      <div className="page subscriptions-page">
        <h1 className="page-title">Subscriptions</h1>
        <div className="empty-state">
          <div className="empty-state-icon">📺</div>
          <div className="empty-state-text">No subscriptions yet. Visit a channel to subscribe.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page subscriptions-page">
      <h1 className="page-title">Subscriptions</h1>
      {loading ? <LoadingSpinner /> : <VideoGrid videos={videos} focusKey="SUBS_GRID" />}
    </div>
  )
}
