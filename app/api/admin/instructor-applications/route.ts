import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-log";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const page = parseInt(sp.get("page") || "1", 10);
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const [applications, total] = await Promise.all([
    prisma.instructorApplication.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.instructorApplication.count({ where }),
  ]);

  return NextResponse.json({
    applications: applications.map((a) => ({ ...a, expertise: parseJsonArray(a.expertise) })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, action, adminNote } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
    }

    const application = await prisma.instructorApplication.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
    }

    if (application.status !== "PENDING") {
      return NextResponse.json({ error: "Đơn này đã được xử lý" }, { status: 400 });
    }

    const updated = await prisma.instructorApplication.update({
      where: { id },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        adminNote: adminNote || null,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    if (action === "APPROVE") {
      await Promise.all([
        prisma.user.update({
          where: { id: application.userId },
          data: { role: "INSTRUCTOR" },
        }),
        prisma.instructorProfile.upsert({
          where: { userId: application.userId },
          create: {
            userId: application.userId,
            title: application.bio || "Giảng viên",
            expertise: application.expertise || "[]",
          },
          update: {
            title: application.bio || "Giảng viên",
            expertise: application.expertise || "[]",
          },
        }),
      ]);
    }

    await logActivity({
      userId: admin.id,
      action: "UPDATE",
      entity: "InstructorApplication",
      entityId: id,
      detail: `${action === "APPROVE" ? "Duyệt" : "Từ chối"} đơn ứng tuyển giảng viên của ${application.fullName} (${application.email})`,
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/instructor-applications]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}