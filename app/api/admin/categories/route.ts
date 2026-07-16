import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { courses: true, products: true } } },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    if (!b?.name || !b?.type) {
      return NextResponse.json({ error: "Thiếu tên hoặc loại danh mục." }, { status: 400 });
    }
    if (!["COURSE", "PRODUCT"].includes(b.type as string)) {
      return NextResponse.json({ error: "Loại danh mục không hợp lệ." }, { status: 400 });
    }
    let slug = slugify(b.name as string);
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString().slice(-5)}`;
    const category = await prisma.category.create({
      data: {
        name: b.name as string,
        slug,
        type: b.type as "PRODUCT" | "COURSE",
        icon: (b.icon as string | null) ?? null,
        description: (b.description as string | null) ?? null,
      },
    });
    await logActivity({ userId: admin.id, action: "CREATE", entity: "Category", entityId: category.id, detail: `Tạo danh mục "${category.name}"` });
    return NextResponse.json({ success: true, id: category.id });
  } catch {
    return NextResponse.json({ error: "Tạo danh mục thất bại." }, { status: 500 });
  }
}
