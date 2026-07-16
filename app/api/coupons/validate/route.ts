import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/enums";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const body = await req.json();
    const { code, courseId, subtotal } = body;

    if (!code) return NextResponse.json({ error: "Thiếu mã coupon" }, { status: 400 });
    if (!subtotal || subtotal <= 0) return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });

    const now = new Date();

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) return NextResponse.json({ error: "Mã coupon không tồn tại" }, { status: 404 });

    if (!coupon.isActive) return NextResponse.json({ error: "Mã coupon đã bị vô hiệu hóa" }, { status: 400 });

    if (now < coupon.startsAt) return NextResponse.json({ error: "Mã coupon chưa có hiệu lực" }, { status: 400 });

    if (now > coupon.expiresAt) return NextResponse.json({ error: "Mã coupon đã hết hạn" }, { status: 400 });

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Mã coupon đã hết lượt sử dụng" }, { status: 400 });
    }

    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json({
        error: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString("vi-VN")}đ để áp dụng mã này`,
      }, { status: 400 });
    }

    if (parseJsonArray(coupon.courseIds).length > 0 && courseId && !parseJsonArray(coupon.courseIds).includes(courseId)) {
      return NextResponse.json({ error: "Mã coupon không áp dụng cho khóa học này" }, { status: 400 });
    }

    let discount = 0;
    if (coupon.type === "PERCENT") {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(coupon.value, subtotal);
    }

    const newTotal = subtotal - discount;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      label: coupon.label,
      type: coupon.type,
      value: coupon.value,
      discount,
      newTotal,
      message: `Giảm ${discount.toLocaleString("vi-VN")}đ`,
    });
  } catch (err) {
    console.error("[POST /api/coupons/validate]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}