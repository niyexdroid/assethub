import { useCallback, useEffect, useState } from 'react'
import { Users, Send } from 'lucide-react'
import { roommatesService, type RoommateRequest } from '@/services/roommates.service'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'

export default function RoommatesListScreen() {
  const [requests, setRequests] = useState<RoommateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendingId, setSendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [received, sent] = await Promise.all([
        roommatesService.getReceivedRequests(),
        roommatesService.getSentRequests(),
      ])
      setRequests([...received, ...sent])
    } catch {
      setError('Could not load roommates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSendRequest = async (userId: string) => {
    setSendingId(userId)
    try {
      await roommatesService.sendRequest(userId)
      load()
    } catch {
      // silently fail
    } finally {
      setSendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  // Extract unique profiles from requests
  const seen = new Set<string>()
  const profiles = requests.reduce<Array<{ userId: string; name: string; bio?: string }>>((acc, r) => {
    const other = r.sender_id
    if (seen.has(other)) return acc
    seen.add(other)
    acc.push({
      userId: other,
      name: r.sender ? `${r.sender.first_name} ${r.sender.last_name}` : 'Unknown',
      bio: undefined,
    })
    return acc
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 text-foreground">Roommates</h1>
          <p className="text-sm text-muted-foreground mt-1">Find and connect with potential roommates</p>
        </div>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          title="No roommates found"
          description="Roommate matches will appear here when you have an active tenancy. Check back once your application is approved."
          icon={<Users className="w-12 h-12 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <div key={profile.userId} className="rounded-xl border bg-card p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                  {profile.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Looking for a roommate
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSendRequest(profile.userId)}
                disabled={sendingId === profile.userId}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                <Send className="w-4 h-4" />
                {sendingId === profile.userId ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
