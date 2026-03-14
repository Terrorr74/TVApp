# Task: TVApp Improvement Plan

## Status
✅ Phase 1 complete (2026-03-14) — ✅ Phase 2 complete (2026-03-14) — ✅ Phase 3 complete (2026-03-14)

## Goal

Restore core playback, fix everyday UX bugs, and add high-value TV features across three phases.

---

## Phase 1 — Restore Playback

| # | Task | Status | Files |
|---|---|---|---|
| 1.1 | Build yt-dlp proxy to replace Piped stream backend | ✅ Done | `docker/yt-dlp-proxy/`, `docker/docker-compose.yml`, `web/.env.local` |
| 1.2 | Fix dead API fallback URL | ✅ Done | `web/src/api/piped.ts` |
| 1.3 | Guard against null HLS URL in PlayerPage | ✅ Done | `web/src/pages/PlayerPage.tsx` |
| 1.4 | Add HLS error handling in `usePlayer` + `VideoPlayer` | ✅ Done | `web/src/hooks/usePlayer.ts`, `web/src/components/player/VideoPlayer.tsx`, `web/src/pages/PlayerPage.tsx` |
| 1.5 | Add Retry button to ErrorScreen + refetch to `usePipedQuery` | ✅ Done | `web/src/components/common/ErrorScreen.tsx`, `web/src/hooks/usePipedQuery.ts`, `PlayerPage.tsx`, `ChannelPage.tsx` |

### 1.1 — yt-dlp proxy

**What was built:** A Flask server (`docker/yt-dlp-proxy/server.py`) that wraps `yt-dlp --dump-json` and exposes the same 4-endpoint API shape as Piped:

- `GET /trending?region=US` → `TrendingVideo[]`
- `GET /search?q=...&filter=all` → `{ items, nextpage: null, suggestion: null, corrected: false }`
- `GET /streams/<videoId>` → `VideoStream` with `.hls` set to the best `m3u8_native` format URL
- `GET /channel/<channelId>` → `ChannelInfo`

All responses include `Access-Control-Allow-Origin: *`.

Added to `docker-compose.yml` as `yt-dlp-proxy` service on port **8083**.
Updated `web/.env.local`: `VITE_PIPED_API_URL=http://localhost:8083`.

### 1.2 — API fallback URL

`web/src/api/piped.ts` line 3: fallback changed from `https://pipedapi.kavin.rocks` (offline) to `http://localhost:8081`.

### 1.3 — Null HLS guard

`PlayerPage.tsx`: added guard after `if (!data) return null`:
```tsx
if (!data.hls) return <ErrorScreen message="No stream available for this video." />
```

### 1.4 — HLS error handling

`usePlayer.ts`: added `hlsError` state (initially `null`, reset on each new URL). Hls.js `ERROR` event sets it when `data.fatal` is true. Return signature changed from `hlsRef` to `{ hlsRef, hlsError }`.

`VideoPlayer.tsx`: accepts new `onError?: (msg: string) => void` prop. A `useEffect` watches `hlsError` and calls `onError` whenever it becomes non-null.

`PlayerPage.tsx`: added `playerError` state. Passes `onError={setPlayerError}` to `<VideoPlayer>`. Renders `<ErrorScreen>` before the player JSX if `playerError` is set.

### 1.5 — Retry button + refetch

`usePipedQuery.ts`: added `retryCount` state (incremented by `refetch()`). Added `retryCount` to the `useEffect` deps so calling `refetch()` triggers a fresh fetch. Return type extended with `refetch: () => void`.

`ErrorScreen.tsx`: accepts optional `onRetry?: () => void` prop. When provided, renders a `<FocusableButton focusKey="ERROR_RETRY">` below the error message so it is D-pad navigable.

`PlayerPage.tsx`: passes `onRetry={refetch}` to all three `<ErrorScreen>` usages. The `playerError` case also calls `setPlayerError(null)` before retrying so the player re-mounts cleanly.

`ChannelPage.tsx`: passes `onRetry={refetch}` to its `<ErrorScreen>`.

---

## Phase 2 — Fix Everyday Bugs

| # | Task | Status | Files |
|---|---|---|---|
| 2.1 | Fix Sidebar active state (HashRouter incompatibility) | ✅ Done | `web/src/components/layout/Sidebar.tsx` |
| 2.2 | Fix SubscriptionsPage silent loading hang | ✅ Done | `web/src/pages/SubscriptionsPage.tsx` |
| 2.3 | Fix Subscriptions feed sort order | ✅ Done | `web/src/api/piped.ts`, `web/src/pages/SubscriptionsPage.tsx` |
| 2.4 | Add image fallback handlers | ✅ Done | `web/src/components/cards/VideoCard.tsx`, `ChannelCard.tsx` |
| 2.5 | Add empty states to Search and Channel pages | ✅ Done | `web/src/pages/SearchPage.tsx`, `ChannelPage.tsx` |

