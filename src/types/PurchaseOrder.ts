export interface POItem {
  id?: number;
  item_id?: number;
  model_name: string;
  model_code: string;
  color: string;
  quantity: number;
  unit_price: number;
  amount: number;
  srp?: number;
  margin?: number;
  rebate_percentage?: number;
}

export interface POItemForAPI {
  item_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
  color: string;
  model_code: string;
  margin: number;
  rebate_percentage: number;
}

export interface PurchaseOrder {
  id?: number;
  po_number: string;
  date_issued: string;
  branch_id?: number;
  supplier_id?: number;
  supplier_details?: SupplierDetails;
  contact_person?: string;
  contact_number?: string;
  delivery_address?: string;
  items?: POItem[];
  dealer_discount?: number;
  net_amount?: number;
  due_date?: string;
  payment_term?: string;
  payment_mode?: string;
  payment_details?: PaymentDetails;
    payment_status: 'paid' | 'unpaid';
    check_number: string | null;
    check_date?: string | null;
  prepared_by?: string;
  checked_by?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'pending' | 'received';
}

export interface CheckDetails {
  check_number: string;
  check_date: string;
  bank: string;
  amount: number;
  status: 'pending' | 'cleared' | 'bounced';
}

export interface PaymentDetails {
  payment_dates: string[];
  payment_amounts: number[];
  checks: CheckDetails[];
}

export interface SupplierDetails {
  name: string;
  address: string;
  tin_number: string;
}

export interface POStatusUpdate {
  ids: number[];
  status: 'pending' | 'received';
  payment_status?: 'unpaid' | 'partial' | 'paid';
}
