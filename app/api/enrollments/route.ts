import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: {
          include: { category: true, _count: { select: { lessons: true } } },
        },
      },
    });
    const data = enrollments.map((e) => ({
      id: e.id,
      progress: e.progress,
      enrolledAt: e.enrolledAt,
      course: {
        title: e.course?.title ?? "",
        slug: e.course?.slug ?? "",
        thumbnail: resolveImageUrl(e.course?.thumbnailPath),
        instructorName: e.course?.instructorName ?? "",
        category: e.course?.category?.name ?? "",
        level: e.course?.level ?? "",
        lessonsCount: e.course?._count?.lessons ?? 0,
      },
    }));
    return NextResponse.json({ enrollments: data });
  } catch {
    return NextResponse.json({ enrollments: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const courseId = (body?.courseId ?? "").toString();
    if (!courseId) return NextResponse.json({ error: "Thiếu courseId." }, { status: 400 });
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: "Khóa học không tồn tại." }, { status: 404 });
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (existing) return NextResponse.json({ success: true, alreadyEnrolled: true });
    await prisma.$transaction([
      prisma.enrollment.create({ data: { userId: user.id, courseId } }),
      prisma.course.update({ where: { id: courseId }, data: { studentsCount: { increment: 1 } } }),
    ]);
    await createNotification({
      userId: user.id,
      type: "NEW_ENROLLMENT",
      title: "Ghi danh thành công",
      message: `Bạn đã ghi danh khóa học “${course.title}”.`,
      link: "/khoa-hoc-cua-toi",
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Đăng ký thất bại." }, { status: 500 });
  }
}
