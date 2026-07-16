import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role") ?? "";

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role && (role === "ADMIN" || role === "USER")) where.role = role as Role;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { enrollments: true } },
        },
      }),
    ]);
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        enrollmentsCount: u._count?.enrollments ?? 0,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return NextResponse.json({ users: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
  }
}
