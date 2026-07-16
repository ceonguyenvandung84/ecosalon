import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { PayoutStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where: Prisma.PayoutWhereInput = {};
    if (status && status !== "ALL") where.status = status as PayoutStatus;

    const payouts = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { affiliate: { include: { user: { select: { fullName: true, email: true } } } } },
    });
    const data = payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      bankName: p.bankName,
      accountNumber: p.accountNumber,
      accountName: p.accountName,
      note: p.note,
      processedAt: p.processedAt,
      createdAt: p.createdAt,
      affiliateCode: p.affiliate?.code ?? "",
      userName: p.affiliate?.user?.fullName ?? "",
      userEmail: p.affiliate?.user?.email ?? "",
    }));

    const counts = await prisma.payout.groupBy({ by: ["status"], _count: true });
    const statusCounts: Record<string, number> = {};
    counts.forEach((c) => (statusCounts[c.status] = c._count));

    return NextResponse.json({ payouts: data, statusCounts });
  } catch {
    return NextResponse.json({ payouts: [], statusCounts: {} });
  }
}
