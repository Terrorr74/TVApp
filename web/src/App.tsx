import { HashRouter, Routes, Route } from 'react-router-dom'
import { SpatialNavProvider } from './navigation/SpatialNavProvider'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import PlayerPage from './pages/PlayerPage'
import ChannelPage from './pages/ChannelPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import SignInPage from './pages/SignInPage'

export default function App() {
  return (
    <SpatialNavProvider>
      <HashRouter>
        <Routes>
          <Route path="/player/:videoId" element={<PlayerPage />} />
          <Route
            path="*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/subscriptions" element={<SubscriptionsPage />} />
                  <Route path="/channel/:channelId" element={<ChannelPage />} />
                  <Route path="/signin" element={<SignInPage />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </HashRouter>
    </SpatialNavProvider>
  )
}
