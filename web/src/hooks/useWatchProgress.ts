import { useMemo, useCallback } from 'react'

const KEY = (id: string) => `tvapp_progress_${id}`

export function useWatchProgress(videoId: string) {
  const savedPosition = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY(videoId)) ?? '0')
    } catch {
      return 0
    }
  }, [videoId])

  const savePosition = useCallback((time: number, duration: number) => {
    if (time > 5 && time < duration - 10) {
      localStorage.setItem(KEY(videoId), String(time))
    } else {
      localStorage.removeItem(KEY(videoId))
    }
  }, [videoId])

  return { savedPosition, savePosition }
}
