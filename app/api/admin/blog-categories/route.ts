import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true, _count: { select: { posts: true } } },
    });
    return NextResponse.json({ categories });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const name = (body?.name ?? "").toString().trim();
    if (!name) return NextResponse.json({ error: "Vui lòng nhập tên" }, { status: 400 });
    const slug = slugify(name) || `chuyen-muc-${Date.now()}`;
    const existing = await prisma.blogCategory.findUnique({ where: { slug } });
    const category = await prisma.blogCategory.create({
      data: { name, slug: existing ? `${slug}-${Math.random().toString(36).slice(2, 6)}` : slug, description: (body?.description as string | null) ?? null },
    });
    return NextResponse.json({ category });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
