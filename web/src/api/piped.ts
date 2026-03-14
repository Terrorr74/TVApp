import type { TrendingVideo, SearchResult, VideoStream, ChannelInfo } from './types'

const BASE_URL = import.meta.env.VITE_PIPED_API_URL ?? 'http://localhost:8081'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Piped API error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export function getTrending(region = 'US'): Promise<TrendingVideo[]> {
  return apiFetch<TrendingVideo[]>(`/trending?region=${region}`)
}

export function search(query: string, filter = 'all'): Promise<SearchResult> {
  return apiFetch<SearchResult>(`/search?q=${encodeURIComponent(query)}&filter=${filter}`)
}

export function getStreams(videoId: string): Promise<VideoStream> {
  return apiFetch<VideoStream>(`/streams/${videoId}`)
}

export function getChannel(channelId: string): Promise<ChannelInfo> {
  return apiFetch<ChannelInfo>(`/channel/${channelId}`)
}

export function searchNextPage(query: string, nextpage: string): Promise<SearchResult> {
  return apiFetch<SearchResult>(`/search?q=${encodeURIComponent(query)}&filter=all&nextpage=${encodeURIComponent(nextpage)}`)
}

export function getChannelNextPage(channelId: string, nextpage: string): Promise<ChannelInfo> {
  return apiFetch<ChannelInfo>(`/nextpage/channel/${channelId}?nextpage=${encodeURIComponent(nextpage)}`)
}

/** Parses a Piped watch URL like /watch?v=ID or https://...?v=ID into the video ID */
export function extractVideoId(pipedUrl: string): string {
  try {
    const url = new URL(pipedUrl, 'https://example.com')
    const v = url.searchParams.get('v')
    if (v) return v
  } catch {
    // fall through
  }
  // Fallback: grab after ?v=
  const match = pipedUrl.match(/[?&]v=([^&]+)/)
  return match ? match[1] : pipedUrl
}

/** Parses a Piped channel URL like /channel/ID into the channel ID */
export function extractChannelId(pipedUrl: string): string {
  const match = pipedUrl.match(/\/channel\/([^/?]+)/)
  return match ? match[1] : pipedUrl
}

/** Format seconds into HH:MM:SS or MM:SS */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Parses a relative date string like "3 days ago" into seconds-ago (lower = more recent) */
export function parseRelativeDate(str: string): number {
  const m = str.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/)
  if (!m) return Infinity
  const n = parseInt(m[1])
  const units: Record<string, number> = {
    second: 1, minute: 60, hour: 3600, day: 86400,
    week: 604800, month: 2592000, year: 31536000,
  }
  return n * (units[m[2]] ?? Infinity)
}

/** Format large view counts */
export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K views`
  return `${views} views`
}
