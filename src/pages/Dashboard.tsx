import { useEffect, useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, 
  ResponsiveContainer, CartesianGrid, Legend, ComposedChart,
  Area, Line
} from 'recharts';
import DetailModal from '../components/DetailModal';
import { fetchApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { fetchRotatingPassword } from '../services/rotatingPasswordApi';

interface DashboardData {
  topAgents: Array<{agent: string; amount: number}>;
  topAgentsUnits?: Array<{agent: string; units: number}>;
  topFmo: Array<{fmo: string; amount: number; count: number}>;
  topBm: Array<{bm: string; amount: number; count: number}>;
  topMechanic: Array<{mechanic: string; amount: number; count: number}>;
  topBao: Array<{bao: string; amount: number; count: number}>;
  branchData: Array<{branch: string; amount: number}>;
  branchMonthStats: Record<string, Record<string, number>>;
  branchMonthUnitStats?: Record<string, Record<string, number>>;
  branchUnitsData?: Array<{branch: string; units: number}>;
  ageData: Array<{group: string; amount: number}>;
  areaData: Array<{area: string; amount: number}>;
  sourceData?: Array<{source: string; amount: number; count: number}>;
  topModels: Array<{
    model: string;
    brand: string;
    total: number;
    units?: number;
    byAge: Array<{group: string; amount: number}>;
    byArea: Array<{area: string; amount: number}>;
  }>;
  inventoryPie: Array<{status: string; value: number}>;
  monthlyData: Array<{month: string; amount: number}>;
  forecastData: Array<{
    month: string;
    amount?: number;
    forecast?: number;
    target: number;
    isTarget?: boolean;
  }>;
  totalSales: number;
  dealershipSales?: number;
  totalInventoryUnits: number;
  inventoryStatus: {
    available: number;
    sold: number;
    reserved?: number;
  };
}

const COLORS = {
  blue: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0369a1'],
  green: ['#39FF14', '#22c55e', '#4ade80', '#86efac'],
  yellow: ['#eab308', '#facc15', '#fde047'],
  red: ['#ef4444', '#f87171', '#fca5a5']
};

// using dialog via DetailModal component

type ModalContent = {
  title: string;
  data: any;
  type: 'agents' | 'branches' | 'models' | 'areas' | 'age' | 'officers' | 'units';
};

export default function Dashboard() {
  const { user } = useAuth();
  const [rotatingPassword, setRotatingPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  // Start dashboard in presentation mode by default; user can toggle back.
  const [presentationMode, setPresentationMode] = useState<boolean>(true);
  const [data, setData] = useState<DashboardData>({
    topAgents: [],
    topFmo: [],
    topBm: [],
    topMechanic: [],
    topBao: [],
    branchData: [],
    branchMonthStats: {},
    ageData: [],
    areaData: [],
    sourceData: [],
    topModels: [],
    inventoryPie: [],
    monthlyData: [],
    forecastData: [],
    totalSales: 0,
    totalInventoryUnits: 0,
    inventoryStatus: {
      available: 0,
      sold: 0
    }
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetchApi<DashboardData>('/dashboard');
        setData(response);
      } catch (e) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // Fetch rotating password if user is NSM/accounting
    if (user && (user.role === 'nsm' || user.role === 'accounting')) {
      fetchRotatingPassword().then(setRotatingPassword).catch(() => setRotatingPassword(null));
    }
  }, [user]);

  // Derive available months from branchMonthStats and default to latest
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    Object.values(data.branchMonthStats || {}).forEach((months) => {
      Object.keys(months || {}).forEach((m) => set.add(m));
    });
    return Array.from(set).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [data.branchMonthStats]);

  useEffect(() => {
    if (availableMonths.length && (selectedMonth === 'all' || !availableMonths.includes(selectedMonth))) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths]);

  // Compute branch data based on selected month (all-time vs specific month)
  const displayedBranchData = useMemo(
    () => {
      if (selectedMonth === 'all') return data.branchData || [];
      const stats = data.branchMonthStats || {};
      return Object.entries(stats).map(([branch, months]) => ({
        branch,
        amount: (months && months[selectedMonth]) ? months[selectedMonth] : 0,
      }));
    },
    [selectedMonth, data.branchData, data.branchMonthStats]
  );

  const sortedBranchData = useMemo(
    () => [...displayedBranchData].sort((a, b) => (b.amount || 0) - (a.amount || 0)),
    [displayedBranchData]
  );

  const branchChartHeight = Math.min(600, Math.max(260, 28 * sortedBranchData.length + 80));

  // Enrich top models with estimated units and per-unit SRP (based on canonical SRP map)
  const topModelsEnriched = useMemo(() => {
    return (data.topModels || []).map((m) => {
      const units = typeof m.units === 'number' && !isNaN(m.units) && m.units > 0 
        ? Math.round(m.units)
        : undefined;
      const perUnit = units ? Math.round(Number(m.total || 0) / units) : undefined;
      return { ...m, units, perUnit } as (typeof m & { units?: number; perUnit?: number });
    });
  }, [data.topModels]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-lg">Loading dashboard data...</div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900"><span className="neon-text">Sales & Inventory</span> Analytics Dashboard</h1>
        <div className="flex flex-col items-end gap-2">
          {/* Rotating password for NSM/accounting only */}
          {user && (user.role === 'nsm' || user.role === 'accounting') && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-2 rounded text-sm font-mono">
              <span className="font-bold">Today's Edit Password:</span> {rotatingPassword || 'Loading...'}
            </div>
          )}
          {/* Prominent toggle for presentation mode (default ON) */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={presentationMode}
              onChange={(e) => setPresentationMode(e.target.checked)}
            />
            Presentation mode
          </label>
          {presentationMode && (
            <button
              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
              onClick={() => setPresentationMode(false)}
              title="Exit presentation mode"
            >
              Exit Presentation Mode
            </button>
          )}
        </div>
      </div>
      
      {modalContent && (
        <DetailModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setModalContent(null);
          }}
          title={modalContent.title}
          data={modalContent.data}
          type={modalContent.type}
        />
      )}
      
  {/* Summary Cards (hidden in presentation mode) */}
      {!presentationMode && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 neon-bg">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Sales</h3>
          <p className="text-3xl font-bold" style={{ color: '#39FF14' }}>₱{data.totalSales.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">All time sales value</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 neon-bg">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Inventory Units</h3>
          <p className="text-3xl font-bold" style={{ color: '#39FF14' }}>{data.totalInventoryUnits.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Total units in inventory</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 neon-bg">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Available Units</h3>
          <p className="text-3xl font-bold" style={{ color: '#39FF14' }}>{data.inventoryStatus.available.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Ready for sale</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 neon-bg">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Dealership Sales</h3>
          <p className="text-3xl font-bold" style={{ color: '#39FF14' }}>₱{(data.totalSales * 1.20).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Total Sales + 20%</p>
        </div>
      </div>
      )}

      {/* Top Performers & Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sales Officers Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Sales Officers Performance</h2>
            <button 
              style={{ display: presentationMode ? 'none' : undefined }}
              onClick={() => {
                setModalContent({
                  title: 'Sales Officers Performance Details',
                  data: {
                    fmo: data.topFmo,
                    bm: data.topBm,
                    mechanic: data.topMechanic,
                    bao: data.topBao
                  },
                  type: 'officers'
                });
                setModalOpen(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <select 
                className="w-full border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  // This would be used to switch between different officer types
                  console.log(e.target.value);
                }}
              >
                <option value="fmo">Field Marketing Officers (FMO)</option>
                <option value="bm">Branch Managers (BM)</option>
                <option value="mechanic">Mechanics</option>
                <option value="bao">Branch Admin Officers (BAO)</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topFmo.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="fmo" />
              <YAxis tickFormatter={(value) => presentationMode ? '' : `₱${(value/1000000).toFixed(1)}M`} tick={presentationMode ? false : true} axisLine={!presentationMode} tickLine={!presentationMode} width={presentationMode ? 0 : undefined} />
              <Tooltip 
                formatter={(value: number) => presentationMode 
                  ? ['', 'Sales Amount'] 
                  : ['₱' + Number(value).toLocaleString(), 'Sales Amount']}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
              />
              <Bar dataKey="amount" fill="#0ea5e9">
                {data.topFmo.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="col-span-2 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800">#1 Performer</div>
              <div className="text-lg font-semibold text-blue-900">{data.topFmo[0]?.fmo || 'N/A'}</div>
              <div className="text-sm text-blue-600" style={{ display: presentationMode ? 'none' : undefined }}>₱{data.topFmo[0]?.amount.toLocaleString() || '0'}</div>
            </div>
          </div>
        </div>

        {/* Top Agents Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Top Agents Performance</h2>
            <button 
              style={{ display: presentationMode ? 'none' : undefined }}
              onClick={() => {
                setModalContent({
                  title: 'Agent Performance Details',
                  data: data.topAgents,
                  type: 'agents'
                });
                setModalOpen(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.topAgents.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="agent" />
              <YAxis tickFormatter={(value) => presentationMode ? '' : `₱${(value/1000000).toFixed(1)}M`} tick={presentationMode ? false : true} axisLine={!presentationMode} tickLine={!presentationMode} width={presentationMode ? 0 : undefined} />
              <Tooltip 
                formatter={(value: number) => presentationMode 
                  ? ['', 'Sales Amount'] 
                  : ['₱' + Number(value).toLocaleString(), 'Sales Amount']}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
              />
              <Bar dataKey="amount" fill="#22c55e" barSize={30}>
                {data.topAgents.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.green[index % COLORS.green.length]} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="col-span-2 p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">#1 Agent</div>
              <div className="text-lg font-semibold text-green-900">{data.topAgents[0]?.agent || 'N/A'}</div>
              <div className="text-sm text-green-600" style={{ display: presentationMode ? 'none' : undefined }}>₱{data.topAgents[0]?.amount.toLocaleString() || '0'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Areas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Top Areas</h2>
            <button 
              style={{ display: presentationMode ? 'none' : undefined }}
              onClick={() => {
                setModalContent({
                  title: 'Sales by Area',
                  data: data.areaData,
                  type: 'areas'
                });
                setModalOpen(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.areaData.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="area" />
              <YAxis hide={presentationMode} tick={!presentationMode} axisLine={!presentationMode} tickLine={!presentationMode} />
              <Tooltip formatter={(value: number) => presentationMode ? '' : '₱' + Number(value).toLocaleString()} />
              <Bar dataKey="amount" fill="#0ea5e9">
                {data.areaData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performing Agents */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Top Performing Agents</h2>
            <button 
              style={{ display: presentationMode ? 'none' : undefined }}
              onClick={() => {
                setModalContent({
                  title: 'Agent Performance Details',
                  data: data.topAgents,
                  type: 'agents'
                });
                setModalOpen(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topAgents}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="agent" />
              <YAxis hide={presentationMode} />
              <Tooltip 
                formatter={(value: number) => presentationMode 
                  ? ['', 'Sales Amount'] 
                  : ['₱' + Number(value).toLocaleString(), 'Sales Amount']}
              />
              <Bar dataKey="amount" fill="#0ea5e9">
                {data.topAgents.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Agents by Units */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Top Agents by Units</h2>
            <button 
              style={{ display: presentationMode ? 'none' : undefined }}
              onClick={() => {
                setModalContent({
                  title: 'Agent Units Details',
                  // map to the same shape the modal expects
                  data: (data.topAgentsUnits || []).map(a => ({ agent: a.agent, amount: a.units })),
                  type: 'agents'
                });
                setModalOpen(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(data.topAgentsUnits || []).slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="agent" />
              <YAxis hide={presentationMode} />
              <Tooltip 
                formatter={(value: number) => presentationMode 
                  ? ['', 'Units'] 
                  : [Number(value).toLocaleString() + ' units', 'Units']}
              />
              <Bar dataKey="units" fill="#49f50bff">
                {(data.topAgentsUnits || []).map((_, index) => (
                  <Cell key={`cell-units-${index}`} fill={COLORS.green[index % COLORS.yellow.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Branch */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Sales by Branch</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Month</label>
              <select
                className="text-sm border rounded-md px-2 py-1"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">All time</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 620 }}>
            <ResponsiveContainer width="100%" height={branchChartHeight}>
              <BarChart data={sortedBranchData} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(value) => presentationMode ? '' : `₱${(value/1000000).toFixed(1)}M`} tick={presentationMode ? false : true} axisLine={!presentationMode} tickLine={!presentationMode} width={presentationMode ? 0 : undefined} />
                <YAxis type="category" dataKey="branch" width={140} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => presentationMode ? '' : '₱' + Number(value).toLocaleString()} />
                <Bar dataKey="amount" name={selectedMonth === 'all' ? 'Total' : selectedMonth} barSize={18}>
                  {sortedBranchData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Models */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Top Models</h2>
            <button 
              style={{ display: presentationMode ? 'none' : undefined }}
              onClick={() => {
                setModalContent({
                  title: 'Model Performance Analysis',
                  data: data.topModels,
                  type: 'models'
                });
                setModalOpen(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={topModelsEnriched.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="model" />
              <YAxis yAxisId="left" tickFormatter={(v) => presentationMode ? '' : `₱${Number(v/1000).toFixed(0)}k`} tick={presentationMode ? false : true} axisLine={!presentationMode} tickLine={!presentationMode} width={presentationMode ? 0 : undefined} />
              <YAxis yAxisId="right" orientation="right" tick={presentationMode ? false : true} axisLine={!presentationMode} tickLine={!presentationMode} width={presentationMode ? 0 : undefined} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (presentationMode) return ['', name];
                  if (name === 'total') return ['₱' + Number(value).toLocaleString(), 'Sales Amount'];
                  if (name === 'units') return [Number(value).toLocaleString() + ' units', 'Units'];
                  return [String(value), name];
                }}
                labelFormatter={(label: string, payload: any) => {
                  if (presentationMode) return label;
                  const first = (payload && payload[0] && payload[0].payload) || {};
                  const perUnit = first.perUnit ? ` • Per Unit: ₱${Number(first.perUnit).toLocaleString()}` : '';
                  return `${label}${perUnit}`;
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="total" name="Sales" fill="#22c55e" barSize={30}>
                {topModelsEnriched.map((_, index) => (
                  <Cell key={`cell-model-${index}`} fill={COLORS.green[index % COLORS.green.length]} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="units" name="Units" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4, fill: '#a78bfa' }} />
            </ComposedChart>
          </ResponsiveContainer>
          {!presentationMode && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            {topModelsEnriched.slice(0,5).map(m => (
              <div key={m.model} className="flex items-center justify-between">
                <span className="truncate">{m.model}</span>
                <span className="ml-2 whitespace-nowrap">
                  {typeof m.perUnit === 'number' ? `Per unit: ₱${m.perUnit.toLocaleString()}` : 'Per unit: —'}
                  {typeof m.units === 'number' ? ` • Units: ${m.units.toLocaleString()}` : ''}
                </span>
              </div>
            ))}
          </div>)}
        </div>

        {/* Age Demographics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Sales by Age Group</h2>
            <button 
              style={{ display: presentationMode ? 'none' : undefined }}
              onClick={() => {
                setModalContent({
                  title: 'Age Demographics Analysis',
                  data: data.ageData,
                  type: 'age'
                });
                setModalOpen(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="group" />
              <YAxis hide={presentationMode} />
              <Tooltip 
                formatter={(value: number) => presentationMode 
                  ? ['', 'Sales Amount'] 
                  : ['₱' + Number(value).toLocaleString(), 'Sales Amount']}
              />
              <Bar dataKey="amount" fill="#22c55e">
                {data.ageData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.green[index % COLORS.green.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source of Sales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Source of Sales</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.sourceData || []}
                nameKey="source"
                dataKey="amount"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={presentationMode ? false : (({ source, percent }) => `${source} (${(percent ? (percent * 100).toFixed(0) : 0)}%)`)}
              >
                {(data.sourceData || []).map((entry, index) => (
                  <Cell 
                    key={`cell-source-${index}`} 
                    fill={
                      entry.source === 'AGENT' ? COLORS.blue[0] :
                      entry.source === 'WALK-IN' ? COLORS.green[0] :
                      entry.source === 'SOCIAL MEDIA' ? COLORS.yellow[0] :
                      entry.source === 'INHOUSE' ? COLORS.red[0] :
                      '#9CA3AF'
                    } 
                  />
                ))}
              </Pie>
              {presentationMode ? <Tooltip formatter={() => ''} /> : <Tooltip formatter={(value: number) => '₱' + Number(value).toLocaleString()} />}
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          {!presentationMode && (
            <div className="mt-4 space-y-2">
              {(data.sourceData || []).map((source) => (
                <div key={source.source} className="flex justify-between text-sm">
                  <span className="text-gray-600">{source.source}</span>
                  <span className="font-medium">
                    {source.count} sales • ₱{source.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Status (no reserved) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.inventoryPie}
                nameKey="status"
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={presentationMode ? false : (({ status, percent }) => `${status} (${(percent ? (percent * 100).toFixed(0) : 0)}%)`)}
              >
                {data.inventoryPie.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.status === 'available' ? COLORS.green[0] : COLORS.red[0]} 
                  />
                ))}
              </Pie>
              {presentationMode ? <Tooltip formatter={() => ''} /> : <Tooltip />}
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      {/* Branch Monthly Performance */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Branch Monthly Performance</h2>
          <div className="flex items-center gap-4">
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                style={{ display: presentationMode ? 'none' : undefined }}
                onClick={() => {
                  setModalContent({
                    title: 'Units Sold by Branch',
                    data: { branchMonthUnitStats: data.branchMonthUnitStats },
                    type: 'units'
                  });
                  setModalOpen(true);
                }}
              >
                View Units
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Branch</label>
                <select 
                  className="text-sm border rounded-md px-2 py-1"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="all">All Branches</option>
                  {data.branchData.map(b => (
                    <option key={b.branch} value={b.branch}>{b.branch}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Month</label>
                <select
                  className="text-sm border rounded-md px-2 py-1"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="all">All time</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={(() => {
                  const entries = Object.entries(data.branchMonthStats || {});
                  const filtered = selectedBranch === 'all' 
                    ? entries 
                    : entries.filter(([branch]) => branch === selectedBranch);
                  return filtered.map(([branch, months]) => {
                    const sorted = Object.entries(months || {})
                      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
                    const lastSix = sorted.slice(-6);
                    const total = lastSix.reduce((sum, [, val]) => sum + (val || 0), 0);
                    const average = lastSix.length ? total / lastSix.length : 0;
                    const monthValue = selectedMonth === 'all'
                      ? Object.values(months || {}).reduce((s, v) => s + (v || 0), 0)
                      : (months && months[selectedMonth]) || 0;
                    // Units
                    const unitMonths = (data.branchMonthUnitStats && data.branchMonthUnitStats[branch]) || {};
                    const totalUnits = Object.values(unitMonths).reduce((s: number, v: any) => s + Number(v || 0), 0);
                    const monthUnits = selectedMonth === 'all' ? totalUnits : Number(unitMonths[selectedMonth] || 0);
                    return { branch, average, monthValue, monthUnits, totalUnits };
                  });
                })()}
                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="branch"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => presentationMode ? '' : `₱${(value/1000000).toFixed(1)}M`}
                tick={presentationMode ? false : true}
                axisLine={!presentationMode}
                tickLine={!presentationMode}
                width={presentationMode ? 0 : undefined}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => presentationMode ? '' : `${value}`}
                tick={presentationMode ? false : true}
                axisLine={!presentationMode}
                tickLine={!presentationMode}
                width={presentationMode ? 0 : undefined}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (presentationMode) return ['', name];
                  if (name.toLowerCase().includes('unit')) return [`${Number(value).toLocaleString()} units`, 'Units'];
                  return `₱${Number(value).toLocaleString()}`;
                }}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
              />
              <Legend />
              <Bar 
                dataKey="average" 
                fill="#0ea5e9"
                name="Monthly Average"
                barSize={30}
              >
                {data.branchData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                ))}
              </Bar>
                <Bar
                  dataKey="monthValue"
                  fill="#22c55e"
                  name={selectedMonth === 'all' ? 'All time' : `Selected Month (${selectedMonth})`}
                  barSize={30}
                />
                <Line
                  type="monotone"
                  dataKey="monthUnits"
                  yAxisId="right"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#a78bfa' }}
                  name={selectedMonth === 'all' ? 'Units (all time)' : `Units (${selectedMonth})`}
                />
                <Line
                  type="monotone"
                  dataKey="totalUnits"
                  yAxisId="right"
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                  name="Units (all time)"
                />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {data.branchData.slice(0, 4).map(branch => (
            <div key={branch.branch} className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600">{branch.branch}</div>
              <div className="text-lg font-bold text-gray-900" style={{ display: presentationMode ? 'none' : undefined }}>₱{branch.amount.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Last Month Sales</div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Sales Forecast (Full Width) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Sales Performance & Forecast</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span>Actual Sales</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Forecast</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
              <span>Target (30/branch)</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data.forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.split(' ').join('\n')}
            />
            <YAxis
              tickFormatter={(value) => presentationMode ? '' : `₱${(value/1000000).toFixed(1)}M`}
              tick={presentationMode ? false : true}
              axisLine={!presentationMode}
              tickLine={!presentationMode}
              width={presentationMode ? 0 : undefined}
            />
            <Tooltip 
              formatter={(value: number, name: string) => presentationMode ? ['', name] : [
                '₱' + Number(value).toLocaleString(),
                name === 'amount' ? 'Actual Sales' : 
                name === 'forecast' ? 'Next Month Forecast' : 
                'Target (30/branch)'
              ]}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="target"
              fill="rgba(229, 231, 235, 0.5)"
              stroke="#9CA3AF"
              strokeDasharray="3 3"
              name="Target (30/branch)"
              fillOpacity={0.3}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
              name="Actual Sales"
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="forecast" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
              name="Next Month Forecast"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
        {!presentationMode && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-700">Current Month Income</h3>
            <p className="text-2xl font-bold text-blue-600">
              ₱{(data.forecastData[data.forecastData.length - 2]?.amount || 0).toLocaleString()}
            </p>
            <p className="text-sm text-blue-600">Actual Sales</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-700">Remaining to Target</h3>
            <p className="text-2xl font-bold text-yellow-700">
              {(() => {
                const current = data.forecastData[data.forecastData.length - 2]?.amount || 0;
                const target = data.forecastData[data.forecastData.length - 2]?.target 
                  || data.forecastData[data.forecastData.length - 1]?.target 
                  || 0;
                const remaining = Math.max(0, Number(target) - Number(current));
                return `₱${remaining.toLocaleString()}`;
              })()}
            </p>
            <p className="text-sm text-yellow-700">This Month Remaining</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700">Monthly Forecast</h3>
            <p className="text-2xl font-bold text-gray-600">
              ₱{(data.forecastData[data.forecastData.length - 1]?.target || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">30 Sales/Branch</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700">Performance</h3>
            <p className="text-2xl font-bold text-gray-600">
              {Math.round((data.forecastData[data.forecastData.length - 2]?.amount || 0) / 
                (data.forecastData[data.forecastData.length - 2]?.target || 1) * 100)}%
            </p>
            <p className="text-sm text-gray-600">vs Target</p>
          </div>
        </div>)}
      </div>

      {/* Interactive KPI Dashboard (hidden in presentation mode) */}
      {!presentationMode && (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sales Performance */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Sales Performance</h3>
              <div className="text-3xl font-bold text-blue-600 mb-1">₱{data.totalSales.toLocaleString()}</div>
              <div className="text-sm text-blue-600">Total Sales Value</div>
            </div>
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg bg-white border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setModalContent({
                    title: 'Top Performers',
                    data: data.topAgents,
                    type: 'agents'
                  });
                  setModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Top Agent</div>
                    <div className="text-lg font-semibold text-gray-900">{data.topAgents[0]?.agent || 'N/A'}</div>
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    ₱{data.topAgents[0]?.amount.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ 
                    width: `${(data.topAgents[0]?.amount / data.totalSales * 100) || 0}%` 
                  }}></div>
                </div>
              </div>

              <div 
                className="p-4 rounded-lg bg-white border border-green-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setModalContent({
                    title: 'Branch Performance',
                    data: data.branchData,
                    type: 'branches'
                  });
                  setModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Top Branch</div>
                    <div className="text-lg font-semibold text-gray-900">{data.branchData[0]?.branch || 'N/A'}</div>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    ₱{data.branchData[0]?.amount.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ 
                    width: `${(data.branchData[0]?.amount / data.totalSales * 100) || 0}%` 
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Overview */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-2">Inventory Status</h3>
              <div className="text-3xl font-bold text-green-600 mb-1">{data.totalInventoryUnits.toLocaleString()}</div>
              <div className="text-sm text-green-600">Total Units</div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Stock Status</div>
                  <div className="text-sm font-medium text-green-600">
                    {Math.round((data.inventoryStatus.available / data.totalInventoryUnits) * 100)}% Available
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ 
                    width: `${(data.inventoryStatus.available / data.totalInventoryUnits) * 100}%` 
                  }}></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-lg font-semibold text-green-600">{data.inventoryStatus.available}</div>
                    <div className="text-xs text-green-600">Available</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-lg font-semibold text-blue-600">{data.inventoryStatus.sold}</div>
                    <div className="text-xs text-blue-600">Sold</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demographics & Models */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">Top Model Performance</h3>
              <div className="text-xl font-bold text-yellow-700 mb-1">{data.topModels[0]?.model || 'N/A'}</div>
              <div className="text-sm text-yellow-600">Best Selling Model</div>
            </div>
            <div 
              className="p-4 rounded-lg bg-white border border-yellow-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setModalContent({
                  title: 'Age Demographics',
                  data: data.ageData,
                  type: 'age'
                });
                setModalOpen(true);
              }}
            >
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Age Demographics</h4>
              {data.ageData.slice(0, 3).map(({ group, amount }, index) => (
                <div key={group} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{group}</span>
                    <span className="font-medium">₱{amount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-yellow-400' : 'bg-yellow-300'
                      }`}
                      style={{ width: `${(amount / data.totalSales * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
