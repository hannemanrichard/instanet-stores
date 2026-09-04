import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductPageEditor } from "@/features/products/presentation/ProductPageEditor";
import { RoleGuard } from "@/shared/components/auth/RoleGuard";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ProductPageEditHeader } from "./ProductPageEditHeader";
import { CATALOG_ROLES } from "@/shared/hooks/use-auth";

interface EditProductPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Edit Product Page",
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return (
    <RoleGuard allowedRoles={CATALOG_ROLES}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <ProductPageEditHeader />
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-[360px] w-full rounded-3xl" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            </div>
          }
        >
          <ProductPageEditor slug={slug} />
        </Suspense>
      </div>
    </RoleGuard>
  );
}
