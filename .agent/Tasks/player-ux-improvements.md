# Player UX Improvements

**Status:** ✅ Complete

## Overview

Two UX improvements to the video player:
1. Back button in the player controls bar
2. End-of-video overlay with next-video countdown and navigation options

---

## 1. Back Button in Player Controls

**Problem:** No visible back button in the player UI. Users had to use the physical Back remote key (Backspace / XF86Back), which was not discoverable.

**Files changed:**
- `web/src/components/player/PlayerControls.tsx`
- `web/src/pages/PlayerPage.tsx`

**Changes:**
- Added `onBack: () => void` prop to `PlayerControls`
- Added `← Back` as the first `ControlButton` in the controls bar (`focusKey: CTRL_BACK`)
- `PlayerPage` passes `onBack={handleBackToMenu}` (calls `navigate(-1)`)

Focus key: `CTRL_BACK`

---

## 2. Video End Overlay (`VideoEndOverlay`)

**Problem:** When a video ended, the player just froze. No feedback to the user, no path to the next video.

**New file:** `web/src/components/player/VideoEndOverlay.tsx`

**Behaviour:**
- Shown when `videoEnded === true` in `PlayerPage`
- Replaces `PlayerOverlay` (mutually exclusive — one or the other is rendered)
- If a next video exists (`data.relatedStreams[0]`):
  - Shows next video thumbnail + title
  - 10-second countdown auto-advances to next video
  - `▶ Play Now (Xs)` button (primary, `focusKey: END_NEXT`)
  - `← Back to Menu` button (`focusKey: END_BACK`)
- If no next video:
  - Shows only `← Back to Menu` (primary style)

**Props:**
```ts
interface Props {
  nextVideo: TrendingVideo | null
  onNextVideo: () => void
  onBackToMenu: () => void
}
```

**Focus context:** `VIDEO_END_OVERLAY` (wraps `END_NEXT` and `END_BACK`)

**Changes to `PlayerPage.tsx`:**
- Added `videoEnded` state (set by `ended` event on `<video>`, cleared on `play`)
- `onPlay` handler resets `videoEnded = false` (so replaying after end works)
- `handleNextVideo` navigates to `/player/${extractVideoId(nextVideo.url)}`
- `handleBackToMenu` calls `navigate(-1)`
- Layout: `{videoEnded && <VideoEndOverlay>}` / `{!videoEnded && <PlayerOverlay>}`

---

## Acceptance Criteria

- [x] Back button visible and focusable in player controls
- [x] Back button navigates to previous screen
- [x] Physical Back key (Backspace / XF86Back) still works
- [x] End overlay appears when video finishes
- [x] Countdown auto-advances to next video after 10 s
- [x] "Play Now" button immediately plays next video
- [x] "Back to Menu" button navigates back
- [x] No countdown shown when there is no next video
- [x] Playing again after end resets `videoEnded` state
