import { useState, useCallback } from 'react'
import type { Subscription } from '../api/types'

const STORAGE_KEY = 'tvapp_subscriptions'

function loadSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Subscription[]) : []
  } catch {
    return []
  }
}

function saveSubscriptions(subs: Subscription[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs))
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(loadSubscriptions)

  const subscribe = useCallback((sub: Subscription) => {
    setSubscriptions((prev) => {
      if (prev.some((s) => s.channelId === sub.channelId)) return prev
      const next = [...prev, sub]
      saveSubscriptions(next)
      return next
    })
  }, [])

  const unsubscribe = useCallback((channelId: string) => {
    setSubscriptions((prev) => {
      const next = prev.filter((s) => s.channelId !== channelId)
      saveSubscriptions(next)
      return next
    })
  }, [])

  const isSubscribed = useCallback(
    (channelId: string) => subscriptions.some((s) => s.channelId === channelId),
    [subscriptions]
  )

  return { subscriptions, subscribe, unsubscribe, isSubscribed }
}
