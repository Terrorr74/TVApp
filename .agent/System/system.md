# System Documentation

## Overview

Ad-free YouTube browsing app for Google TV. A React SPA served through a Kotlin Android WebView shell, fetching content from a self-hosted [Piped](https://github.com/TeamPiped/Piped) instance instead of YouTube directly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + Vite + TypeScript |
| Navigation | Norigin Spatial Navigation (`@noriginmedia/norigin-spatial-navigation`) |
| Video playback | hls.js |
| Backend / API | Self-hosted yt-dlp proxy (Docker, port 8083) — replaced Piped stream backend |
| Android shell | Kotlin + WebView + Leanback (`FragmentActivity`) |
| Data persistence | `localStorage` (subscriptions only) |

---

## Project Structure

```
TVApp/
├── web/                          # React + Vite SPA
│   └── src/
│       ├── api/
│       │   ├── piped.ts          # API client + helper utilities (extractVideoId, formatDuration, etc.)
│       │   ├── googleAuth.ts     # OAuth Device Flow: startDeviceFlow, pollForToken, getValidToken
│       │   ├── youtubeApi.ts     # YouTube Data API v3: getMySubscriptions, subscribeToChannel, getLikedVideos
│       │   └── types.ts          # TypeScript interfaces (TrendingVideo, VideoStream, ChannelInfo, etc.)
│       ├── hooks/
│       │   ├── usePipedQuery.ts  # Generic async data fetcher with cancellation + refetch
│       │   ├── usePlayer.ts      # hls.js lifecycle management; returns { hlsRef, hlsError }
│       │   ├── useWatchProgress.ts # localStorage watch position save/restore per videoId
│       │   ├── useGoogleAuth.ts  # Google sign-in state (isSignedIn, signOut, onSignedIn)
│       │   ├── useSubscriptions.ts # localStorage-backed subscribe/unsubscribe
│       │   └── useSetFocus.ts    # Programmatic spatial nav focus setter
│       ├── navigation/
│       │   └── SpatialNavProvider.tsx  # Initialises norigin spatial nav (once)
│       ├── pages/
│       │   ├── HomePage.tsx      # Trending feed
│       │   ├── SearchPage.tsx    # On-screen keyboard + search results
│       │   ├── PlayerPage.tsx    # Full-screen video player
│       │   ├── ChannelPage.tsx   # Channel info + video list + subscribe toggle
│       │   └── SubscriptionsPage.tsx  # Subscribed channels list
│       ├── components/
│       │   ├── cards/
│       │   │   ├── VideoCard.tsx   # Thumbnail, title, meta, D-pad navigation
│       │   │   └── ChannelCard.tsx # Avatar, name, subscriber count
│       │   ├── grid/
│       │   │   └── VideoGrid.tsx   # Focusable grid wrapper
│       │   ├── keyboard/
│       │   │   └── TVKeyboard.tsx  # D-pad-navigable on-screen keyboard
│       │   ├── player/
│       │   │   ├── VideoPlayer.tsx    # <video> element + hls.js integration
│       │   │   ├── PlayerControls.tsx # Play/pause, seek, back button, progress bar
│       │   │   ├── PlayerOverlay.tsx  # Auto-hides controls after 3 s of inactivity
│       │   │   └── VideoEndOverlay.tsx # End-of-video screen: 10s countdown → next video or back
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx  # Sidebar + content area wrapper
│       │   │   └── Sidebar.tsx    # Left nav: Home / Search / Subscriptions
│       │   └── common/
│       │       ├── LoadingSpinner.tsx
│       │       ├── ErrorScreen.tsx
│       │       └── FocusableButton.tsx
│       ├── styles/
│       │   ├── variables.css     # CSS custom properties (colours, spacing, radius)
│       │   ├── global.css        # Reset + base styles
│       │   └── tv.css            # TV-specific overrides (focus rings, layout scale)
│       ├── App.tsx               # Router + SpatialNavProvider root
│       └── main.tsx              # ReactDOM entry point
├── android/
│   └── app/src/main/
│       ├── kotlin/com/tvapp/
│       │   ├── MainActivity.kt       # WebView host, key event forwarding
│       │   └── TvWebViewClient.kt    # URL interception (blocks external navigations)
│       └── assets/web/               # Built React app (copied by `npm run deploy`)
└── docker/
    ├── docker-compose.yml        # Piped stack + yt-dlp-proxy service
    ├── config/
    │   └── config.properties     # Piped backend config
    └── yt-dlp-proxy/             # Custom stream proxy (replaces broken Piped stream extraction)
        ├── Dockerfile            # python:3.12-slim, installs flask + yt-dlp
        ├── requirements.txt      # flask, yt-dlp
        └── server.py             # Flask app: /trending, /search, /streams/<id>, /channel/<id>
```

---

## Routing

Uses `HashRouter` (required for `file://` asset loading in Android WebView).

| Route | Page | Notes |
|---|---|---|
| `/` | `HomePage` | Trending videos (US region) |
| `/search` | `SearchPage` | On-screen keyboard; debounced 500 ms auto-search |
| `/player/:videoId` | `PlayerPage` | Full-screen; renders outside `AppLayout` (no sidebar) |
| `/channel/:channelId` | `ChannelPage` | Channel header + video grid + subscribe button |
| `/subscriptions` | `SubscriptionsPage` | Local subs merged with YouTube subs when signed in |
| `/signin` | `SignInPage` | Google OAuth Device Flow; shows user code + URL |

---

## API Integration

**Client:** `web/src/api/piped.ts`

Base URL is configured via environment variable:
```
VITE_PIPED_API_URL=http://localhost:8083   # default: http://localhost:8081
```
`web/.env.local` is set to `http://localhost:8083` (yt-dlp proxy).

| Function | Endpoint | Returns |
|---|---|---|
| `getTrending(region)` | `GET /trending?region=US` | `TrendingVideo[]` |
| `search(query, filter)` | `GET /search?q=...&filter=all` | `SearchResult` |
| `getStreams(videoId)` | `GET /streams/{videoId}` | `VideoStream` |
| `getChannel(channelId)` | `GET /channel/{channelId}` | `ChannelInfo` |

---

## Self-Hosted Backend (Docker)

Located in `docker/`. Started with `cd docker && docker compose up -d`.

| Service | Port | Purpose |
|---|---|---|
| **yt-dlp-proxy** | **8083** | **Primary API — all 4 endpoints. Built from `docker/yt-dlp-proxy/`** |
| Piped Frontend | 8090 | Piped's own web UI (not used by this app) |
| Piped Backend API | 8081 | Legacy — stream playback broken (PoToken issue), kept for reference |
| Piped Proxy (HLS) | 8082 | Proxies HLS stream segments |
| bg-helper | internal | Generates YouTube PoTokens |
| Postgres | internal | Piped DB |

**yt-dlp proxy** is the active backend. It wraps `yt-dlp --dump-json` for stream extraction (always up-to-date with YouTube) and exposes the same 4-endpoint API shape as Piped so the React app needs no changes. All responses include `Access-Control-Allow-Origin: *` for the Android WebView `file://` origin.

---

## Spatial Navigation

All interactive elements use `useFocusable()` from norigin spatial navigation. The focus tree is:

```
SpatialNavProvider (root)
└── SIDEBAR
│   ├── SIDEBAR_HOME
│   ├── SIDEBAR_SEARCH
│   └── SIDEBAR_SUBS
└── Page-level context (e.g. HOME_GRID, CHANNEL_PAGE, TV_KEYBOARD, PLAYER_CONTROLS)
    └── Individual cards / keys / buttons
```

Each page sets initial focus programmatically via `useSetFocus` in a `useEffect`.

---

## TV Remote Key Mapping

Handled in `PlayerPage.tsx` for media controls. D-pad navigation is handled globally by norigin spatial navigation.

| TV Remote Key | DOM Key | Action |
|---|---|---|
| D-pad | `ArrowUp/Down/Left/Right` | Spatial navigation |
| OK / Select | `Enter` | Activate focused element |
| Back | `Backspace` / `XF86Back` | Navigate back (`navigate(-1)`) |
| Play/Pause | `MediaPlayPause` / `Space` | Toggle playback |
| Fast Forward | `MediaFastForward` | Seek +30 s |
| Rewind | `MediaRewind` | Seek −30 s |
| Arrow Right (in player) | `ArrowRight` | Seek +10 s |
| Arrow Left (in player) | `ArrowLeft` | Seek −10 s |

---

## Data Persistence

| Key | Value | Purpose |
|---|---|---|
| `tvapp_subscriptions` | `Subscription[]` JSON | Local channel subscriptions |
| `tvapp_progress_${videoId}` | Number (seconds) | Watch position per video |
| `tvapp_google_tokens` | `GoogleTokens` JSON | OAuth access + refresh tokens + expiry |

The WebView has `domStorageEnabled = true`. No server-side user state exists.

---

## Android WebView Configuration

`MainActivity.kt` configures the WebView with:
- `javaScriptEnabled = true`
- `domStorageEnabled = true` (localStorage for subscriptions)
- `mediaPlaybackRequiresUserGesture = false` (HLS autoplay)
- `allowFileAccess = true` (bundled assets)
- `MIXED_CONTENT_ALWAYS_ALLOW` (file:// origin fetching HTTPS APIs)
- Hardware acceleration via `LAYER_TYPE_HARDWARE`

`TvWebViewClient.kt` blocks all top-level external navigations (only `file://` is allowed through). XHR/fetch requests from the React app are not intercepted by `shouldOverrideUrlLoading`.

---

## Build & Deploy

```bash
# Develop (browser)
cd web && npm run dev          # http://localhost:5173

# Build + copy to Android assets
cd web && npm run deploy       # runs: tsc && vite build && rsync dist/ → android assets

# Build APK
cd android && ./gradlew assembleDebug

# Install to TV
adb connect <TV_IP>:5555
adb install app/build/outputs/apk/debug/app-debug.apk
```
