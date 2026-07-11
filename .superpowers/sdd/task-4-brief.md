# Task 4: NewComplaint + ComplaintDetail Pages

## Goal

Create two complaint pages:
- `web/src/pages/tenant/NewComplaint.tsx` — complaint filing form
- `web/src/pages/tenant/ComplaintDetail.tsx` — message thread with reply input

## NewComplaint.tsx

Form with title, category (maintenance/utilities/security/noise/other), priority (low/medium/high), description. Submit via `complaintsService.create()`.

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { complaintsService } from '@/services/complaints.service'

const CATEGORIES = ['maintenance', 'utilities', 'security', 'noise', 'other']
const PRIORITIES = ['low', 'medium', 'high'] as const

export default function NewComplaintScreen() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('maintenance')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!description.trim()) { setError('Description is required.'); return }
    setSubmitting(true)
    setError('')
    try {
      const result = await complaintsService.create({
        title: title.trim(),
        category,
        priority,
        description: description.trim(),
      })
      navigate(`/complaints/${result.id}`)
    } catch (err) {
      setError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Could not file complaint.')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-h2 text-foreground mb-6">New Complaint</h1>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Title</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Leaking faucet in kitchen"
            className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button key={p} onClick={() => setPriority(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  priority === p
                    ? p === 'high' ? 'bg-destructive text-destructive-foreground'
                    : p === 'medium' ? 'bg-amber-500 text-white'
                    : 'bg-muted-foreground text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Description</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive p-3 rounded-lg bg-destructive/10">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
          {submitting ? 'Submitting...' : 'File Complaint'}
        </button>
      </div>
    </div>
  )
}
```

## ComplaintDetail.tsx

Fetches complaint + messages by ID. Thread view with original complaint + replies. Reply input at bottom (hidden if resolved). Uses `complaintsService.getById()`, `complaintsService.getMessages()`, `complaintsService.addMessage()`.

```tsx
import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, AlertTriangle, Clock, CheckCircle2, MessageSquare } from 'lucide-react'
import { complaintsService, type Complaint, type ComplaintMessage } from '@/services/complaints.service'
import { ErrorState } from '@/components/custom/ErrorState'
import { timeAgo } from '@/lib/utils'

const statusIcon = (status: string) => {
  switch (status) {
    case 'open': return <AlertTriangle className="w-4 h-4 text-amber-500" />
    case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />
    case 'resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case 'escalated': return <AlertTriangle className="w-4 h-4 text-destructive" />
    default: return <MessageSquare className="w-4 h-4 text-muted-foreground" />
  }
}

const statusColor: Record<string, string> = {
  open: 'text-amber-600 bg-amber-500/10',
  in_progress: 'text-blue-600 bg-blue-500/10',
  resolved: 'text-emerald-600 bg-emerald-500/10',
  escalated: 'text-destructive bg-destructive/10',
}

export default function ComplaintDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [messages, setMessages] = useState<ComplaintMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [c, msgs] = await Promise.all([
        complaintsService.getById(id),
        complaintsService.getMessages(id),
      ])
      setComplaint(c)
      setMessages(msgs)
    } catch {
      setError('Could not load complaint.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleReply = async () => {
    if (!id || !reply.trim()) return
    setSending(true)
    setReplyError('')
    try {
      const msg = await complaintsService.addMessage(id, reply.trim())
      setMessages((prev) => [...prev, msg])
      setReply('')
    } catch (err) {
      setReplyError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Could not send reply.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!complaint) return <ErrorState message="Complaint not found." />

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/complaints" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to complaints
      </Link>

      <div className="rounded-xl border bg-card p-5 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-h4 font-semibold text-foreground">{complaint.title}</h1>
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold capitalize ${statusColor[complaint.status] ?? 'bg-muted text-muted-foreground'}`}>
            {statusIcon(complaint.status)}
            {complaint.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-muted capitalize">{complaint.category}</span>
          <span className={`font-semibold capitalize ${
            complaint.priority === 'high' ? 'text-destructive' : complaint.priority === 'medium' ? 'text-amber-500' : ''
          }`}>{complaint.priority} priority</span>
          <span>{timeAgo(complaint.created_at)}</span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {complaint.creator?.first_name?.charAt(0) ?? 'Y'}
            </div>
            <span className="text-sm font-medium text-foreground">You</span>
            <span className="text-xs text-muted-foreground">{timeAgo(complaint.created_at)}</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{complaint.description}</p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.sender_id !== complaint.created_by
          return (
            <div key={msg.id} className={`rounded-xl border p-4 ${isMe ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {msg.sender?.first_name?.charAt(0) ?? (isMe ? 'L' : '?')}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {msg.sender?.first_name ? `${msg.sender.first_name} ${msg.sender.last_name ?? ''}` : 'Landlord'}
                </span>
                <span className="text-xs text-muted-foreground">{timeAgo(msg.created_at)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
            </div>
          )
        })}
      </div>

      {complaint.status !== 'resolved' ? (
        <div className="rounded-xl border bg-card p-4">
          {replyError && <p className="text-sm text-destructive mb-3 p-2 rounded-lg bg-destructive/10">{replyError}</p>}
          <div className="flex gap-2">
            <input
              type="text" value={reply} onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              placeholder="Write a reply..."
              className="flex-1 h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={handleReply} disabled={sending || !reply.trim()}
              className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-muted-foreground">This complaint has been resolved.</div>
      )}
    </div>
  )
}
```

## Verification

1. Run `cd web && npx tsc --noEmit --pretty 2>&1 | head -20` — expect no new errors
2. Commit: `git add web/src/pages/tenant/NewComplaint.tsx web/src/pages/tenant/ComplaintDetail.tsx && git commit -m "feat: add tenant NewComplaint and ComplaintDetail pages"`

## Global Constraints

- Catch blocks use type assertion: `(err as any)?.response?.data?.message ?? (err as any)?.message ?? 'fallback'`
- Icons from `lucide-react` only
- Uses `timeAgo` from `@/lib/utils`
