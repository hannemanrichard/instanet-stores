import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import type { ProductInventoryAdjustment } from "@/features/products/domain";
import { ProductError } from "@/features/products/domain";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertActorProductAccess } from "@/shared/server/productStoreAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const productId = Number((await context.params).id);
    if (!productId || Number.isNaN(productId)) {
      throw new ProductError("Valid product id is required", "PRODUCT_INVALID_ID");
    }

    await assertActorProductAccess(actor, productId);

    const body = (await req.json()) as {
      adjustments?: ProductInventoryAdjustment[];
    };
    if (!body.adjustments?.length) {
      throw new ProductError(
        "adjustments are required",
        "PRODUCT_ADJUSTMENTS_REQUIRED"
      );
    }

    const snapshot = await productApplicationService.bulkUpdateInventory(
      productId,
      body.adjustments
    );
    return NextResponse.json({ snapshot });
  } catch (error) {
    return jsonError(error);
  }
}
