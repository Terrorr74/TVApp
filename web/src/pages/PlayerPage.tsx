import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePipedQuery } from '../hooks/usePipedQuery'
import { useSetFocus } from '../hooks/useSetFocus'
import { useWatchProgress } from '../hooks/useWatchProgress'
import { getStreams, formatDuration } from '../api/piped'
import VideoPlayer from '../components/player/VideoPlayer'
import PlayerControls from '../components/player/PlayerControls'
import PlayerOverlay from '../components/player/PlayerOverlay'
import VideoGrid from '../components/grid/VideoGrid'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorScreen from '../components/common/ErrorScreen'

export default function PlayerPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [resumeToast, setResumeToast] = useState<string | null>(null)
  const lastSaveRef = useRef(0)
  const setFocus = useSetFocus()
  const { savedPosition, savePosition } = useWatchProgress(videoId!)

  const { data, loading, error, refetch } = usePipedQuery(
    () => getStreams(videoId!),
    [videoId]
  )

  // Sync playing/time state from video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      const now = Date.now()
      if (now - lastSaveRef.current > 5000) {
        lastSaveRef.current = now
        savePosition(video.currentTime, video.duration)
      }
    }
    const onDurationChange = () => {
      setDuration(video.duration)
      if (savedPosition > 5) {
        video.currentTime = savedPosition
        setResumeToast(`Resuming from ${formatDuration(Math.floor(savedPosition))}`)
        setTimeout(() => setResumeToast(null), 2000)
      }
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
    }
  }, [data, savedPosition, savePosition])

  // Remote/keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return

      switch (e.key) {
        case 'MediaPlayPause':
        case ' ':
          e.preventDefault()
          video.paused ? video.play() : video.pause()
          break
        case 'ArrowRight':
          e.preventDefault()
          video.currentTime = Math.min(video.currentTime + 10, video.duration)
          break
        case 'ArrowLeft':
          e.preventDefault()
          video.currentTime = Math.max(video.currentTime - 10, 0)
          break
        case 'Backspace':
        case 'XF86Back':
          e.preventDefault()
          navigate(-1)
          break
        case 'MediaFastForward':
          video.currentTime = Math.min(video.currentTime + 30, video.duration)
          break
        case 'MediaRewind':
          video.currentTime = Math.max(video.currentTime - 30, 0)
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate])

  useEffect(() => {
    setFocus('PLAYER_CONTROLS')
  }, [setFocus])

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    video.paused ? video.play() : video.pause()
  }

  const handleSeek = (delta: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.currentTime + delta, video.duration))
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorScreen message={error} onRetry={refetch} />
  if (!data) return null
  if (!data.hls) return <ErrorScreen message="No stream available for this video." onRetry={refetch} />
  if (playerError) return <ErrorScreen message={playerError} onRetry={() => { setPlayerError(null); refetch() }} />

  return (
    <div className="player-page">
      <div className="player-video-area">
        <VideoPlayer hlsUrl={data.hls} videoRef={videoRef} onError={setPlayerError} />
        {resumeToast && <div className="resume-toast">{resumeToast}</div>}
        <PlayerOverlay>
          <PlayerControls
            playing={playing}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            title={data.title}
          />
        </PlayerOverlay>
      </div>
      {data.relatedStreams.length > 0 && (
        <div className="related-videos">
          <h2 className="related-title">Up Next</h2>
          <VideoGrid videos={data.relatedStreams} focusKey="RELATED_VIDEOS" />
        </div>
      )}
    </div>
  )
}
