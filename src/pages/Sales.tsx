import React, { useEffect, useMemo, useState } from 'react';
import PasswordModal from '../components/PasswordModal';
import { fetchRotatingPassword } from '../services/rotatingPasswordApi';
import { useToast } from '../components/ToastProvider';
import { modelLoanTemplateApi } from '../services/modelLoanTemplateApi';
import type { ModelLoanTemplate } from '../types/LoanTemplate';

// API Base URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Small inline editor component for delivery status/date
const DeliveryEditor: React.FC<{
  sale: any;
  onSaved: (payload: { delivery_status?: string; delivery_date?: string | null }) => void;
}> = ({ sale, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string>(sale.delivery_status || 'pending');
  const [date, setDate] = useState<string | null>(sale.delivery_date ? new Date(sale.delivery_date).toISOString().slice(0,10) : null);

  const save = () => {
    setEditing(false);
    onSaved({ delivery_status: status, delivery_date: date });
  };

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <select className="border rounded px-2 py-1 text-xs" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pending">pending</option>
            <option value="delivered">delivered</option>
            <option value="cancelled">cancelled</option>
          </select>
          <input className="border rounded px-2 py-1 text-xs" type="date" value={date || ''} onChange={e => setDate(e.target.value || null)} />
          <button className="bg-green-600 text-white px-2 py-1 rounded text-xs" onClick={save}>Save</button>
          <button className="px-2 py-1 rounded text-xs" onClick={() => { setEditing(false); setStatus(sale.delivery_status || 'pending'); setDate(sale.delivery_date ? new Date(sale.delivery_date).toISOString().slice(0,10) : null); }}>Cancel</button>
        </>
      ) : (
        <>
          <span className="text-sm">{sale.delivery_status || 'pending'}</span>
          <button className="ml-2 px-2 py-1 border rounded text-xs" onClick={() => setEditing(true)}>Edit</button>
        </>
      )}
    </div>
  );
};

// Types for branch, inventory, vehicle unit, and sales
interface Branch {
  id: number;
  name: string;
  address: string;
}
interface VehicleUnit {
  id: number;
  unit_number: number;
  engine_no: string;
  chassis_no: string;
  status: 'available' | 'sold' | 'reserved';
  inventory_id: number;
  inventory: InventoryMovement;
}

interface InventoryMovement {
  id: number;
  item_id: number;
  branch_id: number;
  supplier_id?: number;
  date_received: string;
  cost: number;
  srp?: number;
  margin?: number;
  sold_qty: number;
  ending_qty: number;
  items: {
    id: number;
    item_no: string;
    brand: string;
    model: string;
    color: string[];
  };
  vehicle_units: VehicleUnit[];
}

interface SalesItem {
  inventory_id: number;
  vehicle_unit_id: number;
  item_id: number;
  unit_price: number;
  qty: number;
  amount: number;
  items: {
    brand: string;
    model: string;
    color: string[];
    item_no: string;
  };
  vehicle_unit: {
    engine_no: string;
    chassis_no: string;
    unit_number: number;
    status: string;
    inventory: {
      items: {
        brand: string;
        model: string;
        color: string[];
      }
    }
  };
}
interface Sale {
  id?: number;
  branch_id: number;
  date_sold: string;
  category_of_sales: string | null;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  address: string | null;
  contact_no: string | null;
  dr_no: string | null;
  si_no: string | null;
  total_amount: number;
  payment_method: string;
  source_of_sales?: string | null;
  loan_amount?: number;
  date_granted?: string;
  maturity_date?: string;
  terms?: number;
  downpayment_percentage?: number;
  rebates_commission?: number;
  monthly_amortization?: number;
  ar_balance?: number;
  age?: number;
  agent?: string;
  fmo?: string | null;
  bm?: string | null;
  mechanic?: string | null;
  bao?: string | null;
  sales_items: SalesItem[];
  branches?: Branch;
}

const emptySale: Partial<Sale> = {
  branch_id: undefined,
  date_sold: '',
  last_name: '',
  first_name: '',
  middle_name: '',
  address: '',
  contact_no: '',
  dr_no: '',
  si_no: '',
  category_of_sales: '',
  total_amount: 0,
  payment_method: 'cash',
  source_of_sales: '',
  loan_amount: 0,
  date_granted: '',
  maturity_date: '',
  terms: 0,
  downpayment_percentage: 0,
  rebates_commission: 0,
  monthly_amortization: 0,
  ar_balance: 0,
  age: undefined,
  agent: '',
  fmo: '',
  bm: '',
  mechanic: '',
  bao: '',
  sales_items: [],
};

interface ShowFields {
  basic: boolean;
  customer: boolean;
  vehicle: boolean;
  payment: boolean;
  delivery: boolean;
}

interface FormStep {
  step: 1 | 2 | 3 | 4;
  title: string;
}

