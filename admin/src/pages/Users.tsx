import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api';
import Badge from '../components/Badge';

export default function Users() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role,    setRole]    = useState('');
  const [query,   setQuery]   = useState('');
  const [selected,setSelected]= useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/users', { params: { role: role || undefined } })
      .then(r => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [role]);

  const filtered = users.filter(u =>
    !query || `${u.first_name} ${u.last_name} ${u.phone_number} ${u.email ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const openDetail = async (u: any) => {
    try {
      const res = await api.get(`/admin/users/${u.id}`);
      setSelected(res.data);
    } catch { setSelected(u); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} total users</p>
        </div>
        <div className="flex gap-2">
          {['', 'tenant', 'landlord', 'admin'].map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
                ${role === r ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, phone, email..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Verified</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(u)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{u.first_name?.[0]}{u.last_name?.[0]}</span>
                      </div>
                      <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.phone_number}</td>
                  <td className="px-6 py-4"><Badge label={u.role} /></td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${u.is_verified ? 'text-green-600' : 'text-gray-400'}`}>
                      {u.is_verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{selected.first_name?.[0]}{selected.last_name?.[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selected.first_name} {selected.last_name}</p>
                  <Badge label={selected.role} />
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Phone',    selected.phone_number],
                ['Email',    selected.email ?? '—'],
                ['Verified', selected.is_verified ? 'Yes' : 'No'],
                ['KYC Status', selected.kyc_status ?? '—'],
                ['Package', selected.package_type ?? '—'],
                ['Active', selected.is_active ? 'Yes' : 'No'],
                ['Joined', new Date(selected.created_at).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="font-medium text-gray-900 capitalize">{v}</p>
                </div>
              ))}
            </div>
            {selected.kyc_rejection && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600"><strong>KYC Rejection:</strong> {selected.kyc_rejection}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