### 2.1 — Sidebar active state

`Sidebar.tsx`: replaced `useLocation` + `location.pathname === item.path` with `useMatch`. Hash-aware — works correctly with `HashRouter`. `SidebarItem` now owns its own active state via `useMatch`; the `active` prop was removed. `useLocation` import removed.

### 2.2 — SubscriptionsPage loading hang

Wrapped the async IIFE body in `try/finally`. `setLoading(false)` now always runs in `finally`, even if any batch fetch throws. Previously the loading spinner would hang indefinitely on any error.

### 2.3 — Subscriptions sort order

Added `parseRelativeDate(str)` to `piped.ts` — parses strings like `"3 days ago"` into a seconds-ago number. `sortByDate` in `SubscriptionsPage.tsx` now uses it: sorts ascending by seconds-ago so most-recent videos appear first.

### 2.4 — Image fallback handlers

Added `onError` handlers to `<img>` in `VideoCard.tsx` and `ChannelCard.tsx`. On error, sets `src` to an inline SVG dark placeholder and clears `onerror` to prevent loops. No extra asset file needed.

### 2.5 — Empty states

`SearchPage.tsx`: shows `"No results for '...'"` when query is set, data loaded, and results are empty.

`ChannelPage.tsx`: replaced the `videos.length > 0 &&` guard with a ternary that renders `"No videos available for this channel."` for empty channels.

---

## Phase 3 — TV Features

| # | Task | Status | Files |
|---|---|---|---|
| 3.1 | Related videos panel in PlayerPage | ✅ Done | `web/src/pages/PlayerPage.tsx` |
| 3.2 | Watch progress resumption | ✅ Done | `web/src/hooks/useWatchProgress.ts` (new), `PlayerPage.tsx` |
| 3.3 | Pagination for Search and Channel pages | ✅ Done | `web/src/api/piped.ts`, `SearchPage.tsx`, `ChannelPage.tsx` |

### 3.1 — Related videos panel

`PlayerPage.tsx`: wrapped the video element and overlay in `<div className="player-video-area">`. Below it, renders `<VideoGrid videos={data.relatedStreams} focusKey="RELATED_VIDEOS" />` inside a `.related-videos` div with an "Up Next" heading — only when `relatedStreams` is non-empty.

### 3.2 — Watch progress resumption

`useWatchProgress.ts` (new): reads/writes `localStorage` key `tvapp_progress_${videoId}`. `savedPosition` is derived with `useMemo`. `savePosition(time, duration)` saves when `time > 5s` and `time < duration - 10s`, otherwise clears the entry (handles near-start and near-end).

`PlayerPage.tsx`: calls `useWatchProgress(videoId!)`. In `onDurationChange`: seeks to `savedPosition` if `> 5s` and shows a 2-second `resumeToast`. In `onTimeUpdate`: calls `savePosition` throttled to once per 5 seconds via `lastSaveRef`. Toast renders as `<div className="resume-toast">` inside `.player-video-area`.

### 3.3 — Pagination

`piped.ts`: added `searchNextPage(query, nextpage)` and `getChannelNextPage(channelId, nextpage)`.

`SearchPage.tsx`: replaced `usePipedQuery` with manual `useEffect` + `useState`. Tracks `items`, `nextpageToken`, and `loading` independently. Resets on query change. "Load more" `FocusableButton` appends next page results.

`ChannelPage.tsx`: added `extraVideos` and `nextpageToken` states. `useEffect` syncs `nextpageToken` from `data.nextpage` when data loads. "Load more" appends to `extraVideos`; grid receives `[...videos, ...extraVideos]`.

---

## Verification Checklist

### After Phase 1
- [ ] `docker compose up -d` → `curl http://localhost:8083/streams/dQw4w9WgXcQ` returns JSON with valid `.hls` URL
- [ ] Open `http://localhost:5175` → navigate to any trending video → video plays end-to-end
- [ ] Disconnect Docker → player shows error screen with Retry button → Retry reloads

### After Phase 2
- [ ] Navigate to Search → sidebar "Search" item is highlighted
- [ ] Open Subscriptions page → feed shows most-recent videos first
- [ ] Search for something with no results → "No results" message appears
- [ ] Visit a channel with 0 videos → empty state message appears

### After Phase 3
- [x] Play a video → pause at 1:30 → navigate away → return to same video → resumes at ~1:30
- [x] Player page shows "Up Next" grid below video
- [x] Search → scroll to bottom → "Load more" button → second page of results appends
