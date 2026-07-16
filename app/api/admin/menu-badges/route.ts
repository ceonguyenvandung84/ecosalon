import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const [ordersPending, instructorApplicants] = await Promise.all([
      prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.instructorApplication.count({ where: { status: "PENDING" } }),
    ]);
    return NextResponse.json({ ordersPending, instructorApplicants });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
