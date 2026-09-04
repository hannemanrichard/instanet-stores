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
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
import { Eye, Printer } from "lucide-react";
import { isDummyDataEnabled } from "@/shared/lib/dummy-data";
import {
  fetchReturnDetail,
  useCreateReturn,
  useEligibleReturnOrders,
  useMarkReturnCollected,
  useReturnDetail,
  useStoreReturns,
} from "../application";
import {
  getReturnItems,
  type ReturnEntity,
} from "../domain";
import { downloadReturnSlip } from "./printReturnSlip";

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB");
};

const ReturnColorCell = ({
  color,
  colorHex,
}: {
  color?: string;
  colorHex?: string;
}) => {
  if (!color && !colorHex) return <span>—</span>;

  return (
    <span className="inline-flex items-center gap-2">
      {colorHex ? (
        <span
          className="size-3 shrink-0 rounded-full border"
          style={{ backgroundColor: colorHex }}
          aria-hidden
        />
      ) : null}
      <span>{color || "—"}</span>
    </span>
  );
};

export const ReturnsManagementView = () => {
  const t = useTranslations("dashboard.returns");
  const tCommon = useTranslations("dashboard.common");
  const { toast } = useToast();
  const { canPickStore, canMutatePayments, isPlatformAdmin } = useAuth();
  const { store, storeId, isLoading: storeLoading } = useCurrentStore();
  const [scopeStoreId, setScopeStoreId] = useState<number | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<ReturnEntity | null>(
    null
  );
  const [printingId, setPrintingId] = useState<number | null>(null);

  const storesQuery = useStoresList(canPickStore);

  const useDummy = isDummyDataEnabled();
  const scopedStoreId = canPickStore ? scopeStoreId : storeId;
  const effectiveStoreId = useDummy ? 1 : scopedStoreId;
  const returnsEnabled = useDummy || canPickStore || !storeLoading;

  const returnsQuery = useStoreReturns(effectiveStoreId, returnsEnabled);
  const eligibleQuery = useEligibleReturnOrders(
    effectiveStoreId,
    canMutatePayments && effectiveStoreId != null
  );
  const createReturn = useCreateReturn();
  const markCollected = useMarkReturnCollected();

  const filteredReturns = returnsQuery.data ?? [];

  const handleToggleOrder = (orderId: number, checked: boolean) => {
    setSelectedOrderIds((prev) =>
      checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
    );
  };

  const handleCreateReturn = () => {
    if (effectiveStoreId == null || selectedOrderIds.length === 0) return;
    createReturn.mutate(
      { store_id: effectiveStoreId, order_ids: selectedOrderIds },
      {
        onSuccess: () => {
          setSelectedOrderIds([]);
          eligibleQuery.refetch();
        },
      }
    );
  };

  const handleOpenDetails = (item: ReturnEntity) => {
    setSelectedReturn(item);
  };

  const handleCloseDetails = (open: boolean) => {
    if (!open) setSelectedReturn(null);
  };

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

  const handlePrint = async (item: ReturnEntity) => {
    setPrintingId(item.id);
    try {
      const detailed = await fetchReturnDetail(item.id);
      const downloaded = await downloadReturnSlip(detailed, {
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

  if (!canPickStore && storeLoading && !useDummy) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!canPickStore && storeId == null && !useDummy) {
    return (
      <Alert>
        <AlertDescription>{tCommon("storeError")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {canPickStore && !useDummy ? (
        <StoreScopeSelect
          stores={storesQuery.data ?? []}
          value={scopeStoreId}
          onChange={(next) => {
            setScopeStoreId(next);
            setSelectedOrderIds([]);
          }}
          allLabel={isPlatformAdmin ? tCommon("allStores") : tCommon("allAssigned")}
          placeholder={tCommon("selectStore")}
        />
      ) : null}

      {canMutatePayments ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("createTitle")}</CardTitle>
            <CardDescription>{t("createDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {effectiveStoreId == null ? (
              <Alert>
                <AlertDescription>{t("selectStoreHint")}</AlertDescription>
              </Alert>
            ) : null}

            {eligibleQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (eligibleQuery.data ?? []).length === 0 ? (
              <Alert>
                <AlertDescription>{t("noEligible")}</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>{t("columns.order")}</TableHead>
                    <TableHead>{t("columns.product")}</TableHead>
                    <TableHead>{t("columns.tracking")}</TableHead>
                    <TableHead>{t("columns.yalidine")}</TableHead>
                    <TableHead>{t("columns.dc")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(eligibleQuery.data ?? []).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrderIds.includes(order.id)}
                          onCheckedChange={(checked) =>
                            handleToggleOrder(order.id, checked === true)
                          }
                          aria-label={t("selectOrder", { id: order.id })}
                        />
                      </TableCell>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>{order.product || "—"}</TableCell>
                      <TableCell>{order.tracking_id || "—"}</TableCell>
                      <TableCell>{order.yalidine_status || "—"}</TableCell>
                      <TableCell>{order.dc_recent_status || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Button
              type="button"
              onClick={handleCreateReturn}
              disabled={
                createReturn.isPending ||
                selectedOrderIds.length === 0 ||
                effectiveStoreId == null
              }
              aria-label={t("createLabel")}
            >
              {t("createButton", { count: selectedOrderIds.length })}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
          <CardDescription>{t("listDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {returnsQuery.isLoading ? (
            <div className="p-6">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : filteredReturns.length === 0 ? (
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
                    <TableHead>{t("columns.tracking")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.created")}</TableHead>
                    <TableHead className="text-right">
                      {t("columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <IdentifierChip code={item.code} />
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          label={t(`status.${item.status}`)}
                          tone={item.status === "collected" ? "success" : "info"}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-8"
                            onClick={() => handleOpenDetails(item)}
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
                            aria-label={t("print.ariaLabel", { code: item.code })}
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

      <ReturnDetailsDialog
        item={selectedReturn}
        open={selectedReturn != null}
        onOpenChange={handleCloseDetails}
        onPrint={handlePrint}
        printingId={printingId}
        canMarkCollected={canMutatePayments}
        onMarkCollected={(id) => markCollected.mutate(id)}
        isMarkingCollected={markCollected.isPending}
      />
    </div>
  );
};

const ReturnDetailsDialog = ({
  item,
  open,
  onOpenChange,
  onPrint,
  printingId,
  canMarkCollected,
  onMarkCollected,
  isMarkingCollected,
}: {
  item: ReturnEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (item: ReturnEntity) => void;
  printingId: number | null;
  canMarkCollected: boolean;
  onMarkCollected: (id: number) => void;
  isMarkingCollected: boolean;
}) => {
  const t = useTranslations("dashboard.returns");
  const tCommon = useTranslations("dashboard.common");
  const detailQuery = useReturnDetail(open ? item?.id ?? null : null);
  const detailed = detailQuery.data ?? item;
  const lines = detailed ? getReturnItems(detailed) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("itemsModalTitle", { code: item?.code ?? "" })}
          </DialogTitle>
          <DialogDescription>{t("itemsModalDescription")}</DialogDescription>
        </DialogHeader>

        {detailed ? (
          <div className="flex flex-wrap items-center gap-2">
            <IdentifierChip code={detailed.code} />
            <StatusPill
              label={t(`status.${detailed.status}`)}
              tone={detailed.status === "collected" ? "success" : "info"}
            />
            <span className="text-sm text-muted-foreground">
              {formatDate(detailed.created_at)}
            </span>
          </div>
        ) : null}

        {detailQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : lines.length === 0 ? (
          <Alert>
            <AlertDescription>{t("noItems")}</AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.product")}</TableHead>
                  <TableHead>{t("columns.color")}</TableHead>
                  <TableHead>{t("columns.size")}</TableHead>
                  <TableHead>{t("columns.qty")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow
                    key={`${line.order_id}-${line.item_id}-${index}`}
                  >
                    <TableCell>{line.product || "—"}</TableCell>
                    <TableCell>
                      <ReturnColorCell
                        color={line.color}
                        colorHex={line.colorHex}
                      />
                    </TableCell>
                    <TableCell>{line.size || "—"}</TableCell>
                    <TableCell>{line.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          {item ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onPrint(item)}
              disabled={printingId === item.id}
              aria-label={t("print.ariaLabel", { code: item.code })}
            >
              <Printer className="size-4" aria-hidden />
              {t("print.button")}
            </Button>
          ) : null}
          {canMarkCollected && detailed?.status === "processed" ? (
            <Button
              type="button"
              onClick={() => onMarkCollected(detailed.id)}
              disabled={isMarkingCollected}
              aria-label={t("markCollectedLabel", {
                code: detailed.code,
              })}
            >
              {t("markCollected")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            aria-label={tCommon("cancel")}
          >
            {tCommon("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
