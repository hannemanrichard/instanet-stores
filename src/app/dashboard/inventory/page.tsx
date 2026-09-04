import type { Metadata } from "next";
import { Shell } from "@/shared/components";
import { RoleGuard } from "@/shared/components/auth/RoleGuard";
import { InventoryManagementView } from "@/features/inventory";
import { BRAND_NAME } from "@/shared/lib/brand";

export const metadata: Metadata = {
  title: `Inventory | ${BRAND_NAME}`,
  description: "Monitor stock levels for store products.",
};

export default function InventoryDashboardPage() {
  return (
    <RoleGuard allowedRoles={["admin", "store", "stores_manager"]}>
      <Shell>
        <div className="space-y-6">
          <InventoryManagementView />
        </div>
      </Shell>
    </RoleGuard>
  );
}
