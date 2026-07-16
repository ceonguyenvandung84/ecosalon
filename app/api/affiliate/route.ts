import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { generateAffiliateCode, DEFAULT_COMMISSION_RATE } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

// GET current user's affiliate account + stats
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: user.id },
      include: {
        commissions: { orderBy: { createdAt: "desc" }, take: 50 },
        payouts: { orderBy: { createdAt: "desc" }, take: 50 },
        _count: { select: { referredUsers: true, commissions: true } },
      },
    });
    if (!affiliate) return NextResponse.json({ affiliate: null });
    return NextResponse.json({ affiliate });
  } catch {
    return NextResponse.json({ affiliate: null });
  }
}

// POST register the current user as an affiliate (status PENDING)
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const existing = await prisma.affiliate.findUnique({ where: { userId: user.id } });
    if (existing) return NextResponse.json({ error: "Bạn đã đăng ký tiếp thị liên kết rồi." }, { status: 409 });

    // Generate a unique code
    let code = generateAffiliateCode(user.name ?? user.fullName ?? "");
    for (let i = 0; i < 4; i++) {
      const exists = await prisma.affiliate.findUnique({ where: { code } });
      if (!exists) break;
      code = generateAffiliateCode(user.name ?? "");
    }

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: user.id,
        code,
        status: "PENDING",
        commissionRate: DEFAULT_COMMISSION_RATE,
      },
    });
    return NextResponse.json({ success: true, affiliate });
  } catch (e) {
    console.error("Affiliate register error:", e);
    return NextResponse.json({ error: "Đăng ký thất bại." }, { status: 500 });
  }
}

// PATCH update payout bank info
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const affiliate = await prisma.affiliate.findUnique({ where: { userId: user.id } });
    if (!affiliate) return NextResponse.json({ error: "Chưa có tài khoản tiếp thị." }, { status: 404 });
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        payoutBankName: (body?.payoutBankName ?? "").toString().trim() || null,
        payoutAccountNumber: (body?.payoutAccountNumber ?? "").toString().trim() || null,
        payoutAccountName: (body?.payoutAccountName ?? "").toString().trim() || null,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}
