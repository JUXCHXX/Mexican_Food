import type { OrderStatus, OrderType } from "@/lib/supabase";

export interface CartItem {
  item_slug: string;
  item_name: string;
  category_key: string;
  variant: string;
  unit_price: number;
  quantity: number;
  notes?: string;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  order_type: OrderType;
  table_id?: string | null;
  table_number?: number | null;
  table_number?: number | null;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  notes?: string | null;
  subtotal: number;
  tax: number;
  surcharge: number;
  tip: number;
  total: number;
  created_at: string;
  ready_at?: string | null;
  delivered_at?: string | null;
}

export interface OrderResult {
  order: CustomerOrder;
  items: CartItem[];
  rating?: { rating: number; comment?: string | null } | null;
}
