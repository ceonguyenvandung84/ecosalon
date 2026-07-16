import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    if (!b?.title || !b?.message) {
      return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung." }, { status: 400 });
    }
    const type = b?.allUsers ? "ADMIN_BROADCAST" : "GENERAL";
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    if (users.length === 0) {
      return NextResponse.json({ error: "Không có người dùng nào." }, { status: 400 });
    }
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type,
        title: b.title as string,
        message: b.message as string,
        link: (b.link as string | null) ?? null,
      })),
    });
    return NextResponse.json({ success: true, sentCount: users.length });
  } catch {
    return NextResponse.json({ error: "Gửi thất bại." }, { status: 500 });
  }
}
