# .agent Documentation Index

Documentation for the TVApp project. Keep this updated whenever the system changes.

---

## System

| Document | Description |
|---|---|
| [System Overview](./System/system.md) | Tech stack, project structure, routing, API integration, Android WebView config, build & deploy |

---

## Tasks

Active PRDs and implementation plans.

| Document | Status | Description |
|---|---|---|
| [Fix Video Playback](./Tasks/fix-video-playback.md) | ✅ Resolved | Replaced Piped stream backend with yt-dlp proxy (Option C) |
| [TVApp Improvement Plan](./Tasks/tvapp-improvement-plan.md) | ✅ Complete | 3-phase plan: restore playback, fix UX bugs, add TV features |
| [Google Account Connection](./Tasks/google-auth.md) | 🟡 In Progress | Code complete — needs Google Cloud credentials to activate |
| [Player UX Improvements](./Tasks/player-ux-improvements.md) | ✅ Complete | Back button in controls + end-of-video overlay with next-video countdown |

---

## SOP

Best practices for recurring tasks.

| Document | Description |
|---|---|
| [Dev Workflow](./SOP/dev-workflow.md) | Local dev, build/deploy to Android TV, adding pages/API endpoints, Docker commands |
| [Git Workflow](./SOP/git-workflow.md) | Branch strategy, commit conventions, pre-commit checklist |

---

## Key Context

- Stream playback now uses a **yt-dlp proxy** on port 8083 (`docker/yt-dlp-proxy/`). Piped's `/streams` endpoint was broken due to YouTube's PoToken requirement.
- `web/.env.local` points to `http://localhost:8083` (yt-dlp proxy). Piped backend (8081) is still running but not used for streams.
- The React app's API base URL is controlled by `VITE_PIPED_API_URL` (set in `web/.env.local`).
- Routing uses `HashRouter` because the app is served from `file://` in the Android WebView.
