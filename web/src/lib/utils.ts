import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Currency ──────────────────────────────────────
export function formatNGN(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0)
  if (!Number.isFinite(n)) return '₦0'
  return '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatNGNCompact(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0)
  if (!Number.isFinite(n)) return '₦0'
  if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return '₦' + (n / 1_000).toFixed(0) + 'k'
  return formatNGN(n)
}

// ── Dates ─────────────────────────────────────────
export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Misc ──────────────────────────────────────────
export function getInitials(first?: string, last?: string): string {
  const a = first?.charAt(0) ?? ''
  const b = last?.charAt(0) ?? ''
  return (a + b).toUpperCase() || '?'
}

export function getErrorMessage(error: any): string {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.code === 'ECONNABORTED') return 'Request timed out. Check your connection.'
  if (error?.message === 'Network Error') return 'Could not reach the server. Check your connection.'
  return 'Something went wrong. Please try again.'
}
