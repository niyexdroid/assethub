import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { api } from '../api';
import Badge from '../components/Badge';

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-600 bg-red-50',
  high:     'text-orange-600 bg-orange-50',
  medium:   'text-yellow-600 bg-yellow-50',
  low:      'text-gray-600 bg-gray-100',
};

export default function Complaints() {
  const [list,     setList]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [resolveId,setResolveId]= useState<string | null>(null);
  const [notes,    setNotes]    = useState('');
  const [acting,   setActing]   = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/complaints')
      .then(r => setList(Array.isArray(r.data) ? r.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resolve = async () => {
    if (!resolveId || !notes.trim()) return;
    setActing(resolveId);
    try {
      await api.put(`/admin/complaints/${resolveId}/resolve`, { resolution_notes: notes });
      setList(prev => prev.filter(c => c.id !== resolveId));
      setResolveId(null);
      setNotes('');
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error'); }
    setActing('');
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Escalated Complaints</h1>
        <p className="text-sm text-gray-500 mt-1">{list.length} complaint{list.length !== 1 ? 's' : ''} needing attention</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
            <p className="text-gray-500">No escalated complaints</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Complaint</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Parties</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{c.subject}</p>
                    <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{c.property_title}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-600">{c.raised_first} {c.raised_last}</p>
                    <p className="text-xs text-gray-400">vs {c.against_first} {c.against_last}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${PRIORITY_COLOR[c.priority] ?? 'text-gray-600 bg-gray-100'}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4"><Badge label={c.status} /></td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setResolveId(c.id); setNotes(''); }}
                      className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark">
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {resolveId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resolve Complaint</h3>
            <p className="text-sm text-gray-500 mb-4">Both parties will be notified with your resolution.</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="Describe the resolution and outcome..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setResolveId(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={resolve} disabled={!notes.trim() || acting === resolveId}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
