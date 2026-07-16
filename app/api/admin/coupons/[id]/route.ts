import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupon = await prisma.coupon.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { usages: true } },
      usages: {
        take: 10,
        orderBy: { usedAt: "desc" },
        include: {
          user: { select: { fullName: true, email: true } },
          order: { select: { orderCode: true } },
        },
      },
    },
  });

  if (!coupon) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  return NextResponse.json({ coupon });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      code,
      label,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      courseIds,
      startsAt,
      expiresAt,
      isActive,
    } = body;

    const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    if (code && code.toUpperCase() !== existing.code) {
      const dup = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (dup) return NextResponse.json({ error: "Mã coupon đã tồn tại" }, { status: 409 });
    }

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (label !== undefined) updateData.label = label || null;
    if (type !== undefined) {
      if (type !== "PERCENT" && type !== "FIXED_AMOUNT") {
        return NextResponse.json({ error: "Loại coupon không hợp lệ" }, { status: 400 });
      }
      updateData.type = type;
    }
    if (value !== undefined) updateData.value = Number(value);
    if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount) || 0;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (usageLimit !== undefined) updateData.usageLimit = Number(usageLimit) || 0;
    if (courseIds !== undefined) updateData.courseIds = JSON.stringify(courseIds || []);
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
    if (expiresAt !== undefined) updateData.expiresAt = new Date(expiresAt);
    if (isActive !== undefined) updateData.isActive = isActive;

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ coupon });
  } catch (err) {
    console.error("[PUT /api/admin/coupons/[id]]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    await prisma.coupon.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/coupons/[id]]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}