# Google TV YouTube App

Ad-free YouTube browsing via the [Piped](https://github.com/TeamPiped/Piped) proxy. React SPA optimised for 10-foot UI, wrapped in a Kotlin Android TV WebView shell.

## Stack

| Layer | Tech |
|---|---|
| UI | React 18 + Vite + TypeScript |
| Navigation | Norigin Spatial Navigation (D-pad) |
| Video | hls.js |
| Backend | Piped API (`pipedapi.kavin.rocks`) |
| Android shell | Kotlin + WebView + Leanback |

## Development

```bash
cd web
npm install
npm run dev          # http://localhost:5173 — use arrow keys to navigate
```

## Build & Deploy to Android TV

```bash
# 1. Build React app and copy to Android assets
cd web && npm run deploy

# 2. Build APK
cd ../android && ./gradlew assembleDebug

# 3. Install via ADB (TV must be in developer mode)
adb connect <TV_IP>:5555
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Remote key mapping

| TV Remote | DOM key |
|---|---|
| D-pad | `ArrowUp/Down/Left/Right` |
| OK | `Enter` |
| Back | `Backspace` / `XF86Back` |
| Play/Pause | `MediaPlayPause` |
| Fast Forward | `MediaFastForward` |
| Rewind | `MediaRewind` |

## Project structure

```
TVApp/
├── web/          # React + Vite SPA
│   └── src/
│       ├── api/          # Piped API client
│       ├── hooks/        # usePipedQuery, useSubscriptions, usePlayer
│       ├── navigation/   # SpatialNavProvider
│       ├── pages/        # Home, Search, Player, Channel, Subscriptions
│       ├── components/   # Cards, Grid, Player, Keyboard, Layout
│       └── styles/       # variables, global, tv CSS
└── android/      # Kotlin TV shell
    └── app/src/main/
        ├── kotlin/com/tvapp/   # MainActivity, TvWebViewClient
        └── assets/web/         # Built React app (copied by npm run deploy)
```
