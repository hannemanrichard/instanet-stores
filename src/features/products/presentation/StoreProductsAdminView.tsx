"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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
import { useAdminProducts } from "../application";

const formatAmount = (amount?: number | null) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(amount);
};

export const StoreProductsAdminView = () => {
  const t = useTranslations("dashboard.products");
  const tCommon = useTranslations("dashboard.common");
  const productsQuery = useAdminProducts();

  if (productsQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const products = productsQuery.data ?? [];
  const currency = tCommon("currency");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t("catalogTitle")}</CardTitle>
          <CardDescription>{t("catalogDescription")}</CardDescription>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new" aria-label={t("createTitle")}>
            {t("newProduct")}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <Alert>
            <AlertDescription>{t("empty")}</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.id")}</TableHead>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead>{t("columns.store")}</TableHead>
                <TableHead>{t("columns.supplierPrice")}</TableHead>
                <TableHead>{t("columns.retailPrice")}</TableHead>
                <TableHead className="text-right">{t("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>#{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>#{product.store_id ?? 1}</TableCell>
                  <TableCell>
                    {formatAmount(product.supplier_price)} {currency}
                  </TableCell>
                  <TableCell>
                    {formatAmount(product.retail_price)} {currency}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/dashboard/products/edit/${product.id}`}
                        aria-label={t("editLabel", { id: product.id })}
                      >
                        {tCommon("edit")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
