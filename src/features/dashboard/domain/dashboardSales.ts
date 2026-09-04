export type DashboardDateRangePreset =
  | "last_7_days"
  | "last_14_days"
  | "last_30_days"
  | "last_90_days"
  | "this_month";

export type DashboardDateRange = {
  fromDate: string;
  toDate: string;
  preset: DashboardDateRangePreset;
};

export type DashboardSeriesPoint = {
  date: string;
  value: number;
};

export type DashboardHomeMetrics = {
  range: DashboardDateRange;
  series: DashboardSeriesPoint[];
  salesTotal: number;
  salesChangePercent: number;
  ordersInPeriod: number;
  ordersChangePercent: number;
  pendingFulfillment: number;
};
