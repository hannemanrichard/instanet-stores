import { NextRequest, NextResponse } from "next/server";
import { settingsApplicationService } from "@/features/settings/application/services/settingsApplicationService";
import type { SettingKey } from "@/features/settings/domain";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope");

    if (scope === "map") {
      const map = await settingsApplicationService.getSettingsMap();
      return NextResponse.json(
        { map },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    if (scope === "analytics") {
      await requireAdminActor();
      const settings = await settingsApplicationService.getAnalyticsSettings();
      return NextResponse.json({ settings });
    }

    await requireAdminActor();
    const settings = await settingsApplicationService.getAllSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminActor();
    const body = (await req.json()) as {
      key?: SettingKey;
      value?: string | null;
    };
    if (!body.key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }
    const setting = await settingsApplicationService.updateSetting(
      body.key,
      body.value ?? null
    );
    return NextResponse.json({ setting });
  } catch (error) {
    return jsonError(error);
  }
}
