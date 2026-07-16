import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { Prisma } from "@prisma/client";
import { OrderStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
    const where: Prisma.OrderWhereInput = {};
    if (status && status !== "ALL") where.status = status as OrderStatus;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: true, user: { select: { email: true, fullName: true } } },
      }),
    ]);
    const data = orders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      status: o.status,
      total: o.total,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      userEmail: o.user?.email ?? "",
      itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
      firstItemImage: resolveImageUrl(o.items[0]?.productImage),
      createdAt: o.createdAt,
    }));

    const counts = await prisma.order.groupBy({ by: ["status"], _count: true });
    const statusCounts: Record<string, number> = {};
    counts.forEach((c) => (statusCounts[c.status] = c._count));

    return NextResponse.json({
      orders: data,
      statusCounts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return NextResponse.json({ orders: [], statusCounts: {}, total: 0, page: 1, pageSize: 20, totalPages: 0 });
  }
}
