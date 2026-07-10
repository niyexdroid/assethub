import { useNavigate } from 'react-router-dom'
import { User, LogOut, Mail, Phone, Shield, BadgeCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'

export default function Settings() {
  const { user, refreshToken, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    authService.logout(refreshToken ?? undefined).catch(() => {})
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-h2 text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account details.</p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-20">Email</span>
            <span className="text-foreground">{user?.email}</span>
          </div>
          {user?.phone_number && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground w-20">Phone</span>
              <span className="text-foreground">{user.phone_number}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-20">Role</span>
            <span className="text-foreground capitalize">{user?.role}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <BadgeCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-20">Verified</span>
            {user?.is_verified ? (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600">Yes</span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600">Pending</span>
            )}
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  )
}
