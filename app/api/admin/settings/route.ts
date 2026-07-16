import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => (map[s.key] = s.value));
    return NextResponse.json({ settings: map });
  } catch {
    return NextResponse.json({ settings: {} });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const entries = Object.entries(b ?? {});
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lưu thất bại." }, { status: 500 });
  }
}
