import { useState, useEffect } from 'react';
import type { PurchaseOrder, POItem, POItemForAPI, CheckDetails, PaymentDetails } from '../types/PurchaseOrder';
import { api } from '../services/api';
import type { Branch } from '../pages/Inventory';

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  contact_number: string;
}

interface Model {
  id: number;
  item_no: string;
  brand: string;
  model: string;
  color: string[];
  unit_price: number;
  srp?: number;
  rebate_percentage?: number;
}

interface POItemWithModel extends POItem {
  item_id?: number;
  srp?: number;
}

const emptyPOItem: POItemWithModel = {
  model_name: '',
  model_code: '',
  color: '',
  quantity: 1,
  unit_price: 0,
  amount: 0,
  item_id: undefined,
  margin: 0,
  rebate_percentage: 0,
};

const emptyPO: PurchaseOrder = {
  po_number: '',
  date_issued: new Date().toISOString().split('T')[0],
  branch_id: undefined,
  supplier_id: undefined,
  supplier_details: {
    name: '',
    address: '',
    tin_number: '',
  },
  contact_person: '',
  contact_number: '',
  delivery_address: '',
  items: [{ ...emptyPOItem }],
  net_amount: 0,
  dealer_discount: 0,
  due_date: '',
  payment_term: '',
  payment_mode: '',
  payment_details: {
    payment_dates: [],
    payment_amounts: [],
    checks: []
  },
  prepared_by: '',
  checked_by: '',
};

interface PurchaseOrderFormProps {
  onSuccess?: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = function PurchaseOrderForm({ onSuccess }) {
  const [form, setForm] = useState<PurchaseOrder>(emptyPO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await api.get<Model[]>('/po/available-models');
        setAvailableModels(data);
      } catch (err) {
        setError('Failed to load available models');
      }
    };
    fetchModels();
  }, []);
  const [success, setSuccess] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // Next PO number state
  useEffect(() => {
    async function fetchNextPONumber() {
      try {
        const data = await api.get<{ po_number: string }>('/po/next-po-number');
        setForm(prev => ({ ...prev, po_number: data.po_number }));
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchNextPONumber();
  }, []);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, suppliersData] = await Promise.all([
          api.get<Branch[]>('/branches'),
          api.get<Supplier[]>('/suppliers')
        ]);
        setBranches(branchesData);
        setSuppliers(suppliersData);
      } catch (err) {
        setError('Failed to load reference data');
      }
    };
    fetchData();
  }, []);

  // Update delivery address when branch changes
  useEffect(() => {
    if (selectedBranch) {
      setForm(prev => ({
        ...prev,
        delivery_address: selectedBranch.address || '',
        branch_id: selectedBranch.id
      }));
    }
  }, [selectedBranch]);

  // Calculate totals when items change
  useEffect(() => {
    const totalBeforeRebate = form.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0);
    
    const finalAmount = form.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const rebateAmount = (item.rebate_percentage || 0) / 100 * itemTotal;
      return sum + (itemTotal - rebateAmount);
    }, 0);

    const totalDiscount = totalBeforeRebate - finalAmount;
    
    setForm(prev => ({
      ...prev,
      dealer_discount: totalDiscount,
      net_amount: finalAmount
    }));
  }, [form.items]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle item changes
  const handleItemChange = (index: number, field: keyof POItem, value: string | number) => {
    setForm(prev => {
      const newItems = [...(prev.items || [])] as POItemWithModel[];
      
      if (field === 'model_code') {
        const selectedModel = availableModels.find(model => model.item_no === value);
        if (selectedModel) {
          const srp = selectedModel.srp || 0;
          newItems[index] = {
            ...newItems[index],
            model_name: selectedModel.model,
            model_code: selectedModel.item_no,
            srp: srp,
            unit_price: srp,
            color: selectedModel.color[0] || '',
            item_id: selectedModel.id,
            rebate_percentage: 11,
            margin: 0
          };
        } else {
          newItems[index] = {
            ...newItems[index],
            model_name: '',
            model_code: '',
            srp: 0,
            unit_price: 0,
            color: '',
            item_id: undefined,
            rebate_percentage: 11,
            margin: 0
          };
        }
      } else if (field === 'quantity') {
        newItems[index] = {
          ...newItems[index],
          [field]: Number(value) || 1
        };
      } else if (field === 'rebate_percentage') {
        newItems[index] = {
          ...newItems[index],
          rebate_percentage: Number(value) || 0
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          [field]: value
        };
      }
      // Always recalculate amount: (SRP - SRP * rebate%) * quantity
      const srp = newItems[index].srp || 0;
      const rebate = newItems[index].rebate_percentage || 0;
      const baseAmount = Number(newItems[index].quantity) * srp;
      const rebateAmount = baseAmount * (rebate / 100);
      newItems[index].amount = baseAmount - rebateAmount;
      // Always keep unit_price in sync with srp
      newItems[index].unit_price = srp;
      return { ...prev, items: newItems };
    });
  }

  // Add new item row
  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...(prev.items || []), { ...emptyPOItem }]
    }));
  };

  // Remove item row
  const removeItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }));
  };

  // Submit form
  // Handle check details
