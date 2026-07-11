# Task 6: RoommateProfile + RoommateRequests Pages

## Goal

Create two pages:
- `web/src/pages/tenant/RoommateProfile.tsx` — view/edit your roommate profile
- `web/src/pages/tenant/RoommateRequests.tsx` — received/sent requests with accept/reject

## RoommateProfile.tsx

View/edit toggle. Edit mode: budget range, preferred LGAs (multi-select chips from LAGOS_LGAS constant), gender preference, bio. Save via `roommatesService.upsertProfile(data)`.

```tsx
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Save } from 'lucide-react'
import { roommatesService, type RoommateProfile } from '@/services/roommates.service'
import { LAGOS_LGAS } from '@/constants/lgas'
import { ErrorState } from '@/components/custom/ErrorState'

export default function RoommateProfileScreen() {
  const [profile, setProfile] = useState<RoommateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [preferredLgas, setPreferredLgas] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [genderPref, setGenderPref] = useState<'male' | 'female' | 'any'>('any')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const p = await roommatesService.getProfile()
      setProfile(p)
      if (p) {
        setBudgetMin(p.budget_min?.toString() ?? '')
        setBudgetMax(p.budget_max?.toString() ?? '')
        setPreferredLgas(p.preferred_lgas ?? [])
        setBio(p.bio ?? '')
        setGenderPref(p.gender_preference ?? 'any')
      }
    } catch {
      setError('Could not load profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const data: any = {
        budget_min: budgetMin ? Number(budgetMin) : undefined,
        budget_max: budgetMax ? Number(budgetMax) : undefined,
        preferred_lgas: preferredLgas,
        bio: bio.trim() || undefined,
        gender_preference: genderPref,
      }
      const updated = await roommatesService.upsertProfile(data)
      setProfile(updated)
      setEditing(false)
    } catch (err) {
      setSaveError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const toggleLga = (lga: string) => {
    setPreferredLgas((prev) => prev.includes(lga) ? prev.filter((x) => x !== lga) : [...prev, lga])
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/roommates" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to roommates
          </Link>
          <h1 className="text-h2 text-foreground">Your Roommate Profile</h1>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted">
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {profile?.user?.first_name ? `${profile.user.first_name} ${profile.user.last_name}` : 'Your Profile'}
              </h3>
              <p className="text-sm text-muted-foreground capitalize">Gender preference: {profile?.gender_preference ?? 'any'}</p>
            </div>
          </div>

          {profile?.bio && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Bio</p>
              <p className="text-sm text-foreground">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {(profile?.budget_min != null || profile?.budget_max != null) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Budget Range</p>
                <p className="text-sm text-foreground">
                  {profile?.budget_min ? `₦${profile.budget_min.toLocaleString()}` : '—'} – {profile?.budget_max ? `₦${profile.budget_max.toLocaleString()}` : '—'}
                </p>
              </div>
            )}
            {profile?.preferred_lgas && profile.preferred_lgas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Preferred Locations</p>
                <p className="text-sm text-foreground">{profile.preferred_lgas.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Min Budget (₦)</label>
              <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="e.g. 200000"
                className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Max Budget (₦)</label>
              <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Preferred Locations (LGA)</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {LAGOS_LGAS.map((lga) => (
                <button key={lga} onClick={() => toggleLga(lga)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    preferredLgas.includes(lga) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  {lga}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Gender Preference</label>
            <div className="flex gap-2">
              {(['male', 'female', 'any'] as const).map((g) => (
                <button key={g} onClick={() => setGenderPref(g)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    genderPref === g ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Tell potential roommates about yourself..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          {saveError && <p className="text-sm text-destructive p-3 rounded-lg bg-destructive/10">{saveError}</p>}

          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); load(); }}
              className="flex-1 h-11 rounded-xl border text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

## RoommateRequests.tsx

Two-tab view: Received (with accept/reject buttons for pending) and Sent (status display). Fetches via `roommatesService.getReceivedRequests()` and `roommatesService.getSentRequests()`. Actions via `roommatesService.acceptRequest(id)` / `roommatesService.declineRequest(id)`.

```tsx
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { roommatesService, type RoommateRequest } from '@/services/roommates.service'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'
import { timeAgo } from '@/lib/utils'

export default function RoommateRequestsScreen() {
  const [received, setReceived] = useState<RoommateRequest[]>([])
  const [sent, setSent] = useState<RoommateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [r, s] = await Promise.all([
        roommatesService.getReceivedRequests(),
        roommatesService.getSentRequests(),
      ])
      setReceived(r)
      setSent(s)
    } catch {
      setError('Could not load requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAccept = async (id: string) => {
    setActingId(id)
    try { await roommatesService.acceptRequest(id); load() }
    catch { /* silently fail */ }
    finally { setActingId(null) }
  }

  const handleDecline = async (id: string) => {
    setActingId(id)
    try { await roommatesService.declineRequest(id); load() }
    catch { /* silently fail */ }
    finally { setActingId(null) }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  const pending = received.filter((r) => r.status === 'pending')
  const current = tab === 'received' ? received : sent

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to="/roommates" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to roommates
      </Link>
      <h1 className="text-h2 text-foreground mb-6">Requests</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('received')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'received' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}>
          Received ({pending.length > 0 ? pending.length : received.length})
        </button>
        <button onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'sent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}>
          Sent ({sent.length})
        </button>
      </div>

      {current.length === 0 ? (
        <EmptyState
          title={tab === 'received' ? 'No received requests' : 'No sent requests'}
          description={tab === 'received' ? 'Roommate requests you receive will appear here.' : 'You haven\'t sent any roommate requests yet.'}
        />
      ) : (
        <div className="space-y-3">
          {current.map((r) => {
            const person = tab === 'received' ? r.sender : r.receiver
            return (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {person?.first_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    {person ? `${person.first_name} ${person.last_name}` : 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                      r.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                      r.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' :
                      'bg-muted text-muted-foreground'
                    }`}>{r.status}</span>
                    {' '}· {timeAgo(r.created_at)}
                  </p>
                </div>
                {tab === 'received' && r.status === 'pending' && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleAccept(r.id)} disabled={actingId === r.id}
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDecline(r.id)} disabled={actingId === r.id}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

## Verification

1. Run `cd web && npx tsc --noEmit --pretty 2>&1 | head -20` — expect no new errors
2. Commit: `git add web/src/pages/tenant/RoommateProfile.tsx web/src/pages/tenant/RoommateRequests.tsx && git commit -m "feat: add tenant Roommate Profile and Requests pages"`

## Global Constraints

- Catch blocks use type assertion
- Icons from `lucide-react` only
- Uses `timeAgo` from `@/lib/utils`
- Uses `LAGOS_LGAS` from `@/constants/lgas`
