"use client";

import { useUser } from "@clerk/nextjs";
import { useStandardQuery } from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import { isDummyDataEnabled } from "@/shared/lib/dummy-data";
import { useAuth } from "@/shared/hooks/use-auth";
import type { StoreEntity } from "../domain";

const currentStoreKey = ["stores", "current"];

const dummyStore: StoreEntity = {
  id: 1,
  fullname: "Demo Store",
  username: "demo-store",
  email: "demo@bellami.local",
  status: "active",
  created_at: new Date().toISOString(),
};

export const useCurrentStore = () => {
  const { isLoaded, isSignedIn } = useUser();
  const { canPickStore } = useAuth();
  const useDummy = isDummyDataEnabled();

  const query = useStandardQuery(
    currentStoreKey,
    () =>
      apiFetch<{ store: StoreEntity }>("/api/store/me").then(
        (data) => data.store
      ),
    {
      enabled: !useDummy && isLoaded && Boolean(isSignedIn) && !canPickStore,
      staleTime: 10 * 60 * 1000,
      retry: false,
    }
  );

  if (useDummy) {
    return {
      store: dummyStore,
      storeId: dummyStore.id,
      isLoading: false,
      isError: false,
      error: null,
      refetch: query.refetch,
    };
  }

  return {
    store: query.data ?? null,
    storeId: query.data?.id ?? null,
    isLoading: !isLoaded || (Boolean(isSignedIn) && query.isLoading),
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
