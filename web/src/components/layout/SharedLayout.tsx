import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'

export function SharedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
