import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

async function ownItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });
  if (!item || item.cart.userId !== userId) return null;
  return item;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const item = await ownItem(user.id, params.id);
    if (!item) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    let quantity = parseInt((body?.quantity as string) ?? "1", 10) || 1;
    quantity = Math.max(1, Math.min(item.product?.stock ?? 1, quantity));
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return NextResponse.json({ success: true, quantity });
  } catch {
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const item = await ownItem(user.id, params.id);
    if (!item) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    await prisma.cartItem.delete({ where: { id: item.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Xóa thất bại." }, { status: 500 });
  }
}
