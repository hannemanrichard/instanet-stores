"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardList, Loader2, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import StatsCard from "@/shared/components/ui/StatsCard";
import { useAuth } from "@/shared/hooks/use-auth";
import { useDashboardHomeMetrics } from "../application";
import {
  resolveDashboardDateRange,
  type DashboardDateRangePreset,
} from "../domain/dashboardDateRange";
import { DailySalesChart } from "./DailySalesChart";
import { DashboardDateRangeSelect } from "./DashboardDateRangeSelect";
import { formatDashboardAmount } from "./dashboardFormatters";

const formatTrend = (value: number) =>
  `${Math.abs(value).toFixed(1).replace(/\.0$/, "")}%`;

export const DashboardHomeView = () => {
  const t = useTranslations("dashboard.home");
  const tCommon = useTranslations("dashboard.common");
  const { isLoaded } = useAuth();
  const [preset, setPreset] = useState<DashboardDateRangePreset>("last_30_days");
  const range = useMemo(() => resolveDashboardDateRange(preset), [preset]);
  const metricsQuery = useDashboardHomeMetrics(range, isLoaded);
  const metrics = metricsQuery.data;
  const currency = tCommon("currency");

  const handlePresetChange = (nextPreset: DashboardDateRangePreset) => {
    setPreset(nextPreset);
  };

  if (!isLoaded || metricsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-full rounded-lg sm:w-52" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[5.5rem] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (metricsQuery.isError || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <DashboardDateRangeSelect value={preset} onChange={handlePresetChange} />
        </div>
        <Alert>
          <AlertDescription>{t("loadError")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DashboardDateRangeSelect value={preset} onChange={handlePresetChange} />
      </div>

      <section
        aria-label={t("metricsAria")}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <StatsCard
          title={t("stats.sales")}
          displayValue={`${formatDashboardAmount(metrics.salesTotal)} ${currency}`}
          icon={TrendingUp}
          tone="primary"
          trend={{
            value: formatTrend(metrics.salesChangePercent),
            positive: metrics.salesChangePercent >= 0,
          }}
        />
        <StatsCard
          title={t("stats.ordersInPeriod")}
          value={metrics.ordersInPeriod}
          valueType="number"
          icon={ClipboardList}
          tone="primary"
          trend={{
            value: formatTrend(metrics.ordersChangePercent),
            positive: metrics.ordersChangePercent >= 0,
          }}
        />
        <StatsCard
          title={t("stats.pendingFulfillment")}
          value={metrics.pendingFulfillment}
          valueType="number"
          icon={Loader2}
          tone="primary"
        />
      </section>

      <DailySalesChart
        title={t("dailySales.chartTitle")}
        data={metrics.series}
        seriesLabel={t("stats.sales")}
        ariaLabel={t("dailySales.chartAria")}
      />
    </div>
  );
};
