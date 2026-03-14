import { useNavigate } from 'react-router-dom'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { extractVideoId, formatDuration, formatViews } from '../../api/piped'
import type { TrendingVideo } from '../../api/types'

interface Props {
  video: TrendingVideo
  focusKey?: string
}

export default function VideoCard({ video, focusKey }: Props) {
  const navigate = useNavigate()
  const videoId = extractVideoId(video.url)

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => navigate(`/player/${videoId}`),
  })

  return (
    <div
      ref={ref}
      className={`video-card ${focused ? 'focused' : ''}`}
      onClick={() => navigate(`/player/${videoId}`)}
    >
      <div className="video-card-thumb">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' fill='%23333'%3E%3Crect width='100%25' height='100%25'/%3E%3C/svg%3E"
          }}
        />
        <span className="video-card-duration">{formatDuration(video.duration)}</span>
      </div>
      <div className="video-card-info">
        <div className="video-card-title">{video.title}</div>
        <div className="video-card-meta">
          <span>{video.uploaderName}</span>
          <span>{formatViews(video.views)}</span>
        </div>
      </div>
    </div>
  )
}
