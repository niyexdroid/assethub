import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [edits,    setEdits]    = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState('');
  const [saved,    setSaved]    = useState('');

  useEffect(() => {
    api.get('/admin/settings')
      .then(r => { setSettings(Array.isArray(r.data) ? r.data : []); })
      .catch(() => setSettings([]))
      .finally(() => setLoading(false));
  }, []);

  const save = async (key: string) => {
    const value = edits[key];
    if (value === undefined) return;
    setSaving(key);
    try {
      await api.put(`/admin/settings/${key}`, { value });
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
      setSaved(key);
      setTimeout(() => setSaved(''), 2000);
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error saving'); }
    setSaving('');
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage platform-wide configuration</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : settings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No settings found</div>
        ) : (
          settings.map(s => (
            <div key={s.key} className="px-6 py-5 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 font-mono">{s.key}</p>
                {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  defaultValue={s.value}
                  onChange={e => setEdits(prev => ({ ...prev, [s.key]: e.target.value }))}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button onClick={() => save(s.key)} disabled={saving === s.key || !(s.key in edits)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40
                    ${saved === s.key ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'}`}>
                  <Save size={14} />
                  {saved === s.key ? 'Saved' : saving === s.key ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
