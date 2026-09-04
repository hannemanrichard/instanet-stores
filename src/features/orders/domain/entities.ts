// Domain entities for Orders feature

export type Nullable<T> = T | undefined;

export interface OrderEntity {
  id: number;
  status?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  commune?: string;
  wilaya?: string;
  channel?: string;
  comment?: string;
  objective?: string;
  delivery_company?: string;
  delivery_fees?: number;
  delivery_notes?: number;
  delivery_attempt?: number;
  tracking_id?: string;
  tracker_id?: number;
  dc_recent_status?: string;
  yalidine_status?: string;
  agent_id?: number;
  partner_id?: number;
  store_id?: number;
  is_supplier_paid: boolean;
  product?: string;
  product_color?: string;
  product_size?: string;
  product_price?: number;
  product_qty: number;
  /** Enriched from order items / product page — not persisted on orders row */
  product_thumbnail?: string;
  shipping_price?: number;
  is_auto_delivered: boolean;
  is_exchange_required: boolean;
  is_exchange?: boolean;
  has_exchange?: boolean;
  has_defect: boolean;
  is_free_shipping?: boolean;
  is_stopdesk?: boolean;
  is_wholesale?: boolean;
  return_processed: boolean;
  stopdesk?: string;
  created_at?: string;
  modified_at?: string;
}

export interface OrderItemProductDetails {
  id: number;
  product_id?: number;
  product?: string;
  color?: string;
  colorHex?: string;
  size?: string;
  thumbnail?: string;
  cog?: number;
}

export interface OrderItemEntity {
  order_id: number;
  item_id: number;
  qty?: number;
  unit_supplier_price?: number;
  item?: OrderItemProductDetails;
}

export interface OrderWithItems {
  order: OrderEntity;
  items: OrderItemEntity[];
}

export interface CreateOrderItemInput {
  item_id: number;
  qty?: number;
  unit_supplier_price?: number;
}

export interface UpdateOrderItemInput {
  item_id: number;
  qty?: number;
  unit_supplier_price?: number;
}

export interface OrderSummary {
  total_orders: number;
  total_processing: number;
  total_delivered: number;
  total_value: number;
}

