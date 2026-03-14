import { useNavigate, useMatch } from 'react-router-dom'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'

const NAV_ITEMS = [
  { label: 'Home', path: '/', focusKey: 'SIDEBAR_HOME' },
  { label: 'Search', path: '/search', focusKey: 'SIDEBAR_SEARCH' },
  { label: 'Subscriptions', path: '/subscriptions', focusKey: 'SIDEBAR_SUBS' },
]

function SidebarItem({
  label,
  path,
  focusKey,
}: {
  label: string
  path: string
  focusKey: string
}) {
  const navigate = useNavigate()
  const match = useMatch(path === '/' ? { path: '/', end: true } : path)
  const isActive = !!match

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => navigate(path),
  })

  return (
    <div
      ref={ref}
      className={`sidebar-item ${focused ? 'focused' : ''} ${isActive ? 'active' : ''}`}
      onClick={() => navigate(path)}
    >
      {label}
    </div>
  )
}

export default function Sidebar() {
  const { ref, focusKey } = useFocusable({ focusKey: 'SIDEBAR' })
  const { isSignedIn } = useGoogleAuth()

  return (
    <FocusContext.Provider value={focusKey}>
      <nav ref={ref} className="sidebar">
        <div className="sidebar-logo">TV</div>
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.path}
            label={item.label}
            path={item.path}
            focusKey={item.focusKey}
          />
        ))}
        <SidebarItem
          label={isSignedIn ? '✓ Google' : 'Sign In'}
          path="/signin"
          focusKey="SIDEBAR_SIGNIN"
        />
      </nav>
    </FocusContext.Provider>
  )
}
