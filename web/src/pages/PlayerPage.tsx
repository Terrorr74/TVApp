import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePipedQuery } from '../hooks/usePipedQuery'
import { useSetFocus } from '../hooks/useSetFocus'
import { getStreams } from '../api/piped'
import VideoPlayer from '../components/player/VideoPlayer'
import PlayerControls from '../components/player/PlayerControls'
import PlayerOverlay from '../components/player/PlayerOverlay'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorScreen from '../components/common/ErrorScreen'

export default function PlayerPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const setFocus = useSetFocus()

  const { data, loading, error } = usePipedQuery(
    () => getStreams(videoId!),
    [videoId]
  )

  // Sync playing/time state from video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    const onDurationChange = () => setDuration(video.duration)

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
  }, [data])

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
  if (error) return <ErrorScreen message={error} />
  if (!data) return null

  return (
    <div className="player-page">
      <VideoPlayer hlsUrl={data.hls} videoRef={videoRef} />
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
  )
}
