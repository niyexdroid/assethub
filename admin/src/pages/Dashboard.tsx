import { useEffect, useState } from 'react';
import { Building2, Users, CreditCard, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '../api';

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [props,  setProps]  = useState<any[]>([]);
  const [users,  setUsers]  = useState<any[]>([]);
  const [kyc,    setKyc]    = useState<any[]>([]);
  const [txns,   setTxns]   = useState<any[]>([]);
  const [comps,  setComps]  = useState<any[]>([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/admin/properties/pending'),
      api.get('/admin/users'),
      api.get('/admin/kyc/pending'),
      api.get('/admin/transactions'),
      api.get('/admin/complaints'),
    ]).then(([p, u, k, t, c]) => {
      if (p.status === 'fulfilled') setProps(p.value.data);
      if (u.status === 'fulfilled') setUsers(u.value.data);
      if (k.status === 'fulfilled') setKyc(k.value.data);
      if (t.status === 'fulfilled') setTxns(Array.isArray(t.value.data) ? t.value.data : t.value.data?.data ?? []);
      if (c.status === 'fulfilled') setComps(c.value.data);
      setLoading(false);
    });
  }, []);

  const totalRevenue = txns.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.platform_fee ?? 0), 0);
  const tenants   = users.filter(u => u.role === 'tenant').length;
  const landlords = users.filter(u => u.role === 'landlord').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of AssetHub platform activity</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard icon={Users}       label="Total Users"          value={users.length}     sub={`${tenants} tenants · ${landlords} landlords`} color="bg-blue-500" />
            <StatCard icon={Building2}   label="Pending Properties"   value={props.length}     sub="Awaiting approval"   color="bg-yellow-500" />
            <StatCard icon={ShieldCheck} label="Pending KYC"          value={kyc.length}       sub="Awaiting review"     color="bg-purple-500" />
            <StatCard icon={CreditCard}  label="Platform Revenue"     value={`₦${totalRevenue.toLocaleString('en-NG')}`} sub="All time"  color="bg-primary" />
            <StatCard icon={AlertTriangle} label="Escalated Complaints" value={comps.length}   sub="Need attention"      color="bg-red-500" />
            <StatCard icon={TrendingUp}  label="Transactions"         value={txns.length}      sub="All time"            color="bg-green-500" />
          </div>

          {/* Pending properties table */}
          {props.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Pending Property Approvals</h2>
                <a href="/properties" className="text-sm text-primary hover:underline">View all</a>
              </div>
              <div className="divide-y divide-gray-50">
                {props.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.lga} · {p.landlord_first} {p.landlord_last}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent users */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Users</h2>
              <a href="/users" className="text-sm text-primary hover:underline">View all</a>
            </div>
            <div className="divide-y divide-gray-50">
              {users.slice(0, 5).map((u: any) => (
                <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{u.first_name?.[0]}{u.last_name?.[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-gray-400">{u.phone_number}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium
                    ${u.role === 'landlord' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
