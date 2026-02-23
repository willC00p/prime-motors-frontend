import { fetchApi } from '../services/api';

export async function fetchSupplierPayments() {
  return fetchApi('/api/suppliers/payments/monitor');
}
