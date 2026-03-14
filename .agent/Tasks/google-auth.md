# Task: Google Account Connection

## Status
⬜ Planned

## Goal

Allow users to sign in with their Google account so the app can access their personal YouTube data: subscriptions, watch history, liked videos, and playlists.

---

## Background

The app currently manages subscriptions locally via `localStorage`. Connecting a Google account would sync with the user's real YouTube subscriptions and unlock personalised features.

For TV / set-top-box devices the correct OAuth flow is the **Device Authorization Grant** (RFC 8628), also known as the "device flow". The user sees a short code on-screen, goes to `google.com/device` on their phone/computer, enters the code, and the TV is authenticated without any keyboard input.

---

## OAuth Scopes Required

| Scope | Purpose |
|---|---|
| `https://www.googleapis.com/auth/youtube.readonly` | Read subscriptions, history, liked videos |
| `https://www.googleapis.com/auth/youtube` | Write: subscribe/unsubscribe, like/unlike |

---

## Architecture

```
TVApp (WebView)
  └── GoogleAuthService (new)
        ├── POST /o/oauth2/device/code   → get device_code + user_code
        ├── Poll POST /o/oauth2/token     → exchange for access_token + refresh_token
        └── Store tokens in localStorage (tvapp_google_tokens)

YouTube Data API v3 (googleapis.com)
  ├── GET /youtube/v3/subscriptions     → user's subscribed channels
  ├── GET /youtube/v3/videos?myRating=like → liked videos
  └── GET /youtube/v3/activities        → watch history (limited)
```

---

## Implementation Plan

### Step 1 — Google Cloud Console setup (manual, one-time)
1. Create a project at console.cloud.google.com
2. Enable **YouTube Data API v3**
3. Create OAuth 2.0 credentials → application type: **TV and Limited Input devices**
4. Note `client_id` and `client_secret`
5. Add to `web/.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=your_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### Step 2 — `web/src/api/googleAuth.ts` (new file)
```ts
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET
const SCOPE = 'https://www.googleapis.com/auth/youtube'
const TOKEN_KEY = 'tvapp_google_tokens'

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_at: number   // Date.now() + expires_in * 1000
}

export async function startDeviceFlow(): Promise<{ userCode: string; verificationUrl: string; deviceCode: string; interval: number }> {
  // POST https://oauth2.googleapis.com/device/code
}

export async function pollForToken(deviceCode: string, interval: number): Promise<GoogleTokens | null> {
  // Poll POST https://oauth2.googleapis.com/token
  // Returns null if still pending, throws on error/expired
}

export function saveTokens(tokens: GoogleTokens): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}

export function loadTokens(): GoogleTokens | null {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null') } catch { return null }
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  // POST https://oauth2.googleapis.com/token with grant_type=refresh_token
}

export async function getValidToken(): Promise<string | null> {
  // Load tokens, refresh if expired, return access_token
}
```

### Step 3 — `web/src/api/youtubeApi.ts` (new file)
```ts
// Wraps YouTube Data API v3 using the access token from googleAuth.ts
export async function getMySubscriptions(): Promise<Subscription[]>
export async function getLikedVideos(): Promise<TrendingVideo[]>
export async function subscribeToChannel(channelId: string): Promise<void>
export async function unsubscribeFromChannel(subscriptionId: string): Promise<void>
```

### Step 4 — `web/src/hooks/useGoogleAuth.ts` (new file)
```ts
// Manages auth state: { tokens, signIn, signOut, isSignedIn }
// signIn() triggers device flow, shows code on screen, polls until complete
// Stores result in localStorage
```

### Step 5 — `web/src/pages/SignInPage.tsx` (new file)
- Shows Google sign-in prompt
- On activate: calls `startDeviceFlow()`, displays `user_code` and `verification_url`
- Shows animated "Waiting for authorisation..." spinner
- Polls `pollForToken()` until success or timeout
- On success: saves tokens, navigates to Home

### Step 6 — UI integration
- Add "Sign In" item to `Sidebar.tsx` nav (path `/signin`)
- Add `/signin` route in `App.tsx`
- In `useSubscriptions.ts`: if signed in, merge localStorage subs with YouTube subs
- `ChannelPage.tsx`: use `subscribeToChannel` / `unsubscribeFromChannel` when signed in

---

## Data Persistence

Tokens stored in `localStorage` under `tvapp_google_tokens`:
```json
{
  "access_token": "ya29...",
  "refresh_token": "1//...",
  "expires_at": 1773519902000
}
```

`expires_at` is checked before each API call. If expired, the refresh token is used automatically.

---

## Security Notes

- `client_secret` will be embedded in the built JS bundle. For a personal/private app this is acceptable (TV OAuth clients are public clients by design). For a distributed app, proxy refresh calls through the yt-dlp server.
- Tokens are stored in `localStorage` (same as subscriptions). The Android WebView has `domStorageEnabled = true`.

---

## Acceptance Criteria

- [ ] User can initiate sign-in from the sidebar
- [ ] Sign-in page displays device code and verification URL
- [ ] After authorisation on phone, app receives tokens and navigates home
- [ ] Subscriptions page shows YouTube subscriptions merged with local ones
- [ ] Subscribe/unsubscribe on ChannelPage writes to YouTube (when signed in)
- [ ] Token refreshes automatically before expiry
- [ ] Sign-out clears tokens and reverts to local-only mode

---

## Files to Create / Modify

| File | Action |
|---|---|
| `web/src/api/googleAuth.ts` | Create |
| `web/src/api/youtubeApi.ts` | Create |
| `web/src/hooks/useGoogleAuth.ts` | Create |
| `web/src/pages/SignInPage.tsx` | Create |
| `web/src/components/layout/Sidebar.tsx` | Add Sign In item |
| `web/src/App.tsx` | Add `/signin` route |
| `web/src/hooks/useSubscriptions.ts` | Merge Google subs |
| `web/src/pages/ChannelPage.tsx` | Use YouTube API when signed in |
| `web/.env.local` | Add `VITE_GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_SECRET` |

---

## References

- [Google OAuth 2.0 for TV Devices](https://developers.google.com/identity/protocols/oauth2/limited-input-device)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- `web/src/api/types.ts` — existing type shapes
- `web/src/hooks/useSubscriptions.ts` — current local subscription logic
