export type ReturnStatus = "processed" | "collected";

export interface ReturnEntity {
  id: number;
  /** Public identifier, e.g. RET-4XEE9K */
  code: string;
  store_id: number;
  status: ReturnStatus;
  created_at: string;
  modified_at: string;
  order_ids?: number[];
  orders?: ReturnOrderSummary[];
  items?: ReturnItemSummary[];
}

export interface ReturnItemSummary {
  order_id: number;
  item_id: number;
  product?: string;
  color?: string;
  colorHex?: string;
  size?: string;
  qty: number;
}

export interface ReturnOrderSummary {
  id: number;
  status?: string;
  product?: string;
  product_qty: number;
  tracking_id?: string;
  yalidine_status?: string;
  dc_recent_status?: string;
  created_at?: string;
}

export interface CreateReturnInput {
  store_id: number;
  order_ids: number[];
}

export interface EligibleReturnOrder {
  id: number;
  store_id?: number;
  status?: string;
  product?: string;
  product_qty: number;
  tracking_id?: string;
  yalidine_status?: string;
  dc_recent_status?: string;
  created_at?: string;
}
