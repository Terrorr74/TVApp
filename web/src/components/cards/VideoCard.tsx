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
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
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
