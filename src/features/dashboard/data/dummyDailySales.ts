import { subDays } from "date-fns";
import { formatDashboardDate } from "../domain/dashboardDateRange";

const DUMMY_DAY_COUNT = 180;

export type DummyDailyMetric = {
  date: string;
  sales: number;
  orders: number;
};

const hashDate = (isoDate: string) => {
  let hash = 0;
  for (let index = 0; index < isoDate.length; index += 1) {
    hash = (hash * 31 + isoDate.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const buildMetricForDate = (isoDate: string): DummyDailyMetric => {
  const hash = hashDate(isoDate);
  const weekdayBoost =
    new Date(`${isoDate}T00:00:00`).getDay() % 6 === 0 ? 0.72 : 1;
  const orders = Math.max(3, Math.round((8 + (hash % 14)) * weekdayBoost));
  const averageOrderValue = 3800 + (hash % 3200);

  return {
    date: isoDate,
    orders,
    sales: orders * averageOrderValue,
  };
};

export const buildDummyDailyMetrics = (
  now = new Date(),
  dayCount = DUMMY_DAY_COUNT
): DummyDailyMetric[] =>
  Array.from({ length: dayCount }, (_, index) => {
    const date = subDays(now, dayCount - 1 - index);
    return buildMetricForDate(formatDashboardDate(date));
  });

export const DUMMY_DAILY_METRICS = buildDummyDailyMetrics();
