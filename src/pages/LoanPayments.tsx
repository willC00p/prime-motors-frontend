import React from 'react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface LoanPayment {
  payment_no: number;
  status: string;
  paid_date?: string;
}

interface Sale {
  id: number;
  first_name: string;
  last_name: string;
  contact_no: string;
  branch_id?: number;
  branch_name?: string;
  total_amount: number;
  payment_method: string;
  date_granted: string;
  maturity_date: string;
  terms: number;
  loan_amount: number;
  monthly_amortization: number;
  payments?: LoanPayment[];
  loan_payments?: LoanPayment[];
}



// Import api utility
import { api } from '../services/api';

const LoanPayments: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { data: loanSales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['loanSales'],
    queryFn: async () => {
      console.log('[LoanPayments] Fetching loan sales');
      try {
        const url = `/api/sales?payment_method=loan`;
        console.log('[LoanPayments] Making request to:', url);
        const data = await api.get<Sale[]>(url);
        console.log('[LoanPayments] Raw fetched loan sales:', data);
        
        if (Array.isArray(data)) {
          console.log(`[LoanPayments] Fetched ${data.length} sales`);
          data.forEach((sale, idx) => {
            console.log(`[LoanPayments] Sale #${idx}:`, {
              id: sale.id,
              date_granted: sale.date_granted,
              customerName: `${sale.first_name} ${sale.last_name}`,
              payment_method: sale.payment_method,
              loan_amount: sale.loan_amount,
              terms: sale.terms
            });
          });
          return data;
        } else {
          console.error('[LoanPayments] Unexpected data format:', data);
          throw new Error('Unexpected data format from API');
        }
      } catch (error) {
        console.error('[LoanPayments] Error fetching loan sales:', error);
        throw error;
      }
  }
  });

  // Branch list and UI filters
  interface Branch {
    id: number;
    name: string;
  }
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [branchFilter, setBranchFilter] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<Branch[]>('/api/branches');
        if (!cancelled) setBranches(data || []);
      } catch (err) {
        console.error('Failed to load branches for loan payments filter', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Client-side filtered view
  const filteredSales = React.useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return (loanSales || []).filter(sale => {
      // Branch filter
      if (branchFilter && sale.branch_id && sale.branch_id !== branchFilter) return false;
      // Search by id, name, contact
      if (!q) return true;
      const idMatch = String(sale.id).includes(q);
      const name = `${sale.first_name || ''} ${sale.last_name || ''}`.toLowerCase();
      const nameMatch = name.includes(q);
      const contactMatch = (sale.contact_no || '').toLowerCase().includes(q);
      return idMatch || nameMatch || contactMatch;
    });
  }, [loanSales, searchTerm, branchFilter]);



  type PaymentVars = { paymentId: number; amount: number; paymentNumber: number };
  const recordPaymentMutation = useMutation<unknown, Error, PaymentVars>({
    mutationFn: async ({ paymentId, amount, paymentNumber }) => {
      console.log('[recordPayment] Sending payment:', { paymentId, amount, paymentNumber });
      try {
        const data = await api.post('/api/loan-payments', {
          sale_id: paymentId,
          paid_amount: amount,
          payment_number: paymentNumber,
          paid_date: new Date().toISOString(),
          status: 'paid'
        });
        console.log('[recordPayment] Success:', data);
        return data;
      } catch (error) {
        console.error('[recordPayment] Error:', error);
        // Check if the error is from our API
        const message = error instanceof Error ? error.message : 'Failed to record payment';
        if (message.includes('Payment not found or already paid')) {
          alert('This payment cannot be recorded. It may have already been paid or the payment number is incorrect.');
        } else {
          alert('Failed to record payment. Please try again.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[recordPayment] Payment recorded successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['loanSales'] });
    },
    onError: (error) => {
      console.error('[recordPayment] Mutation error:', error);
    }
  });






  // State for report generation
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Function to download monthly report
  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      await api.getPDF(
        `/api/loan-payments/monthly-report?month=${selectedMonth}&year=${selectedYear}`,
        `LoanPayments_${selectedYear}_${selectedMonth}.pdf`
      );
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Loan Payments Management</h2>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search by name, contact or sale ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1"
              />
              <select
                value={branchFilter ?? ''}
                onChange={(e) => setBranchFilter(e.target.value ? Number(e.target.value) : null)}
                className="border rounded px-3 py-1"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {/* Month Selection */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border rounded px-3 py-1"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>

              {/* Year Selection */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border rounded px-3 py-1"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>

              {/* Generate Report Button */}
              <button
                onClick={handleDownloadReport}
                disabled={isGenerating}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Monthly Report'}
              </button>
            </div>
          </div>
            <div className="space-y-6">
            {filteredSales.map(sale => {
              const loanStartDate = new Date(sale.date_granted);
              const startMonth = loanStartDate.getMonth();
              // Use loan_payments from backend for status
              const payments = sale.loan_payments || [];
              return (
                <div key={sale.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium">{sale.first_name} {sale.last_name}</h3>
                      <p className="text-sm text-gray-500">Contact: {sale.contact_no}</p>
                      <p className="text-sm text-gray-500">
                        Total Amount: ₱{sale.total_amount?.toLocaleString?.() ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {Array.from({ length: sale.terms }, (_, i) => {
                      // Start from the next month after sale
                      const monthDate = new Date(loanStartDate);
                      monthDate.setMonth(startMonth + i + 1); // Add 1 to skip the down payment month
                      monthDate.setDate(1); // Set to 1st of the month
                      const payment = payments.find((p: LoanPayment) => p.payment_no === i + 1);
                      const isPaid = payment && payment.status === 'paid';
                      return (
                        <div key={monthDate.toISOString()} className="p-3 rounded-lg border bg-white">
                          <div className="text-sm font-medium mb-1">
                            {format(monthDate, 'MMMM yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            Payment {i + 1} of {sale.terms} • ₱{sale.monthly_amortization.toLocaleString()}
                          </div>
                          {isPaid && (
                            <>
                              <div className="text-xs text-green-700 mt-1">
                                Paid on: {payment?.paid_date ? format(new Date(payment.paid_date), 'yyyy-MM-dd') : '—'}
                              </div>
                            </>
                          )}
                          <button
                            onClick={() => {
                              if (recordPaymentMutation.isPending || isPaid) return;
                              recordPaymentMutation.mutate({
                                paymentId: sale.id,
                                amount: sale.monthly_amortization,
                                paymentNumber: i + 1
                              });
                            }}
                            className={clsx(
                              "mt-2 w-full px-2 py-1 text-xs font-medium rounded transition-colors",
                              isPaid
                                ? "bg-green-100 text-green-800 cursor-not-allowed"
                                : recordPaymentMutation.isPending
                                ? "bg-blue-400 cursor-wait"
                                : recordPaymentMutation.isError
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            )}
                            disabled={isPaid || recordPaymentMutation.isPending}
                          >
                            {isPaid
                              ? "Paid"
                              : recordPaymentMutation.isPending
                              ? "Recording..."
                              : recordPaymentMutation.isError
                              ? "Failed - Try Again"
                              : "Mark as Paid"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanPayments;
