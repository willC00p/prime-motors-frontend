


import { useEffect, useState } from 'react';
import { FaBell, FaRegBell, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { api } from '../services/api';
import { fetchSupplierPayments } from '../services/supplierPaymentsApi';

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  contact_number: string;
  tin_number?: string;
  address?: string;
  created_at?: string;
}

interface SupplierPaymentPO {
  id: number;
  po_number: string;
  date_issued: string;
  due_date: string | null;
  payment_status: 'paid' | 'unpaid';
  check_number: string | null;
  dealer_discount?: number;
  purchase_order_items?: { amount: number }[];
  payment_term?: string;
  payment_mode?: string;
}

interface SupplierPaymentMonitor extends Supplier {
  totalPaid: number;
  totalDue: number;
  purchase_orders: SupplierPaymentPO[];
}

const emptySupplier: Supplier = {
  id: 0,
  name: '',
  contact_person: '',
  contact_number: '',
  tin_number: '',
  address: '',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<Supplier>(emptySupplier);
  const [paymentMonitor, setPaymentMonitor] = useState<SupplierPaymentMonitor[]>([]);
  const [reminders, setReminders] = useState<{ [poId: number]: string }>({});
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [reminderPO, setReminderPO] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'dueSoon' | 'paid'>('all');
  // Load reminders from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('poReminders');
    if (stored) setReminders(JSON.parse(stored));
  }, []);

  const saveReminder = (poId: number, date: Date) => {
    const newReminders = { ...reminders, [poId]: date.toISOString() };
    setReminders(newReminders);
    localStorage.setItem('poReminders', JSON.stringify(newReminders));
    setReminderPO(null);
    setReminderDate(null);
  };

  const getStatus = (po: SupplierPaymentPO) => {
    if (po.payment_status === 'paid') return 'paid';
    if (!po.due_date) return 'unknown';
    const due = new Date(po.due_date);
    const now = new Date();
    if (due < now) return 'overdue';
    const soon = new Date();
    soon.setDate(now.getDate() + 7);
    if (due <= soon) return 'dueSoon';
    return 'unpaid';
  };

  const filteredMonitor = paymentMonitor.map(supplier => ({
    ...supplier,
    purchase_orders: supplier.purchase_orders.filter(po => {
      const status = getStatus(po);
      if (statusFilter === 'all') return true;
      if (statusFilter === 'overdue') return status === 'overdue';
      if (statusFilter === 'dueSoon') return status === 'dueSoon';
      if (statusFilter === 'paid') return status === 'paid';
      return true;
    })
  })).filter(supplier => supplier.purchase_orders.length > 0);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.get<Supplier[]>('/suppliers');
      setSuppliers(data);
    } catch (err) {
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await fetchSupplierPayments();
  setPaymentMonitor(data as SupplierPaymentMonitor[]);
    } catch (err) {
      setError('Failed to load payment monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchPayments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, form);
      } else {
        await api.post('/suppliers', form);
      }
      fetchSuppliers();
      setShowForm(false);
      setEditingSupplier(null);
      setForm(emptySupplier);
      setSuccess(editingSupplier ? 'Supplier updated successfully' : 'Supplier created successfully');
    } catch (err) {
      setError('Failed to save supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm(supplier);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
      setSuccess('Supplier deleted successfully');
    } catch (err) {
      setError('Failed to delete supplier');
    }
  };



  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingSupplier(null);
            setForm(emptySupplier);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Supplier'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">TIN Number</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={form.tin_number || ''}
                  onChange={(e) => setForm({ ...form, tin_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={form.contact_number}
                  onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSupplier(null);
                  setForm(emptySupplier);
                }}
                className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingSupplier ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <>
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIN Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.tin_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.contact_person}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contact_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="text-red-600 hover:text-red-900 mr-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Monitoring Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-xl font-bold">Supplier Payment Monitoring</h2>
            <div>
              <label className="mr-2 text-sm font-medium">Filter:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="overdue">Overdue</option>
                <option value="dueSoon">Due Soon</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Due</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date Issued</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Number</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Reminder</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMonitor.map((supplier) => (
                supplier.purchase_orders.length === 0 ? (
                  <tr key={supplier.id + '-empty'}>
                    <td className="px-4 py-2" colSpan={10}>{supplier.name} (No POs)</td>
                  </tr>
                ) : (
                  supplier.purchase_orders.map((po, idx) => {
                    const status = getStatus(po);
                    const isOverdue = status === 'overdue';
                    const isDueSoon = status === 'dueSoon';
                    const isPaid = status === 'paid';
                    const reminderSet = reminders[po.id];
                    return (
                      <tr key={supplier.id + '-' + po.id}
                        className={
                          isOverdue ? 'bg-red-50 animate-pulse' :
                          isDueSoon ? 'bg-yellow-50' :
                          isPaid ? 'bg-green-50' : ''
                        }
                      >
                        {idx === 0 && (
                          <>
                            <td className="px-4 py-2 font-semibold" rowSpan={supplier.purchase_orders.length}>{supplier.name}</td>
                            <td className="px-4 py-2 font-semibold" rowSpan={supplier.purchase_orders.length}>₱{supplier.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-2 font-semibold" rowSpan={supplier.purchase_orders.length}>₱{supplier.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </>
                        )}
                        {idx !== 0 && null}
                        <td className="px-4 py-2">{po.po_number}</td>
                        <td className="px-4 py-2">{po.date_issued ? new Date(po.date_issued).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2" title={po.due_date ? new Date(po.due_date).toLocaleString() : ''}>
                          {po.due_date ? new Date(po.due_date).toLocaleDateString() : '-'}
                          {isOverdue && <FaExclamationTriangle className="inline ml-1 text-red-500" title="Overdue!" />}
                          {isDueSoon && <FaExclamationTriangle className="inline ml-1 text-yellow-500" title="Due soon!" />}
                        </td>
                        <td className="px-4 py-2">
                          {isPaid && <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"><FaCheckCircle className="mr-1" />Paid</span>}
                          {isOverdue && <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800"><FaTimesCircle className="mr-1" />Overdue</span>}
                          {isDueSoon && <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"><FaExclamationTriangle className="mr-1" />Due Soon</span>}
                          {!isPaid && !isOverdue && !isDueSoon && <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Unpaid</span>}
                        </td>
                        <td className="px-4 py-2">{po.check_number || '-'}</td>
                        <td className="px-4 py-2 text-right">
                          ₱{(po.purchase_order_items && po.purchase_order_items.length > 0
                            ? po.purchase_order_items.reduce((sum: number, item: { amount: number }) => sum + (Number(item.amount) || 0), 0)
                            : (po.dealer_discount || 0)
                          ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {reminderSet ? (
                            <span className="inline-flex items-center text-blue-600" title={`Reminder set for ${new Date(reminderSet).toLocaleString()}`}>
                              <FaBell className="mr-1" />
                              {new Date(reminderSet).toLocaleDateString()}
                            </span>
                          ) : (
                            !isPaid && (
                              <button
                                className="inline-flex items-center text-gray-500 hover:text-blue-600"
                                onClick={() => {
                                  setReminderPO(po.id);
                                  setReminderDate(po.due_date ? new Date(po.due_date) : new Date());
                                }}
                                title="Set Reminder"
                              >
                                <FaRegBell className="mr-1" />Set Reminder
                              </button>
                            )
                          )}
                          {/* Reminder Date Picker Popup */}
                          {reminderPO === po.id && (
                            <div className="absolute z-50 bg-white border rounded shadow p-4 mt-2">
                              <DatePicker
                                selected={reminderDate}
                                onChange={(date: Date | null) => setReminderDate(date)}
                                showTimeSelect
                                dateFormat="Pp"
                                minDate={new Date()}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  className="px-2 py-1 bg-blue-600 text-white rounded"
                                  onClick={() => reminderDate && saveReminder(po.id, reminderDate)}
                                >Save</button>
                                <button
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded"
                                  onClick={() => setReminderPO(null)}
                                >Cancel</button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

    </div>
  );
}
