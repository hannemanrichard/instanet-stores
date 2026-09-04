import { SupabasePaymentsService } from "../../data";
import type {
  CreatePaymentInput,
  PaymentEntity,
  PaymentsSummary,
} from "../../domain";
import { PaymentsError } from "../../domain";
import type { PaymentsRepository } from "../../domain/repositories";

export class PaymentsApplicationService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async getSummary(storeIds?: number[]): Promise<PaymentsSummary> {
    try {
      return await this.paymentsRepository.getSummary(storeIds);
    } catch (error) {
      if (error instanceof PaymentsError) throw error;
      throw new PaymentsError(
        "Failed to load payments",
        "PAYMENTS_FETCH_FAILED"
      );
    }
  }

  async getById(id: number): Promise<PaymentEntity | null> {
    try {
      if (!id) {
        throw new PaymentsError(
          "Payment id is required",
          "PAYMENTS_ID_REQUIRED"
        );
      }
      return await this.paymentsRepository.getById(id);
    } catch (error) {
      if (error instanceof PaymentsError) throw error;
      throw new PaymentsError(
        "Failed to load payment",
        "PAYMENTS_FETCH_FAILED"
      );
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentEntity> {
    try {
      if (!input.store_id) {
        throw new PaymentsError(
          "Store id is required",
          "PAYMENTS_STORE_REQUIRED"
        );
      }
      if (!input.order_ids?.length) {
        throw new PaymentsError(
          "At least one order is required",
          "PAYMENTS_ORDERS_REQUIRED"
        );
      }
      return await this.paymentsRepository.create(input);
    } catch (error) {
      if (error instanceof PaymentsError) throw error;
      throw new PaymentsError(
        "Failed to create payment",
        "PAYMENTS_CREATE_FAILED"
      );
    }
  }

  async markPaid(paymentId: number): Promise<PaymentEntity> {
    try {
      if (!paymentId) {
        throw new PaymentsError(
          "Payment id is required",
          "PAYMENTS_ID_REQUIRED"
        );
      }
      return await this.paymentsRepository.markPaid(paymentId);
    } catch (error) {
      if (error instanceof PaymentsError) throw error;
      throw new PaymentsError(
        "Failed to mark payment as paid",
        "PAYMENTS_MARK_PAID_FAILED"
      );
    }
  }
}

const paymentsService = new SupabasePaymentsService();
export const paymentsApplicationService = new PaymentsApplicationService(
  paymentsService
);
