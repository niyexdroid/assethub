import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Save } from 'lucide-react'
import { roommatesService } from '@/services/roommates.service'
import type { RoommateProfile } from '@/types/roommate'
import { LAGOS_LGAS } from '@/constants/lgas'
import { formatNGN } from '@/lib/utils'
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
                  {profile?.budget_min ? formatNGN(profile.budget_min) : '—'} – {profile?.budget_max ? formatNGN(profile.budget_max) : '—'}
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
