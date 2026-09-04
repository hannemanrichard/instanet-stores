import { useStandardQuery } from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import {
  getDummyDashboardHomeMetrics,
  isDummyDataEnabled,
} from "@/shared/lib/dummy-data";
import type {
  DashboardDateRange,
  DashboardHomeMetrics,
} from "../domain/dashboardSales";

const dashboardHomeMetricsKey = (
  range: DashboardDateRange,
  storeId?: number | null
) => [
  "dashboard",
  "home-metrics",
  range.preset,
  range.fromDate,
  range.toDate,
  storeId ?? "all",
];

export const useDashboardHomeMetrics = (
  range: DashboardDateRange,
  enabled = true,
  storeId?: number | null
) => {
  const params = new URLSearchParams({
    from: range.fromDate,
    to: range.toDate,
    preset: range.preset,
  });
  if (storeId != null) params.set("storeId", String(storeId));

  return useStandardQuery<DashboardHomeMetrics>(
    dashboardHomeMetricsKey(range, storeId),
    async () => {
      if (isDummyDataEnabled()) return getDummyDashboardHomeMetrics(range);
      return apiFetch<DashboardHomeMetrics>(
        `/api/dashboard/daily-sales?${params}`
      );
    },
    {
      enabled,
      staleTime: 60 * 1000,
    }
  );
};
