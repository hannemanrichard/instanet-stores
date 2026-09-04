import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import { ProductPageError } from "@/features/products/domain";
import { jsonError } from "@/shared/server/jsonError";

/** Public storefront page by slug */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug?.trim()) {
      throw new ProductPageError(
        "Valid slug is required",
        "PRODUCT_PAGE_INVALID_SLUG"
      );
    }

    const page = await productApplicationService.getProductPageBySlug(slug);
    return NextResponse.json({ page });
  } catch (error) {
    return jsonError(error);
  }
}
