import { NextRequest, NextResponse } from "next/server";
import { inventoryApplicationService } from "@/features/inventory/application/services/inventoryApplicationService";
import type { InventoryAdjustmentInput } from "@/features/inventory/domain";
import { InventoryError } from "@/features/inventory/domain";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertActorProductAccess } from "@/shared/server/productStoreAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const { productId: productIdParam } = await context.params;
    const productId = Number(productIdParam);

    if (!productId || Number.isNaN(productId)) {
      throw new InventoryError(
        "Valid productId is required",
        "INVENTORY_INVALID_PRODUCT"
      );
    }

    await assertActorProductAccess(actor, productId);

    const body = (await req.json()) as {
      adjustments?: InventoryAdjustmentInput[];
    };

    if (!body.adjustments?.length) {
      throw new InventoryError(
        "adjustments are required",
        "INVENTORY_ADJUSTMENTS_REQUIRED"
      );
    }

    const summary =
      await inventoryApplicationService.bulkAdjustProductInventory(
        productId,
        body.adjustments
      );

    return NextResponse.json({ summary });
  } catch (error) {
    return jsonError(error);
  }
}
