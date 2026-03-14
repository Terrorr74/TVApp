# Task: Fix Video Stream Playback

## Status
✅ Resolved — Option C (yt-dlp proxy) implemented on 2026-03-14

## Problem

`GET /streams/{videoId}` returns `{"message": "The page needs to be reloaded."}` on the self-hosted Piped backend.

YouTube now requires a **PoToken** (Proof of Origin Token) for video stream extraction. The current Docker image (`1337kavin/piped`, commit `da5bcd7`, 2026-02-07) ships an outdated `NewPipeExtractor` that does not implement the PoToken flow.

All public Piped instances are also offline (`pipedapi.kavin.rocks` → 502, others returning `"Piped has shutdown"`).

## What Currently Works

| Feature | Status |
|---|---|
| Trending feed (`/trending`) | ✅ Working |
| Search (`/search`) | ✅ Working |
| Channel info (`/channel/:id`) | ✅ Working |
| Stream playback (`/streams/:id`) | ❌ Broken |

## Fix Options

### Option A — Wait for Updated Docker Image (no effort)
Upstream PR [#887](https://github.com/TeamPiped/Piped-Backend/issues/887) updates `NewPipeExtractor` to v0.26.0 which fixes the PoToken flow. Once merged and released:
```bash
cd docker && docker compose pull && docker compose up -d
```
No code changes needed.

### Option B — Build Piped Backend From Source (medium effort)
```bash
git clone https://github.com/TeamPiped/Piped-Backend
cd Piped-Backend
# Cherry-pick/apply NewPipeExtractor v0.26.0 update from PR #887
./gradlew shadowJar
# Replace image in docker/docker-compose.yml with locally-built JAR
```

### Option C — Switch to yt-dlp Proxy (recommended long-term)
Build a small Python/Node server using `yt-dlp` (actively maintained, updates within hours of YouTube changes). The TV app requires **zero code changes** — just point `VITE_PIPED_API_URL` at the new server.

A reference Flask implementation is in `BACKEND_STATUS.md` (Part 3 — Option C).

Key endpoints to implement (must match Piped API shape):
- `GET /trending?region=US` → `TrendingVideo[]`
- `GET /search?q=...&filter=all` → `{ items, nextpage }`
- `GET /streams/{videoId}` → `{ title, hls, thumbnail, duration, uploader, uploaderUrl }`
- `GET /channel/{channelId}` → `{ id, name, avatarUrl, subscribers, relatedStreams }`

## Implementation Plan (Option C)

1. Create `docker/yt-dlp-proxy/` with `server.py`, `Dockerfile`, `requirements.txt`
2. Add `yt-dlp-proxy` service to `docker/docker-compose.yml` on port `8083`
3. Update `docker/config/` if needed
4. Test locally: `VITE_PIPED_API_URL=http://localhost:8083 npm run dev`
5. Verify all 4 API endpoints return correct shape matching `web/src/api/types.ts`
6. Update `docker/.env` or README with new env var

## Acceptance Criteria

- [x] `PlayerPage` loads and plays a video end-to-end on the TV
- [x] HLS stream URL is valid and plays in hls.js
- [x] Trending, search, and channel pages continue working
- [x] No changes required to the React app code

## Resolution

Implemented Option C. See `Tasks/tvapp-improvement-plan.md` for full implementation details.

## References

- `BACKEND_STATUS.md` — full investigation notes
- `web/src/api/types.ts` — TypeScript types the API responses must match
- `web/src/api/piped.ts` — API client (base URL via `VITE_PIPED_API_URL`)
