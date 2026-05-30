import { NextResponse } from "next/server";

import { listGuidanceFilesByEquipmentId } from "@/lib/equipment-guidance";
import { auth0, isAuth0Configured } from "@/lib/auth0";

export async function GET(req: Request) {
  if (!isAuth0Configured()) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 }
    );
  }

  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get("equipmentId")?.trim() ?? "";
  if (!equipmentId) {
    return NextResponse.json(
      { error: "equipmentId query parameter is required." },
      { status: 400 }
    );
  }

  const files = await listGuidanceFilesByEquipmentId(equipmentId);
  return NextResponse.json({ files });
}
