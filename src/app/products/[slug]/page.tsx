import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageView } from "@/features/products";
import { StorefrontLayout } from "@/shared/components/layout";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${decodeURIComponent(slug)} | Product`,
  };
}

const isValidSlug = (slug: string) => slug.length > 0;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  if (!isValidSlug(slug)) {
    notFound();
  }

  return (
    <StorefrontLayout>
      <div className="container mx-auto space-y-10 px-4">
        <ProductPageView slug={slug} />
      </div>
    </StorefrontLayout>
  );
}

