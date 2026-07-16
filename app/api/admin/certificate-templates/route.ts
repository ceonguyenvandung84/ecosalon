import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const templates = await prisma.certificateTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { certificates: true } } },
    });
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ templates: [] });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    if (!b?.title) {
      return NextResponse.json({ error: "Thiếu tiêu đề." }, { status: 400 });
    }
    if (b?.isDefault) {
      await prisma.certificateTemplate.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    const template = await prisma.certificateTemplate.create({
      data: {
        title: b.title as string,
        description: (b.description as string | null) ?? null,
        svgTemplate: (b.svgTemplate as string) ?? "",
        backgroundPath: (b.backgroundPath as string | null) ?? null,
        fields: JSON.stringify(b.fields ?? null),
        fonts: JSON.stringify(b.fonts ?? null),
        placeholder: JSON.stringify(b.placeholder ?? null),
        isDefault: (b.isDefault as boolean) ?? false,
        isActive: (b.isActive as boolean) ?? true,
      },
    });
    return NextResponse.json({ success: true, id: template.id });
  } catch {
    return NextResponse.json({ error: "Tạo mẫu thất bại." }, { status: 500 });
  }
}
