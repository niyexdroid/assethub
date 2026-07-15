import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle2, AlertTriangle } from 'lucide-react'
import { complaintsService, type Complaint, type ComplaintMessage } from '@/services/complaints.service'
import { ErrorState } from '@/components/custom/ErrorState'
import { formatDate, timeAgo } from '@/lib/utils'

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [messages, setMessages] = useState<ComplaintMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState<'escalate' | 'resolve' | null>(null)
  const [actionError, setActionError] = useState('')
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [c, m] = await Promise.all([
        complaintsService.getById(id),
        complaintsService.getMessages(id),
      ])
      setComplaint(c)
      setMessages(m)
    } catch {
      setError('Could not load complaint.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!id || !reply.trim()) return
    setSending(true)
    try {
      const msg = await complaintsService.addMessage(id, reply.trim())
      setMessages((prev) => [...prev, msg])
      setReply('')
    } catch {
      setSendError('Failed to send message. Try again.')
    } finally {
      setSending(false)
    }
  }

  const handleAction = async (action: 'escalate' | 'resolve') => {
    if (!id) return
    setActionLoading(action)
    setActionError('')
    try {
      if (action === 'escalate') await complaintsService.escalate(id)
      else await complaintsService.resolve(id)
      const updated = await complaintsService.getById(id)
      setComplaint(updated)
    } catch (err) {
      setActionError((err as any)?.response?.data?.message ?? (err as any)?.message ?? `Failed to ${action}.`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!complaint) return <ErrorState message="Complaint not found." />

  const statusColor: Record<string, string> = {
    open: 'bg-blue-500/10 text-blue-600',
    in_progress: 'bg-amber-500/10 text-amber-600',
    resolved: 'bg-emerald-500/10 text-emerald-600',
    escalated: 'bg-destructive/10 text-destructive',
  }

  const priorityColor: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-amber-500/10 text-amber-600',
    high: 'bg-destructive/10 text-destructive',
  }

  const canAct = complaint.status !== 'resolved'

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/landlord/complaints" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to complaints
          </Link>
          <h1 className="text-h2 text-foreground">{complaint.title}</h1>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`px-3 py-1 rounded-lg text-sm font-semibold capitalize ${statusColor[complaint.status] ?? 'bg-muted text-muted-foreground'}`}>
          {complaint.status.replace('_', ' ')}
        </span>
        <span className={`px-3 py-1 rounded-lg text-sm font-semibold capitalize ${priorityColor[complaint.priority] ?? 'bg-muted text-muted-foreground'}`}>
          {complaint.priority} priority
        </span>
        <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-muted text-muted-foreground capitalize">
          {complaint.category}
        </span>
      </div>

      {/* Description card */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          {complaint.creator ? (
            <span>Reported by {complaint.creator.first_name} {complaint.creator.last_name} · {formatDate(complaint.created_at)}</span>
          ) : (
            <span>Reported {formatDate(complaint.created_at)}</span>
          )}
          {complaint.property && <span> · {complaint.property.title}</span>}
        </div>
      </div>

      {/* Action buttons */}
      {canAct && (
        <div className="flex gap-2 mb-6">
          {complaint.status !== 'escalated' && (
            <button
              onClick={() => handleAction('escalate')}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 disabled:opacity-60"
            >
              <AlertTriangle className="w-4 h-4" />
              {actionLoading === 'escalate' ? 'Escalating...' : 'Escalate'}
            </button>
          )}
          <button
            onClick={() => handleAction('resolve')}
            disabled={actionLoading !== null}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            {actionLoading === 'resolve' ? 'Resolving...' : 'Resolve'}
          </button>
        </div>
      )}
      {actionError && (
        <p className="text-sm text-destructive mb-6 p-2 rounded-lg bg-destructive/10">{actionError}</p>
      )}

      {/* Messages */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Messages</h3>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {messages.map((m) => {
              const isMine = m.sender_id === complaint.created_by
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    isMine ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                      {m.sender ? `${m.sender.first_name} ${m.sender.last_name}` : 'Unknown'} · {timeAgo(m.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Reply input */}
      {sendError && (
        <p className="text-sm text-destructive mb-3 p-2 rounded-lg bg-destructive/10">{sendError}</p>
      )}
      {canAct && (
        <div className="flex gap-2">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type a reply..."
            className="flex-1 px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {sending ? <Send className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
