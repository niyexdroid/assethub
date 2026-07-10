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
