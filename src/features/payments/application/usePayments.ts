import {
  useStandardMutation,
  useStandardQuery,
} from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import type {
  CreatePaymentInput,
  PaymentEntity,
  PaymentsSummary,
} from "../domain";
import {
  createDummyPayment,
  getDummyPaymentById,
  getDummyPaymentsSummary,
  isDummyDataEnabled,
  markDummyPaymentPaid,
} from "@/shared/lib/dummy-data";

const paymentsKey = ["payments"];

export const usePaymentsSummary = (
  storeId: number | null | undefined,
  enabled = true
) => {
  const params = storeId != null ? `?storeId=${storeId}` : "";
  const dummy = isDummyDataEnabled();
  return useStandardQuery(
    [...paymentsKey, "summary", String(storeId ?? "me"), dummy ? "dummy" : "live"],
    async () => {
      if (dummy) return getDummyPaymentsSummary();
      return apiFetch<PaymentsSummary>(`/api/payments${params}`);
    },
    {
      enabled: dummy || enabled,
      staleTime: 60 * 1000,
    }
  );
};

export const fetchPaymentDetail = async (id: number): Promise<PaymentEntity> => {
  if (isDummyDataEnabled()) {
    const found = getDummyPaymentById(id);
    if (!found) throw new Error("Payment not found");
    return found;
  }

  return apiFetch<{ payment: PaymentEntity }>(`/api/payments/${id}`).then(
    (data) => data.payment
  );
};

export const usePaymentDetail = (id: number | null) => {
  const dummy = isDummyDataEnabled();
  return useStandardQuery(
    [...paymentsKey, "detail", String(id ?? "none"), dummy ? "dummy" : "live"],
    () => fetchPaymentDetail(id as number),
    {
      enabled: id != null,
      staleTime: 60 * 1000,
    }
  );
};

export const useCreatePayment = () => {
  return useStandardMutation(
    (payload: CreatePaymentInput) => {
      if (isDummyDataEnabled()) {
        return Promise.resolve(createDummyPayment(payload));
      }
      return apiFetch<{ payment: PaymentEntity }>("/api/payments", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((d) => d.payment);
    },
    {
      invalidateQueries: [paymentsKey, ["orders"]],
      successMessage: "Payment batch created",
      errorMessage: "Failed to create payment",
    }
  );
};

export const useMarkPaymentPaid = () => {
  return useStandardMutation(
    (paymentId: number) => {
      if (isDummyDataEnabled()) {
        return Promise.resolve(markDummyPaymentPaid(paymentId));
      }
      return apiFetch<{ payment: PaymentEntity }>(
        `/api/payments/${paymentId}/mark-paid`,
        { method: "POST" }
      ).then((d) => d.payment);
    },
    {
      invalidateQueries: [paymentsKey],
      successMessage: "Payment marked as paid",
      errorMessage: "Failed to mark payment as paid",
    }
  );
};
