import { NextRequest, NextResponse } from "next/server";
import { inventoryApplicationService } from "@/features/inventory/application/services/inventoryApplicationService";
import { InventoryError } from "@/features/inventory/domain";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { assertActorProductAccess } from "@/shared/server/productStoreAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const actor = await requireDashboardActor();
    const { productId: productIdParam } = await context.params;
    const productId = Number(productIdParam);

    if (!productId || Number.isNaN(productId)) {
      throw new InventoryError(
        "Valid productId is required",
        "INVENTORY_INVALID_PRODUCT"
      );
    }

    await assertActorProductAccess(actor, productId);

    const summary =
      await inventoryApplicationService.getInventoryPhaseSummary(productId);
    return NextResponse.json({ summary });
  } catch (error) {
    return jsonError(error);
  }
}
