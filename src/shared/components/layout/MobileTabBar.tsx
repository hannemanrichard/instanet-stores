"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/utils";
import { NavHugeIcon } from "./NavHugeIcon";
import { navIcons, type NavIconKey } from "./navIcons";
import { useAuth } from "@/shared/hooks/use-auth";

type TabItem = {
  key: string;
  href: string;
  iconKey: NavIconKey;
};

const tabItems: TabItem[] = [
  { key: "home", href: "/dashboard", iconKey: "home" },
  { key: "inventory", href: "/dashboard/inventory", iconKey: "inventory" },
  { key: "orders", href: "/dashboard/orders", iconKey: "orders" },
  { key: "payments", href: "/dashboard/payments", iconKey: "payments" },
  { key: "settings", href: "/dashboard/settings", iconKey: "settings" },
];

const isActive = (pathname: string, href: string) =>
  pathname === href ||
  (href !== "/dashboard" && pathname.startsWith(href));

export const MobileTabBar = () => {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const { isStoresManager } = useAuth();
  const visibleTabs = isStoresManager
    ? tabItems.map((item) =>
        item.key === "settings"
          ? { key: "returns", href: "/dashboard/returns", iconKey: "returns" as const }
          : item
      )
    : tabItems;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5 gap-0.5 px-1 pt-1.5 pb-1">
        {visibleTabs.map((item) => {
          const active = isActive(pathname, item.href);
          const label = t(item.key);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-auto flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-muted-foreground transition-colors",
                "focus:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-accent text-primary focus:bg-accent focus-visible:bg-accent"
                  : "hover:text-foreground"
              )}
            >
              <NavHugeIcon
                icons={navIcons[item.iconKey]}
                active={active}
                size={24}
                className={cn(active && "text-primary")}
              />
              <span
                className={cn(
                  "truncate text-[10px] font-medium",
                  active && "font-bold text-primary"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
