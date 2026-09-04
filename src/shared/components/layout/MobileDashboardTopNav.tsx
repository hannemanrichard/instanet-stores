"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { AppIcon } from "./AppIcon";
import { uiIcons } from "./navIcons";

const isDashboardHome = (pathname: string) =>
  pathname === "/dashboard" || pathname === "/dashboard/";

const resolveTitleKey = (pathname: string): string => {
  if (isDashboardHome(pathname)) return "home";
  if (pathname.startsWith("/dashboard/orders")) return "orders";
  if (pathname.startsWith("/dashboard/inventory")) return "inventory";
  if (pathname.startsWith("/dashboard/returns")) return "returns";
  if (pathname.startsWith("/dashboard/payments")) return "payments";
  if (pathname.startsWith("/dashboard/stores")) return "stores";
  if (pathname.startsWith("/dashboard/products")) return "products";
  if (pathname.startsWith("/dashboard/product-pages")) return "productPages";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return "dashboard";
};

/**
 * Mobile-only top bar: page title + back (hidden on dashboard home).
 */
export const MobileDashboardTopNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("navigation");
  const isHome = isDashboardHome(pathname);
  const title = t(resolveTitleKey(pathname));

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-white px-2 md:hidden">
      {!isHome ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0"
          onClick={handleBack}
          aria-label={t("back")}
        >
          <AppIcon
            icon={uiIcons.chevronLeft}
            size={22}
            className="rtl:rotate-180"
          />
        </Button>
      ) : (
        <div className="w-2 shrink-0" aria-hidden />
      )}
      <h1 className="min-w-0 flex-1 truncate text-start text-base font-bold tracking-tight text-foreground">
        {title}
      </h1>
    </header>
  );
};
