import { useEffect, useState } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { TrendingVideo } from '../../api/types'

const COUNTDOWN_SECONDS = 10

interface Props {
  nextVideo: TrendingVideo | null
  onNextVideo: () => void
  onBackToMenu: () => void
}

function EndButton({
  label,
  focusKey,
  onSelect,
  className = '',
}: {
  label: string
  focusKey: string
  onSelect: () => void
  className?: string
}) {
  const { ref, focused } = useFocusable({ focusKey, onEnterPress: onSelect })
  return (
    <button
      ref={ref}
      className={`end-btn ${focused ? 'focused' : ''} ${className}`}
      onClick={onSelect}
    >
      {label}
    </button>
  )
}

export default function VideoEndOverlay({ nextVideo, onNextVideo, onBackToMenu }: Props) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const { ref, focusKey } = useFocusable({ focusKey: 'VIDEO_END_OVERLAY' })

  // Auto-advance countdown — only when there is a next video
  useEffect(() => {
    if (!nextVideo) return
    if (countdown <= 0) { onNextVideo(); return }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, nextVideo, onNextVideo])

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="video-end-overlay">
        <div className="video-end-content">
          <h2 className="video-end-title">Video ended</h2>

          {nextVideo ? (
            <>
              <p className="video-end-hint">
                Next video in <span className="video-end-countdown">{countdown}s</span>
              </p>
              <div className="video-end-next-thumb">
                <img src={nextVideo.thumbnail} alt={nextVideo.title} />
                <span className="video-end-next-title">{nextVideo.title}</span>
              </div>
              <div className="video-end-buttons">
                <EndButton
                  label={`▶ Play Now (${countdown}s)`}
                  focusKey="END_NEXT"
                  onSelect={onNextVideo}
                  className="end-btn--primary"
                />
                <EndButton
                  label="← Back to Menu"
                  focusKey="END_BACK"
                  onSelect={onBackToMenu}
                />
              </div>
            </>
          ) : (
            <div className="video-end-buttons">
              <EndButton
                label="← Back to Menu"
                focusKey="END_BACK"
                onSelect={onBackToMenu}
                className="end-btn--primary"
              />
            </div>
          )}
        </div>
      </div>
    </FocusContext.Provider>
  )
}
