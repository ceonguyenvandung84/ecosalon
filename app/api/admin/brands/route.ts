import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
    return NextResponse.json({ brands });
  } catch {
    return NextResponse.json({ brands: [] });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { name, slug, logoPath, description } = body;
    if (!name || !slug) return NextResponse.json({ error: "Tên và slug là bắt buộc" }, { status: 400 });

    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name, logoPath: logoPath || null, description: description || null },
      create: { name, slug, logoPath: logoPath || null, description: description || null },
    });
    return NextResponse.json(brand, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { id, name, slug, logoPath, description } = body;
    if (!id) return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        ...(name && { name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") }),
        ...(logoPath !== undefined && { logoPath }),
        ...(description !== undefined && { description }),
      },
    });
    return NextResponse.json(brand);
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
