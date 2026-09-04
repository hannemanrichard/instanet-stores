import type { SettingsMap } from "../domain";

const MAP_CACHE_TTL_MS = 5 * 60 * 1000;

let mapCache: { value: SettingsMap; expiresAt: number } | null = null;

export const getCachedSettingsMap = (): SettingsMap | null => {
  if (!mapCache || mapCache.expiresAt <= Date.now()) return null;
  return mapCache.value;
};

export const setCachedSettingsMap = (value: SettingsMap): void => {
  mapCache = {
    value,
    expiresAt: Date.now() + MAP_CACHE_TTL_MS,
  };
};

export const invalidateSettingsMapCache = (): void => {
  mapCache = null;
};
