import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { usePipedQuery } from '../hooks/usePipedQuery'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useSetFocus } from '../hooks/useSetFocus'
import { getChannel } from '../api/piped'
import VideoGrid from '../components/grid/VideoGrid'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorScreen from '../components/common/ErrorScreen'
import type { TrendingVideo } from '../api/types'

function SubscribeButton({
  subscribed,
  onToggle,
}: {
  subscribed: boolean
  onToggle: () => void
}) {
  const { ref, focused } = useFocusable({
    focusKey: 'SUBSCRIBE_BTN',
    onEnterPress: onToggle,
  })

  return (
    <button
      ref={ref}
      className={`subscribe-btn ${subscribed ? 'subscribe-btn--subscribed' : ''} ${focused ? 'focused' : ''}`}
      onClick={onToggle}
    >
      {subscribed ? 'Unsubscribe' : 'Subscribe'}
    </button>
  )
}

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const { subscribe, unsubscribe, isSubscribed } = useSubscriptions()
  const setFocus = useSetFocus()
  const { ref, focusKey } = useFocusable({ focusKey: 'CHANNEL_PAGE' })

  const { data, loading, error } = usePipedQuery(
    () => getChannel(channelId!),
    [channelId]
  )

  useEffect(() => {
    setFocus('SUBSCRIBE_BTN')
  }, [setFocus])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorScreen message={error} />
  if (!data) return null

  const subscribed = isSubscribed(channelId!)

  const handleToggle = () => {
    if (subscribed) {
      unsubscribe(channelId!)
    } else {
      subscribe({ channelId: channelId!, name: data.name, avatarUrl: data.avatarUrl })
    }
  }

  // Channel videos share the same shape as TrendingVideo for our VideoGrid
  const videos = data.relatedStreams as unknown as TrendingVideo[]

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="page channel-page">
        <div className="channel-header">
          <img className="channel-avatar" src={data.avatarUrl} alt={data.name} />
          <div className="channel-meta">
            <h1 className="channel-name">{data.name}</h1>
            <div className="channel-subs">
              {data.subscribers >= 1_000_000
                ? `${(data.subscribers / 1_000_000).toFixed(1)}M subscribers`
                : `${(data.subscribers / 1_000).toFixed(0)}K subscribers`}
            </div>
            <SubscribeButton subscribed={subscribed} onToggle={handleToggle} />
          </div>
        </div>
        {videos.length > 0 && (
          <VideoGrid videos={videos} focusKey="CHANNEL_VIDEOS" />
        )}
      </div>
    </FocusContext.Provider>
  )
}
