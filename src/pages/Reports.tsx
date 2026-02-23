import { useEffect, useState } from 'react';
import { api } from '../services/api';

type Branch = { id: number; name: string };

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'all';

export default function Reports() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>('all');
  const [period, setPeriod] = useState<Period>('monthly');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Array<{ id: number; name: string }>>('/branches');
        setBranches(res || []);
      } catch (e) {
        console.error(e);
        setError('Failed to load branches');
      }
    })();
  }, []);

  // Date fields are enabled for all except 'all' to allow precise control

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      if (branchId !== 'all') params.set('branch_id', branchId);
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const selectedBranch = branches.find(b => String(b.id) === branchId)?.name || 'All';
      const filenameParts = [
        'sales-report',
        period,
        selectedBranch.replace(/\s+/g, '-').toLowerCase(),
        start || '',
        end || ''
      ].filter(Boolean);
      const filename = `${filenameParts.join('_')}.xlsx`;
      await api.getExcel(`/reports/sales/export?${params.toString()}`, filename);
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports Export</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="w-full border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Range</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={period === 'all'}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={period === 'all'}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Export Excel'}
          </button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          The generated workbook includes a Summary sheet (overview, by-branch, by-model) and a Details sheet (per sale item):
          date sold, branch, DR/SI, customer name & contact, address, payment method, category of sales, agent/FMO/BM/Mechanic/BAO,
          item brand/model/color, engine/chassis, qty, unit price, amount, and sale total.
        </p>
      </div>
    </div>
  );
}
