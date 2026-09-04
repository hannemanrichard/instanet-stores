"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/shared/components/ui/badge";
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
import { useManagersList, useStoresList, useUpdateStoreStatus } from "../application";

export const StoresManagementView = () => {
  const t = useTranslations("dashboard.stores");
  const storesQuery = useStoresList(true);
  const managersQuery = useManagersList(true);
  const updateStatus = useUpdateStoreStatus();
  const managersByStore = new Map<number, string[]>();
  for (const manager of managersQuery.data ?? []) {
    const label = manager.email || manager.fullName;
    for (const assignedStoreId of manager.storeIds) {
      const current = managersByStore.get(assignedStoreId) ?? [];
      current.push(label);
      managersByStore.set(assignedStoreId, current);
    }
  }

  const handleToggleStatus = (storeId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    updateStatus.mutate({ storeId, status: nextStatus });
  };

  if (storesQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const stores = storesQuery.data ?? [];

  if (stores.length === 0) {
    return (
      <Alert>
        <AlertDescription>{t("empty")}</AlertDescription>
      </Alert>
    );
  }

  const statusBadge = (status: string) => (
    <Badge variant={status === "active" ? "secondary" : "outline"}>
      {status}
    </Badge>
  );

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardHeader className="space-y-1 p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold">
                  {store.fullname ||
                    store.username ||
                    t("storeFallback", { id: store.id })}
                </CardTitle>
                {statusBadge(store.status)}
              </div>
              <CardDescription>
                #{store.id} · {store.email || "—"}
                {(managersByStore.get(store.id) ?? []).length > 0
                  ? ` · ${t("managers")}: ${(managersByStore.get(store.id) ?? []).join(", ")}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 p-4 pt-0 text-sm">
              <span className="text-muted-foreground">
                {new Date(store.created_at).toLocaleDateString("en-GB")}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={updateStatus.isPending || store.id === 1}
                onClick={() => handleToggleStatus(store.id, store.status)}
                aria-label={t("toggleLabel", { id: store.id })}
              >
                {store.status === "active" ? t("deactivate") : t("activate")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.id")}</TableHead>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead>{t("columns.email")}</TableHead>
                <TableHead>{t("columns.username")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.managers")}</TableHead>
                <TableHead>{t("columns.created")}</TableHead>
                <TableHead className="text-right">{t("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>#{store.id}</TableCell>
                  <TableCell>
                    {store.fullname || "—"}
                    {store.id === 1 ? (
                      <Badge className="ml-2" variant="outline">
                        {t("defaultBadge")}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{store.email || "—"}</TableCell>
                  <TableCell>{store.username || "—"}</TableCell>
                  <TableCell>{statusBadge(store.status)}</TableCell>
                  <TableCell>
                    {(managersByStore.get(store.id) ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(store.created_at).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateStatus.isPending || store.id === 1}
                      onClick={() => handleToggleStatus(store.id, store.status)}
                      aria-label={t("toggleLabel", { id: store.id })}
                    >
                      {store.status === "active"
                        ? t("deactivate")
                        : t("activate")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};
