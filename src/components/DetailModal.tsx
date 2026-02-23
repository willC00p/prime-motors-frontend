import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  type: 'agents' | 'branches' | 'models' | 'areas' | 'age' | 'officers' | 'units';
}

const COLORS = {
  blue: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0369a1'],
  green: ['#22c55e', '#4ade80', '#86efac'],
  yellow: ['#eab308', '#facc15', '#fde047'],
  red: ['#ef4444', '#f87171', '#fca5a5']
};

export default function DetailModal({ isOpen, onClose, title, data, type }: DetailModalProps) {
  const [unitsMonth, setUnitsMonth] = useState<string>('all');
  const unitRows = useMemo(() => {
    if (type !== 'units') return [];
    const stats: Record<string, Record<string, number>> = data?.branchMonthUnitStats || {};
    const rows = Object.entries(stats).map(([branch, months]) => {
      const totalUnits = Object.values(months || {}).reduce((s, v) => s + Number(v || 0), 0);
      const monthUnits = unitsMonth === 'all' ? totalUnits : Number((months || {})[unitsMonth] || 0);
      return { branch, totalUnits, monthUnits };
    });
    return rows.sort((a, b) => (b.monthUnits || 0) - (a.monthUnits || 0));
  }, [type, data, unitsMonth]);
  const unitMonths: string[] = useMemo(() => {
    if (type !== 'units') return [];
    const set = new Set<string>();
    const stats: Record<string, Record<string, number>> = data?.branchMonthUnitStats || {};
    Object.values(stats).forEach((m) => Object.keys(m || {}).forEach((k) => set.add(k)));
    return Array.from(set).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [type, data]);
  const renderDetailedContent = () => {
    switch (type) {
      case 'models':
        return (
          <div className="space-y-6">
            {data.map((model: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">{model.brand} - {model.model}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Sales by Age Group</h5>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={model.byAge}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="group" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => '₱' + value.toLocaleString()} />
                        <Bar dataKey="amount" fill="#0ea5e9">
                          {model.byAge.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">Sales by Area</h5>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={model.byArea}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="area" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => '₱' + value.toLocaleString()} />
                        <Bar dataKey="amount" fill="#22c55e">
                          {model.byArea.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS.green[index % COLORS.green.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'areas':
        return (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" />
                <YAxis />
                <Tooltip formatter={(value: number) => '₱' + value.toLocaleString()} />
                <Bar dataKey="amount" fill="#0ea5e9">
                  {data.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.map((item: any) => (
                <div key={item.area} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">{item.area}</h4>
                  <p className="text-blue-600 font-semibold">₱{item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'officers':
        return (
          <div className="space-y-8">
            {Object.entries(data).map(([role, officers]: [string, any]) => (
              <div key={role} className="space-y-4">
                <h4 className="text-lg font-semibold capitalize">{role}</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={officers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={role} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => '₱' + value.toLocaleString()} />
                    <Bar dataKey="amount" fill="#0ea5e9">
                      {officers.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        );
      case 'units':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Units Sold per Branch</div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Month</label>
                <select
                  className="text-sm border rounded-md px-2 py-1"
                  value={unitsMonth}
                  onChange={(e) => setUnitsMonth(e.target.value)}
                >
                  <option value="all">All time</option>
                  {unitMonths.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Branch</th>
                    <th className="py-2 pr-4">Units ({unitsMonth === 'all' ? 'All time' : unitsMonth})</th>
                    <th className="py-2 pr-4">Units (All time)</th>
                  </tr>
                </thead>
                <tbody>
                  {unitRows.map((r: any, idx: number) => (
                    <tr key={r.branch} className={idx % 2 ? 'bg-gray-50' : ''}>
                      <td className="py-2 pr-4">{idx + 1}</td>
                      <td className="py-2 pr-4 font-medium">{r.branch}</td>
                      <td className="py-2 pr-4">{r.monthUnits.toLocaleString()}</td>
                      <td className="py-2 pr-4">{r.totalUnits.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={type === 'agents' ? 'agent' : type === 'branches' ? 'branch' : 'group'} />
              <YAxis />
              <Tooltip formatter={(value: number) => '₱' + value.toLocaleString()} />
              <Bar 
                dataKey="amount" 
                fill={type === 'agents' ? '#0ea5e9' : type === 'branches' ? '#22c55e' : '#eab308'}
              >
                {data.map((_: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[type === 'agents' ? 'blue' : type === 'branches' ? 'green' : 'yellow'][index % 5]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl max-h-[85vh] overflow-y-auto transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  {renderDetailedContent()}
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