const handleCheckChange = (index: number, field: keyof CheckDetails, value: string | number) => {
  setForm(prev => {
    const paymentDetails = prev.payment_details || { payment_dates: [], payment_amounts: [], checks: [] };
    const newChecks = [...(paymentDetails.checks || [])];
    newChecks[index] = {
      ...newChecks[index],
      [field]: value,
      status: 'pending'
    };
    return {
      ...prev,
      payment_details: {
        ...paymentDetails,
        checks: newChecks
      }
    };
  });
};

const addCheck = () => {
  setForm(prev => {
    const paymentDetails = prev.payment_details || { payment_dates: [], payment_amounts: [], checks: [] };
    return {
      ...prev,
      payment_details: {
        ...paymentDetails,
        checks: [
          ...(paymentDetails.checks || []),
          { check_number: '', check_date: '', bank: '', amount: 0, status: 'pending' }
        ]
      }
    };
  });
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate and parse PO date
    const poDate = new Date(form.date_issued);
    if (isNaN(poDate.getTime()) || poDate > new Date()) {
      setError('Please enter a valid PO date (not in the future)');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!form.date_issued || !form.contact_person || !form.contact_number || !form.prepared_by || !form.checked_by) {
      setError('Please fill in all required fields');
      setError('Please fill in all required fields, including Prepared By and Checked By');
      setLoading(false);
      return;
    }
    // Validate dates
    if (isNaN(Date.parse(form.date_issued))) {
      setError('Please enter a valid issue date');
      setLoading(false);
      return;
    }
    if (form.due_date && isNaN(Date.parse(form.due_date))) {
      setError('Please enter a valid due date');
      setLoading(false);
      return;
    }

    // Validate items
    if ((form.items || []).length === 0) {
      setError('Please add at least one item');
      setLoading(false);
      return;
    }

    for (const item of form.items || []) {
      if (!item.model_name || !item.model_code || !item.color || !item.quantity || !item.unit_price) {
        setError('Please fill in all item details');
        setLoading(false);
        return;
      }
      if (!item.amount || item.amount <= 0) {
        setError(`Amount for ${item.model_name || 'item'} must be greater than 0`);
        setLoading(false);
        return;
      }
    }

    try {
      // Validate items
  for (const [index, item] of (form.items || []).entries()) {
        if (!item.item_id) {
          throw new Error(`Please select a valid model for item #${index + 1}`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Please enter a valid quantity for ${item.model_name || `item #${index + 1}`}`);
        }
        if (!item.unit_price || item.unit_price <= 0) {
          throw new Error(`Please enter a valid unit price for ${item.model_name || `item #${index + 1}`}`);
        }
        const quantity = Math.max(1, Number(item.quantity));
        const unitPrice = Math.max(0, Number(item.unit_price));
        if (!quantity || !unitPrice) {
          throw new Error(`Please enter valid quantity and unit price for ${item.model_name || `item #${index + 1}`}`);
        }
      };

      // Calculate total amount, rebates, and net amount
      const totalBeforeRebate = (form.items || []).reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0);
      
      const rebateAmount = (form.items || []).reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        const itemRebate = (item.rebate_percentage || 0) / 100 * itemTotal;
        return sum + itemRebate;
      }, 0);

      const netAmount = totalBeforeRebate - rebateAmount;

      // Ensure dates are in YYYY-MM-DD format
      const formatDate = (date?: string) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      const payload = {
        date_issued: formatDate(form.date_issued),
        branch_id: form.branch_id,
        supplier_id: form.supplier_id,
        contact_person: form.contact_person,
        contact_number: form.contact_number,
        payment_term: form.payment_term || '-',
  due_date: formatDate(form.due_date),
        dealer_discount: rebateAmount, // Use the total rebate amount
        net_amount: netAmount,
        payment_mode: form.payment_mode,
        prepared_by: form.prepared_by,
        checked_by: form.checked_by,
        items: (form.items || []).map(item => ({
          item_id: item.item_id,
          model_code: item.model_code,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          color: item.color,
          rebate_percentage: Number(item.rebate_percentage) || 0,
          amount: item.amount // Use the already calculated amount that includes rebate
        }))
      };

      await api.post('/po', payload);
      setSuccess('Purchase Order created successfully!');
      setForm(emptyPO);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create Purchase Order');
    } finally {
      setLoading(false);
    }
  };

  return (
  <>
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">New Purchase Order</h1>
        <p className="text-gray-600">PMBC - NEW MOTO DEALERSHIP</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of P.O</label>
            <input
              type="date"
              name="date_issued"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              value={form.date_issued}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">P.O No.</label>
            <input
              type="text"
              name="po_number"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-100"
              value={form.po_number}
              readOnly
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Branch</label>
            <select
              name="branch_id"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              value={selectedBranch?.id || ''}
              onChange={(e) => {
                const branch = branches.find(b => b.id === Number(e.target.value));
                setSelectedBranch(branch || null);
              }}
              required
            >
              <option value="">Select Branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <select
              name="supplier_id"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              value={form.supplier_id || ''}
              onChange={(e) => {
                const supplier = suppliers.find(s => s.id === Number(e.target.value));
                if (supplier) {
                  setForm(prev => ({
                    ...prev,
                    supplier_id: supplier.id,
                    contact_person: supplier.contact_person,
                    contact_number: supplier.contact_number
                  }));
                }
              }}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-50"
              value={form.contact_person}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              name="contact_number"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-50"
              value={form.contact_number}
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
          <textarea
            name="delivery_address"
            rows={2}
            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-50"
            value={form.delivery_address}
            readOnly
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">SRP</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rebate %</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(form.items || []).map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    <select
                      className="block w-full border-gray-300 rounded-md shadow-sm"
                      value={item.model_code}
                      onChange={(e) => handleItemChange(index, 'model_code', e.target.value)}
                      required
                    >
                      <option value="">Select a model</option>
                      {availableModels.map(model => (
                        <option key={model.id} value={model.item_no}>
                          {model.item_no} - {model.brand} {model.model}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                      value={item.model_code}
                      readOnly
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="block w-full border-gray-300 rounded-md shadow-sm"
                      value={item.color}
                      onChange={(e) => handleItemChange(index, 'color', e.target.value)}
                      required
                    >
                      <option value="">Select a color</option>
                      {availableModels
                        .find(m => m.model === item.model_name)?.color
                        .map(color => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      className="block w-full border-gray-300 rounded-md shadow-sm text-right"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      min="1"
                      required
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {(item as POItemWithModel).srp?.toLocaleString() || '-'}
                  </td>
                  {/* <td className="px-4 py-2 text-right">
                    {(item as POItemWithModel).srp?.toLocaleString() || '-'}
                  </td> */}
                  <td className="px-4 py-2 text-right">
                    {/* Margin per unit: (SRP - (Amount/Quantity)) */}
                    {(((item.srp || 0) - ((item.amount || 0) / (item.quantity || 1)))).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className="block w-full border-gray-300 rounded-md shadow-sm text-right"
                      value={item.rebate_percentage || 0}
                      onChange={(e) => handleItemChange(index, 'rebate_percentage', Number(e.target.value))}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {item.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-900"
                      disabled={(form.items || []).length === 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={addItem}
            className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Add Item
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Rebate Amount</label>
            <input
              type="number"
              name="dealer_discount"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-50"
              value={form.dealer_discount}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Net Amount Due</label>
            <input
              type="number"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-50"
              value={form.net_amount}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              name="due_date"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              value={form.due_date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Term</label>
            <input
              type="text"
              name="payment_term"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              value={form.payment_term}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
            <select
              name="payment_mode"
              className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              value={form.payment_mode}
              onChange={handleChange}
              required
            >
              <option value="">Select Payment Mode</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Prepared By and Checked By Fields */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prepared By</label>
            <input
              type="text"
              name="prepared_by"
              value={form.prepared_by || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Approved By</label>
            <input
              type="text"
              name="checked_by"
              value={form.checked_by || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setForm(emptyPO)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear Form
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  </>
  );
}

export default PurchaseOrderForm;
