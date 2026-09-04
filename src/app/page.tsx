import type { Metadata } from "next";
import { BRAND_NAME } from "@/shared/lib/brand";
import { StoreLandingPage } from "@/features/landing";
import { LandingLayout } from "@/shared/components/layout";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Store partner platform`,
  description:
    "Join Instanet to manage inventory, orders, returns, and payouts for cash-on-delivery stores.",
};

export default function Home() {
  return (
    <LandingLayout>
      <StoreLandingPage />
    </LandingLayout>
  );
}
