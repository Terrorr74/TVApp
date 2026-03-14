const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET as string
const SCOPE = 'https://www.googleapis.com/auth/youtube'
const TOKEN_KEY = 'tvapp_google_tokens'

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_at: number // Date.now() + expires_in * 1000
}

export interface DeviceFlowResult {
  deviceCode: string
  userCode: string
  verificationUrl: string
  expiresIn: number
  interval: number
}

// ── Device flow ──────────────────────────────────────────────────────────────

export async function startDeviceFlow(): Promise<DeviceFlowResult> {
  const res = await fetch('https://oauth2.googleapis.com/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, scope: SCOPE }),
  })
  if (!res.ok) throw new Error(`Device flow failed: ${res.status}`)
  const data = await res.json()
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUrl: data.verification_url,
    expiresIn: data.expires_in,
    interval: data.interval ?? 5,
  }
}

/**
 * Poll once for a token. Returns tokens on success, null if still pending,
 * throws on hard errors (expired, access_denied).
 */
export async function pollForToken(
  deviceCode: string,
): Promise<GoogleTokens | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  })
  const data = await res.json()
  if (data.error === 'authorization_pending') return null
  if (data.error === 'slow_down') return null
  if (data.error) throw new Error(data.error_description ?? data.error)
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

// ── Token storage ─────────────────────────────────────────────────────────────

export function saveTokens(tokens: GoogleTokens): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}

export function loadTokens(): GoogleTokens | null {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Token refresh ─────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json()
  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // refresh_token not rotated by Google
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

/**
 * Returns a valid access token, refreshing if within 60 seconds of expiry.
 * Returns null if not signed in.
 */
export async function getValidToken(): Promise<string | null> {
  let tokens = loadTokens()
  if (!tokens) return null
  if (Date.now() > tokens.expires_at - 60_000) {
    tokens = await refreshAccessToken(tokens.refresh_token)
    saveTokens(tokens)
  }
  return tokens.access_token
}
