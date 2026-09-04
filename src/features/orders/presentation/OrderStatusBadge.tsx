"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  STATUS_PILL_BASE_CLASSNAME,
  StatusPill,
} from "@/shared/components/ui/StatusPill";
import { cn } from "@/shared/utils/utils";
import type { OrderEntity } from "../domain";
import { ORDER_STATUS_OPTIONS } from "../domain";
import {
  formatOrderStatusLabel,
  getOrderStatusStyle,
  getOrderStatusTone,
} from "./orderTableUtils";

type OrderStatusBadgeProps = {
  order: OrderEntity;
  readOnly?: boolean;
  isUpdating?: boolean;
  onStatusChange: (orderId: number, status: string) => void;
};

const statusBadgeBaseClassName = [
  STATUS_PILL_BASE_CLASSNAME,
  "capitalize",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "data-[state=open]:ring-2 data-[state=open]:ring-offset-1",
].join(" ");

export const OrderStatusBadge = ({
  order,
  readOnly = false,
  isUpdating = false,
  onStatusChange,
}: OrderStatusBadgeProps) => {
  const status = order.status ?? "initial";
  const label = formatOrderStatusLabel(status);
  const tone = getOrderStatusTone(status);
  const style = getOrderStatusStyle(status);

  const handleSelect = (nextStatus: string) => {
    if (nextStatus === status) return;
    onStatusChange(order.id, nextStatus);
  };

  if (readOnly || isUpdating) {
    return <StatusPill label={label} tone={tone} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(statusBadgeBaseClassName, style.badge)}
          aria-label={`Order status: ${label}. Click to change.`}
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[11.5rem] rounded-xl border-border/70 p-1.5 shadow-lg"
      >
        {ORDER_STATUS_OPTIONS.map((option) => {
          const optionStyle = getOrderStatusStyle(option);
          const isActive = option === status;

          return (
            <DropdownMenuItem
              key={option}
              className={cn(
                "cursor-pointer rounded-lg px-1.5 py-1.5 focus:bg-transparent",
                isActive && "bg-muted/40"
              )}
              onSelect={() => handleSelect(option)}
            >
              <span
                className={cn(
                  STATUS_PILL_BASE_CLASSNAME,
                  "h-7 w-full capitalize",
                  optionStyle.badge
                )}
              >
                {formatOrderStatusLabel(option)}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
