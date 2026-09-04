"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/utils/apiFetch";
import type { SettingEntity, SettingKey, SettingsMap } from "../domain";

const SETTINGS_QUERY_KEY = ["settings"];

export const useSettings = () => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () =>
      apiFetch<{ settings: SettingEntity[] }>("/api/settings").then(
        (d) => d.settings
      ),
  });
};

export const useAnalyticsSettings = () => {
  return useQuery({
    queryKey: [...SETTINGS_QUERY_KEY, "analytics"],
    queryFn: () =>
      apiFetch<{ settings: SettingEntity[] }>(
        "/api/settings?scope=analytics"
      ).then((d) => d.settings),
  });
};

export const useSettingsMap = () => {
  return useQuery({
    queryKey: [...SETTINGS_QUERY_KEY, "map"],
    queryFn: () =>
      apiFetch<{ map: SettingsMap }>("/api/settings?scope=map").then(
        (d) => d.map
      ),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: SettingKey; value: string | null }) =>
      apiFetch<{ setting: SettingEntity }>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ key, value }),
      }).then((d) => d.setting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
};
