"use client";

import {
  useStandardMutation,
  useStandardQuery,
} from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import type { StoreEntity } from "../domain";

const storesKey = ["stores"];

export const useStoresList = (enabled = true) => {
  return useStandardQuery(
    [...storesKey, "list"],
    () =>
      apiFetch<{ stores: StoreEntity[] }>("/api/stores").then((d) => d.stores),
    {
      enabled,
      staleTime: 60 * 1000,
    }
  );
};

export const useUpdateStoreStatus = () => {
  return useStandardMutation(
    ({ storeId, status }: { storeId: number; status: string }) =>
      apiFetch<{ store: StoreEntity }>(`/api/stores/${storeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }).then((d) => d.store),
    {
      invalidateQueries: [storesKey],
      successMessage: "Store status updated",
      errorMessage: "Failed to update store status",
    }
  );
};
