import { NextResponse } from "next/server";
import { requireCurrentStore } from "@/shared/server/requireCurrentStore";
import { jsonError } from "@/shared/server/jsonError";

export async function GET() {
  try {
    const store = await requireCurrentStore();
    return NextResponse.json({ store });
  } catch (error) {
    return jsonError(error);
  }
}
