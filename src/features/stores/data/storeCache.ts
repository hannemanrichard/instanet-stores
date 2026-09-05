import type { StoreEntity } from "../domain";

const STORE_CACHE_TTL_MS = 5 * 60 * 1000;

type StoreCacheEntry = {
  value: StoreEntity | null;
  expiresAt: number;
};

const storeByEmailCache = new Map<string, StoreCacheEntry>();
const inflightStoreByEmail = new Map<string, Promise<StoreEntity | null>>();

export const getCachedStoreByEmail = (email: string): StoreEntity | null | undefined => {
  const entry = storeByEmailCache.get(email);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    storeByEmailCache.delete(email);
    return undefined;
  }
  return entry.value;
};

export const setCachedStoreByEmail = (
  email: string,
  value: StoreEntity | null
): void => {
  storeByEmailCache.set(email, {
    value,
    expiresAt: Date.now() + STORE_CACHE_TTL_MS,
  });
};

export const invalidateCachedStoreByEmail = (email: string): void => {
  storeByEmailCache.delete(email);
};

export const getInflightStoreByEmail = (
  email: string
): Promise<StoreEntity | null> | undefined => inflightStoreByEmail.get(email);

export const setInflightStoreByEmail = (
  email: string,
  promise: Promise<StoreEntity | null>
): void => {
  inflightStoreByEmail.set(email, promise);
};

export const clearInflightStoreByEmail = (email: string): void => {
  inflightStoreByEmail.delete(email);
};

export const resetStoreCache = (): void => {
  storeByEmailCache.clear();
  inflightStoreByEmail.clear();
};
