export interface TrendingVideo {
  url: string
  title: string
  thumbnail: string
  uploaderName: string
  uploaderUrl: string
  uploaderAvatar: string | null
  uploadedDate: string
  duration: number
  views: number
  uploaderVerified: boolean
  shortDescription: string
}

export interface SearchVideo {
  url: string
  title: string
  thumbnail: string
  uploaderName: string
  uploaderUrl: string
  uploaderAvatar: string | null
  uploadedDate: string
  duration: number
  views: number
  uploaderVerified: boolean
  shortDescription: string
  type: 'stream'
}

export interface SearchChannel {
  url: string
  name: string
  thumbnail: string
  description: string
  subscribers: number
  verified: boolean
  type: 'channel'
}

export type SearchItem = SearchVideo | SearchChannel

export interface SearchResult {
  items: SearchItem[]
  nextpage: string | null
  suggestion: string | null
  corrected: boolean
}

export interface AudioStream {
  url: string
  format: string
  quality: string
  mimeType: string
  codec: string | null
  bitrate: number
}

export interface VideoStream {
  title: string
  description: string
  uploadDate: string
  uploader: string
  uploaderUrl: string
  uploaderAvatar: string
  thumbnailUrl: string
  hls: string | null
  dash: string | null
  lbryId: string | null
  views: number
  likes: number
  dislikes: number
  duration: number
  uploaderSubscriberCount: number
  uploaderVerified: boolean
  audioStreams: AudioStream[]
  videoStreams: {
    url: string
    format: string
    quality: string
    mimeType: string
    codec: string | null
    fps: number
    videoOnly: boolean
  }[]
  relatedStreams: TrendingVideo[]
  chapters: { title: string; start: number; image: string }[]
}

export interface ChannelVideo {
  url: string
  title: string
  thumbnail: string
  uploaderName: string
  uploaderUrl: string
  uploaderAvatar: string | null
  uploadedDate: string
  duration: number
  views: number
  uploaderVerified: boolean
  shortDescription: string
}

export interface ChannelInfo {
  id: string
  name: string
  avatarUrl: string
  bannerUrl: string | null
  description: string
  subscribers: number
  verified: boolean
  relatedStreams: ChannelVideo[]
  nextpage: string | null
}

export interface Subscription {
  channelId: string
  name: string
  avatarUrl: string
}
