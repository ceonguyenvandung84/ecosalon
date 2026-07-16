import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "maintenance_mode" },
      select: { value: true },
    });
    return NextResponse.json(
      { maintenance: setting?.value === "true" },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch {
    return NextResponse.json({ maintenance: false }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}