import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

// PATCH update a payout status. PAID = confirm (totalPaid += amount).
// REJECTED = refund amount back to affiliate balance.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const status = ((body?.status as string | null) ?? "").toString();
    const note = ((body?.note as string | null) ?? "").toString().trim();
    if (!["PAID", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }
    const payout = await prisma.payout.findUnique({ where: { id: params.id } });
    if (!payout) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    if (payout.status !== "PENDING") {
      return NextResponse.json({ error: "Yêu cầu này đã được xử lý." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id: payout.id },
        data: { status: status as "PENDING" | "PAID" | "REJECTED", note: note || null, processedAt: new Date() },
      });
      if (status === "PAID") {
        await tx.affiliate.update({ where: { id: payout.affiliateId }, data: { totalPaid: { increment: payout.amount } } });
      } else if (status === "REJECTED") {
        // Refund reserved amount back to balance
        await tx.affiliate.update({ where: { id: payout.affiliateId }, data: { balance: { increment: payout.amount } } });
      }
    });

    const aff = await prisma.affiliate.findUnique({ where: { id: payout.affiliateId }, select: { userId: true } });
    if (aff?.userId) {
      await createNotification({
        userId: aff.userId,
        type: "PAYOUT_STATUS",
        title: status === "PAID" ? "Yêu cầu rút tiền đã chi" : "Yêu cầu rút tiền bị từ chối",
        message: status === "PAID"
          ? `Yêu cầu rút ${formatPrice(payout.amount)} đã được chi trả.`
          : `Yêu cầu rút ${formatPrice(payout.amount)} bị từ chối, số tiền đã được hoàn về số dư.`,
        link: "/tiep-thi-lien-ket",
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Update payout error:", e);
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}
