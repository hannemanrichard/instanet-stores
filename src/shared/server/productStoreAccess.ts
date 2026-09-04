import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import { inventoryApplicationService } from "@/features/inventory/application/services/inventoryApplicationService";
import { supabaseServer as supabase } from "@/infrastructure/supabase/server";
import type { ProductEntity, ProductPageEntity } from "@/features/products/domain";
import { ForbiddenError, assertStoreAccess, type StoreScopedActor } from "./storeAccess";

export const assertActorProductAccess = async (
  actor: StoreScopedActor,
  productId: number
): Promise<ProductEntity> => {
  const product = await productApplicationService.getProductById(productId);
  if (!product) {
    throw new ForbiddenError("Product not found");
  }
  assertStoreAccess(actor, product.store_id);
  return product;
};

export const assertActorProductPageAccess = async (
  actor: StoreScopedActor,
  pageId: number
): Promise<ProductPageEntity> => {
  const page = await productApplicationService.getProductPageById(pageId);
  if (!page) {
    throw new ForbiddenError("Product page not found");
  }
  await assertActorProductAccess(actor, page.product_id);
  return page;
};

export const getProductIdForItem = async (
  itemId: number
): Promise<number | null> => {
  const { data, error } = await supabase
    .from("items")
    .select("product_id")
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw error;
  return data?.product_id ?? null;
};

export const assertActorItemAccess = async (
  actor: StoreScopedActor,
  itemId: number
): Promise<ProductEntity> => {
  const productId = await getProductIdForItem(itemId);
  if (productId == null) {
    throw new ForbiddenError("Item not found");
  }
  return assertActorProductAccess(actor, productId);
};

export const assertActorInventoryAccess = async (
  actor: StoreScopedActor,
  inventoryId: number
): Promise<ProductEntity> => {
  const record = await inventoryApplicationService.getInventoryById(inventoryId);
  if (!record) {
    throw new ForbiddenError("Inventory record not found");
  }
  return assertActorItemAccess(actor, record.item_id);
};
