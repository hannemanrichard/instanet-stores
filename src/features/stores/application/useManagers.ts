"use client";

import {
  useStandardMutation,
  useStandardQuery,
} from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import type { StoreManagerProfile } from "../domain";

const managersKey = ["managers"];

export const useManagersList = (enabled = true) => {
  return useStandardQuery(
    [...managersKey, "list"],
    () =>
      apiFetch<{ managers: StoreManagerProfile[] }>("/api/managers").then(
        (d) => d.managers
      ),
    {
      enabled,
      staleTime: 60 * 1000,
    }
  );
};

export const useAssignManager = () => {
  return useStandardMutation(
    (payload: { email: string; storeIds: number[] }) =>
      apiFetch<{ manager: StoreManagerProfile }>("/api/managers", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((d) => d.manager),
    {
      invalidateQueries: [managersKey],
      successMessage: "Manager assigned",
      errorMessage: "Failed to assign manager",
    }
  );
};

export const useUpdateManagerAssignments = () => {
  return useStandardMutation(
    ({
      email,
      storeIds,
    }: {
      email: string;
      storeIds: number[];
    }) =>
      apiFetch<{ manager: StoreManagerProfile }>(
        `/api/managers/${encodeURIComponent(email)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ storeIds }),
        }
      ).then((d) => d.manager),
    {
      invalidateQueries: [managersKey],
      successMessage: "Manager stores updated",
      errorMessage: "Failed to update manager stores",
    }
  );
};

export const useDemoteManager = () => {
  return useStandardMutation(
    (email: string) =>
      apiFetch<{ success: boolean }>(
        `/api/managers/${encodeURIComponent(email)}`,
        { method: "DELETE" }
      ),
    {
      invalidateQueries: [managersKey],
      successMessage: "Manager removed",
      errorMessage: "Failed to remove manager",
    }
  );
};
