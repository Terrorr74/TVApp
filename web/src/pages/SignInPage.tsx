import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { startDeviceFlow, pollForToken, saveTokens } from '../api/googleAuth'
import { useGoogleAuth } from '../hooks/useGoogleAuth'

type Stage = 'idle' | 'loading' | 'waiting' | 'error'

export default function SignInPage() {
  const navigate = useNavigate()
  const { isSignedIn, signOut, onSignedIn } = useGoogleAuth()
  const [stage, setStage] = useState<Stage>('idle')
  const [userCode, setUserCode] = useState('')
  const [verificationUrl, setVerificationUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deviceCodeRef = useRef('')

  // If already signed in, show signed-in state
  const handleSignOut = () => {
    signOut()
    setStage('idle')
  }

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  useEffect(() => () => stopPolling(), [])

  const handleSignIn = async () => {
    setStage('loading')
    setErrorMsg('')
    try {
      const flow = await startDeviceFlow()
      deviceCodeRef.current = flow.deviceCode
      setUserCode(flow.userCode)
      setVerificationUrl(flow.verificationUrl)
      setStage('waiting')

      pollTimerRef.current = setInterval(async () => {
        try {
          const tokens = await pollForToken(deviceCodeRef.current)
          if (tokens) {
            stopPolling()
            saveTokens(tokens)
            onSignedIn(tokens)
            navigate('/')
          }
        } catch (err) {
          stopPolling()
          setErrorMsg(err instanceof Error ? err.message : 'Authorisation failed')
          setStage('error')
        }
      }, flow.interval * 1000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not start sign-in')
      setStage('error')
    }
  }

  const { ref: btnRef, focused: btnFocused } = useFocusable({
    focusKey: 'SIGNIN_BTN',
    onEnterPress: isSignedIn ? handleSignOut : stage === 'idle' || stage === 'error' ? handleSignIn : undefined,
  })

  return (
    <div className="page signin-page">
      <h1 className="page-title">Google Account</h1>

      {isSignedIn ? (
        <div className="signin-content">
          <div className="signin-status signin-status--connected">
            ✓ Connected to Google
          </div>
          <p className="signin-hint">Your YouTube subscriptions are synced.</p>
          <button
            ref={btnRef}
            className={`signin-btn signin-btn--signout ${btnFocused ? 'focused' : ''}`}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="signin-content">
          {(stage === 'idle' || stage === 'error') && (
            <>
              <p className="signin-hint">
                Sign in to sync your YouTube subscriptions and watch history.
              </p>
              {stage === 'error' && (
                <div className="signin-error">{errorMsg}</div>
              )}
              <button
                ref={btnRef}
                className={`signin-btn ${btnFocused ? 'focused' : ''}`}
                onClick={handleSignIn}
              >
                Sign in with Google
              </button>
            </>
          )}

          {stage === 'loading' && (
            <div className="signin-hint">Starting sign-in…</div>
          )}

          {stage === 'waiting' && (
            <div className="signin-device-flow">
              <p className="signin-hint">On your phone or computer, go to:</p>
              <div className="signin-url">{verificationUrl}</div>
              <p className="signin-hint">And enter this code:</p>
              <div className="signin-code">{userCode}</div>
              <p className="signin-hint signin-hint--dim">Waiting for authorisation…</p>
              <button
                ref={btnRef}
                className={`signin-btn signin-btn--cancel ${btnFocused ? 'focused' : ''}`}
                onClick={() => { stopPolling(); setStage('idle') }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
