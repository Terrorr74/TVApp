# Backend Investigation — Why Videos Are Not Loading

*Investigated: 2026-03-14*

---

## Part 1 — Public Piped Instances Are Dead

All known public Piped instances are offline.

| Instance | Result |
|---|---|
| `pipedapi.kavin.rocks` (original) | `502 Bad Gateway` |
| `api.piped.projectsegfau.lt` | Returns literal `"Piped has shutdown"` |
| `piped-api.garudalinux.org` | Empty / timeout |
| `piped.adminforge.de` | `301` redirect, no data |
| `api.piped.yt` | Empty / timeout |

Invidious public instances also have `/trending` disabled.

---

## Part 2 — Self-Hosted Piped: What Works and What Doesn't

Self-hosting via Docker (`docker/docker-compose.yml`) was set up and tested.

### What works ✅
- **Trending** — `GET /trending?region=US` returns 15 videos with thumbnails, metadata
- **Search** — `GET /search?q=...` returns 20 results correctly

### What doesn't work ❌
- **Streams** — `GET /streams/{videoId}` returns `{"message": "The page needs to be reloaded."}`

### Root Cause of Stream Failure

YouTube requires a **PoToken** (Proof of Origin Token) for video stream extraction. The PoToken is a challenge/response token that proves the request comes from a real browser.

**The Piped Docker image (2026-02-07, commit `da5bcd7`) ships with an outdated `NewPipeExtractor` that does not fully implement the PoToken flow.** Open GitHub issue: [#887 — Update NewPipeExtractor to v0.26.0](https://github.com/TeamPiped/Piped-Backend/issues/887), description: *"Fixes recent issues of videos not loading at all."*

### Technical Deep-Dive

1. **BgPoTokenProvider** class exists in the JAR and is registered when `BG_HELPER_URL` is set.
2. **bg-helper** container runs, is healthy, and generates valid PoTokens when called directly:
   ```json
   {"poToken": "MqIBxrA_...long token...", "visitorData": "CgtTTEFX..."}
   ```
3. **reqwest4j** (the native Rust networking library Piped uses) does NOT use Docker's internal DNS resolver — it cannot resolve Docker service hostnames like `bg-helper`. Using a direct IP (`172.19.0.4`) also didn't trigger bg-helper calls, confirming the extractor itself doesn't call the provider.
4. **The NewPipeExtractor version** in the current image doesn't invoke the PoToken provider for stream extraction, so bg-helper is never called regardless of configuration.

---

## Part 3 — Fix Options

### Option A — Wait for Updated Docker Image (no effort, unstable ETA)
The upstream PR (#887) to update NewPipeExtractor is open. Once merged and released as a new Docker image, `docker compose pull && docker compose up -d` should fix streams with no other changes.

### Option B — Build Piped Backend From Source (medium effort)
```bash
git clone https://github.com/TeamPiped/Piped-Backend
cd Piped-Backend
# Apply any pending NewPipeExtractor update from PR #887
./gradlew shadowJar
# Replace image in docker-compose with locally built version
```

### Option C — Switch to yt-dlp Proxy (recommended long-term)
A small Python/Node server that uses `yt-dlp` for stream extraction. yt-dlp is actively maintained and updates within hours of YouTube changes.

**Minimal Flask server:**
```python
# docker/yt-dlp-proxy/server.py
from flask import Flask, jsonify, request
import subprocess, json

app = Flask(__name__)

@app.get('/trending')
def trending():
    out = subprocess.check_output([
        'yt-dlp', '--flat-playlist', '-J',
        'https://www.youtube.com/feed/trending'
    ])
    data = json.loads(out)
    return jsonify([{
        'url': f'/watch?v={e["id"]}',
        'title': e['title'],
        'thumbnail': e.get('thumbnail') or f'https://i.ytimg.com/vi/{e["id"]}/hqdefault.jpg',
        'uploaderName': e.get('uploader', ''),
        'duration': e.get('duration', 0),
        'views': e.get('view_count', 0),
        'uploadedDate': e.get('upload_date', ''),
    } for e in data.get('entries', [])])

@app.get('/streams/<video_id>')
def streams(video_id):
    out = subprocess.check_output([
        'yt-dlp', '--dump-json', '--no-playlist',
        f'https://www.youtube.com/watch?v={video_id}'
    ])
    data = json.loads(out)
    hls = next((f['url'] for f in data['formats']
                 if f.get('ext') == 'm3u8' or f.get('protocol', '').startswith('m3u8')), None)
    return jsonify({
        'title': data['title'],
        'hls': hls,
        'thumbnail': data.get('thumbnail'),
        'duration': data.get('duration', 0),
        'uploader': data.get('uploader', ''),
        'uploaderUrl': f'/channel/{data.get("channel_id")}',
    })

@app.get('/search')
def search():
    q = request.args.get('q', '')
    out = subprocess.check_output([
        'yt-dlp', '--flat-playlist', '-J', '--no-playlist',
        f'ytsearch20:{q}'
    ])
    data = json.loads(out)
    items = [{
        'url': f'/watch?v={e["id"]}',
        'title': e['title'],
        'thumbnail': f'https://i.ytimg.com/vi/{e["id"]}/hqdefault.jpg',
        'uploaderName': e.get('uploader', ''),
        'duration': e.get('duration', 0),
        'views': e.get('view_count', 0),
        'type': 'stream',
    } for e in data.get('entries', [])]
    return jsonify({'items': items, 'nextpage': None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081)
```

Set `VITE_PIPED_API_URL=http://localhost:8081` and the TV app requires zero code changes.

---

## Current State of the Self-Hosted Stack

| Service | Port | Status |
|---|---|---|
| Piped Frontend | 8090 | ✅ Running |
| Piped Backend API | 8081 | ✅ Running (trending/search only) |
| Piped Proxy (HLS) | 8082 | ✅ Running |
| bg-helper | internal | ✅ Running, generates tokens |
| Postgres | internal | ✅ Running |

**To start:** `cd docker && docker compose up -d`
**To stop:** `cd docker && docker compose down`
**Current limitation:** Stream playback broken until Piped updates NewPipeExtractor to v0.26.0.
