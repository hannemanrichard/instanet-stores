"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { StoreEntity, StoreManagerProfile } from "../domain";
import {
  useAssignManager,
  useDemoteManager,
  useManagersList,
  useStoresList,
  useUpdateManagerAssignments,
} from "../application";

const storeLabel = (store: StoreEntity) =>
  store.fullname || store.username || store.email || `#${store.id}`;

const StoreCheckboxList = ({
  stores,
  selectedIds,
  onToggle,
  idPrefix,
}: {
  stores: StoreEntity[];
  selectedIds: number[];
  onToggle: (storeId: number, checked: boolean) => void;
  idPrefix: string;
}) => {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {stores.map((store) => {
        const inputId = `${idPrefix}-${store.id}`;
        const checked = selectedIds.includes(store.id);
        return (
          <label
            key={store.id}
            htmlFor={inputId}
            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <Checkbox
              id={inputId}
              checked={checked}
              onCheckedChange={(value) => onToggle(store.id, value === true)}
              aria-label={storeLabel(store)}
            />
            <span>{storeLabel(store)}</span>
          </label>
        );
      })}
    </div>
  );
};

const ManagerRow = ({
  manager,
  stores,
}: {
  manager: StoreManagerProfile;
  stores: StoreEntity[];
}) => {
  const t = useTranslations("dashboard.managers");
  const tCommon = useTranslations("dashboard.common");
  const updateAssignments = useUpdateManagerAssignments();
  const demoteManager = useDemoteManager();
  const [storeIds, setStoreIds] = useState(manager.storeIds);

  const handleToggle = (storeId: number, checked: boolean) => {
    setStoreIds((current) =>
      checked
        ? [...current, storeId]
        : current.filter((id) => id !== storeId)
    );
  };

  const handleSave = () => {
    if (storeIds.length === 0) return;
    updateAssignments.mutate({
      email: manager.email,
      storeIds,
    });
  };

  const handleDemote = () => {
    demoteManager.mutate(manager.email);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{manager.fullName || manager.email || "—"}</p>
          <p className="text-xs text-muted-foreground">{manager.email || "—"}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="mb-3 flex flex-wrap gap-1">
          {manager.stores.map((store) => (
            <Badge key={store.id} variant="secondary">
              {storeLabel(store)}
            </Badge>
          ))}
        </div>
        <StoreCheckboxList
          stores={stores}
          selectedIds={storeIds}
          onToggle={handleToggle}
          idPrefix={`manager-${manager.email}`}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={updateAssignments.isPending || storeIds.length === 0}
            aria-label={t("saveAssignments", { email: manager.email })}
          >
            {tCommon("save")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleDemote}
            disabled={demoteManager.isPending}
            aria-label={t("demoteLabel", { email: manager.email })}
          >
            {t("demote")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const ManagersManagementView = () => {
  const t = useTranslations("dashboard.managers");
  const tCommon = useTranslations("dashboard.common");
  const managersQuery = useManagersList(true);
  const storesQuery = useStoresList(true);
  const assignManager = useAssignManager();
  const [email, setEmail] = useState("");
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);

  const stores = storesQuery.data ?? [];
  const managers = managersQuery.data ?? [];

  const handleToggleStore = (storeId: number, checked: boolean) => {
    setSelectedStoreIds((current) =>
      checked
        ? [...current, storeId]
        : current.filter((id) => id !== storeId)
    );
  };

  const handleAssign = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || selectedStoreIds.length === 0) return;
    assignManager.mutate(
      { email: trimmedEmail, storeIds: selectedStoreIds },
      {
        onSuccess: () => {
          setEmail("");
          setSelectedStoreIds([]);
        },
      }
    );
  };

  const isLoading = managersQuery.isLoading || storesQuery.isLoading;

  const assignedCount = useMemo(
    () => managers.reduce((sum, manager) => sum + manager.storeIds.length, 0),
    [managers]
  );

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("assignTitle")}</CardTitle>
          <CardDescription>{t("assignDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-2">
            <Label htmlFor="manager-email">{t("emailLabel")}</Label>
            <Input
              id="manager-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("emailPlaceholder")}
              aria-label={t("emailLabel")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("storesLabel")}</Label>
            {stores.length === 0 ? (
              <Alert>
                <AlertDescription>{t("noStores")}</AlertDescription>
              </Alert>
            ) : (
              <StoreCheckboxList
                stores={stores}
                selectedIds={selectedStoreIds}
                onToggle={handleToggleStore}
                idPrefix="assign-store"
              />
            )}
          </div>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={
              assignManager.isPending ||
              !email.trim() ||
              selectedStoreIds.length === 0
            }
            aria-label={t("assignLabel")}
          >
            {t("assign")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
          <CardDescription>
            {t("listDescription", { count: assignedCount })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {managers.length === 0 ? (
            <div className="p-6">
              <Alert>
                <AlertDescription>{t("empty")}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.user")}</TableHead>
                  <TableHead>{t("columns.stores")}</TableHead>
                  <TableHead className="text-right">{tCommon("save")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((manager) => (
                  <ManagerRow
                    key={manager.email}
                    manager={manager}
                    stores={stores}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
