import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { AffiliateStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where: Prisma.AffiliateWhereInput = {};
    if (status && status !== "ALL") where.status = status as AffiliateStatus;

    const affiliates = await prisma.affiliate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        _count: { select: { referredUsers: true, commissions: true } },
      },
    });
    const data = affiliates.map((a) => ({
      id: a.id,
      code: a.code,
      status: a.status,
      commissionRate: a.commissionRate,
      balance: a.balance,
      totalEarned: a.totalEarned,
      totalPaid: a.totalPaid,
      userName: a.user?.fullName ?? "",
      userEmail: a.user?.email ?? "",
      referredCount: a._count.referredUsers,
      commissionsCount: a._count.commissions,
      createdAt: a.createdAt,
    }));

    const counts = await prisma.affiliate.groupBy({ by: ["status"], _count: true });
    const statusCounts: Record<string, number> = {};
    counts.forEach((c) => (statusCounts[c.status] = c._count));

    // Pending payouts count for badge
    const pendingPayouts = await prisma.payout.count({ where: { status: "PENDING" } });

    return NextResponse.json({ affiliates: data, statusCounts, pendingPayouts });
  } catch {
    return NextResponse.json({ affiliates: [], statusCounts: {}, pendingPayouts: 0 });
  }
}
