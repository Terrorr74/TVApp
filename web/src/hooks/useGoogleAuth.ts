import { useState, useCallback, useEffect } from 'react'
import {
  loadTokens,
  clearTokens,
  type GoogleTokens,
} from '../api/googleAuth'

export function useGoogleAuth() {
  const [tokens, setTokens] = useState<GoogleTokens | null>(() => loadTokens())

  // Keep in sync if another tab signs in/out via localStorage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'tvapp_google_tokens') {
        setTokens(loadTokens())
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const signOut = useCallback(() => {
    clearTokens()
    setTokens(null)
  }, [])

  // Called by SignInPage once polling succeeds and tokens are persisted
  const onSignedIn = useCallback((t: GoogleTokens) => {
    setTokens(t)
  }, [])

  return {
    isSignedIn: tokens !== null,
    tokens,
    signOut,
    onSignedIn,
  }
}
