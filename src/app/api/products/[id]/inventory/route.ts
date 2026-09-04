import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import { ProductError } from "@/features/products/domain";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { assertActorProductAccess } from "@/shared/server/productStoreAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireDashboardActor();
    const productId = Number((await context.params).id);
    if (!productId || Number.isNaN(productId)) {
      throw new ProductError("Valid product id is required", "PRODUCT_INVALID_ID");
    }

    await assertActorProductAccess(actor, productId);

    const snapshot =
      await productApplicationService.getProductInventory(productId);
    return NextResponse.json({ snapshot });
  } catch (error) {
    return jsonError(error);
  }
}
