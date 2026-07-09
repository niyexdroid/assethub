import { Outlet } from 'react-router-dom'
import { Home } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">AssetHub</span>
        </div>
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
