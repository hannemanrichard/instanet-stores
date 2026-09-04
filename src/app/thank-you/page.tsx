import type { Metadata } from "next";
import { StorefrontLayout } from "@/shared/components/layout";
import { StorefrontThankYouCard } from "@/shared/components/storefront";

export const metadata: Metadata = {
  title: "Thank You",
  description: "We received your COD lead submission.",
};

export default function ThankYouPage() {
  return (
    <StorefrontLayout>
      <StorefrontThankYouCard />
    </StorefrontLayout>
  );
}

