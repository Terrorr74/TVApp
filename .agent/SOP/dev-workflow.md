# SOP: Development Workflow

## Local Development (Browser)

```bash
cd web
npm install          # first time only
npm run dev          # http://localhost:5173
```

Use arrow keys to navigate. The app works fully in a browser for UI/navigation development. Video playback requires a working backend.

### Pointing at a local backend

```bash
# In web/.env.local (git-ignored)
VITE_PIPED_API_URL=http://localhost:8081
```

Start the Docker stack first:
```bash
cd docker && docker compose up -d
```

## Build & Deploy to Android TV

```bash
# 1. Build and copy React app into Android assets
cd web && npm run deploy

# 2. Build debug APK
cd ../android && ./gradlew assembleDebug

# 3. Install (TV must be in Developer Mode with ADB enabled)
adb connect <TV_IP>:5555
adb install app/build/outputs/apk/debug/app-debug.apk
```

`npm run deploy` runs: `tsc && vite build && rsync -av --delete dist/ ../android/app/src/main/assets/web/`

## Adding a New Page

1. Create `web/src/pages/YourPage.tsx`
2. Add a route in `App.tsx` (inside `AppLayout` for sidebar, or bare for full-screen like `PlayerPage`)
3. Set initial focus in a `useEffect(() => { setFocus('YOUR_FOCUSKEY') }, [setFocus])`
4. Wrap interactive content in `FocusContext.Provider` with a `useFocusable` context key

## Adding a New API Endpoint

1. Add the TypeScript type to `web/src/api/types.ts`
2. Add the fetch function to `web/src/api/piped.ts` using `apiFetch<YourType>('/your-path')`
3. Use `usePipedQuery(() => yourFn(params), [params])` in the component

## Docker Backend

```bash
cd docker
docker compose up -d         # start all services
docker compose down          # stop all services
docker compose logs -f piped-backend   # tail backend logs
docker compose pull && docker compose up -d  # update images
```

Services: piped-frontend (:8090), piped-backend (:8081), piped-proxy (:8082), bg-helper, postgres.
