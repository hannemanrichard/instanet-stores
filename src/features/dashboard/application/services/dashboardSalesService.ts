import type { OrderRepository } from "@/features/orders/domain/repositories";
import { SupabaseOrderService } from "@/features/orders/data";
import {
  getPreviousDashboardDateRange,
  type DashboardDateRange,
} from "../../domain/dashboardDateRange";
import type { DashboardHomeMetrics } from "../../domain/dashboardSales";

const toChangePercent = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const sumBy = <T>(
  items: T[],
  selector: (item: T) => number
) => items.reduce((total, item) => total + selector(item), 0);

export class DashboardSalesService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async getHomeMetrics(
    range: DashboardDateRange,
    storeId?: number,
    storeIds?: number[]
  ): Promise<DashboardHomeMetrics> {
    const previousRange = getPreviousDashboardDateRange(range);
    const [currentMetrics, previousMetrics, pendingFulfillment] =
      await Promise.all([
        this.orderRepository.getDailyMetrics(
          range.fromDate,
          range.toDate,
          storeId,
          storeIds
        ),
        this.orderRepository.getDailyMetrics(
          previousRange.fromDate,
          previousRange.toDate,
          storeId,
          storeIds
        ),
        this.orderRepository.getPendingFulfillmentCount(storeId, storeIds),
      ]);

    const salesTotal = sumBy(currentMetrics, (point) => point.sales);
    const previousSalesTotal = sumBy(previousMetrics, (point) => point.sales);
    const ordersInPeriod = sumBy(currentMetrics, (point) => point.orders);
    const previousOrdersInPeriod = sumBy(
      previousMetrics,
      (point) => point.orders
    );

    return {
      range,
      series: currentMetrics.map((point) => ({
        date: point.date,
        value: point.sales,
      })),
      salesTotal,
      salesChangePercent: toChangePercent(salesTotal, previousSalesTotal),
      ordersInPeriod,
      ordersChangePercent: toChangePercent(
        ordersInPeriod,
        previousOrdersInPeriod
      ),
      pendingFulfillment,
    };
  }
}

export const dashboardSalesService = new DashboardSalesService(
  new SupabaseOrderService()
);
