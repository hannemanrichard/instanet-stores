import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import type { CreateProductPayload } from "@/features/products/application/services/productApplicationService";
import { ProductError } from "@/features/products/domain";
import {
  requireDashboardActor,
  requireStoreOpsActor,
} from "@/shared/server/requireDashboardActor";
import { assertStoreAccess, resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const storeIdParam = req.nextUrl.searchParams.get("storeId");
    const requestedStoreId = storeIdParam ? Number(storeIdParam) : null;
    const storeIds = resolveScopeStoreIds(actor, requestedStoreId);

    if (storeIds === undefined) {
      const products = await productApplicationService.getAdminProducts();
      return NextResponse.json({ products });
    }

    const products =
      await productApplicationService.getProductsByStoreIds(storeIds);
    return NextResponse.json({ products });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireStoreOpsActor();
    const payload = (await req.json()) as CreateProductPayload;

    if (!payload.product?.name?.trim()) {
      throw new ProductError("Product name is required", "PRODUCT_NAME_REQUIRED");
    }

    assertStoreAccess(actor, payload.product.store_id ?? null);

    const created = await productApplicationService.createProductWithRelations(
      payload
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
