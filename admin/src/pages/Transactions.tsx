import { useEffect, useState } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';

export default function Transactions() {
  const [txns,    setTxns]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');
  const [revenue, setRevenue] = useState<any[]>([]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/admin/transactions'),
      api.get('/admin/reports/revenue', { params: {
        from: new Date(Date.now() - 180 * 864e5).toISOString().split('T')[0],
        to:   new Date().toISOString().split('T')[0],
      }}),
    ]).then(([t, r]) => {
      if (t.status === 'fulfilled') setTxns(Array.isArray(t.value.data) ? t.value.data : []);
      if (r.status === 'fulfilled') setRevenue(Array.isArray(r.value.data) ? r.value.data : []);
      setLoading(false);
    });
  }, []);

  const totalRevenue = txns.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.platform_fee ?? 0), 0);
  const totalRent    = txns.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.amount ?? 0), 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Payment history and revenue reports</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Transactions', value: txns.length },
          { label: 'Total Rent Processed', value: `₦${totalRent.toLocaleString('en-NG')}` },
          { label: 'Platform Revenue',    value: `₦${totalRevenue.toLocaleString('en-NG')}` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : txns.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No transactions yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Landlord</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Platform Fee</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {txns.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{t.tenant_first} {t.tenant_last}</td>
                  <td className="px-6 py-4 text-gray-600">{t.landlord_first} {t.landlord_last}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">₦{Number(t.amount).toLocaleString('en-NG')}</td>
                  <td className="px-6 py-4 text-green-600 font-medium">₦{Number(t.platform_fee ?? 0).toLocaleString('en-NG')}</td>
                  <td className="px-6 py-4"><Badge label={t.status} /></td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
