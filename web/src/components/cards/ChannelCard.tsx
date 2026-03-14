import { useNavigate } from 'react-router-dom'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { extractChannelId } from '../../api/piped'

interface Props {
  name: string
  avatarUrl: string
  channelUrl: string
  subscribers?: number
  focusKey?: string
}

export default function ChannelCard({ name, avatarUrl, channelUrl, subscribers, focusKey }: Props) {
  const navigate = useNavigate()
  const channelId = extractChannelId(channelUrl)

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => navigate(`/channel/${channelId}`),
  })

  return (
    <div
      ref={ref}
      className={`channel-card ${focused ? 'focused' : ''}`}
      onClick={() => navigate(`/channel/${channelId}`)}
    >
      <img
        className="channel-card-avatar"
        src={avatarUrl}
        alt={name}
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' fill='%23333'%3E%3Crect width='100%25' height='100%25'/%3E%3C/svg%3E"
        }}
      />
      <div className="channel-card-info">
        <div className="channel-card-name">{name}</div>
        {subscribers != null && (
          <div className="channel-card-subs">
            {subscribers >= 1_000_000
              ? `${(subscribers / 1_000_000).toFixed(1)}M subscribers`
              : `${(subscribers / 1_000).toFixed(0)}K subscribers`}
          </div>
        )}
      </div>
    </div>
  )
}
