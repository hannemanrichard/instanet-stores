"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { DataTable } from "@/shared/components/ui/data-table/data-table";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useCurrentStore, useStoresList } from "@/features/stores";
import { StoreScopeSelect } from "@/shared/components/stores/StoreScopeSelect";
import { useAuth } from "@/shared/hooks/use-auth";
import {
  useOrderSummary,
  usePaginatedOrders,
  useUpdateOrderStatus,
} from "../application";
import type { OrderEntity, PaginatedOrdersResult } from "../domain";
import { ORDER_STATUS_OPTIONS } from "../domain";
import { CreateOrderDialog } from "./CreateOrderDialog";
import { OrderCustomerCell } from "./OrderCustomerCell";
import { OrderProductCell } from "./OrderProductCell";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatOrderStatusLabel } from "./orderTableUtils";
import StatsCard from "@/shared/components/ui/StatsCard";
import { CheckCircle2, ClipboardList, Loader2, Printer, Search, X } from "lucide-react";
import { isDummyDataEnabled } from "@/shared/lib/dummy-data";
import { printDeliverySlips } from "./printDeliverySlips";
import { useToast } from "@/shared/hooks/use-toast";
import { formatRelativeDate } from "@/shared/utils/formatRelativeDate";
import { cn } from "@/shared/utils/utils";

const formatAmount = (amount?: number | null) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(amount);
};