const Sales: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [inventory, setInventory] = useState<InventoryMovement[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<VehicleUnit[]>([]);
  const [showFields, setShowFields] = useState<ShowFields>({
    basic: true,
    customer: true,
    vehicle: true,
  payment: true,
  delivery: true
  });
  const [currentStep, setCurrentStep] = useState<FormStep>({
    step: 1,
    title: "Select Vehicle"
  });
  const [selectedInventory, setSelectedInventory] = useState<InventoryMovement | null>(null);
  const [form, setForm] = useState<Partial<Sale>>(emptySale);
  const [showForm, setShowForm] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'summary' | 'byItem' | 'raw' | 'delivery'>('summary');
  // Filters
  const [filterBranch, setFilterBranch] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>(''); // YYYY-MM, empty means all
  // Global search
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Per-row selections for model and units
  const [rowModel, setRowModel] = useState<Record<number, string>>({});
  type UnitWithInventory = VehicleUnit & { inventory: InventoryMovement };
  const [rowUnits, setRowUnits] = useState<Record<number, UnitWithInventory[]>>({});
  const [rowUnitSearch, setRowUnitSearch] = useState<Record<number, string>>({});

  // Loan template state
  const [loanTemplates, setLoanTemplates] = useState<ModelLoanTemplate[]>([]);
  // Allow a wider set of term choices
  const DEFAULT_TERMS = [3, 6, 12, 18, 24, 30, 36];
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editSale, setEditSale] = useState<Partial<Sale> & { id?: number } | null>(null);
  // Password modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingEditId, setPendingEditId] = useState<number | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [rotatingPassword, setRotatingPassword] = useState<string | null>(null);

  useEffect(() => {
    fetchRotatingPassword().then(setRotatingPassword).catch(() => setRotatingPassword(null));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/sales`).then(async res => {
        if (!res.ok) throw new Error('Failed to fetch sales');
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Invalid sales JSON:', text);
          throw new Error('Invalid sales response');
        }
      }),
      fetch(`${API_URL}/api/branches`).then(async res => {
        if (!res.ok) throw new Error('Failed to fetch branches');
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Invalid branches JSON:', text);
          throw new Error('Invalid branches response');
        }
      }),
      fetch(`${API_URL}/api/inventory`).then(async res => {
        if (!res.ok) throw new Error('Failed to fetch inventory');
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Invalid inventory JSON:', text);
          throw new Error('Invalid inventory response');
        }
      })
    ])
      .then(([salesData, branchData, inventoryData]) => {
        console.log('Loaded branches:', branchData);
        console.log('Loaded inventory:', inventoryData);
        setSales(salesData);
        setBranches(branchData);
        setInventory(inventoryData);
      })
      .catch((err) => {
        console.error('Error loading data:', err);
        setError('Failed to load sales data: ' + err.message);
        showToast({ type: 'error', message: 'Failed to load sales data: ' + err.message });
      })
      .finally(() => setLoading(false));
  }, []);

  // Helpers for filtering
  const monthKey = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`; // YYYY-MM
  };

  const visibleSales = React.useMemo(() => {
    return (sales || []).filter((s) => {
      const byBranch = filterBranch === 'all' || s.branch_id === filterBranch;
      const byMonth = !filterMonth || monthKey(s.date_sold) === filterMonth;
      return byBranch && byMonth;
    });
  }, [sales, filterBranch, filterMonth]);

  // Build a searchable text haystack for any sale (includes nested fields)
  const buildHaystack = (sale: Sale): string => {
    const acc: string[] = [];
    const visited = new Set<any>();

    const pushVal = (v: any) => {
      if (v === null || v === undefined) return;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        const s = String(v);
        acc.push(s);
        // If it's a date-like string, also add a localized variant for matching
        if (typeof v === 'string') {
          const time = Date.parse(v);
          if (!isNaN(time)) {
            try {
              acc.push(new Date(v).toLocaleDateString());
            } catch {}
          }
        }
        return;
      }
      if (typeof v !== 'object') return;
      if (visited.has(v)) return;
      visited.add(v);
      if (Array.isArray(v)) {
        v.forEach(pushVal);
        return;
      }
      for (const key of Object.keys(v)) {
        try {
          pushVal((v as any)[key]);
        } catch {}
      }
    };

    // Include branch name explicitly
    const branchName = branches.find(b => b.id === sale.branch_id)?.name;
    if (branchName) acc.push(branchName);

    pushVal(sale);
    return acc.join(' | ').toLowerCase();
  };

  const filteredSales = useMemo(() => {
    const base = visibleSales;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    const tokens = q.split(/\s+/).filter(Boolean);
    return base.filter((s) => {
      const hay = buildHaystack(s);
      return tokens.every(t => hay.includes(t));
    });
  }, [visibleSales, searchQuery, branches]);

  // Open edit modal and preload with server data, require password
  const openEdit = async (saleId?: number) => {
    if (!saleId) return;
    setPendingEditId(saleId);
    setPasswordModalOpen(true);
  };

  async function doOpenEdit(saleId: number) {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/sales/${saleId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEditSale(data);
      setEditOpen(true);
    } catch (e) {
      showToast({ type: 'error', message: 'Failed to load sale: ' + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordSubmit(input: string) {
    setPasswordError(null);
    if (!rotatingPassword) {
      setPasswordError('Password not loaded.');
      return;
    }
    if (input === rotatingPassword && pendingEditId) {
      setPasswordModalOpen(false);
      setPasswordError(null);
      doOpenEdit(pendingEditId);
      setPendingEditId(null);
    } else {
      setPasswordError('Incorrect password.');
    }
  }

  const submitEdit = async () => {
    if (!editSale?.id) return;
    try {
      setLoading(true);
      const payload = {
        branch_id: editSale.branch_id,
        date_sold: editSale.date_sold,
        category_of_sales: editSale.category_of_sales || null,
        last_name: editSale.last_name,
        first_name: editSale.first_name,
        middle_name: editSale.middle_name || null,
        address: editSale.address || null,
        contact_no: editSale.contact_no || null,
        age: editSale.age || null,
        agent: editSale.agent || null,
        dr_no: editSale.dr_no || null,
        si_no: editSale.si_no || null,
        total_amount: editSale.total_amount,
        payment_method: editSale.payment_method,
        source_of_sales: editSale.source_of_sales || null,
        loan_amount: editSale.loan_amount || null,
        date_granted: editSale.date_granted || null,
        maturity_date: editSale.maturity_date || null,
        terms: editSale.terms || null,
        downpayment_percentage: editSale.downpayment_percentage || null,
        rebates_commission: editSale.rebates_commission || null,
        monthly_amortization: editSale.monthly_amortization || null,
        ar_balance: editSale.ar_balance || null,
        fmo: editSale.fmo || null,
        bm: editSale.bm || null,
        mechanic: editSale.mechanic || null,
        bao: editSale.bao || null,
      };
      const res = await fetch(`${API_URL}/api/sales/${editSale.id}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setSales(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditOpen(false);
      setEditSale(null);
    } catch (e) {
      showToast({ type: 'error', message: 'Failed to update sale: ' + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setLoading(false);
    }
  };

  // Form handlers and inventory fetching
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'branch_id' ? Number(value) : value }));
    // If branch changes, clear sales_items and availableVehicles
    if (name === 'branch_id') {
      setForm(f => ({ ...f, sales_items: [] }));
      setAvailableVehicles([]);
      setSelectedInventory(null);
      setRowModel({});
      setRowUnits({});
    }
  };

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = Number(e.target.value);
    console.log('Selected branch:', branchId);
    setForm({ ...form, branch_id: branchId });
    if (branchId) {
      setLoading(true);
      try {
        // First, verify the branch exists
        const branchResponse = await fetch(`${API_URL}/api/branches/${branchId}`);
        if (!branchResponse.ok) {
          throw new Error('Failed to verify branch');
        }
        const branchData = await branchResponse.json();
        console.log('Verified branch:', branchData);

        // Then fetch inventory for this branch
        const response = await fetch(`${API_URL}/api/inventory?branch_id=${branchId}&status=available`);
        if (!response.ok) {
          throw new Error('Failed to fetch inventory');
        }
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          console.log('Fetched inventory:', data);
          if (Array.isArray(data)) {
            setInventory(data);
            // Clear previously selected inventory and vehicle units
            setSelectedInventory(null);
            setAvailableVehicles([]);
          } else {
            throw new Error('Invalid inventory data format');
          }
        } catch (e) {
          console.error('Invalid inventory JSON:', text);
          throw new Error('Invalid inventory response');
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
        showToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to fetch inventory' });
      } finally {
        setLoading(false);
      }
    }
  };

  // When inventory is selected, fetch its available vehicle units
  const handleInventorySelect = async (inventoryId: number) => {
    console.log('Selected inventory:', inventoryId);
    try {
      // Fetch the specific inventory item with its vehicle units
      const response = await fetch(`${API_URL}/api/inventory/${inventoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory details');
      }
      const text = await response.text();
      try {
        const inv = JSON.parse(text);
        console.log('Found inventory:', inv);
        if (inv) {
          setSelectedInventory(inv);
          // Filter available units and sort by unit number
          const availableUnits = (inv.vehicle_units || [])
            .filter((unit: VehicleUnit) => unit.status === 'available')
            .sort((a: VehicleUnit, b: VehicleUnit) => a.unit_number - b.unit_number);
          console.log('Available units:', availableUnits);
          setAvailableVehicles(availableUnits);
        }
      } catch (e) {
        console.error('Invalid inventory JSON:', text);
        throw new Error('Invalid inventory response');
      }
    } catch (err) {
      console.error('Error fetching inventory details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory details');
    }
  };

  const handleAddSalesItem = () => {
    const emptyItem: SalesItem = {
      inventory_id: 0,
      vehicle_unit_id: 0,
      item_id: 0,
      unit_price: 0,
      qty: 1,
      amount: 0,
      items: {
        brand: '',
        model: '',
        color: [],
        item_no: ''
      },
      vehicle_unit: {
        engine_no: '',
        chassis_no: '',
        unit_number: 0,
        status: 'available',
        inventory: {
          items: {
            brand: '',
            model: '',
            color: []
          }
        }
      }
    };
    setForm({
      ...form,
      sales_items: [...(form.sales_items || []), emptyItem]
    });
  };

  // Update handleInventorySelection to update only the correct sales item and its available vehicles
  const handleInventorySelection = async (idx: number, inventory_id: number, vehicle_unit_id: number) => {
    // Find the inventory for the selected branch
  const inv = safeInventory.find((inv: InventoryMovement) => inv.id === inventory_id && inv.branch_id === form.branch_id);
  const availableUnits = inv?.vehicle_units.filter((u: VehicleUnit) => u.status === 'available') || [];
  // Update only the selected item's available vehicles
  const unit = availableUnits.find((u: VehicleUnit) => u.id === vehicle_unit_id);
    const updatedItem: SalesItem = {
      inventory_id,
      vehicle_unit_id,
      item_id: inv ? inv.item_id : 0,
      unit_price: inv ? (inv.srp || inv.cost) : 0,
      qty: 1,
      amount: inv ? (inv.srp || inv.cost) : 0,
      items: inv ? {
        brand: inv.items.brand,
        model: inv.items.model,
        color: inv.items.color,
        item_no: inv.items.item_no
      } : { brand: '', model: '', color: [], item_no: '' },
      vehicle_unit: unit ? {
        engine_no: unit.engine_no || '',
        chassis_no: unit.chassis_no || '',
        unit_number: unit.unit_number,
        status: unit.status,
        inventory: {
          items: inv ? {
            brand: inv.items.brand,
            model: inv.items.model,
            color: inv.items.color
          } : { brand: '', model: '', color: [] }
        }
      } : {
        engine_no: '',
        chassis_no: '',
        unit_number: 0,
        status: 'available',
        inventory: { items: { brand: '', model: '', color: [] } }
      }
    };
    const updatedItems = (form.sales_items || []).map((item, i) =>
      i === idx ? updatedItem : item
    );

    // Calculate total amount from all items
    const total = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    setForm({ 
      ...form, 
      sales_items: updatedItems,
      total_amount: total,
      // Only update loan amount when payment method is inhouse
      ...(form.payment_method === 'inhouse' ? {
        loan_amount: total - ((form.downpayment_percentage || 0) / 100 * total)
      } : {})
    });
    setAvailableVehicles(availableUnits);

    // Fetch loan templates for this model (item_id)
    if (inv?.item_id) {
      try {
        const templates = await modelLoanTemplateApi.getTemplates(inv.item_id);
        setLoanTemplates(templates);
        setSelectedTerm(null); // Reset term selection
      } catch (e) {
        setLoanTemplates([]);
      }
    } else {
      setLoanTemplates([]);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    if (!form.branch_id || !form.date_sold || !form.last_name || !form.first_name || !(form.sales_items && form.sales_items.length)) {
      showToast({ type: 'error', message: 'Please fill all required fields.' });
      return;
    }
    // Validate items
    for (const item of form.sales_items || []) {
      if (!item.inventory_id || !item.vehicle_unit_id) {
        showToast({ type: 'error', message: 'Please select inventory and vehicle unit for all items.' });
        return;
      }
    }
    try {
      setLoading(true);
      // Post to backend
      const res = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: form.branch_id,
          date_sold: form.date_sold,
          category_of_sales: form.category_of_sales || null,
          last_name: form.last_name,
          first_name: form.first_name,
          middle_name: form.middle_name || null,
          address: form.address || null,
          contact_no: form.contact_no || null,
          age: form.age || null,
          agent: form.agent || null,
          dr_no: form.dr_no || null,
          si_no: form.si_no || null,
          total_amount: form.total_amount,
          payment_method: form.payment_method,
          source_of_sales: form.source_of_sales || null,
          loan_amount: form.loan_amount || null,
          date_granted: form.date_granted || null,
          maturity_date: form.maturity_date || null,
          terms: form.terms || null,
          downpayment_percentage: form.downpayment_percentage || null,
          rebates_commission: form.rebates_commission || null,
          monthly_amortization: form.monthly_amortization || null,
          ar_balance: form.ar_balance || null,
          fmo: form.fmo || null,
          bm: form.bm || null,
          mechanic: form.mechanic || null,
          bao: form.bao || null,
          items: form.sales_items?.map(item => ({
            inventory_id: item.inventory_id,
            vehicle_unit_id: item.vehicle_unit_id,
            item_id: item.item_id,
            qty: item.qty,
            unit_price: item.unit_price,
            amount: item.unit_price * item.qty
          }))
        })
      });
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMsg = 'Failed to create sales report';
        if (contentType && contentType.includes('application/json')) {
          const error = await res.json();
          errorMsg = error.message || error.error || errorMsg;
        } else {
          const text = await res.text();
          errorMsg = text;
        }
        throw new Error(errorMsg);
      }
      // Success: notify user immediately and clear form
      showToast({ type: 'success', message: 'Sale created' });
      setShowForm(false);
      setForm(emptySale);
      setSelectedInventory(null);
      setAvailableVehicles([]);

      // Refresh sales list and inventory in background. If refresh fails, show a friendly error but don't surface raw server traces.
      (async () => {
        try {
          const [newSales, newInventory] = await Promise.all([
            fetch(`${API_URL}/api/sales`).then(async r => { if (!r.ok) throw r; return r.json(); }),
            fetch(`${API_URL}/api/inventory?branch_id=${form.branch_id}`).then(async r => { if (!r.ok) throw r; return r.json(); })
          ]);
          setSales(newSales);
          setInventory(newInventory);
        } catch (refreshErr) {
          console.error('Failed to refresh sales/inventory after create', refreshErr);
          showToast({ type: 'error', message: 'Sale created but failed to refresh lists. Please reload the page or try again.' });
        }
      })();
    } catch (error) {
      // Sanitize backend errors before showing to the user
      const friendly = (() => {
        try {
          const e = error as any;
          if (!e) return 'Failed to create sales report';
          // If it's a Response instance, try to parse JSON/text
          if (e instanceof Response) return 'Server returned an error';
          const msg = e instanceof Error ? e.message : String(e);
          // Collapse long Prisma messages into a short friendly message
          if (/prisma/i.test(msg) || /P200|PrismaClientKnownRequestError/.test(msg)) {
            return 'Server validation failed — please check required fields and try again.';
          }
          // If message is extremely long, truncate for UI
          if (msg.length > 300) return msg.slice(0, 300) + '...';
          return msg;
        } catch (e) {
          return 'Failed to create sales report';
        }
      })();
      console.error('Create sale error (full):', error);
      showToast({ type: 'error', message: friendly });
    } finally {
      setLoading(false);
    }
  };

  // Add logging when the branch dropdown is clicked
  const handleBranchDropdownClick = () => {
    console.log('Branches state on dropdown click:', branches);
  };

  // Add logging when the inventory dropdown is clicked
  const handleInventoryDropdownClick = () => {
    console.log('Inventory state on dropdown click:', inventory);
    console.log('Current selected branch_id:', form.branch_id);
  };

  // Use inventory.current for all inventory dropdowns and logic
  const safeInventory = Array.isArray((inventory as any).current) ? (inventory as any).current : Array.isArray(inventory) ? inventory : [];

  // Branch-scoped inventory and models
  const branchInventory = useMemo(() => (
    (safeInventory as InventoryMovement[]).filter(inv => inv.branch_id === form.branch_id)
  ), [safeInventory, form.branch_id]);

  const modelsOnBranch = useMemo(() => {
    const map = new Map<string, { key: string; brand: string; model: string; available: number }>();
    (branchInventory || []).forEach(inv => {
      const brand = inv.items?.brand || '';
      const model = inv.items?.model || '';
      const key = `${brand}|||${model}`;
      const units = (inv.vehicle_units || []).filter(u => u.status === 'available').length;
      if (!map.has(key)) map.set(key, { key, brand, model, available: 0 });
      map.get(key)!.available += units;
    });
    return Array.from(map.values()).filter(m => m.available > 0).sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
  }, [branchInventory]);

  const handleModelSelection = (idx: number, key: string) => {
    setRowModel(prev => ({ ...prev, [idx]: key }));
    const [brand, model] = key.split('|||');
    const invs = (branchInventory || []).filter(inv => inv.items?.brand === brand && inv.items?.model === model);
    const units: UnitWithInventory[] = invs.flatMap(inv => (inv.vehicle_units || [])
      .filter(u => u.status === 'available')
      .map(u => ({ ...u, inventory: inv }))
    ).sort((a, b) => a.unit_number - b.unit_number);
    setRowUnits(prev => ({ ...prev, [idx]: units }));
    // Reset the item at idx with basic brand/model, clear ids and pre-fill unit_price from first matching inventory if available
    const defaultInv = invs.length > 0 ? invs[0] : null;
    const defaultPrice = defaultInv ? (defaultInv.srp ?? defaultInv.cost ?? 0) : 0;
    const updatedItems = (form.sales_items || []).map((it, i) => i === idx ? {
      inventory_id: 0,
      vehicle_unit_id: 0,
      item_id: 0,
      unit_price: defaultPrice,
      qty: 1,
      amount: defaultPrice,
      items: { brand, model, color: [], item_no: '' },
      vehicle_unit: {
        engine_no: '', chassis_no: '', unit_number: 0, status: 'available',
        inventory: { items: { brand, model, color: [] } as any }
      }
    } as unknown as SalesItem : it);
    const total = updatedItems.reduce((s, it) => s + (it.amount || 0), 0);
    setForm(f => ({ ...f, sales_items: updatedItems, total_amount: total }));
  };

  const handleUnitSelectionOnly = (idx: number, unitId: number) => {
    const units = rowUnits[idx] || [];
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;
    const inv = unit.inventory;
    const updatedItem: SalesItem = {
      inventory_id: inv.id,
      vehicle_unit_id: unit.id,
      item_id: inv.item_id,
      unit_price: inv.srp || inv.cost,
      qty: 1,
      amount: inv.srp || inv.cost,
      items: {
        brand: inv.items.brand,
        model: inv.items.model,
        color: inv.items.color,
        item_no: inv.items.item_no
      },
      vehicle_unit: {
        engine_no: unit.engine_no || '',
        chassis_no: unit.chassis_no || '',
        unit_number: unit.unit_number,
        status: unit.status,
        inventory: { items: { brand: inv.items.brand, model: inv.items.model, color: inv.items.color } }
      }
    };
    const updatedItems = (form.sales_items || []).map((it, i) => i === idx ? updatedItem : it);
    const total = updatedItems.reduce((s, it) => s + (it.amount || 0), 0);
    setForm(f => ({ ...f, sales_items: updatedItems, total_amount: total }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/import/sales`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      console.log('Import result:', result);

      // Refresh the sales list
      const newSales = await fetch(`${API_URL}/api/sales`).then(r => r.json());
      setSales(newSales);

      alert('Sales data imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import sales data: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
      // Reset the file input
      const fileInput = document.getElementById('salesImport') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="p-4">
      <PasswordModal
        isOpen={passwordModalOpen}
        onClose={() => { setPasswordModalOpen(false); setPendingEditId(null); setPasswordError(null); }}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
      />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <div className="flex gap-2">
          <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
            Import Excel
            <input
              id="salesImport"
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </label>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setShowForm(true)}
          >
            + New Sales Report
          </button>
        </div>
      </div>
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(['summary', 'byItem', 'delivery', 'raw'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
              `}
            >
              {tab === 'summary' ? 'Summary' : tab === 'byItem' ? 'By Item' : 'Raw Data'}
            </button>
          ))}
        </nav>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Branch</label>
              <select
                className="border rounded px-2 py-1 text-sm bg-white"
                value={filterBranch === 'all' ? '' : String(filterBranch)}
                onChange={(e) => setFilterBranch(e.target.value === '' ? 'all' : Number(e.target.value))}
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Month</label>
              <input
                type="month"
                className="border rounded px-2 py-1 text-sm"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
            <div className="min-w-[16rem]">
              <label className="block text-xs text-gray-600 mb-1">Search</label>
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder="Search all fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="text-sm px-3 py-1 border rounded" onClick={() => { setFilterBranch('all'); setFilterMonth(''); }}>
              Clear filters
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setShowForm(true)}
            >
              + New Sales Report
            </button>
            <div className="text-xs text-gray-500 ml-auto">
              Showing {filteredSales.length.toLocaleString()} of {sales.length.toLocaleString()} sales
            </div>
          </div>
          {activeTab === 'summary' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Summary</h2>
              <div className="mb-4">
                <div className="flex gap-4">
                  <button 
                    className={`px-4 py-2 text-sm font-medium rounded ${showFields.basic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
                    onClick={() => setShowFields(f => ({ ...f, basic: !f.basic }))}
                  >
                    Basic Info
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium rounded ${showFields.customer ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
                    onClick={() => setShowFields(f => ({ ...f, customer: !f.customer }))}
                  >
                    Customer Details
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium rounded ${showFields.vehicle ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
                    onClick={() => setShowFields(f => ({ ...f, vehicle: !f.vehicle }))}
                  >
                    Vehicle Details
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium rounded ${showFields.delivery ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
                    onClick={() => setShowFields(f => ({ ...f, delivery: !f.delivery }))}
                  >
                    Delivery Details
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium rounded ${showFields.payment ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
                    onClick={() => setShowFields(f => ({ ...f, payment: !f.payment }))}
                  >
                    Payment Details
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden mb-4 text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      
                      {/* Basic Info */}
                      {showFields.basic && (
                        <>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">DR/SI No</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        </>
                      )}

                      {/* Customer Details */}
                      {showFields.customer && (
                        <>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Middle Name</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Address</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Contact No</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        </>
                      )}

                      {/* Vehicle Details */}
                      {showFields.vehicle && (
                        <>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Model</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Color</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Engine No</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Chassis No</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Invty Code</th>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                        </>
                      )}

                      {/* Delivery Details */}
                      {showFields.delivery && (
                        <>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Delivery Status</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </>
                      )}

                      {/* Payment Details */}
                      {showFields.payment && (
                        <>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">VAT</th>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">SRP</th>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Loan Amount</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date Granted</th>
                          <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Maturity Date</th>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Terms</th>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Downpayment %</th>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Rebates</th>
                          <th className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Monthly Amort.</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSales.map((sale, index) => {
                      const firstItem = sale.sales_items?.[0];
                      const vat = (sale.total_amount || 0) * 0.12;
                      const netAmount = (sale.total_amount || 0) - vat;
                      return (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2">{index + 1}</td>
                          <td className="px-2 py-2">
                            <button className="px-2 py-1 text-xs border rounded hover:bg-gray-50" onClick={() => openEdit(sale.id)}>
                              Edit
                            </button>
                          </td>
                          
                          {/* Basic Info */}
                          {showFields.basic && (
                            <>
                              <td className="px-2 py-2">{branches.find(b => b.id === sale.branch_id)?.name || 'N/A'}</td>
                              <td className="px-2 py-2">{new Date(sale.date_sold).toLocaleDateString()}</td>
                              <td className="px-2 py-2">{sale.category_of_sales}</td>
                              <td className="px-2 py-2">{sale.dr_no || sale.si_no}</td>
                              <td className="px-2 py-2">{sale.agent}</td>
                              <td className="px-2 py-2">{sale.source_of_sales || ''}</td>
                            </>
                          )}

                          {/* Customer Details */}
                          {showFields.customer && (
                            <>
                              <td className="px-2 py-2">{sale.last_name}</td>
                              <td className="px-2 py-2">{sale.first_name}</td>
                              <td className="px-2 py-2">{sale.middle_name}</td>
                              <td className="px-2 py-2">{sale.address}</td>
                              <td className="px-2 py-2">{sale.contact_no}</td>
                              <td className="px-2 py-2">{sale.age}</td>
                            </>
                          )}

                          {/* Vehicle Details */}
                          {showFields.vehicle && (
                            <>
                              <td className="px-2 py-2">{firstItem?.items?.brand}</td>
                              <td className="px-2 py-2">{firstItem?.items?.model}</td>
                              <td className="px-2 py-2">{firstItem?.items?.color?.[0]}</td>
                              <td className="px-2 py-2">{firstItem?.vehicle_unit?.engine_no}</td>
                              <td className="px-2 py-2">{firstItem?.vehicle_unit?.chassis_no}</td>
                              <td className="px-2 py-2">{firstItem?.items?.item_no}</td>
                              <td className="px-2 py-2 text-right">{firstItem?.unit_price?.toLocaleString()}</td>
                            </>
                          )}

                          {/* Delivery fields */}
                          {showFields.delivery && (
                            <>
                              <td className="px-2 py-2">{(sale as any).delivery_status || 'pending'}</td>
                              <td className="px-2 py-2">{(sale as any).delivery_date ? new Date((sale as any).delivery_date).toLocaleDateString() : ''}</td>
                              <td className="px-2 py-2">
                                <DeliveryEditor sale={sale} onSaved={async (updated) => {
                                  try {
                                    const res = await fetch(`${API_URL}/api/sales/${sale.id}/delivery`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(updated)
                                    });
                                    if (!res.ok) throw new Error(await res.text());
                                        const updatedSale = await res.json();
                                        setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
                                      } catch (e) {
                                        showToast({ type: 'error', message: 'Failed to update delivery: ' + (e instanceof Error ? e.message : String(e)) });
                                      }
                                }} />
                              </td>
                            </>
                          )}

                          {/* Payment Details */}
                          {showFields.payment && (
                            <>
                              <td className="px-2 py-2 text-right">{vat.toLocaleString()}</td>
                              <td className="px-2 py-2 text-right">{netAmount.toLocaleString()}</td>
                              <td className="px-2 py-2 text-right">{sale.total_amount?.toLocaleString()}</td>
                              <td className="px-2 py-2 text-right">{sale.loan_amount?.toLocaleString()}</td>
                              <td className="px-2 py-2">{sale.date_granted ? new Date(sale.date_granted).toLocaleDateString() : ''}</td>
                              <td className="px-2 py-2">{sale.maturity_date ? new Date(sale.maturity_date).toLocaleDateString() : ''}</td>
                              <td className="px-2 py-2 text-right">{sale.terms}</td>
                              <td className="px-2 py-2 text-right">{sale.downpayment_percentage}%</td>
                              <td className="px-2 py-2 text-right">{sale.rebates_commission?.toLocaleString()}</td>
                              <td className="px-2 py-2 text-right">{sale.monthly_amortization?.toLocaleString()}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'byItem' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">By Item</h2>
              {/* Group and display sales by item */}
              <div className="text-gray-500">(Coming soon)</div>
            </div>
          )}
          {activeTab === 'delivery' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Delivery Management</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden mb-4 text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
                      <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Delivery Status</th>
                      <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                      <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSales.map((sale, idx) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2">{idx + 1}</td>
                        <td className="px-2 py-2">{sale.id}</td>
                        <td className="px-2 py-2">{sale.first_name} {sale.last_name}</td>
                        <td className="px-2 py-2">{(sale as any).delivery_status || 'pending'}</td>
                        <td className="px-2 py-2">{(sale as any).delivery_date ? new Date((sale as any).delivery_date).toLocaleDateString() : ''}</td>
                        <td className="px-2 py-2">
                          <DeliveryEditor sale={sale} onSaved={async (updated) => {
                            try {
                              const res = await fetch(`${API_URL}/api/sales/${sale.id}/delivery`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updated)
                              });
                              if (!res.ok) throw new Error(await res.text());
                              const updatedSale = await res.json();
                              setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
                            } catch (e) {
                              showToast({ type: 'error', message: 'Failed to update delivery: ' + (e instanceof Error ? e.message : String(e)) });
                            }
                          }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'raw' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Delivery Details</h2>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(filteredSales, null, 2)}</pre>
            </div>
          )}
        </>
      )}
      {/* Edit Sale Modal */}
      {editOpen && editSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={() => { setEditOpen(false); setEditSale(null); }}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Sale #{editSale.id}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Date Sold</label>
                <input type="date" className="border rounded px-2 py-1 w-full" value={editSale.date_sold ? String(editSale.date_sold).slice(0,10) : ''} onChange={e => setEditSale(s => ({ ...s!, date_sold: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Category</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.category_of_sales || ''} onChange={e => setEditSale(s => ({ ...s!, category_of_sales: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">DR No</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.dr_no || ''} onChange={e => setEditSale(s => ({ ...s!, dr_no: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">SI No</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.si_no || ''} onChange={e => setEditSale(s => ({ ...s!, si_no: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Agent</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.agent || ''} onChange={e => setEditSale(s => ({ ...s!, agent: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Payment Method</label>
                <select className="border rounded px-2 py-1 w-full" value={editSale.payment_method || 'cash'} onChange={e => setEditSale(s => ({ ...s!, payment_method: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="inhouse">Inhouse</option>
                  <option value="financing">Financing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Source of Sales</label>
                <select className="border rounded px-2 py-1 w-full" value={editSale.source_of_sales || ''} onChange={e => setEditSale(s => ({ ...s!, source_of_sales: e.target.value }))}>
                  <option value="">Select source</option>
                  <option value="AGENT">Agent</option>
                  <option value="WALK-IN">Walk-in</option>
                  <option value="SOCIAL MEDIA">Social Media</option>
                  <option value="INHOUSE">Inhouse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">First Name</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.first_name || ''} onChange={e => setEditSale(s => ({ ...s!, first_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.last_name || ''} onChange={e => setEditSale(s => ({ ...s!, last_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Middle Name</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.middle_name || ''} onChange={e => setEditSale(s => ({ ...s!, middle_name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Address</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.address || ''} onChange={e => setEditSale(s => ({ ...s!, address: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contact No</label>
                <input type="text" className="border rounded px-2 py-1 w-full" value={editSale.contact_no || ''} onChange={e => setEditSale(s => ({ ...s!, contact_no: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Age</label>
                <input type="number" className="border rounded px-2 py-1 w-full" value={editSale.age || 0} onChange={e => setEditSale(s => ({ ...s!, age: Number(e.target.value) }))} />
              </div>
              {editSale.payment_method === 'inhouse' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Downpayment %</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={editSale.downpayment_percentage || 0} onChange={e => setEditSale(s => ({ ...s!, downpayment_percentage: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Loan Amount</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={editSale.loan_amount || 0} onChange={e => setEditSale(s => ({ ...s!, loan_amount: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Monthly Amortization</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={editSale.monthly_amortization || 0} onChange={e => setEditSale(s => ({ ...s!, monthly_amortization: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Terms</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={editSale.terms || 0} onChange={e => setEditSale(s => ({ ...s!, terms: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Date Granted</label>
                    <input type="date" className="border rounded px-2 py-1 w-full" value={editSale.date_granted ? String(editSale.date_granted).slice(0,10) : ''} onChange={e => setEditSale(s => ({ ...s!, date_granted: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Maturity Date</label>
                    <input type="date" className="border rounded px-2 py-1 w-full" value={editSale.maturity_date ? String(editSale.maturity_date).slice(0,10) : ''} onChange={e => setEditSale(s => ({ ...s!, maturity_date: e.target.value }))} />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Delivery Status</label>
                <select className="border rounded px-2 py-1 w-full" value={(editSale as any).delivery_status || 'pending'} onChange={e => setEditSale(s => ({ ...s!, delivery_status: e.target.value } as any))}>
                  <option value="pending">pending</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Delivery Date</label>
                <input type="date" className="border rounded px-2 py-1 w-full" value={(editSale as any).delivery_date ? String((editSale as any).delivery_date).slice(0,10) : ''} onChange={e => setEditSale(s => ({ ...s!, delivery_date: e.target.value } as any))} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => { setEditOpen(false); setEditSale(null); }}>Cancel</button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={submitEdit}>Save changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal for new sales report */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">New Sales Report</h2>
            <div className="mb-6">
              <div className="flex justify-between items-center">
                {[
                  { step: 1, title: "Select Vehicle" },
                  { step: 2, title: "Customer Info" },
                  { step: 3, title: "Payment Details" },
                  { step: 4, title: "Review" }
                ].map((step) => (
                  <div 
                    key={step.step} 
                    className={`flex-1 text-center ${
                      currentStep.step === step.step 
                        ? 'text-blue-600 font-medium'
                        : currentStep.step > step.step
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 bg-white
                        ${currentStep.step === step.step ? 'border-blue-600' : 
                          currentStep.step > step.step ? 'border-green-600' : 'border-gray-300'}">
                        {currentStep.step > step.step ? '✓' : step.step}
                      </div>
                      <div className="mt-2">{step.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <form 
              className="space-y-4" 
              onSubmit={handleSubmit}
            >
              {currentStep.step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Branch *</label>
                    <select
                      name="branch_id"
                      className="mt-1 border rounded px-2 py-1 w-full bg-white"
                      value={form.branch_id ?? ''}
                      onChange={handleChange}
                      onClick={handleBranchDropdownClick}
                      required
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle *</label>
                    {(form.sales_items || []).map((item, idx) => (
                      <div key={idx} className="border p-4 rounded-lg mb-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Model:</label>
                            <select
                              className="w-full border rounded px-2 py-1 bg-white"
                              value={rowModel[idx] || ''}
                              onChange={(e) => handleModelSelection(idx, e.target.value)}
                              required
                            >
                              <option value="">Select model</option>
                              {modelsOnBranch.map(m => (
                                <option key={m.key} value={m.key}>
                                  {m.brand} {m.model} ({m.available} units available)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Unit:</label>
                            <div className="relative">
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1"
                                placeholder={rowModel[idx] ? 'Type engine/chassis/unit # to search...' : 'Select model first'}
                                value={rowUnitSearch[idx] ?? (item.vehicle_unit?.unit_number ? String(item.vehicle_unit.unit_number) : '')}
                                onChange={(e) => setRowUnitSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                                disabled={!rowModel[idx]}
                                required
                              />
                              {/* Suggestions dropdown */}
                              {rowModel[idx] && (rowUnitSearch[idx] ?? '').length > 0 && (
                                <ul className="absolute z-50 left-0 right-0 bg-white border rounded mt-1 max-h-48 overflow-auto text-sm">
                                  {(rowUnits[idx] || [])
                                    .filter(u => {
                                      const q = (rowUnitSearch[idx] || '').toLowerCase();
                                      return (
                                        (u.engine_no || '').toLowerCase().includes(q) ||
                                        (u.chassis_no || '').toLowerCase().includes(q) ||
                                        (u.unit_number ? String(u.unit_number) : '').toLowerCase().includes(q)
                                      );
                                    })
                                    .map(u => (
                                      <li
                                        key={u.id}
                                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={(ev) => { ev.preventDefault(); /* prevent blur */ }}
                                        onClick={() => {
                                          handleUnitSelectionOnly(idx, u.id);
                                          const label = u.unit_number ? `Unit #${u.unit_number} - ${u.engine_no || '-'} / ${u.chassis_no || '-'}` : `${u.engine_no || '-'} / ${u.chassis_no || '-'}`;
                                          setRowUnitSearch(prev => ({ ...prev, [idx]: label }));
                                        }}
                                      >
                                        <div className="font-medium">{u.unit_number ? `Unit #${u.unit_number}` : 'Unit' } — {u.engine_no || '-'} / {u.chassis_no || '-'}</div>
                                        <div className="text-xs text-gray-500">Inventory: {u.inventory?.items?.item_no || u.inventory?.id || '-'}</div>
                                      </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Brand:</span> {item.items?.brand || ''}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Model:</span> {item.items?.model || ''}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Color:</span> {item.items?.color?.[0] || ''}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Engine No:</span> {item.vehicle_unit?.engine_no || ''}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Chassis No:</span> {item.vehicle_unit?.chassis_no || ''}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Unit Number:</span> {item.vehicle_unit?.unit_number || ''}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Inventory Code:</span> {item.items?.item_no || ''}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Unit Price:</span> ₱{item.unit_price?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddSalesItem} className="bg-green-600 text-white px-2 py-1 rounded">+ Add Item</button>
                  </div>
                </>
              )}
              {currentStep.step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date Sold *</label>
                    <input
                      type="date"
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.date_sold || ''}
                      onChange={e => setForm(f => ({ ...f, date_sold: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category of Sales *</label>
                    <input
                      type="text"
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.category_of_sales || ''}
                      onChange={e => setForm(f => ({ ...f, category_of_sales: e.target.value }))}
                      required
                    />
                  </div>
                </>
              )}
              {currentStep.step === 2 && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        className="mt-1 border rounded px-2 py-1 w-full"
                        value={form.last_name || ''}
                        onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        className="mt-1 border rounded px-2 py-1 w-full"
                        value={form.first_name || ''}
                        onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      <input
                        type="text"
                        className="mt-1 border rounded px-2 py-1 w-full"
                        value={form.middle_name || ''}
                        onChange={e => setForm(f => ({ ...f, middle_name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address *</label>
                    <input
                      type="text"
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.address || ''}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact No. *</label>
                    <input
                      type="text"
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.contact_no || ''}
                      onChange={e => setForm(f => ({ ...f, contact_no: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age *</label>
                    <input
                      type="number"
                      min="18"
                      max="120"
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.age || ''}
                      onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Agent</label>
                    <input
                      type="text"
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.agent || ''}
                      onChange={e => setForm(f => ({ ...f, agent: e.target.value }))}
                    />
                  </div>
                </>
              )}
              
              {currentStep.step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">DR No.</label>
                    <input
                      type="text"
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.dr_no || ''}
                      onChange={e => setForm(f => ({ ...f, dr_no: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SI No.</label>
                    <input
                      type="text"
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.si_no || ''}
                      onChange={e => setForm(f => ({ ...f, si_no: e.target.value }))}
                    />
                  </div>
                </div>
              )}
              {currentStep.step === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                    <select
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.payment_method || 'cash'}
                      onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="inhouse">Inhouse</option>
                      <option value="financing">Financing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source of Sales *</label>
                    <select
                      className="mt-1 border rounded px-2 py-1 w-full"
                      value={form.source_of_sales || ''}
                      onChange={e => setForm(f => ({ ...f, source_of_sales: e.target.value }))}
                      required
                    >
                      <option value="">Select source</option>
                      <option value="AGENT">Agent</option>
                      <option value="WALK-IN">Walk-in</option>
                      <option value="SOCIAL MEDIA">Social Media</option>
                      <option value="INHOUSE">Inhouse</option>
                    </select>
                  </div>
                  {form.payment_method === 'inhouse' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Terms (months)</label>
                          <select
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={selectedTerm ?? form.terms ?? ''}
                            onChange={e => {
                              const term = Number(e.target.value);
                              setSelectedTerm(term);
                              setForm(f => {
                                const updatedForm = { ...f, terms: term };
                                // Find template for this term
                                const template = loanTemplates.find(t => t.term_months === term);
                                if (template) {
                                  const monthlyAmort = template.monthly_amortization;
                                  const totalLoanAmount = (monthlyAmort || 0) * term;
                                  const downpaymentAmount = ((template.downpayment_percentage || 0) / 100) * (updatedForm.total_amount || 0);
                                  return {
                                    ...updatedForm,
                                    loan_amount: totalLoanAmount - downpaymentAmount,
                                    downpayment_percentage: template.downpayment_percentage,
                                    rebates_commission: template.rebates_commission,
                                    monthly_amortization: monthlyAmort
                                  };
                                } else {
                                  // Fallback: compute loan based on total_amount and downpayment if no template exists
                                  const total = updatedForm.total_amount || 0;
                                  const downpaymentAmount = ((updatedForm.downpayment_percentage || 0) / 100) * total;
                                  const loan = total - downpaymentAmount;
                                  const monthlyAmort = term > 0 ? Number((loan / term).toFixed(2)) : 0;
                                  return {
                                    ...updatedForm,
                                    loan_amount: loan,
                                    monthly_amortization: monthlyAmort
                                  };
                                }
                                return updatedForm;
                              });
                            }}
                          >
                            <option value="">Select term</option>
                            {DEFAULT_TERMS.map(term => (
                              <option key={term} value={term}>{term} months</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
                          <input
                            type="number"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.loan_amount || 0}
                            onChange={e => setForm(f => ({ ...f, loan_amount: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date Granted</label>
                          <input
                            type="date"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.date_granted || ''}
                            onChange={e => setForm(f => ({ ...f, date_granted: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Maturity Date</label>
                          <input
                            type="date"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.maturity_date || ''}
                            onChange={e => setForm(f => ({ ...f, maturity_date: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Downpayment %</label>
                          <input
                            type="number"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.downpayment_percentage || 0}
                            onChange={e => {
                              const percentage = Number(e.target.value);
                              const totalAmount = form.total_amount || 0;
                              const rawAmount = (percentage / 100) * totalAmount;
                              setForm(f => ({ 
                                ...f, 
                                downpayment_percentage: percentage,
                                loan_amount: totalAmount - rawAmount
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Downpayment Amount</label>
                          <input
                            type="number"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={((form.downpayment_percentage || 0) / 100) * (form.total_amount || 0)}
                            onChange={e => {
                              const rawAmount = Number(e.target.value);
                              const totalAmount = form.total_amount || 0;
                              const percentage = (rawAmount / totalAmount) * 100;
                              setForm(f => ({ 
                                ...f, 
                                downpayment_percentage: percentage,
                                loan_amount: totalAmount - rawAmount 
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Monthly Amortization</label>
                          <input
                            type="number"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.monthly_amortization || 0}
                            onChange={e => {
                              const monthlyAmort = Number(e.target.value);
                              setForm(f => {
                                const totalLoanAmount = monthlyAmort * (f.terms || 0);
                                const downpaymentAmount = ((f.downpayment_percentage || 0) / 100) * (f.total_amount || 0);
                                return {
                                  ...f,
                                  monthly_amortization: monthlyAmort,
                                  loan_amount: totalLoanAmount - downpaymentAmount
                                };
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Rebates/Commission</label>
                          <input
                            type="number"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.rebates_commission || 0}
                            onChange={e => setForm(f => ({ ...f, rebates_commission: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">FMO</label>
                          <input
                            type="text"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.fmo || ''}
                            onChange={e => setForm(f => ({ ...f, fmo: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">BM</label>
                          <input
                            type="text"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.bm || ''}
                            onChange={e => setForm(f => ({ ...f, bm: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Mechanic</label>
                          <input
                            type="text"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.mechanic || ''}
                            onChange={e => setForm(f => ({ ...f, mechanic: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">BAO</label>
                          <input
                            type="text"
                            className="mt-1 border rounded px-2 py-1 w-full"
                            value={form.bao || ''}
                            onChange={e => setForm(f => ({ ...f, bao: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Review Step */}
              {currentStep.step === 4 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-4">Selected Vehicle</h3>
                    {form.sales_items?.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-4 bg-white p-3 rounded mb-4">
                        <div>
                          <p className="text-sm"><span className="font-medium">Brand:</span> {item.items?.brand}</p>
                          <p className="text-sm"><span className="font-medium">Model:</span> {item.items?.model}</p>
                          <p className="text-sm"><span className="font-medium">Color:</span> {item.items?.color?.[0]}</p>
                          <p className="text-sm"><span className="font-medium">Unit Price:</span> ₱{item.unit_price?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm"><span className="font-medium">Engine No:</span> {item.vehicle_unit?.engine_no}</p>
                          <p className="text-sm"><span className="font-medium">Chassis No:</span> {item.vehicle_unit?.chassis_no}</p>
                          <p className="text-sm"><span className="font-medium">Unit #:</span> {item.vehicle_unit?.unit_number}</p>
                          <p className="text-sm"><span className="font-medium">Code:</span> {item.items?.item_no}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-4">Customer Details</h3>
                    <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded">
                      <div>
                        <p className="text-sm"><span className="font-medium">Name:</span> {form.first_name} {form.middle_name} {form.last_name}</p>
                        <p className="text-sm"><span className="font-medium">Age:</span> {form.age}</p>
                        <p className="text-sm"><span className="font-medium">Contact:</span> {form.contact_no}</p>
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-medium">Address:</span> {form.address}</p>
                        <p className="text-sm"><span className="font-medium">Agent:</span> {form.agent}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-4">Payment Details</h3>
                    <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded">
                      <div>
                        <p className="text-sm"><span className="font-medium">Payment Method:</span> {form.payment_method}</p>
                        <p className="text-sm"><span className="font-medium">Source:</span> {form.source_of_sales}</p>
                        {form.payment_method === 'inhouse' && (
                          <>
                            <p className="text-sm"><span className="font-medium">Loan Amount:</span> ₱{form.loan_amount?.toLocaleString()}</p>
                            <p className="text-sm"><span className="font-medium">Terms:</span> {form.terms} months</p>
                            <p className="text-sm"><span className="font-medium">Monthly Amortization:</span> ₱{form.monthly_amortization?.toLocaleString()}</p>
                          </>
                        )}
                      </div>
                      {form.payment_method === 'inhouse' && (
                        <div>
                          <p className="text-sm"><span className="font-medium">Downpayment:</span> {form.downpayment_percentage}%</p>
                          <p className="text-sm"><span className="font-medium">Date Granted:</span> {form.date_granted}</p>
                          <p className="text-sm"><span className="font-medium">Maturity Date:</span> {form.maturity_date}</p>
                          <p className="text-sm"><span className="font-medium">Rebates/Commission:</span> ₱{form.rebates_commission?.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Form Navigation */}
              <div className="flex justify-between gap-2 mt-4">
                <div>
                  {currentStep.step > 1 && (
                    <button
                      type="button"
                      className="px-4 py-1 rounded border"
                      onClick={() => setCurrentStep(prev => ({ ...prev, step: prev.step > 1 ? (prev.step - 1) as FormStep['step'] : prev.step }))}
                    >
                      Previous
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-1 rounded border"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  {currentStep.step < 4 ? (
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                      onClick={() => setCurrentStep(prev => ({ ...prev, step: prev.step < 4 ? (prev.step + 1) as FormStep['step'] : prev.step }))}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </form>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
