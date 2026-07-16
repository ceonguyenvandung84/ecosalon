import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
  const search = searchParams.get("search") ?? "";

  const where: Prisma.CouponWhereInput = {};
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { label: { contains: search } },
    ];
  }

  const [total, coupons] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { usages: true } } },
    }),
  ]);

  return NextResponse.json({
    coupons: coupons.map((c) => ({
      ...c,
      usedCount: c.usedCount,
      usageCount: c._count.usages,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      code,
      label,
      type,
      value,
      minOrderAmount = 0,
      maxDiscount = null,
      usageLimit = 0,
      courseIds = [],
      startsAt,
      expiresAt,
      isActive = true,
    } = body;

    if (!code || !type || value === undefined || !startsAt || !expiresAt) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    if (type !== "PERCENT" && type !== "FIXED_AMOUNT") {
      return NextResponse.json({ error: "Loại coupon không hợp lệ" }, { status: 400 });
    }

    if (type === "PERCENT" && (value < 1 || value > 100)) {
      return NextResponse.json({ error: "Phần trăm giảm phải từ 1-100" }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Mã coupon đã tồn tại" }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        label: label || null,
        type,
        value: Number(value),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: Number(usageLimit) || 0,
        courseIds: JSON.stringify(courseIds || []),
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt),
        isActive,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/coupons]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}