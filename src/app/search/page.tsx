import type { Metadata } from "next";
import { StorefrontSearchPageContent } from "@/features/products";
import { StorefrontLayout } from "@/shared/components/layout";

export const metadata: Metadata = {
  title: "Search Products",
  description: "Find the perfect product for your campaign.",
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

const decodeQuery = (value?: string) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const initial = decodeQuery(q);

  return (
    <StorefrontLayout>
      <StorefrontSearchPageContent initialSearchTerm={initial} />
    </StorefrontLayout>
  );
}

