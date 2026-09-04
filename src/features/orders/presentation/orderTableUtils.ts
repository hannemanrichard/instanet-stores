import type { OrderStatus } from "../domain";
import {
  STATUS_PILL_STYLES,
  type StatusPillStyle,
  type StatusTone,
} from "@/shared/components/ui/StatusPill";

export const getOrderCustomerName = (order: {
  first_name?: string;
  last_name?: string;
}): string =>
  [order.first_name, order.last_name].filter(Boolean).join(" ") || "—";

export const getOrderLocationLabel = (order: {
  wilaya?: string;
  commune?: string;
}): string => {
  const parts = [order.wilaya, order.commune].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
};

export type OrderStatusTone = StatusTone;
export type OrderStatusStyle = StatusPillStyle;

export const getOrderStatusTone = (status?: string): OrderStatusTone => {
  const normalized = (status ?? "").toLowerCase();

  if (normalized === "initial") {
    return "info";
  }
  if (normalized === "processing") {
    return "warning";
  }
  if (normalized === "returned") {
    return "error";
  }
  if (normalized === "delivered") {
    return "success";
  }

  return "neutral";
};

export const getOrderStatusStyle = (status?: string): OrderStatusStyle =>
  STATUS_PILL_STYLES[getOrderStatusTone(status)];

export const getOrderStatusBadgeClassName = (status?: string): string =>
  getOrderStatusStyle(status).badge;

export const formatOrderStatusLabel = (status: OrderStatus | string): string =>
  status.charAt(0).toUpperCase() + status.slice(1);
