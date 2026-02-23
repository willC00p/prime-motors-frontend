import type { Decimal } from '@prisma/client/runtime/library';

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  item_id: number;
  quantity: number;
  unit_price: Decimal;
  amount: Decimal | null;
  color: string | null;
  rebate_percentage: Decimal | null;
  items: {
    id: number;
    item_no: string;
    model: string | null;
    brand: string | null;
  };
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  date_issued: Date;
  due_date: Date | null;
  contact_person: string | null;
  contact_number: string | null;
  payment_term: string | null;
  payment_mode: string | null;
  payment_status: 'paid' | 'unpaid';
  check_number: string | null;
  check_date: Date | null;
  dealer_discount: Decimal | null;
  prepared_by: string | null;
  checked_by: string | null;
  purchase_order_items: PurchaseOrderItem[];
  branches: {
    id: number;
    name: string;
    address: string | null;
  } | null;
  suppliers: {
    id: number;
    name: string;
    address: string | null;
    contact_person: string | null;
    contact_number: string | null;
  } | null;
}
