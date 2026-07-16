import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { PAID_STATUSES, CUSTOMER_TAG_VALUES } from "@/lib/crm";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        bio: true,
        avatarPath: true,
        isActive: true,
        role: true,
        tags: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderCode: true,
            status: true,
            total: true,
            createdAt: true,
            items: { select: { id: true } },
          },
        },
        enrollments: {
          orderBy: { enrolledAt: "desc" },
          select: {
            id: true,
            progress: true,
            enrolledAt: true,
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        crmNotes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalSpent = user.orders
      .filter((o) => (PAID_STATUSES as unknown as string[]).includes(o.status))
      .reduce((s, o) => s + o.total, 0);
    const paidOrderCount = user.orders.filter((o) =>
      (PAID_STATUSES as unknown as string[]).includes(o.status)
    ).length;

    return NextResponse.json({
      customer: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatarPath ? resolveImageUrl(user.avatarPath) : "",
        isActive: user.isActive,
        role: user.role,
        tags: parseJsonArray(user.tags),
        createdAt: user.createdAt,
        totalSpent,
        paidOrderCount,
        orderCount: user.orders.length,
        enrollmentCount: user.enrollments.length,
        orders: user.orders.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          status: o.status,
          total: o.total,
          itemCount: o.items.length,
          createdAt: o.createdAt,
        })),
        enrollments: user.enrollments.map((e) => ({
          id: e.id,
          progress: e.progress,
          enrolledAt: e.enrolledAt,
          courseId: e.course?.id,
          courseTitle: e.course?.title,
          courseSlug: e.course?.slug,
        })),
        notes: user.crmNotes,
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const data: Record<string, unknown> = {};

    if (Array.isArray(body.tags)) {
      const tags = body.tags as unknown[];
      // keep only known + non-empty unique tag values
      const clean = Array.from(
        new Set(
          (tags.filter((t): t is string => typeof t === "string") as string[])
            .filter((t) => t.trim() && CUSTOMER_TAG_VALUES.includes(t))
        )
      );
      data.tags = JSON.stringify(clean);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, tags: true },
    });

    return NextResponse.json({ ok: true, tags: parseJsonArray(updated.tags) });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
