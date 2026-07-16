import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const comments = await prisma.blogComment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        post: { select: { title: true, slug: true } },
      },
    });
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { id, isHidden } = body;
    if (!id) return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });
    await prisma.blogComment.update({ where: { id }, data: { isHidden } });
    return NextResponse.json({ success: true });
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
    await prisma.blogComment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
