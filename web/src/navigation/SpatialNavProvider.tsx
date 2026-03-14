import { useEffect, type ReactNode } from 'react'
import { init } from '@noriginmedia/norigin-spatial-navigation'

let initialized = false

export function SpatialNavProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!initialized) {
      init({ debug: false, visualDebug: false })
      initialized = true
    }
  }, [])

  return <>{children}</>
}
