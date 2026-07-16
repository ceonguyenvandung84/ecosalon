import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// GET danh sách thông báo + số chưa đọc
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("GET notifications error:", err);
    return NextResponse.json({ error: "Lỗi tải thông báo" }, { status: 500 });
  }
}

// POST đánh dấu tất cả đã đọc
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST notifications read-all error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}
