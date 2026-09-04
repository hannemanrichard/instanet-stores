import { SettingsManagementView } from "@/features/settings/presentation";
import { RoleGuard } from "@/shared/components/auth/RoleGuard";

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={["admin", "store"]}>
      <div className="container mx-auto py-8 px-4">
        <SettingsManagementView />
      </div>
    </RoleGuard>
  );
}

