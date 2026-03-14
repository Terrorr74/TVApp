import { usePlayer } from '../../hooks/usePlayer'

interface Props {
  hlsUrl: string | null
  videoRef: React.RefObject<HTMLVideoElement>
}

export default function VideoPlayer({ hlsUrl, videoRef }: Props) {
  usePlayer(videoRef, hlsUrl)

  return (
    <video
      ref={videoRef}
      className="video-element"
      autoPlay
      playsInline
    />
  )
}
