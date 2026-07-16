import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { AdminEntity, AdminAction } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");

    const where: Prisma.AdminActivityWhereInput = {};
    if (entity) where.entity = entity as AdminEntity;
    if (action) where.action = action as AdminAction;

    const [items, total] = await Promise.all([
      prisma.adminActivity.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true, role: true, avatarPath: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminActivity.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}