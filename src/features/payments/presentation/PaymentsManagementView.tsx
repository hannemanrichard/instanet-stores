"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { IdentifierChip } from "@/shared/components/ui/IdentifierChip";
import { StatusPill } from "@/shared/components/ui/StatusPill";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useAuth } from "@/shared/hooks/use-auth";
import { useToast } from "@/shared/hooks/use-toast";
import { useCurrentStore, useStoresList } from "@/features/stores";
import { StoreScopeSelect } from "@/shared/components/stores/StoreScopeSelect";
import {
  fetchPaymentDetail,
  useMarkPaymentPaid,
  usePaymentDetail,
  usePaymentsSummary,
} from "../application";
import type { PaymentEntity } from "../domain";
import StatsCard from "@/shared/components/ui/StatsCard";
import {
  Banknote,
  CircleDollarSign,
  Eye,
  Loader2,
  Printer,
  Wallet,
} from "lucide-react";
import { isDummyDataEnabled } from "@/shared/lib/dummy-data";
import { downloadPaymentSlip } from "./printPaymentSlip";

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(amount);

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB");
};

export const PaymentsManagementView = () => {
  const t = useTranslations("dashboard.payments");
  const tCommon = useTranslations("dashboard.common");
  const { toast } = useToast();
  const { canPickStore, canMutatePayments, isPlatformAdmin } = useAuth();
  const { store, storeId, isLoading: storeLoading } = useCurrentStore();
  const [scopeStoreId, setScopeStoreId] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentEntity | null>(
    null
  );
  const [printingId, setPrintingId] = useState<number | null>(null);

  const storesQuery = useStoresList(canPickStore);

  const effectiveStoreId = canPickStore ? scopeStoreId : storeId;
  const useDummy = isDummyDataEnabled();
  const summaryEnabled = useDummy || canPickStore || !storeLoading;
  const summaryQuery = usePaymentsSummary(
    useDummy ? 1 : effectiveStoreId,
    summaryEnabled
  );
  const markPaid = useMarkPaymentPaid();

  const resolveStoreName = (forStoreId: number) => {
    if (useDummy) return "Demo Store";
    const scoped = storesQuery.data?.find((entry) => entry.id === forStoreId);
    return (
      scoped?.fullname ||
      scoped?.username ||
      store?.fullname ||
      store?.username ||
      ""
    );
  };

  const handlePrint = async (item: PaymentEntity) => {
    setPrintingId(item.id);
    try {
      const detailed = await fetchPaymentDetail(item.id);
      const downloaded = await downloadPaymentSlip(detailed, {
        storeName: resolveStoreName(detailed.store_id),
      });
      if (!downloaded) {
        toast({
          title: t("print.blockedTitle"),
          description: t("print.blockedDescription"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("print.blockedTitle"),
        description: t("print.blockedDescription"),
        variant: "destructive",
      });
    } finally {
      setPrintingId(null);
    }
  };

  if (!canPickStore && storeLoading && !isDummyDataEnabled()) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!canPickStore && storeId == null && !isDummyDataEnabled()) {
    return (
      <Alert>
        <AlertDescription>{tCommon("storeError")}</AlertDescription>
      </Alert>
    );
  }

  const summary = summaryQuery.data;
  const payments = [...(summary?.readyPayments ?? []), ...(summary?.paidPayments ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-8">
      {canPickStore && !useDummy ? (
        <StoreScopeSelect
          stores={storesQuery.data ?? []}
          value={scopeStoreId}
          onChange={setScopeStoreId}
          allLabel={isPlatformAdmin ? tCommon("allStores") : tCommon("allAssigned")}
          placeholder={tCommon("selectStore")}
        />
      ) : null}

      {summaryQuery.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatsCard
              title={t("stats.notReady")}
              displayValue={`${formatAmount(summary?.notReadyTotal ?? 0)} ${tCommon("currency")}`}
              icon={Wallet}
              tone="primary"
            />
            <StatsCard
              title={t("stats.ready")}
              displayValue={`${formatAmount(summary?.readyTotal ?? 0)} ${tCommon("currency")}`}
              icon={CircleDollarSign}
              tone="primary"
            />
            <StatsCard
              title={t("stats.paid")}
              displayValue={`${formatAmount(summary?.paidTotal ?? 0)} ${tCommon("currency")}`}
              icon={Banknote}
              tone="primary"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("listTitle")}</CardTitle>
              <CardDescription>{t("listDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="p-6">
                  <Alert>
                    <AlertDescription>{t("empty")}</AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("columns.id")}</TableHead>
                        <TableHead>{t("columns.status")}</TableHead>
                        <TableHead>{t("columns.created")}</TableHead>
                        <TableHead>{t("columns.amount")}</TableHead>
                        <TableHead className="text-right">
                          {t("columns.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <IdentifierChip code={item.code} />
                          </TableCell>
                          <TableCell>
                            <StatusPill
                              label={item.is_paid ? t("badgePaid") : t("badgeReady")}
                              tone={item.is_paid ? "success" : "info"}
                            />
                          </TableCell>
                          <TableCell>{formatDate(item.created_at)}</TableCell>
                          <TableCell>
                            {formatAmount(item.amount)} {tCommon("currency")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-8"
                                onClick={() => setSelectedPayment(item)}
                                aria-label={t("viewDetailsLabel", {
                                  code: item.code,
                                })}
                              >
                                <Eye className="size-4" aria-hidden />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-8"
                                onClick={() => handlePrint(item)}
                                disabled={printingId === item.id}
                                aria-label={t("print.ariaLabel", {
                                  code: item.code,
                                })}
                              >
                                <Printer className="size-4" aria-hidden />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <PaymentDetailsDialog
        item={selectedPayment}
        open={selectedPayment != null}
        onOpenChange={(open) => {
          if (!open) setSelectedPayment(null);
        }}
        onPrint={handlePrint}
        printingId={printingId}
        canMarkPaid={canMutatePayments}
        onMarkPaid={(id) =>
          markPaid.mutate(id, {
            onSuccess: (updated) => setSelectedPayment(updated),
          })
        }
        isMarkingPaid={markPaid.isPending}
      />
    </div>
  );
};

const PaymentDetailsDialog = ({
  item,
  open,
  onOpenChange,
  onPrint,
  printingId,
  canMarkPaid,
  onMarkPaid,
  isMarkingPaid,
}: {
  item: PaymentEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (item: PaymentEntity) => void;
  printingId: number | null;
  canMarkPaid: boolean;
  onMarkPaid: (id: number) => void;
  isMarkingPaid: boolean;
}) => {
  const t = useTranslations("dashboard.payments");
  const tCommon = useTranslations("dashboard.common");
  const detailQuery = usePaymentDetail(open ? item?.id ?? null : null);
  const detailed = detailQuery.data ?? item;
  const orders = detailed?.orders ?? [];
  const ordersTotal = orders.reduce((sum, order) => sum + (order.amount ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-3 pe-8 text-start">
          <div className="flex flex-wrap items-center gap-2">
            {item?.code ? <IdentifierChip code={item.code} /> : null}
            {detailed ? (
              <StatusPill
                label={detailed.is_paid ? t("badgePaid") : t("badgeReady")}
                tone={detailed.is_paid ? "success" : "info"}
              />
            ) : null}
          </div>
          <div className="space-y-1">
            <DialogTitle>{t("detailsTitle")}</DialogTitle>
            <DialogDescription>{t("detailsDescription")}</DialogDescription>
          </div>
        </DialogHeader>

        {detailed ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("columns.amount")}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {formatAmount(detailed.amount)}{" "}
              <span className="text-base font-medium text-muted-foreground">
                {tCommon("currency")}
              </span>
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("columns.created")}
                </dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {formatDate(detailed.created_at)}
                </dd>
              </div>
              {detailed.paid_at ? (
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("badgePaid")}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium">
                    {formatDate(detailed.paid_at)}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("ordersHeading")}
                </dt>
                <dd className="mt-0.5 text-sm font-medium">{orders.length}</dd>
              </div>
            </dl>
            {detailed.note ? (
              <p className="mt-3 text-sm text-muted-foreground">{detailed.note}</p>
            ) : null}
          </div>
        ) : null}

        {detailQuery.isLoading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : orders.length === 0 ? (
          <Alert>
            <AlertDescription>{t("noOrders")}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("ordersHeading")}</h3>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("columns.order")}</TableHead>
                    <TableHead>{t("columns.product")}</TableHead>
                    <TableHead className="text-end">{t("columns.qty")}</TableHead>
                    <TableHead className="text-end">
                      {t("columns.amount")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-mono text-xs tracking-wide">
                        #{order.order_id}
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate whitespace-normal">
                        {order.product || "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {order.product_qty ?? "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatAmount(order.amount)} {tCommon("currency")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="font-semibold">
                      {t("total")}
                    </TableCell>
                    <TableCell className="text-end font-semibold tabular-nums">
                      {formatAmount(ordersTotal || detailed?.amount || 0)}{" "}
                      {tCommon("currency")}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            aria-label={t("close")}
          >
            {t("close")}
          </Button>
          {item ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onPrint(item)}
              disabled={printingId === item.id}
              aria-label={t("print.ariaLabel", { code: item.code })}
            >
              {printingId === item.id ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Printer className="size-4" aria-hidden />
              )}
              {t("print.button")}
            </Button>
          ) : null}
          {canMarkPaid && detailed && !detailed.is_paid ? (
            <Button
              type="button"
              onClick={() => onMarkPaid(detailed.id)}
              disabled={isMarkingPaid}
              aria-label={t("markPaidLabel", { code: detailed.code })}
            >
              {isMarkingPaid ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {t("markPaid")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
