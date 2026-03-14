import { useState, useEffect, useCallback, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PlayerOverlay({ children }: Props) {
  const [visible, setVisible] = useState(true)

  const show = useCallback(() => {
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return

    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [visible])

  useEffect(() => {
    const handleKey = () => show()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [show])

  return (
    <div className={`player-overlay ${visible ? 'player-overlay--visible' : ''}`}>
      {children}
    </div>
  )
}
