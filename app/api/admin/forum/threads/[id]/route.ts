import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    const thread = await prisma.forumThread.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { name: true } },
        author: { select: { fullName: true, avatarPath: true } },
        replies: { orderBy: { createdAt: "asc" }, include: { author: { select: { fullName: true, avatarPath: true } } } },
      },
    });
    if (!thread) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ thread });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (body.isPinned !== undefined) data.isPinned = !!body.isPinned;
    if (body.isLocked !== undefined) data.isLocked = !!body.isLocked;
    if (body.isHidden !== undefined) data.isHidden = !!body.isHidden;
    const thread = await prisma.forumThread.update({ where: { id: params.id }, data });
    return NextResponse.json({ thread });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    await prisma.forumThread.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
