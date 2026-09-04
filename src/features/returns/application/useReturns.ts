import {
  useStandardMutation,
  useStandardQuery,
} from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import {
  createDummyReturn,
  getDummyEligibleReturnOrders,
  getDummyReturnById,
  getDummyReturns,
  isDummyDataEnabled,
  markDummyReturnCollected,
} from "@/shared/lib/dummy-data";
import type {
  CreateReturnInput,
  EligibleReturnOrder,
  ReturnEntity,
} from "../domain";

const returnsKey = ["returns"];

export const useStoreReturns = (storeId: number | null | undefined, enabled = true) => {
  const params =
    storeId != null ? `?storeId=${storeId}` : "";
  const dummy = isDummyDataEnabled();
  return useStandardQuery(
    [...returnsKey, "list", String(storeId ?? "all"), dummy ? "dummy" : "live"],
    async () => {
      if (dummy) return getDummyReturns(storeId);
      return apiFetch<{ returns: ReturnEntity[] }>(`/api/returns${params}`).then(
        (d) => d.returns
      );
    },
    {
      enabled: dummy || enabled,
      staleTime: 60 * 1000,
    }
  );
};

export const useEligibleReturnOrders = (storeId: number | null, enabled = true) => {
  const params = storeId != null ? `?storeId=${storeId}` : "";
  const dummy = isDummyDataEnabled();
  return useStandardQuery(
    [...returnsKey, "eligible", String(storeId ?? "none"), dummy ? "dummy" : "live"],
    async () => {
      if (dummy) {
        if (storeId == null) return [];
        return getDummyEligibleReturnOrders(storeId);
      }
      return apiFetch<{ orders: EligibleReturnOrder[] }>(
        `/api/returns/eligible${params}`
      ).then((d) => d.orders);
    },
    {
      enabled: dummy ? storeId != null : enabled && storeId != null,
      staleTime: 30 * 1000,
    }
  );
};

export const fetchReturnDetail = async (id: number): Promise<ReturnEntity> => {
  if (isDummyDataEnabled()) {
    const found = getDummyReturnById(id);
    if (!found) throw new Error("Return not found");
    return found;
  }

  return apiFetch<{ return: ReturnEntity }>(`/api/returns/${id}`).then(
    (data) => data.return
  );
};

export const useReturnDetail = (id: number | null) => {
  const dummy = isDummyDataEnabled();
  return useStandardQuery(
    [...returnsKey, "detail", String(id ?? "none"), dummy ? "dummy" : "live"],
    () => fetchReturnDetail(id as number),
    {
      enabled: id != null,
      staleTime: 60 * 1000,
    }
  );
};

export const useCreateReturn = () => {
  return useStandardMutation(
    (payload: CreateReturnInput) => {
      if (isDummyDataEnabled()) {
        return Promise.resolve(createDummyReturn(payload));
      }
      return apiFetch<{ return: ReturnEntity }>("/api/returns", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((d) => d.return);
    },
    {
      invalidateQueries: [returnsKey],
      successMessage: "Return batch created",
      errorMessage: "Failed to create return batch",
    }
  );
};

export const useMarkReturnCollected = () => {
  return useStandardMutation(
    (returnId: number) => {
      if (isDummyDataEnabled()) {
        return Promise.resolve(markDummyReturnCollected(returnId));
      }
      return apiFetch<{ return: ReturnEntity }>(`/api/returns/${returnId}/collect`, {
        method: "POST",
      }).then((d) => d.return);
    },
    {
      invalidateQueries: [returnsKey],
      successMessage: "Return marked as collected",
      errorMessage: "Failed to mark return as collected",
    }
  );
};
