import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import VideoCard from '../cards/VideoCard'
import type { TrendingVideo } from '../../api/types'

interface Props {
  videos: TrendingVideo[]
  focusKey?: string
}

export default function VideoGrid({ videos, focusKey: propFocusKey }: Props) {
  const { ref, focusKey } = useFocusable({ focusKey: propFocusKey })

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="video-grid">
        {videos.map((video, i) => (
          <VideoCard
            key={video.url}
            video={video}
            focusKey={`VIDEO_CARD_${i}`}
          />
        ))}
      </div>
    </FocusContext.Provider>
  )
}
