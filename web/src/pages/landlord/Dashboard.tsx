import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Users, Wallet, AlertTriangle, Plus, Building2 } from 'lucide-react'
import { StatCard } from '@/components/custom/StatCard'
import { useAuthStore } from '@/stores/auth.store'
import { propertiesService, type Property } from '@/services/properties.service'
import { tenanciesService, type Tenancy as T } from '@/services/tenancies.service'
import { paymentsService, type PaymentTransaction } from '@/services/payments.service'
import { complaintsService, type Complaint } from '@/services/complaints.service'
import { formatNGNCompact, formatNGN, formatDate } from '@/lib/utils'
import { ErrorState } from '@/components/custom/ErrorState'

export default function DashboardScreen() {
  const { user } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [tenancies, setTenancies] = useState<T[]>([])
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [props, tens, pays, comps] = await Promise.allSettled([
        propertiesService.getLandlordProperties(),
        tenanciesService.getLandlordTenancies(),
        paymentsService.getHistory(),
        complaintsService.list(),
      ])
      if (props.status === 'fulfilled') setProperties(props.value)
      if (tens.status === 'fulfilled') setTenancies(tens.value)
      if (pays.status === 'fulfilled') setPayments(pays.value as PaymentTransaction[])
      if (comps.status === 'fulfilled') setComplaints(comps.value)
    } catch {
      setError('Could not load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const activeTenancies = tenancies.filter((t) => t.status === 'active')
  const pendingTenancies = tenancies.filter((t) => t.status === 'pending')
  const openComplaints = complaints.filter((c) => c.status === 'open' || c.status === 'in_progress')
  const thisMonthRevenue = payments
    .filter((p) => {
      const d = new Date(p.paid_at ?? p.created_at)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'success'
    })
    .reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">{greeting()}</p>
        <h1 className="text-h2 text-foreground">{user?.first_name ?? 'Landlord'}</h1>
      </div>

      {/* Revenue banner */}
      <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-brand-green to-brand-green-light text-white">
        <p className="text-sm opacity-80">This Month's Revenue</p>
        <p className="text-h1 mt-1">{formatNGNCompact(thisMonthRevenue)}</p>
        <p className="text-xs opacity-60 mt-1">
          {payments.filter((p) => p.status === 'success').length} successful payments
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Home}
          label="Properties"
          value={String(properties.length)}
          sub={`${properties.filter((p) => p.is_available).length} available`}
          color="#12A376"
        />
        <StatCard
          icon={Users}
          label="Tenants"
          value={String(activeTenancies.length)}
          sub={`${pendingTenancies.length} pending`}
          color="#F4A825"
        />
        <StatCard
          icon={Wallet}
          label="This Month"
          value={formatNGNCompact(thisMonthRevenue)}
          sub={`${payments.filter((p) => {
            const d = new Date(p.paid_at ?? p.created_at)
            return d.getMonth() === new Date().getMonth() && p.status === 'success'
          }).length} payments`}
          color="#12A376"
        />
        <StatCard
          icon={AlertTriangle}
          label="Complaints"
          value={String(openComplaints.length)}
          sub="Open"
          color="#F4A825"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/landlord/listings/create" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Listing
        </Link>
        <Link to="/landlord/listings" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors">
          <Building2 className="w-4 h-4" /> View Listings
        </Link>
      </div>

      {/* Recent tenancies */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h4 text-foreground">Recent Tenancies</h3>
          <Link to="/landlord/tenancies" className="text-sm text-primary font-medium hover:underline">View all</Link>
        </div>
        {tenancies.length === 0 ? (
          <div className="p-8 text-center rounded-xl border bg-card text-sm text-muted-foreground">
            No tenancies yet. List a property to get started.
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Property</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tenant</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Rent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenancies.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{t.property?.title ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.tenant?.first_name} {t.tenant?.last_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        t.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        t.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-muted text-muted-foreground'
                      }`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatNGN(t.yearly_amount ?? t.monthly_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent complaints */}
      {openComplaints.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4 text-foreground">Open Complaints</h3>
            <Link to="/landlord/complaints" className="text-sm text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {openComplaints.slice(0, 3).map((c) => (
              <Link key={c.id} to={`/landlord/complaints/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-all">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.category} • {formatDate(c.created_at)}</p>
                </div>
                {c.priority === 'high' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/10 text-destructive">High</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
