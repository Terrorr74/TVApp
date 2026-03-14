import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface Props {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="content-area">{children}</main>
    </div>
  )
}
