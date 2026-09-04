import type {
  CreatePaymentInput,
  NotReadyPaymentOrder,
  PaymentEntity,
  PaymentsSummary,
} from "./entities";

export interface PaymentsRepository {
  getSummary(storeIds?: number[]): Promise<PaymentsSummary>;
  getNotReadyOrders(storeIds?: number[]): Promise<NotReadyPaymentOrder[]>;
  getByStoreId(storeId: number): Promise<PaymentEntity[]>;
  getByStoreIds(storeIds?: number[]): Promise<PaymentEntity[]>;
  getById(id: number): Promise<PaymentEntity | null>;
  create(input: CreatePaymentInput): Promise<PaymentEntity>;
  markPaid(paymentId: number): Promise<PaymentEntity>;
}
