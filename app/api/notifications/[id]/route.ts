import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// PATCH đánh dấu một thông báo đã đọc
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  try {
    await prisma.notification.updateMany({
      where: { id: params.id, userId },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH notification error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

// DELETE xóa một thông báo
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  try {
    await prisma.notification.deleteMany({ where: { id: params.id, userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE notification error:", err);
    return NextResponse.json({ error: "Lỗi xóa" }, { status: 500 });
  }
}
