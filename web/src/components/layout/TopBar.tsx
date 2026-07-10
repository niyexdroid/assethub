import { Link, useNavigate } from 'react-router-dom'
import { Bell, Home, Menu, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/hooks/useTheme'
import { getInitials } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { useState } from 'react'

interface Props {
  onToggleSidebar?: () => void
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
}

export function TopBar({ onToggleSidebar, showSearch, searchValue, onSearchChange, searchPlaceholder }: Props) {
  const { user, refreshToken, clearAuth } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    // Fire-and-forget — revoke tokens on server, but always clear locally
    authService.logout(refreshToken ?? undefined).catch(() => {})
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link to="/home" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground hidden sm:inline">AssetHub</span>
        </Link>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-4">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder ?? 'Search...'}
            className="w-full h-10 px-4 rounded-xl border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
          {isDark ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
        </button>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {getInitials(user?.first_name, user?.last_name)}
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border bg-popover shadow-lg z-50 p-1">
                <button
                  onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  <UserIcon className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-muted transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
