# Backend Investigation — Why Videos Are Not Loading

*Investigated: 2026-03-14*

## Root Cause

**Piped has shut down.** The project's public infrastructure is gone, and virtually all community-run instances have gone offline in its wake.

Evidence gathered:

| Instance | Result |
|---|---|
| `pipedapi.kavin.rocks` (original) | `502 Bad Gateway` |
| `api.piped.projectsegfau.lt` | Returns literal string `"Piped has shutdown"` |
| `piped-api.garudalinux.org` | Empty response / timeout |
| `piped.adminforge.de` | `301` redirect, no data |
| `pipedapi.drgns.space` | Timeout |
| `piped.video` | Returns the Piped frontend HTML (API route gone) |
| `api.piped.yt` | Empty response |

Invidious (the other major YouTube proxy) was tested as a fallback — its public instances have disabled the `/trending` endpoint (`"Endpoint disabled"`).

---

## What Piped Was

Piped was an open-source, privacy-respecting YouTube frontend/proxy. It:
- Scraped YouTube without using the official API
- Returned clean JSON for video metadata, search, streams
- Provided HLS stream URLs that bypassed YouTube ads entirely

Google's anti-scraping measures and legal pressure caused the project to shut down its public infrastructure.

---

## Options Going Forward

### Option 1 — Self-host Piped (Recommended for now)
The Piped codebase still exists on GitHub. You can run your own instance privately:

```bash
# docker-compose.yml (minimal Piped stack)
# Requires: backend + frontend + proxy (Nginx) + Wireguard
git clone https://github.com/TeamPiped/Piped-Docker
cd Piped-Docker
./configure-instance.sh
docker compose up -d
```

Then point the app at your instance:
```ts
// web/src/api/piped.ts
const BASE_URL = import.meta.env.VITE_PIPED_API_URL ?? 'https://pipedapi.kavin.rocks'
```

Add to `web/.env.local`:
```
VITE_PIPED_API_URL=https://your-self-hosted-piped-instance.com
```

**Pros:** Same API, zero code changes in the app, ad-free streams work as designed.
**Cons:** Requires a VPS and ongoing maintenance; Piped backend may break as YouTube changes.

---

### Option 2 — Self-host Invidious
[Invidious](https://github.com/iv-org/invidious) is still actively maintained and has a compatible REST API, but the response shapes differ from Piped's.

Key API differences to adapt:

| Endpoint | Piped | Invidious |
|---|---|---|
| Trending | `GET /trending?region=US` → `TrendingVideo[]` | `GET /api/v1/trending?region=US` → `InvidiousVideo[]` |
| Search | `GET /search?q=...` → `{ items }` | `GET /api/v1/search?q=...` → `InvidiousVideo[]` |
| Streams | `GET /streams/{id}` → `{ hls, ... }` | `GET /api/v1/videos/{id}` → `{ adaptiveFormats, ... }` |
| Channel | `GET /channel/{id}` | `GET /api/v1/channels/{id}` |

Invidious does **not** return a clean HLS URL — you would need to build the HLS manifest from `adaptiveFormats`, or use a `dash` manifest URL instead (hls.js supports DASH too via the `dash` loader plugin).

```bash
docker run -p 3000:3000 quay.io/invidious/invidious
```

---

### Option 3 — yt-dlp proxy server (Most resilient)
Run a small local/server-side Node.js or Python service that shells out to `yt-dlp`, which is actively maintained and keeps up with YouTube changes.

```python
# server.py (Flask example)
from flask import Flask, jsonify, request
import subprocess, json

app = Flask(__name__)

@app.get('/streams/<video_id>')
def streams(video_id):
    out = subprocess.check_output([
        'yt-dlp', '--dump-json', '--no-playlist',
        f'https://www.youtube.com/watch?v={video_id}'
    ])
    data = json.loads(out)
    # Find best HLS or DASH format URL
    hls = next((f['url'] for f in data['formats'] if f.get('protocol') == 'm3u8_native'), None)
    return jsonify({'title': data['title'], 'hls': hls, 'thumbnail': data['thumbnail']})
```

Pair this with a `/trending` endpoint using `yt-dlp` trending scraping or the YouTube Data API v3 (free tier: 10,000 units/day) for discovery, and yt-dlp only for stream resolution.

**Pros:** Most resilient — yt-dlp updates within hours of YouTube changes.
**Cons:** Requires a backend server (no longer a pure static web app).

---

### Option 4 — YouTube Data API v3 (Official, no ad bypass)
Use Google's official API for metadata (trending, search, channels) and keep yt-dlp for stream extraction. This means videos play through the official player or require yt-dlp for the actual stream URL.

- Free quota: 10,000 units/day
- Requires a Google Cloud project and API key
- **Does not bypass ads** on its own — you still need yt-dlp or a proxy for the stream URL

---

## Recommended Path

**Short term:** Self-host Piped via Docker on a cheap VPS (€3–5/month).
The app code needs only one change — make `VITE_PIPED_API_URL` an env variable.

**Long term:** Migrate to a yt-dlp-backed proxy server (Option 3), which will remain functional regardless of what happens to community Piped/Invidious instances.

---

## Code Change Required (Immediate)

Make the API base URL configurable so switching backends requires no code changes:

```ts
// web/src/api/piped.ts
const BASE_URL = import.meta.env.VITE_PIPED_API_URL ?? 'https://pipedapi.kavin.rocks'
```

Add `web/.env.local` to `.gitignore` (already covered) and document the env var in README.
