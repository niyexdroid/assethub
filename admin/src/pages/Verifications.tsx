import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { api } from '../api';
import Badge from '../components/Badge';

const TYPE_LABELS: Record<string, string> = {
  utility_bill: 'Utility Bill',
  land_registry: 'Land Registry',
  property_title: 'Property Title',
};

export default function Verifications() {
  const [list,    setList]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [rejectId,setRejectId]= useState<string | null>(null);
  const [reason,  setReason]  = useState('');
  const [acting,  setActing]  = useState<Set<string>>(new Set());

  const load = () => {
    setError('');
    api.get('/verifications/pending')
      .then(r => setList(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Failed to load verifications. Check your connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setActing(prev => new Set(prev).add(id));
    try {
      await api.put(`/verifications/${id}/approve`);
      setList(prev => prev.filter(v => v.id !== id));
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error'); }
    setActing(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const reject = async () => {
    if (!rejectId || !reason.trim()) return;
    setActing(prev => new Set(prev).add(rejectId));
    try {
      await api.put(`/verifications/${rejectId}/reject`, { reason });
      setList(prev => prev.filter(v => v.id !== rejectId));
      setRejectId(null);
      setReason('');
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error'); }
    setActing(prev => { const next = new Set(prev); next.delete(rejectId); return next; });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Landlord Verifications</h1>
        <p className="text-sm text-gray-500 mt-1">{list.length} pending verification{list.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-4 mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
            <span>{error}</span>
            <button onClick={load} className="ml-auto text-red-700 underline text-xs">Retry</button>
          </div>
        )}
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : !error && list.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
            <p className="text-gray-500">All caught up — no pending landlord verifications</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Landlord</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{v.landlord_name}</p>
                    <p className="text-xs text-gray-400">{v.landlord_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge label={TYPE_LABELS[v.verification_type] ?? v.verification_type} />
                  </td>
                  <td className="px-6 py-4">
                    {v.document_url
                      ? <a href={v.document_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-xs hover:underline">
                          View Document <ExternalLink size={10} />
                        </a>
                      : <span className="text-gray-400 text-xs">—</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => approve(v.id)} disabled={acting.has(v.id)} title="Approve"
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg disabled:opacity-40">
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => { setRejectId(v.id); setReason(''); }} title="Reject"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Verification</h3>
            <p className="text-sm text-gray-500 mb-4">The landlord will be notified with this reason.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} minLength={10}
              placeholder="Minimum 10 characters — e.g. Document unclear, information mismatch..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none mb-4" />
            {reason.length > 0 && reason.length < 10 && (
              <p className="text-xs text-amber-600 -mt-3 mb-4">{10 - reason.length} more character{10 - reason.length !== 1 ? 's' : ''} required</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={reject} disabled={reason.length < 10 || acting.has(rejectId)}
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
