"use client";

import type { IconSvgElement } from "@hugeicons/react";

import {
  ArrowDown01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  ArrowUpDownIcon,
  BoxesIcon as BoxesStrokeIcon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon as ClipboardListStroke,
  Copy01Icon,
  CreditCardIcon,
  CreditCardIcon as CreditCardStroke,
  EyeIcon,
  FilterHorizontalIcon,
  Globe02Icon,
  Home04Icon as Home04StrokeIcon,
  ImageNotFound01Icon,
  Logout01Icon,
  Menu01Icon,
  Notification01Icon,
  Package01Icon as PackageStroke,
  DeliveryReturn01Icon as ReturnsStroke,
  Settings01Icon as SettingsStroke,
  ShoppingBagAddIcon,
  ShoppingBag01Icon as ShoppingBagStroke,
  SidebarLeftIcon,
  SparklesIcon as SparklesStroke,
  Store01Icon as StoreStroke,
} from "@hugeicons-pro/core-stroke-rounded";

import {
  BoxesIcon as BoxesSolidIcon,
  ClipboardListIcon as ClipboardListSolid,
  CreditCardIcon as CreditCardSolid,
  Home04Icon as Home04SolidIcon,
  Package01Icon as PackageSolid,
  DeliveryReturn01Icon as ReturnsSolid,
  Settings01Icon as SettingsSolid,
  ShoppingBag01Icon as ShoppingBagSolid,
  SparklesIcon as SparklesSolid,
  Store01Icon as StoreSolid,
} from "@hugeicons-pro/core-solid-rounded";

export type HugeNavIconPair = {
  stroke: IconSvgElement;
  solid: IconSvgElement;
};

const pair = (
  stroke: IconSvgElement,
  solid: IconSvgElement,
): HugeNavIconPair => ({ stroke, solid });

/** Sidebar / mobile tab nav — stroke idle, solid active. */
export const navIcons = {
  home: pair(Home04StrokeIcon, Home04SolidIcon),
  inventory: pair(BoxesStrokeIcon, BoxesSolidIcon),
  orders: pair(ShoppingBagStroke, ShoppingBagSolid),
  returns: pair(ReturnsStroke, ReturnsSolid),
  payments: pair(CreditCardStroke, CreditCardSolid),
  stores: pair(StoreStroke, StoreSolid),
  products: pair(PackageStroke, PackageSolid),
  productPages: pair(PackageStroke, PackageSolid),
  settings: pair(SettingsStroke, SettingsSolid),
  sparkles: pair(SparklesStroke, SparklesSolid),
  /** Alias used by some shared chrome */
  earnings: pair(ClipboardListStroke, ClipboardListSolid),
} as const satisfies Record<string, HugeNavIconPair>;

export type NavIconKey = keyof typeof navIcons;

/** Chrome / utility icons (stroke-rounded). */
export const uiIcons = {
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  globe: Globe02Icon,
  check: CheckmarkCircle01Icon,
  chevronsUpDown: ArrowUpDownIcon,
  account: CheckmarkBadge01Icon,
  billing: CreditCardIcon,
  notifications: Notification01Icon,
  logout: Logout01Icon,
  menu: Menu01Icon,
  panelLeft: SidebarLeftIcon,
  close: Cancel01Icon,
  chevronDown: ArrowDown01Icon,
  chevronsLeft: ArrowLeftDoubleIcon,
  chevronsRight: ArrowRightDoubleIcon,
  columns: FilterHorizontalIcon,
  view: EyeIcon,
  copy: Copy01Icon,
  imageEmpty: ImageNotFound01Icon,
  newOrder: ShoppingBagAddIcon,
} as const satisfies Record<string, IconSvgElement>;
