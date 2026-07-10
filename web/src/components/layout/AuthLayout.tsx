import { Outlet } from 'react-router-dom'
import { Home, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function AuthLayout() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Theme toggle — fixed top-right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2.5 rounded-xl border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all shadow-sm"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

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
