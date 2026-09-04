import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import { ProductError } from "@/features/products/domain";
import { jsonError } from "@/shared/server/jsonError";

/** Public — storefront PDP needs variants */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const productId = Number((await context.params).id);
    if (!productId || Number.isNaN(productId)) {
      throw new ProductError("Valid product id is required", "PRODUCT_INVALID_ID");
    }

    const items = await productApplicationService.getProductItems(productId);
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error);
  }
}
