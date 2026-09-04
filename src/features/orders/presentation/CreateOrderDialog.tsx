"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAdminProducts, useProductItems } from "@/features/products";
import { useCreateOrder } from "../application";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateOrderDialog = ({
  open,
  onOpenChange,
}: CreateOrderDialogProps) => {
  const t = useTranslations("dashboard.orders.dialog");
  const createOrder = useCreateOrder();
  const productsQuery = useAdminProducts();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [productId, setProductId] = useState<number | null>(null);
  const [itemId, setItemId] = useState<number | null>(null);
  const [qty, setQty] = useState("1");

  const itemsQuery = useProductItems(productId ?? 0);

  const selectedProduct = useMemo(
    () => (productsQuery.data ?? []).find((product) => product.id === productId),
    [productsQuery.data, productId]
  );

  const selectedItem = useMemo(
    () => (itemsQuery.data ?? []).find((item) => item.id === itemId),
    [itemsQuery.data, itemId]
  );

  const handleReset = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setAddress("");
    setWilaya("");
    setCommune("");
    setProductId(null);
    setItemId(null);
    setQty("1");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleReset();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const quantity = Number(qty);
    if (!selectedProduct || !selectedItem || !Number.isFinite(quantity) || quantity < 1) {
      return;
    }

    const unitPrice = selectedProduct.retail_price;

    await createOrder.mutateAsync({
      order: {
        status: "initial",
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        wilaya: wilaya.trim() || undefined,
        commune: commune.trim() || undefined,
        product: selectedProduct.name,
        product_color: selectedItem.color,
        product_size: selectedItem.size,
        product_price: unitPrice,
        product_qty: quantity,
        is_wholesale: false,
        is_auto_delivered: false,
        is_exchange_required: false,
        has_defect: false,
        return_processed: false,
        channel: "stores_dashboard",
      },
      items: [
        {
          item_id: selectedItem.id,
          qty: quantity,
        },
      ],
      productId: selectedProduct.id,
    });

    handleOpenChange(false);
  };

  const canSubmit =
    Boolean(firstName.trim()) &&
    Boolean(phone.trim()) &&
    productId != null &&
    itemId != null &&
    Number(qty) >= 1 &&
    !createOrder.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="order-first-name">{t("firstName")}</Label>
              <Input
                id="order-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                aria-label={t("firstNameLabel")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-last-name">{t("lastName")}</Label>
              <Input
                id="order-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                aria-label={t("lastNameLabel")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-phone">{t("phone")}</Label>
            <Input
              id="order-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              aria-label={t("phoneLabel")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-address">{t("address")}</Label>
            <Input
              id="order-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              aria-label={t("addressLabel")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="order-wilaya">{t("wilaya")}</Label>
              <Input
                id="order-wilaya"
                value={wilaya}
                onChange={(event) => setWilaya(event.target.value)}
                aria-label={t("wilayaLabel")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-commune">{t("commune")}</Label>
              <Input
                id="order-commune"
                value={commune}
                onChange={(event) => setCommune(event.target.value)}
                aria-label={t("communeLabel")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("product")}</Label>
            <Select
              value={productId?.toString() ?? ""}
              onValueChange={(value) => {
                setProductId(Number(value));
                setItemId(null);
              }}
            >
              <SelectTrigger aria-label={t("selectProductLabel")}>
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {(productsQuery.data ?? []).map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("variant")}</Label>
            <Select
              value={itemId?.toString() ?? ""}
              onValueChange={(value) => setItemId(Number(value))}
              disabled={!productId || itemsQuery.isLoading}
            >
              <SelectTrigger aria-label={t("selectVariantLabel")}>
                <SelectValue placeholder={t("selectVariant")} />
              </SelectTrigger>
              <SelectContent>
                {(itemsQuery.data ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {[item.color, item.size].filter(Boolean).join(" / ") ||
                      t("itemFallback", { id: item.id })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-qty">{t("quantity")}</Label>
            <Input
              id="order-qty"
              type="number"
              min={1}
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              aria-label={t("quantityLabel")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {createOrder.isPending ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
