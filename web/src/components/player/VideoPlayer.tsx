import { useEffect } from 'react'
import { usePlayer } from '../../hooks/usePlayer'

interface Props {
  hlsUrl: string | null
  videoRef: React.RefObject<HTMLVideoElement>
  onError?: (msg: string) => void
}

export default function VideoPlayer({ hlsUrl, videoRef, onError }: Props) {
  const { hlsError } = usePlayer(videoRef, hlsUrl)

  useEffect(() => {
    if (hlsError) onError?.(hlsError)
  }, [hlsError, onError])

  return (
    <video
      ref={videoRef}
      className="video-element"
      autoPlay
      playsInline
    />
  )
}
