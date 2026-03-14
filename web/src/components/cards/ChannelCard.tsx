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
      <img className="channel-card-avatar" src={avatarUrl} alt={name} />
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
