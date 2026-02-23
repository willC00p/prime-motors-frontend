import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type Slide = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  bullets?: string[];
};

const slides: Slide[] = [
  {
    id: 'auth',
    title: 'Secure Authentication',
    subtitle: 'Roles, sessions, and protections',
    description:
      'Centralized Auth with role-based access controls keeps sensitive modules safe and lets you expose only the right features to the right users.',
    bullets: ['Role-based routes', 'Session management', 'ProtectedRoute wrapper']
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    subtitle: 'Accurate stock & movements',
    description:
      'This module is the canonical source of truth for vehicle stock across all branches. It stores inventory movements (receipts, transfers, sold quantities), per-unit records (engine/chassis/unit numbers), and pricing metadata (cost, SRP). Use it to replace siloed spreadsheets, paper logs, and manual cycle counts.',
    bullets: [
      'Per-unit tracking: engine + chassis + unit numbers',
      'Inventory movements: receive, transfer, sell',
      'Accurate ending_qty and sold_qty counters',
      'Branch-scoped inventories with cross-branch reconciliation',
    ]
  },
  {
    id: 'sales',
    title: 'Sales Workflow',
    subtitle: 'From order to invoice',
    description:
      'Create sales, attach items, update inventory, and generate invoices — all transactionally safe in the database.',
    bullets: ['Transactional sales create', 'Sales items + inventory updates', 'SI/DR tracking']
  },
  {
    id: 'reports',
    title: 'Reports & PDFs',
    subtitle: 'Export-ready summaries',
    description:
      'Build printable reports and PDFs (monthly loan reports, PO, sales summaries) with styled layouts suitable for presentations and accounting.',
    bullets: ['PDF generator', 'Monthly loan reports', 'PO & sales exports']
  },
  {
    id: 'analytics',
    title: 'Analytics & Dashboard',
    subtitle: 'Real-time KPIs for decision making',
    description:
      'Interactive dashboards surface the most important business metrics (sales, margins, inventory health) so managers can act quickly. Charts, trend lines, and branch comparisons remove guesswork and speed decisions.',
    bullets: [
      'Sales by day / month, top models',
      'Inventory turnover & aging',
      'Branch comparisons and alerts',
      'Gross margin and pricing intelligence'
    ]
  },
  {
    id: 'lto',
    title: 'LTO Registration',
    subtitle: 'Forms and management',
    description:
      'Integrated LTO registration forms allow capturing registration data, managing submissions, and coordinating with logistics.',
    bullets: ['Registration forms', 'Manager view', 'Export capability']
  },
  {
    id: 'audit',
    title: 'Audits & Seed Tools',
    subtitle: 'Data integrity utilities',
    description:
      'A collection of scripts and checks (seeders, audits, reconciliations) help keep branch data consistent and quickly recover from mismatches.',
    bullets: ['Seed scripts', 'Audit checks', 'Reconciliation helpers']
  },
  {
    id: 'ux',
    title: 'Modern UI & Theme',
    subtitle: 'Tailwind + responsive design',
    description:
      'A clean, responsive UI with Tailwind, neon accents for brand identity, accessible components, and a consistent layout across modules.',
    bullets: ['Responsive layouts', 'Tailwind theme', 'Accessible components']
  }
];

