export interface PaymentEntity {
  id: number;
  /** Public identifier, e.g. PMT-4K2M9A */
  code: string;
  store_id: number;
  amount: number;
  is_paid: boolean;
  note?: string;
  created_at: string;
  paid_at?: string;
  orders?: PaymentOrderSummary[];
}

export interface PaymentOrderSummary {
  order_id: number;
  amount: number;
  product?: string;
  product_qty?: number;
  created_at?: string;
}

export interface NotReadyPaymentOrder {
  id: number;
  store_id?: number;
  product?: string;
  product_qty: number;
  amount: number;
  created_at?: string;
  status?: string;
}

export interface PaymentsSummary {
  notReadyTotal: number;
  readyTotal: number;
  paidTotal: number;
  notReadyOrders: NotReadyPaymentOrder[];
  readyPayments: PaymentEntity[];
  paidPayments: PaymentEntity[];
}

export interface CreatePaymentInput {
  store_id: number;
  order_ids: number[];
  note?: string;
}
