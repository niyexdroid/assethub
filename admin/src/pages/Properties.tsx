import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Ban, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';
import Badge from '../components/Badge';

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<'pending' | 'all'>('pending');
  const [rejectId,   setRejectId]   = useState<string | null>(null);
  const [reason,     setReason]     = useState('');
  const [acting,     setActing]     = useState('');
  const [selected,   setSelected]   = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const url = tab === 'pending' ? '/admin/properties/pending' : '/admin/properties';
      const res = await api.get(url);
      setProperties(Array.isArray(res.data) ? res.data : []);
    } catch { setProperties([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      await api.put(`/admin/properties/${id}/approve`);
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error'); }
    setActing('');
  };

  const reject = async () => {
    if (!rejectId || !reason.trim()) return;
    setActing(rejectId);
    try {
      await api.put(`/admin/properties/${rejectId}/reject`, { reason });
      setProperties(prev => prev.filter(p => p.id !== rejectId));
      setRejectId(null);
      setReason('');
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error'); }
    setActing('');
  };

  const suspend = async (id: string) => {
    if (!confirm('Suspend this property?')) return;
    setActing(id);
    try {
      await api.put(`/admin/properties/${id}/suspend`);
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error'); }
    setActing('');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage property listings</p>
        </div>
        <div className="flex gap-2">
          {(['pending', 'all'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${tab === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t === 'pending' ? 'Pending Approval' : 'All Properties'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No properties found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Landlord</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rent</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-gray-400 text-xs">{p.lga}, Lagos</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.landlord_first ?? p.landlord_first_name} {p.landlord_last ?? p.landlord_last_name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.monthly_rent ? `₦${Number(p.monthly_rent).toLocaleString('en-NG')}/mo` : ''}
                    {p.yearly_rent  ? `₦${Number(p.yearly_rent).toLocaleString('en-NG')}/yr`  : ''}
                  </td>
                  <td className="px-6 py-4"><Badge label={p.approval_status} /></td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(p)} title="View"
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Eye size={15} />
                      </button>
                      {p.approval_status === 'pending' && (
                        <>
                          <button onClick={() => approve(p.id)} disabled={acting === p.id} title="Approve"
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg disabled:opacity-40">
                            <CheckCircle size={15} />
                          </button>
                          <button onClick={() => { setRejectId(p.id); setReason(''); }} title="Reject"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {p.approval_status === 'approved' && (
                        <button onClick={() => suspend(p.id)} disabled={acting === p.id} title="Suspend"
                          className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg disabled:opacity-40">
                          <Ban size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Listing</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason — the landlord will be notified.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="e.g. Incomplete information, misleading photos..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={reject} disabled={!reason.trim() || acting === rejectId}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {selected.photos?.[0] && (
              <img src={selected.photos[0]} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Address', selected.address],
                ['LGA', selected.lga],
                ['Type', selected.property_type],
                ['Mode', selected.tenancy_mode],
                ['Bedrooms', selected.bedrooms],
                ['Bathrooms', selected.bathrooms],
                ['Monthly Rent', selected.monthly_rent ? `₦${Number(selected.monthly_rent).toLocaleString()}` : '—'],
                ['Yearly Rent', selected.yearly_rent ? `₦${Number(selected.yearly_rent).toLocaleString()}` : '—'],
                ['Caution Fee', selected.caution_fee ? `₦${Number(selected.caution_fee).toLocaleString()}` : '—'],
                ['Status', selected.approval_status],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="font-medium text-gray-900 capitalize">{v ?? '—'}</p>
                </div>
              ))}
            </div>
            {selected.description && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700">{selected.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
