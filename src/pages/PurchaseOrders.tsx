

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { PurchaseOrder, POItem } from '../types/PurchaseOrder';
import PurchaseOrderForm from './PurchaseOrderForm';



export default function PurchaseOrders() {
  interface DeliveryItemInput {
    item_id: number;
    model_name: string;
    color: string;
    quantity_ordered: number;
    quantity_delivered: number;
    quantity_to_deliver: number;
  }


// ...existing code...
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>(undefined);
  const [checkNumber, setCheckNumber] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Partial delivery state
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItemInput[]>([]);
  const [deliveryDR, setDeliveryDR] = useState('');
  const [deliverySI, setDeliverySI] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.get<PurchaseOrder[]>('/po');
      const ordersWithStatus = data.map(order => ({
        ...order,
        status: order.payment_term === 'completed' ? 'received' : 'pending'
      } as PurchaseOrder));
      setOrders(ordersWithStatus);
    } catch (err) {
      setError('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openDeliveryDialog = async (order: PurchaseOrder) => {
    let items: POItem[] = [];
    if ((order as any).items) {
      items = (order as any).items;
    } else {
      try {
        const data = await api.get<POItem[]>(`/po/${order.id}/items`);
        items = data;
      } catch {
        items = [];
      }
    }
    const deliveryInputs: DeliveryItemInput[] = items.map(item => ({
      item_id: typeof item.item_id === 'number' ? item.item_id : (item.id as number),
      model_name: (item as any).model_name || (item as any).model_code || '',
      color: item.color || '',
      quantity_ordered: item.quantity,
      quantity_delivered: (item.delivered_qty ?? (item as any).quantity_delivered ?? 0),
      quantity_to_deliver: 0,
    }));
    setDeliveryItems(deliveryInputs);
    setSelectedOrderId(order.id);
    setDeliveryDR('');
    setDeliverySI('');
    setDeliveryDate('');
    setDeliveryError(null);
    setShowDeliveryDialog(true);
  };

  const handleDeliveryQtyChange = (idx: number, value: number) => {
    setDeliveryItems(items => items.map((item, i) =>
      i === idx ? { ...item, quantity_to_deliver: value } : item
    ));
  };

  const handleSubmitDelivery = async () => {
    if (!selectedOrderId) return;
    setDeliveryLoading(true);
    setDeliveryError(null);
    try {
      const deliveredItems = deliveryItems
        .filter(item => item.quantity_to_deliver > 0)
        .map(item => ({
          item_id: item.item_id,
          quantity: item.quantity_to_deliver,
        }));
      if (deliveredItems.length === 0) {
        setDeliveryError('Please enter at least one delivered quantity.');
        setDeliveryLoading(false);
        return;
      }
      await api.post(`/po/${selectedOrderId}/deliver`, {
        delivered_items: deliveredItems,
        dr_number: deliveryDR,
        si_number: deliverySI,
        delivery_date: deliveryDate,
      });
      setShowDeliveryDialog(false);
      fetchOrders();
    } catch (e: any) {
      setDeliveryError(e?.message || 'Failed to record delivery');
    } finally {
      setDeliveryLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' ? true : order.status === statusFilter
  );

  const handlePayment = async () => {
    if (!selectedOrderId || !checkNumber) return;
    try {
      setLoading(true);
      const orderId = Number(selectedOrderId);
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) throw new Error('Selected order not found');
      await api.post(`/po/${orderId}/payment`, {
        check_number: checkNumber,
        check_date: checkDate,
      });
      setOrders(orders.map(order =>
        order.id === selectedOrderId
          ? { ...order, payment_status: 'paid', check_number: checkNumber, check_date: checkDate }
          : order
      ));
      setShowPaymentDialog(false);
      setCheckNumber('');
      setCheckDate('');
      setSelectedOrderId(undefined);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to update payment status: ${err.message}`);
      } else if (typeof err === 'object' && err && 'response' in err) {
        const axiosError = err as any;
        setError(`Failed to update payment status: ${axiosError.response?.data?.error || axiosError.message}`);
      } else {
        setError('Failed to update payment status: Unknown error');
      }
      console.error('Payment update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <div className="flex gap-4">
          <select
            className="border rounded-md px-3 py-1.5"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'received')}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Close Form' : 'New Purchase Order'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">New Purchase Order</h2>
          <PurchaseOrderForm onSuccess={() => {
            setShowForm(false);
            fetchOrders();
          }} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Number</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <>
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.po_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.date_issued).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.contact_person}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => openDeliveryDialog(order)}
                          className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 mr-2"
                        >
                          Deliver
                        </button>
                        <button
                          onClick={async () => {
                            const dr_no = prompt('Enter Delivery Receipt (DR) Number:');
                            const si_no = prompt('Enter Sales Invoice (SI) Number:');
                            const date_received = prompt('Enter Received Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                            if (dr_no && si_no && date_received) {
                              try {
                                await api.post(`/po/${order.id}/complete`, {
                                  po_id: order.id,
                                  dr_no,
                                  si_no,
                                  date_received
                                });
                                fetchOrders();
                              } catch (err) {
                                setError('Failed to complete purchase order');
                              }
                            }
                          }}
                          className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        >
                          Complete Order
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {order.status?.toUpperCase() || 'RECEIVED'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {order.payment_status || 'unpaid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.check_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                    <button
                      onClick={async () => {
                        try {
                          await api.getPDF(`/po/${order.id}/pdf`);
                        } catch (err) {
                          setError('Failed to download PDF');
                        }
                      }}
                      className="inline-flex px-3 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      Download PDF
                    </button>
                    {order.payment_status !== 'paid' && (
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setShowPaymentDialog(true);
                        }}
                        className="inline-flex px-3 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
                {/* Show PO items with delivery status */}
                {order.items && order.items.length > 0 && (
                  <tr>
                    <td colSpan={7} className="bg-gray-50 px-6 py-2">
                      <table className="w-full text-xs border">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1">Model</th>
                            <th className="border px-2 py-1">Ordered</th>
                            <th className="border px-2 py-1">Delivered</th>
                            <th className="border px-2 py-1">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item: any) => {
                            const delivered = item.delivered_qty ?? item.quantity_delivered ?? 0;
                            let status = 'Pending';
                            if (delivered >= item.quantity) status = 'Fully Delivered';
                            else if (delivered > 0) status = 'Partially Delivered';
                            return (
                              <tr key={item.id}>
                                <td className="border px-2 py-1">{item.model_name || item.model_code || ''}</td>
                                <td className="border px-2 py-1">{item.quantity}</td>
                                <td className="border px-2 py-1">{delivered}</td>
                                <td className="border px-2 py-1">
                                  {status === 'Fully Delivered' && <span className="text-green-600 font-semibold">Fully Delivered</span>}
                                  {status === 'Partially Delivered' && <span className="text-yellow-600 font-semibold">Partially Delivered</span>}
                                  {status === 'Pending' && <span className="text-gray-500">Pending</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery Dialog (rendered outside the table for valid HTML) */}
      {showDeliveryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-2">Partial Delivery</h2>
            <table className="w-full mb-4">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Color</th>
                  <th>Ordered</th>
                  <th>Delivered</th>
                  <th>To Deliver</th>
                </tr>
              </thead>
              <tbody>
                {deliveryItems.map((item, idx) => (
                  <tr key={item.item_id}>
                    <td>{item.model_name}</td>
                    <td>{item.color}</td>
                    <td>{item.quantity_ordered}</td>
                    <td>{item.quantity_delivered}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={item.quantity_ordered - item.quantity_delivered}
                        value={item.quantity_to_deliver}
                        onChange={e => {
                          let val = parseInt(e.target.value, 10) || 0;
                          if (val < 0) val = 0;
                          if (val > item.quantity_ordered - item.quantity_delivered) val = item.quantity_ordered - item.quantity_delivered;
                          handleDeliveryQtyChange(idx, val);
                        }}
                        className="w-16 border rounded px-1 py-0.5"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                placeholder="Delivery Receipt (DR) #"
                value={deliveryDR}
                onChange={e => setDeliveryDR(e.target.value)}
                className="border rounded px-2 py-1 flex-1"
              />
              <input
                type="text"
                placeholder="Sales Invoice (SI) #"
                value={deliverySI}
                onChange={e => setDeliverySI(e.target.value)}
                className="border rounded px-2 py-1 flex-1"
              />
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="border rounded px-2 py-1 flex-1"
              />
            </div>
            {deliveryError && <div className="text-red-500 mb-2">{deliveryError}</div>}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded"
                onClick={() => setShowDeliveryDialog(false)}
                disabled={deliveryLoading}
              >Cancel</button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={handleSubmitDelivery}
                disabled={deliveryLoading}
              >{deliveryLoading ? 'Saving...' : 'Submit Delivery'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Enter Payment Details</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="checkNumber" className="block text-sm font-medium text-gray-700">
                  Check Number
                </label>
                <input
                  type="text"
                  id="checkNumber"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter check number"
                />
              </div>
              <div>
                <label htmlFor="checkDate" className="block text-sm font-medium text-gray-700">
                  Check Date
                </label>
                <input
                  type="date"
                  id="checkDate"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter check date"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setCheckNumber('');
                    setCheckDate('');
                    setSelectedOrderId(undefined);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!checkNumber || !checkDate}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    checkNumber && checkDate
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
