import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { generateOrderCode } from "@/lib/orders";
import { notifyAdmins } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";
import type { Coupon } from "@prisma/client";
import { parseJsonArray } from "@/lib/enums";

interface CourseOrderItem {
  courseId: string;
  price?: number;
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const {
      items = [],         // [{ courseId, price }]
      couponCode,
      customerName = "",
      customerPhone = "",
      customerEmail = "",
      paymentMethod = "BANK_QR",
    } = body as {
      items?: CourseOrderItem[];
      couponCode?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      paymentMethod?: string;
    };

    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên và số điện thoại." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Không có khóa học nào được chọn." }, { status: 400 });
    }

    // Validate each course
    const courseIds = (items as CourseOrderItem[]).map((it) => it.courseId).filter(Boolean);
    if (courseIds.length === 0) {
      return NextResponse.json({ error: "Danh sách khóa học không hợp lệ." }, { status: 400 });
    }

    const userId = user.id;

    // Fetch courses + check not already enrolled
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds }, isPublished: true },
    });

    if (courses.length !== courseIds.length) {
      return NextResponse.json({ error: "Một hoặc nhiều khóa học không hợp lệ." }, { status: 400 });
    }

    // Check not already enrolled
    const existingEnrollments = await prisma.enrollment.findMany({
      where: { userId, courseId: { in: courseIds } },
      select: { courseId: true },
    });
    const enrolledCourseIds = new Set(existingEnrollments.map((e) => e.courseId));
    const alreadyEnrolled = courseIds.filter((id: string) => enrolledCourseIds.has(id));
    if (alreadyEnrolled.length > 0) {
      return NextResponse.json({
        error: `Bạn đã đăng ký khóa học này rồi.`,
        alreadyEnrolled,
      }, { status: 400 });
    }

    // Build order items with snapshot
    let subtotal = 0;
    const orderItemsData = (items as CourseOrderItem[]).map((it) => {
      const course = courses.find((c) => c.id === it.courseId);
      if (!course) return null;
      const unitPrice = it.price ?? (course.discountPrice ?? course.price);
      const lineTotal = unitPrice;
      subtotal += lineTotal;
      return {
        itemType: "COURSE" as const,
        courseId: course.id,
        productTitle: course.title,
        productImage: course.thumbnailPath ?? null,
        unitPrice,
        quantity: 1,
        lineTotal,
      };
    }).filter((x): x is NonNullable<typeof x> => !!x);

    if (orderItemsData.length === 0) {
      return NextResponse.json({ error: "Không có khóa học hợp lệ." }, { status: 400 });
    }

    // Apply coupon if provided
    let discount = 0;
    let couponRecord: Coupon | null = null;

    if (couponCode) {
      const now = new Date();
      couponRecord = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (!couponRecord || !couponRecord.isActive || now < couponRecord.startsAt || now > couponRecord.expiresAt) {
        return NextResponse.json({ error: "Mã coupon không hợp lệ hoặc đã hết hạn." }, { status: 400 });
      }
      if (couponRecord.usageLimit > 0 && couponRecord.usedCount >= couponRecord.usageLimit) {
        return NextResponse.json({ error: "Mã coupon đã hết lượt sử dụng." }, { status: 400 });
      }
      if (subtotal < couponRecord.minOrderAmount) {
        return NextResponse.json({ error: `Đơn hàng tối thiểu ${couponRecord.minOrderAmount.toLocaleString("vi-VN")}đ.` }, { status: 400 });
      }
      if (parseJsonArray(couponRecord.courseIds).length > 0) {
        const applicableCourseIds = parseJsonArray(couponRecord.courseIds);
        const hasApplicable = orderItemsData.some((it) => applicableCourseIds.includes(it.courseId));
        if (!hasApplicable) return NextResponse.json({ error: "Mã coupon không áp dụng cho khóa học này." }, { status: 400 });
      }

      if (couponRecord.type === "PERCENT") {
        discount = Math.round((subtotal * couponRecord.value) / 100);
        if (couponRecord.maxDiscount && discount > couponRecord.maxDiscount) discount = couponRecord.maxDiscount;
      } else {
        discount = Math.min(couponRecord.value, subtotal);
      }
    }

    // For course orders, shipping fee = 0
    const shippingFee = 0;
    const total = subtotal - discount;

    // Generate unique order code
    let orderCode = generateOrderCode();
    for (let i = 0; i < 3; i++) {
      const exists = await prisma.order.findUnique({ where: { orderCode } });
      if (!exists) break;
      orderCode = generateOrderCode();
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderCode,
        userId,
        orderType: "COURSE",
        status: "PENDING_PAYMENT",
        subtotal,
        shippingFee,
        total,
        customerName: customerName.toString().trim(),
        customerPhone: customerPhone.toString().trim(),
        customerEmail: customerEmail ? customerEmail.toString().trim() : null,
        shippingAddress: "N/A", // courses don't ship
        paymentMethod: paymentMethod as "BANK_QR" | "VNPAY" | "MOMO",
        items: { create: orderItemsData },
      },
    });

    // Track coupon usage
    if (couponRecord && discount > 0) {
      await prisma.couponUsage.create({
        data: {
          couponId: couponRecord.id,
          userId,
          orderId: order.id,
          discount,
        },
      });
      await prisma.coupon.update({
        where: { id: couponRecord.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Notify admin
    await notifyAdmins({
      type: "ORDER_STATUS",
      title: "Đơn khóa học mới",
      message: `Đơn ${order.orderCode} - Khóa học (${formatPrice(total)}) vừa được đặt.`,
      link: `/admin/don-hang/${order.id}`,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderCode: order.orderCode,
      total,
      discount,
      items: orderItemsData,
    });
  } catch (e) {
    console.error("[POST /api/courses/order]", e);
    return NextResponse.json({ error: "Tạo đơn hàng thất bại." }, { status: 500 });
  }
}