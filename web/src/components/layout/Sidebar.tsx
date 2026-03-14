import { useNavigate, useLocation } from 'react-router-dom'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'

const NAV_ITEMS = [
  { label: 'Home', path: '/', focusKey: 'SIDEBAR_HOME' },
  { label: 'Search', path: '/search', focusKey: 'SIDEBAR_SEARCH' },
  { label: 'Subscriptions', path: '/subscriptions', focusKey: 'SIDEBAR_SUBS' },
]

function SidebarItem({
  label,
  path,
  focusKey,
  active,
}: {
  label: string
  path: string
  focusKey: string
  active: boolean
}) {
  const navigate = useNavigate()
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => navigate(path),
  })

  return (
    <div
      ref={ref}
      className={`sidebar-item ${focused ? 'focused' : ''} ${active ? 'active' : ''}`}
      onClick={() => navigate(path)}
    >
      {label}
    </div>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const { ref, focusKey } = useFocusable({ focusKey: 'SIDEBAR' })

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
            active={location.pathname === item.path}
          />
        ))}
      </nav>
    </FocusContext.Provider>
  )
}
