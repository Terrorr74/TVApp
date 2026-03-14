import { getValidToken } from './googleAuth'
import type { Subscription, TrendingVideo } from './types'

const BASE = 'https://www.googleapis.com/youtube/v3'

async function ytFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

interface YTSubscriptionItem {
  id: string
  snippet: {
    resourceId: { channelId: string }
    title: string
    thumbnails: { default?: { url: string } }
  }
}

interface YTSubscriptionList {
  items: YTSubscriptionItem[]
  nextPageToken?: string
}

/** Fetch all of the signed-in user's YouTube subscriptions. */
export async function getMySubscriptions(): Promise<Subscription[]> {
  const results: Subscription[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      mine: 'true',
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    })
    const page = await ytFetch<YTSubscriptionList>(`/subscriptions?${params}`)
    for (const item of page.items ?? []) {
      results.push({
        channelId: item.snippet.resourceId.channelId,
        name: item.snippet.title,
        avatarUrl: item.snippet.thumbnails.default?.url ?? '',
      })
    }
    pageToken = page.nextPageToken
  } while (pageToken)

  return results
}

/**
 * Subscribe to a channel on YouTube.
 * Returns the new subscription ID (needed to unsubscribe later).
 */
export async function subscribeToChannel(channelId: string): Promise<string> {
  const res = await ytFetch<YTSubscriptionItem>(
    '/subscriptions?part=snippet',
    {
      method: 'POST',
      body: JSON.stringify({
        snippet: { resourceId: { kind: 'youtube#channel', channelId } },
      }),
    },
  )
  return res.id
}

/** Unsubscribe using the subscription resource ID (not the channel ID). */
export async function unsubscribeFromChannel(subscriptionId: string): Promise<void> {
  await ytFetch<void>(`/subscriptions?id=${encodeURIComponent(subscriptionId)}`, {
    method: 'DELETE',
  })
}

/**
 * Look up the subscription resource ID for a given channel ID.
 * Returns null if the user is not subscribed to that channel.
 */
export async function getSubscriptionId(channelId: string): Promise<string | null> {
  const params = new URLSearchParams({
    part: 'snippet',
    forChannelId: channelId,
    mine: 'true',
  })
  const res = await ytFetch<YTSubscriptionList>(`/subscriptions?${params}`)
  return res.items?.[0]?.id ?? null
}

// ── Liked videos ──────────────────────────────────────────────────────────────

interface YTVideoItem {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: { medium?: { url: string }; default?: { url: string } }
    channelTitle: string
    channelId: string
    publishedAt: string
  }
  contentDetails: { duration: string }
  statistics: { viewCount: string }
}

interface YTVideoList {
  items: YTVideoItem[]
  nextPageToken?: string
}

function iso8601ToSeconds(duration: string): number {
  const m = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0')
}

export async function getLikedVideos(): Promise<TrendingVideo[]> {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    myRating: 'like',
    maxResults: '50',
  })
  const page = await ytFetch<YTVideoList>(`/videos?${params}`)
  return (page.items ?? []).map((item) => ({
    url: `/watch?v=${item.id}`,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
    uploaderName: item.snippet.channelTitle,
    uploaderUrl: `/channel/${item.snippet.channelId}`,
    uploaderAvatar: null,
    uploadedDate: item.snippet.publishedAt,
    duration: iso8601ToSeconds(item.contentDetails.duration),
    views: parseInt(item.statistics.viewCount ?? '0'),
    uploaderVerified: false,
    shortDescription: item.snippet.description.slice(0, 200),
  }))
}