export default function InteractivePresentation() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [inventoryPreviewOpen, setInventoryPreviewOpen] = useState(false);
  const [inventoryPreviewLoading, setInventoryPreviewLoading] = useState(false);
  const [inventoryPreviewError, setInventoryPreviewError] = useState<string | null>(null);
  const [inventoryPreviewData, setInventoryPreviewData] = useState<any[]>([]);
  const [autoplay, setAutoplay] = useState(false);
  const [intervalMs, setIntervalMs] = useState(6000);
  const [expanded, setExpanded] = useState<Slide | null>(null);
  const autoplayRef = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') setAutoplay(a => !a);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (autoplay) {
      autoplayRef.current = window.setInterval(() => setIndex(i => (i + 1) % slides.length), intervalMs);
    } else {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [autoplay, intervalMs]);

  const next = () => setIndex(i => (i + 1) % slides.length);
  const prev = () => setIndex(i => (i - 1 + slides.length) % slides.length);

  async function fetchInventoryPreview() {
    setInventoryPreviewError(null);
    setInventoryPreviewLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/inventory`);
      if (!res.ok) throw new Error('Failed to fetch inventory preview: ' + res.statusText);
      const txt = await res.text();
      const data = JSON.parse(txt);
      // pick top 8 rows for preview
      setInventoryPreviewData(Array.isArray(data) ? data.slice(0, 8) : []);
      setInventoryPreviewOpen(true);
    } catch (err: any) {
      console.error('Preview error', err);
      setInventoryPreviewError(err?.message || String(err));
    } finally {
      setInventoryPreviewLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <header className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Interactive System Presentation</h2>
                <p className="text-sm text-gray-500">Use arrows, autoplay, or click a feature to highlight details.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  onClick={() => setAutoplay(a => !a)}
                >
                  {autoplay ? 'Stop' : 'Autoplay'}
                </button>
                <select
                  className="border rounded px-2 py-1"
                  value={String(intervalMs)}
                  onChange={(e) => setIntervalMs(Number(e.target.value))}
                >
                  <option value={4000}>4s</option>
                  <option value={6000}>6s</option>
                  <option value={9000}>9s</option>
                </select>
              </div>
            </header>

            <main>
              <article className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="rounded-md overflow-hidden border">
                    <div className="p-6 bg-gradient-to-br from-slate-900 to-black text-white">
                      <h3 className="text-xl font-semibold">{slides[index].title}</h3>
                      {slides[index].subtitle && <p className="text-sm text-slate-300">{slides[index].subtitle}</p>}
                      <p className="mt-3 text-sm text-slate-200">{slides[index].description}</p>
                      {slides[index].bullets && (
                        <ul className="mt-3 list-disc pl-5 text-slate-200">
                          {slides[index].bullets!.map(b => <li key={b}>{b}</li>)}
                        </ul>
                      )}
                      {slides[index].id === 'analytics' && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white/10 p-3 rounded">
                            <div className="text-xs text-slate-300">Sales (30d)</div>
                            <div className="text-lg font-semibold">1,234</div>
                          </div>
                          <div className="bg-white/10 p-3 rounded">
                            <div className="text-xs text-slate-300">Inventory Turnover</div>
                            <div className="text-lg font-semibold">6.2</div>
                          </div>
                          <div className="bg-white/10 p-3 rounded">
                            <div className="text-xs text-slate-300">Aging &gt;90d</div>
                            <div className="text-lg font-semibold">12 units</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white">
                      <div className="flex items-center gap-2">
                        <button onClick={prev} className="px-3 py-2 bg-gray-100 rounded">Prev</button>
                        <button onClick={next} className="px-3 py-2 bg-gray-100 rounded">Next</button>
                        <button onClick={() => setExpanded(slides[index])} className="px-3 py-2 bg-neon text-black rounded">Focus</button>
                      </div>
                      <div className="text-sm text-gray-600">{index + 1} / {slides.length}</div>
                    </div>
                  </div>
                </div>

                <aside className="space-y-3">
                  <div className="bg-white p-4 rounded shadow">
                    <h4 className="font-semibold">Features</h4>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {slides.map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => setIndex(i)}
                          className={`text-left p-2 rounded border ${i === index ? 'border-neon bg-neon/10' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-gray-500">{s.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded shadow">
                    <h4 className="font-semibold">Quick Actions</h4>
                    <div className="mt-3 flex flex-col gap-2">
                      <button onClick={() => setIndex(0)} className="px-3 py-2 bg-gray-100 rounded">Show Auth</button>
                      <button onClick={() => setIndex(1)} className="px-3 py-2 bg-gray-100 rounded">Show Inventory</button>
                      <button onClick={() => setIndex(2)} className="px-3 py-2 bg-gray-100 rounded">Show Sales</button>
                      <button onClick={() => setIndex(slides.findIndex(s => s.id === 'analytics'))} className="px-3 py-2 bg-gray-100 rounded">Show Analytics</button>
                      <button onClick={() => navigate('/inventory')} className="px-3 py-2 bg-blue-50 rounded text-blue-700 text-left">Open Inventory Page</button>
                      <button onClick={() => navigate('/sales')} className="px-3 py-2 bg-blue-50 rounded text-blue-700 text-left">Open Sales Page</button>
                      <button onClick={() => navigate('/reports')} className="px-3 py-2 bg-blue-50 rounded text-blue-700 text-left">Open Reports Page</button>
                      <button onClick={() => navigate('/dashboard')} className="px-3 py-2 bg-blue-50 rounded text-blue-700 text-left">Open Dashboard</button>
                    </div>
                  </div>
                </aside>
              </article>
            </main>
          </div>
        </div>
      </div>

      {/* Expanded detail modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{expanded.title}</h3>
                {expanded.subtitle && <p className="text-sm text-gray-600">{expanded.subtitle}</p>}
              </div>
              <button onClick={() => setExpanded(null)} className="text-gray-500">Close</button>
            </div>
              <div className="mt-4 text-sm text-gray-700">
              <p>{expanded.description}</p>
              {expanded.bullets && (
                <ul className="mt-3 list-disc pl-5">
                  {expanded.bullets.map(b => <li key={b}>{b}</li>)}
                </ul>
              )}

              {/* Special enriched content for inventory slide */}
              {expanded.id === 'inventory' && (
                <div className="mt-4 border rounded p-3 bg-gray-50">
                  <h4 className="font-semibold">Inventory — deeper dive</h4>
                  <p className="text-sm text-gray-700 mt-2">The Inventory module removes the error-prone manual steps common with spreadsheets and paper systems. Instead of multiple Excel files per branch, each with unknown freshness, you get:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
                    <li>Single source of truth: a central inventory table with per-branch filtering eliminates conflicting counts.</li>
                    <li>Per-unit traceability: every physical unit has engine, chassis and unit_number fields stored and searchable — no more mismatched serials in paper logs.</li>
                    <li>Automated adjustments: sales and returns update inventory movements transactionally, so ending_qty and sold_qty always reconcile with sales data.</li>
                    <li>Auditable history: inventory_movements keep a chronological log (received, transferred, sold) for compliance and investigations.</li>
                    <li>Operational benefits: faster stocktakes, fewer lost units, correct pricing on sales, and reduced reconciliation time with accounting.</li>
                  </ul>

                  <h5 className="mt-3 font-semibold">Live preview</h5>
                  <p className="text-sm text-gray-600">Click the button to fetch a small inventory preview from your running backend (top 8 rows).</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => fetchInventoryPreview()}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                      disabled={inventoryPreviewLoading}
                    >
                      {inventoryPreviewLoading ? 'Loading…' : 'Show inventory preview'}
                    </button>
                    <button onClick={() => navigate('/inventory')} className="px-3 py-1 bg-gray-100 rounded">Open full Inventory</button>
                  </div>

                  {inventoryPreviewError && (
                    <div className="mt-3 text-red-600 text-sm">Error: {inventoryPreviewError}</div>
                  )}

                  {inventoryPreviewOpen && (
                    <div className="mt-3 overflow-auto">
                      <table className="min-w-full text-xs bg-white rounded border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-1 text-left">#</th>
                            <th className="px-2 py-1 text-left">Brand</th>
                            <th className="px-2 py-1 text-left">Model</th>
                            <th className="px-2 py-1 text-left">Available Units</th>
                            <th className="px-2 py-1 text-left">Item Code</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryPreviewData.length === 0 && (
                            <tr><td colSpan={5} className="px-2 py-2">No preview rows</td></tr>
                          )}
                          {inventoryPreviewData.map((inv, idx) => (
                            <tr key={inv.id || idx} className="border-t">
                              <td className="px-2 py-1 align-top">{idx + 1}</td>
                              <td className="px-2 py-1 align-top">{inv.items?.brand || inv.items?.brand || '-'}</td>
                              <td className="px-2 py-1 align-top">{inv.items?.model || '-'}</td>
                              <td className="px-2 py-1 align-top">{(inv.vehicle_units || []).filter((u: any) => u.status === 'available').length}</td>
                              <td className="px-2 py-1 align-top">{inv.items?.item_no || inv.id || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {/* Analytics deep-dive (inserted) */}
              {expanded.id === 'analytics' && (
                <div className="mt-4 border rounded p-3 bg-gray-50">
                  <h4 className="font-semibold">Analytics & Dashboard — deeper dive</h4>
                  <p className="text-sm text-gray-700 mt-2">Dashboards surface critical KPIs in one place so branch managers and executives make faster, evidence-based decisions instead of relying on stale spreadsheets.</p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
                    <li><strong>Sales Velocity:</strong> Daily and monthly sales trends, top-selling models, and week-over-week growth.</li>
                    <li><strong>Inventory Health:</strong> Turnover rate, aging stock, and units near reorder thresholds.</li>
                    <li><strong>Financial Signals:</strong> Gross margin, discounts applied, and effective pricing by branch.</li>
                    <li><strong>Operational Alerts:</strong> Low-stock, long-parked units, and branch discrepancies flagged automatically.</li>
                  </ul>

                  <h5 className="mt-3 font-semibold">Business impact</h5>
                  <ul className="list-disc pl-5 text-sm text-gray-700 mt-2">
                    <li>Reduce carrying costs by prioritizing slow-moving inventory for promotion or transfer.</li>
                    <li>Avoid stockouts and lost sales via branch-level reorder alerts.</li>
                    <li>Improve margin through price intelligence and tracked discount impact.</li>
                    <li>Save accounting time: automated monthly summaries and reconciled sales vs inventory.</li>
                  </ul>

                  <h5 className="mt-3 font-semibold">Sample data (chart-ready)</h5>
                  <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">{
`[
  { "date": "2025-10-01", "sales": 12 },
  { "date": "2025-10-02", "sales": 18 },
  { "date": "2025-10-03", "sales": 9 }
]
`
                  }</pre>

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => navigate('/dashboard')} className="px-3 py-1 bg-neon rounded text-black">Open Dashboard</button>
                    <button onClick={() => navigate('/reports')} className="px-3 py-1 bg-gray-100 rounded">View Reports</button>
                  </div>
                </div>
              )}
              {/* Examples and comparison */}
              <div className="mt-4 border rounded p-3 bg-gray-50">
                <h4 className="font-semibold">Real-world example</h4>
                <p className="text-sm text-gray-600 mt-2">Here is how this feature maps to real UX and data:</p>
                <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto text-xs">{
`// sample record
{ date_sold: '2025-10-12', agent: '${expanded.title.includes('Auth') ? 'ALFRED' : 'EFREN'}', model: '${expanded.title.includes('Inventory') ? 'P1 BOLT 150' : 'MONARCH 175'}', total_amount: 115000 }
`}
                </pre>

                <h5 className="mt-3 font-semibold">Why this beats spreadsheets & paper</h5>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2">
                  <li>Centralized, auditable transactions vs fragmented Excel files.</li>
                  <li>Automated inventory adjustments on sale vs manual counts prone to mistakes.</li>
                  <li>Printable, styled PDFs and reports instead of manually composing documents.</li>
                </ul>

                <div className="mt-3 flex gap-2">
                  <button onClick={() => navigate('/reports')} className="px-3 py-1 bg-neon rounded text-black">View Reports</button>
                  <button onClick={() => navigate('/dashboard')} className="px-3 py-1 bg-gray-100 rounded">Open Dashboard</button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => { setExpanded(null); }} className="px-4 py-2 bg-neon rounded text-black">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
