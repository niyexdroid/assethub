import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { api } from '../api';
import Badge from '../components/Badge';

export default function KYC() {
  const [list,    setList]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId,setRejectId]= useState<string | null>(null);
  const [reason,  setReason]  = useState('');
  const [acting,  setActing]  = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/kyc/pending')
      .then(r => setList(Array.isArray(r.data) ? r.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (userId: string) => {
    setActing(userId);
    try {
      await api.put(`/admin/kyc/${userId}/approve`);
      setList(prev => prev.filter(k => k.user_id !== userId));
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error'); }
    setActing('');
  };

  const reject = async () => {
    if (!rejectId || !reason.trim()) return;
    setActing(rejectId);
    try {
      await api.put(`/admin/kyc/${rejectId}/reject`, { reason });
      setList(prev => prev.filter(k => k.user_id !== rejectId));
      setRejectId(null);
      setReason('');
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error'); }
    setActing('');
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-sm text-gray-500 mt-1">{list.length} pending verification{list.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
            <p className="text-gray-500">All caught up — no pending KYC reviews</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">BVN</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">NIN</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map((k: any) => (
                <tr key={k.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{k.first_name} {k.last_name}</p>
                    <p className="text-xs text-gray-400">{k.phone_number}</p>
                  </td>
                  <td className="px-6 py-4"><Badge label={k.role} /></td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{k.type ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${k.bvn_verified ? 'text-green-600' : 'text-gray-400'}`}>
                      {k.bvn_verified ? 'Verified' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${k.nin_verified ? 'text-green-600' : 'text-gray-400'}`}>
                      {k.nin_verified ? 'Verified' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {k.student_id_url
                      ? <a href={k.student_id_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-xs hover:underline">
                          View <ExternalLink size={10} />
                        </a>
                      : <span className="text-gray-400 text-xs">—</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => approve(k.user_id)} disabled={acting === k.user_id} title="Approve"
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg disabled:opacity-40">
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => { setRejectId(k.user_id); setReason(''); }} title="Reject"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <XCircle size={16} />
                      </button>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject KYC</h3>
            <p className="text-sm text-gray-500 mb-4">The user will be notified with this reason.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="e.g. Document unclear, information mismatch..."
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
    </div>
  );
}
