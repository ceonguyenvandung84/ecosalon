import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const released = await prisma.commission.updateMany({
      where: { status: "HOLD", holdUntil: { lte: now } },
      data: { status: "APPROVED", releasedAt: now },
    });

    if (released.count > 0) {
      // Update affiliate balances for released commissions
      const commissions = await prisma.commission.findMany({
        where: { releasedAt: now, status: "APPROVED" },
        select: { affiliateId: true, amount: true },
      });
      for (const c of commissions) {
        await prisma.affiliate.update({
          where: { id: c.affiliateId },
          data: { balance: { increment: c.amount }, totalEarned: { increment: c.amount } },
        });
      }
    }

    return NextResponse.json({ released: released.count, ok: true });
  } catch (e) {
    console.error("Release commissions error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
