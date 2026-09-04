import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import type { UpdateProductPayload } from "@/features/products/application/services/productApplicationService";
import { ProductError } from "@/features/products/domain";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertStoreAccess } from "@/shared/server/storeAccess";
import { assertActorProductAccess } from "@/shared/server/productStoreAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const productId = Number((await context.params).id);
    if (!productId || Number.isNaN(productId)) {
      throw new ProductError("Valid product id is required", "PRODUCT_INVALID_ID");
    }

    const product = await assertActorProductAccess(actor, productId);
    return NextResponse.json({ product });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
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

    const payload = (await req.json()) as UpdateProductPayload;
    if (payload.product?.store_id != null) {
      assertStoreAccess(actor, payload.product.store_id);
    }

    await productApplicationService.updateProductWithRelations(
      productId,
      payload
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
