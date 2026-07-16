import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { MIN_PAYOUT } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

// POST request a payout (deducts from available balance)
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const amount = Math.round(Number(body?.amount ?? 0));

    const affiliate = await prisma.affiliate.findUnique({ where: { userId: user.id } });
    if (!affiliate) return NextResponse.json({ error: "Chưa có tài khoản tiếp thị." }, { status: 404 });
    if (affiliate.status !== "APPROVED") return NextResponse.json({ error: "Tài khoản chưa được duyệt." }, { status: 403 });
    if (!affiliate.payoutAccountNumber || !affiliate.payoutBankName) {
      return NextResponse.json({ error: "Vui lòng cập nhật thông tin ngân hàng nhận tiền trước." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < MIN_PAYOUT) {
      return NextResponse.json({ error: `Số tiền rút tối thiểu là ${MIN_PAYOUT.toLocaleString("vi-VN")}đ.` }, { status: 400 });
    }
    if (amount > affiliate.balance) {
      return NextResponse.json({ error: "Số dư không đủ." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.affiliate.update({ where: { id: affiliate.id }, data: { balance: { decrement: amount } } });
      await tx.payout.create({
        data: {
          affiliateId: affiliate.id,
          amount,
          status: "PENDING",
          bankName: affiliate.payoutBankName,
          accountNumber: affiliate.payoutAccountNumber,
          accountName: affiliate.payoutAccountName,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Payout request error:", e);
    return NextResponse.json({ error: "Yêu cầu rút tiền thất bại." }, { status: 500 });
  }
}