export const OrdersManagementView = () => {
  const t = useTranslations("dashboard.orders");
  const tCommon = useTranslations("dashboard.common");
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canPickStore, canChangeOrderStatus, isPlatformAdmin } = useAuth();
  const updateOrderStatus = useUpdateOrderStatus();
  const { storeId, isLoading: storeLoading } = useCurrentStore();
  const [scopeStoreId, setScopeStoreId] = useState<number | null>(null);
  const storesQuery = useStoresList(canPickStore);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [status, setStatus] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<OrderEntity[]>([]);

  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      search: appliedSearch.trim() || undefined,
      storeId: canPickStore ? scopeStoreId ?? undefined : undefined,
    }),
    [appliedSearch, canPickStore, scopeStoreId, status]
  );

  const ordersEnabled =
    isDummyDataEnabled() || canPickStore || (!storeLoading && storeId != null);
  const ordersQuery = usePaginatedOrders(filters, page, pageSize, ordersEnabled);
  const summaryQuery = useOrderSummary(
    ordersEnabled,
    canPickStore ? scopeStoreId : undefined
  );
  const pageOrders = ordersQuery.data?.data ?? [];

  const slipLabels = {
    title: t("print.slipTitle"),
    order: t("print.order"),
    tracking: t("print.tracking"),
    customer: t("print.customer"),
    phone: t("print.phone"),
    phone2: t("print.phone2"),
    address: t("print.address"),
    wilaya: t("print.wilaya"),
    commune: t("print.commune"),
    product: t("print.product"),
    color: t("print.color"),
    size: t("print.size"),
    qty: t("print.qty"),
    amount: t("print.amount"),
    stopdesk: t("print.stopdesk"),
    notes: t("print.notes"),
    yes: t("print.yes"),
    no: t("print.no"),
  };

  const handlePrintOrders = (ordersToPrint: OrderEntity[]) => {
    if (ordersToPrint.length === 0) {
      toast({
        title: t("print.emptyTitle"),
        description: t("print.emptyDescription"),
        variant: "destructive",
      });
      return;
    }

    const opened = printDeliverySlips(ordersToPrint, slipLabels);
    if (!opened) {
      toast({
        title: t("print.blockedTitle"),
        description: t("print.blockedDescription"),
        variant: "destructive",
      });
    }
  };

  const handlePrintSlips = () => {
    handlePrintOrders(
      selectedOrders.length > 0 ? selectedOrders : pageOrders
    );
  };

  const handleApplySearch = () => {
    const next = searchInput.trim();
    setSearchInput(next);
    setAppliedSearch(next);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    setPage(1);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleApplySearch();
  };

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    if (isDummyDataEnabled()) {
      queryClient.setQueriesData<PaginatedOrdersResult>(
        { queryKey: ["orders", "paginated"] },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((order) =>
              order.id === orderId ? { ...order, status: nextStatus } : order
            ),
          };
        }
      );
      toast({ title: t("statusUpdated") });
      return;
    }

    try {
      await updateOrderStatus.mutateAsync({ orderId, status: nextStatus });
    } catch {
      // Mutation hook surfaces error toast
    }
  };

  const columns = [
    {
      key: "customer",
      label: t("columns.customer"),
      render: (order: OrderEntity) => <OrderCustomerCell order={order} />,
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (order: OrderEntity) => (
        <OrderStatusBadge
          order={order}
          readOnly={!canChangeOrderStatus}
          isUpdating={updateOrderStatus.isPending}
          onStatusChange={handleStatusChange}
        />
      ),
    },
    {
      key: "product",
      label: t("columns.product"),
      render: (order: OrderEntity) => <OrderProductCell order={order} />,
    },
    {
      key: "created_at",
      label: t("columns.created"),
      render: (order: OrderEntity) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatRelativeDate(order.created_at, locale)}
        </span>
      ),
    },
  ];

  if (!canPickStore && storeLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canPickStore && storeId == null) {
    return (
      <Alert>
        <AlertDescription>{t("storeError")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatsCard
          title={t("stats.total")}
          value={summaryQuery.data?.total_orders ?? 0}
          valueType="number"
          icon={ClipboardList}
          tone="primary"
        />
        <StatsCard
          title={t("stats.processing")}
          value={summaryQuery.data?.total_processing ?? 0}
          valueType="number"
          icon={Loader2}
          tone="primary"
        />
        <StatsCard
          title={t("stats.delivered")}
          value={summaryQuery.data?.total_delivered ?? 0}
          valueType="number"
          icon={CheckCircle2}
          tone="primary"
        />
      </div>

      {canPickStore ? (
        <StoreScopeSelect
          stores={storesQuery.data ?? []}
          value={scopeStoreId}
          onChange={(next) => {
            setScopeStoreId(next);
            setPage(1);
          }}
          allLabel={isPlatformAdmin ? tCommon("allStores") : tCommon("allAssigned")}
          placeholder={tCommon("selectStore")}
        />
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="space-y-0 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:start-3"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <Input
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t("filters.searchPlaceholder")}
                  className={cn(
                    "h-11 border-0 bg-transparent pe-11 ps-11 shadow-none",
                    "placeholder:text-muted-foreground/70",
                    "focus-visible:ring-0",
                    "sm:h-9 sm:border sm:border-input sm:bg-background sm:pe-9 sm:ps-9 sm:shadow-sm",
                    "sm:focus-visible:ring-1 sm:focus-visible:ring-ring"
                  )}
                  aria-label={t("filters.searchLabel")}
                />
                {searchInput ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-1.5 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground sm:end-1 sm:size-7"
                    onClick={handleClearSearch}
                    aria-label={t("filters.clearSearch")}
                  >
                    <X className="size-3.5" strokeWidth={2} aria-hidden />
                  </Button>
                ) : null}
              </div>
              <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-input bg-background shadow-sm sm:w-auto">
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className="h-9 w-full rounded-none border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 sm:w-44"
                    aria-label={t("filters.statusLabel")}
                  >
                    <SelectValue placeholder={t("filters.statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                    {ORDER_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {formatOrderStatusLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div
                  className="w-px shrink-0 self-stretch bg-border"
                  aria-hidden
                />
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "relative size-9 shrink-0 rounded-none text-muted-foreground",
                          "hover:bg-accent hover:text-accent-foreground",
                          selectedOrders.length > 0 &&
                            "bg-accent/60 text-accent-foreground"
                        )}
                        onClick={handlePrintSlips}
                        aria-label={
                          selectedOrders.length > 0
                            ? t("print.selected", {
                                count: selectedOrders.length,
                              })
                            : t("print.ariaLabel")
                        }
                        disabled={
                          ordersQuery.isLoading || pageOrders.length === 0
                        }
                      >
                        <Printer className="size-4" strokeWidth={1.75} aria-hidden />
                        {selectedOrders.length > 0 ? (
                          <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                            {selectedOrders.length}
                          </span>
                        ) : null}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-medium">
                      {selectedOrders.length > 0
                        ? t("print.selected", {
                            count: selectedOrders.length,
                          })
                        : t("print.page")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {isPlatformAdmin ? (
              <Button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                aria-label={t("createLabel")}
              >
                {t("create")}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ordersQuery.isLoading ? (
            <Skeleton className="h-72 w-full rounded-none" />
          ) : (
            <DataTable
              columns={columns}
              data={pageOrders}
              totalItems={ordersQuery.data?.total ?? 0}
              currentPage={page}
              pageSize={pageSize}
              isSelectable
              onRowsSelect={setSelectedOrders}
              bulkActions={[
                {
                  label: t("print.bulkAction"),
                  action: (items) => handlePrintOrders(items),
                },
              ]}
              onPageChange={(nextPage) => {
                setSelectedOrders([]);
                setPage(nextPage);
              }}
            />
          )}
          {canPickStore ? (
            <p className="border-t px-4 py-3 text-xs text-muted-foreground sm:px-6">
              {t("totalValue", {
                value: formatAmount(summaryQuery.data?.total_value),
              })}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isPlatformAdmin ? (
        <CreateOrderDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      ) : null}
    </div>
  );
};
