import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Home, Building2, CreditCard, MessageSquare, Users, Settings, X } from 'lucide-react'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

const TENANT_NAV = [
  { to: '/home', icon: Home, label: 'Explore' },
  { to: '/tenancy', icon: Building2, label: 'My Tenancy' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
  { to: '/roommates', icon: Users, label: 'Roommates' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function TenantLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={cn(
          'fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-sidebar shrink-0 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}>
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-bold">AssetHub</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-3 space-y-1">
            {TENANT_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/home'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
