"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar";
import { cn } from "@/shared/utils/utils";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/shared/lib/brand";
import { useAuth } from "@/shared/hooks/use-auth";
import { useI18n } from "@/shared/lib/providers/i18n-provider";
import { AppIcon } from "./AppIcon";
import { LanguageSwitcher } from "./language-switcher";
import { NavHugeIcon } from "./NavHugeIcon";
import { navIcons, uiIcons, type NavIconKey } from "./navIcons";
import { UserNav } from "./UserNav";

type NavLink = {
  key: string;
  href: string;
  iconKey: NavIconKey;
};

type NavSection = {
  labelKey: string;
  items: NavLink[];
  collapsible?: boolean;
  triggerIconKey?: NavIconKey;
};

const workspaceSection: NavSection = {
  labelKey: "workspace",
  items: [
    { key: "dashboard", href: "/dashboard", iconKey: "home" },
    { key: "inventory", href: "/dashboard/inventory", iconKey: "inventory" },
    { key: "orders", href: "/dashboard/orders", iconKey: "orders" },
    { key: "returns", href: "/dashboard/returns", iconKey: "returns" },
    { key: "payments", href: "/dashboard/payments", iconKey: "payments" },
  ],
};

const catalogSection: NavSection = {
  labelKey: "catalog",
  items: [
    { key: "products", href: "/dashboard/products", iconKey: "products" },
    {
      key: "productPages",
      href: "/dashboard/product-pages",
      iconKey: "productPages",
    },
  ],
};

const adminSection: NavSection = {
  labelKey: "admin",
  collapsible: true,
  triggerIconKey: "stores",
  items: [
    { key: "stores", href: "/dashboard/stores", iconKey: "stores" },
    { key: "managers", href: "/dashboard/managers", iconKey: "stores" },
  ],
};

const accountSection: NavSection = {
  labelKey: "account",
  items: [{ key: "settings", href: "/dashboard/settings", iconKey: "settings" }],
};

const isNavActive = (pathname: string, href: string) =>
  pathname === href ||
  (href !== "/dashboard" && pathname.startsWith(href));

const activeItemClassName =
  "bg-sidebar-accent font-semibold text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground";

const SidebarNavItem = ({
  href,
  iconKey,
  label,
  active,
}: {
  href: string;
  iconKey: NavIconKey;
  label: string;
  active: boolean;
}) => {
  const { isRTL } = useI18n();
  const dir = isRTL ? "rtl" : "ltr";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn("h-9 px-3", active && activeItemClassName)}
      >
        <Link
          href={href}
          aria-label={label}
          dir={dir}
          style={{ direction: dir }}
          className="justify-start"
        >
          <NavHugeIcon icons={navIcons[iconKey]} active={active} className="!size-5" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const NavSectionBlock = ({ section }: { section: NavSection }) => {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const { isRTL } = useI18n();
  const hasActiveChild = section.items.some((item) =>
    isNavActive(pathname, item.href)
  );
  const [open, setOpen] = useState(hasActiveChild || !section.collapsible);
  const chevronIcon = isRTL ? uiIcons.chevronLeft : uiIcons.chevronRight;

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  if (section.collapsible) {
    const triggerIcons = navIcons[section.triggerIconKey ?? "stores"];

    return (
      <SidebarGroup>
        <SidebarMenu>
          <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={t(section.labelKey)}
                  isActive={hasActiveChild}
                  dir={isRTL ? "rtl" : "ltr"}
                  className={cn(
                    "h-9 px-3",
                    hasActiveChild && activeItemClassName
                  )}
                >
                  <NavHugeIcon icons={triggerIcons} active={hasActiveChild} />
                  <span>{t(section.labelKey)}</span>
                  <AppIcon
                    icon={chevronIcon}
                    size={16}
                    className={cn(
                      "ms-auto transition-transform duration-200",
                      open && "rotate-90"
                    )}
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {section.items.map((item) => {
                    const active = isNavActive(pathname, item.href);
                    const label = t(item.key);
                    return (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton asChild isActive={active}>
                          <Link
                            href={item.href}
                            aria-label={label}
                            dir={isRTL ? "rtl" : "ltr"}
                          >
                            <NavHugeIcon
                              icons={navIcons[item.iconKey]}
                              active={active}
                            />
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t(section.labelKey)}</SidebarGroupLabel>
      <SidebarMenu>
        {section.items.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            iconKey={item.iconKey}
            label={t(item.key)}
            active={isNavActive(pathname, item.href)}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

const SidebarUpgradeCard = () => {
  const t = useTranslations("navigation");

  return (
    <Card className="mx-2 mb-2 overflow-hidden border-border bg-secondary shadow-none group-data-[collapsible=icon]:hidden">
      <CardContent className="flex flex-col gap-3 p-4 text-start">
        <div className="flex size-10 items-center justify-center self-start rounded-lg bg-accent text-accent-foreground">
          <NavHugeIcon icons={navIcons.sparkles} active />
        </div>
        <div className="w-full space-y-1 text-start">
          <p className="text-sm font-semibold leading-none">
            {t("upgradeTitle")}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("upgradeDescription")}
          </p>
        </div>
        <Button asChild size="sm" className="w-full">
          <Link href="/dashboard/orders" aria-label={t("upgradeCta")}>
            {t("upgradeCta")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export function StoreSidebar() {
  const { isRTL } = useI18n();
  const { isAdmin, isStoresManager, canManageCatalog, roleLabel } = useAuth();
  const dir = isRTL ? "rtl" : "ltr";

  const sections = useMemo(() => {
    const next = [workspaceSection];
    if (canManageCatalog) next.push(catalogSection);
    if (isAdmin) next.push(adminSection);
    if (!isStoresManager) next.push(accountSection);
    return next;
  }, [canManageCatalog, isAdmin, isStoresManager]);

  return (
    <Sidebar
      key={dir}
      collapsible="icon"
      side={isRTL ? "right" : "left"}
      dir={dir}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/dashboard"
                aria-label={`${BRAND_NAME} home`}
                dir={dir}
              >
                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
                  <Image
                    src={BRAND_LOGO_SRC}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                    aria-hidden
                    unoptimized
                  />
                </div>
                <div className="grid min-w-0 flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{BRAND_NAME}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {roleLabel ?? "Stores"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <div className="flex flex-col gap-1 py-2">
          {sections.map((section) => (
            <NavSectionBlock key={section.labelKey} section={section} />
          ))}
          <div className="mt-2 pt-2">
            <SidebarUpgradeCard />
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-sidebar-border">
        <LanguageSwitcher variant="sidebar" />
        <UserNav />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
