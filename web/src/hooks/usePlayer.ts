import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

export function usePlayer(videoRef: React.RefObject<HTMLVideoElement>, hlsUrl: string | null) {
  const hlsRef = useRef<Hls | null>(null)
  const [hlsError, setHlsError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !hlsUrl) return

    setHlsError(null)

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const isHls = hlsUrl.includes('.m3u8') || hlsUrl.includes('m3u8')

    if (isHls && Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked — user will press play
        })
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setHlsError(`Stream error: ${data.type}`)
      })
    } else {
      // Direct stream (mp4) or Safari native HLS
      video.src = hlsUrl
      video.play().catch(() => {})
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [hlsUrl, videoRef])

  return { hlsRef, hlsError }
}
