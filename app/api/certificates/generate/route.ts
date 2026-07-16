import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { courseId } = await req.json();
    if (!courseId) return NextResponse.json({ error: "Thiếu courseId" }, { status: 400 });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { fullName: true } },
        lessons: { where: { isPublished: true }, select: { id: true } },
      },
    });

    if (!course) return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });

    const existing = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (existing) return NextResponse.json({ certificate: existing });

    const completedCount = await prisma.lessonProgress.count({
      where: { userId: user.id, lessonId: { in: course.lessons.map((l) => l.id) }, completed: true },
    });

    if (course.lessons.length > 0 && completedCount < course.lessons.length) {
      return NextResponse.json({ error: "Chưa hoàn thành tất cả bài học" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (!enrollment) return NextResponse.json({ error: "Chưa đăng ký khóa học" }, { status: 400 });

    let template = await prisma.certificateTemplate.findFirst({ where: { isDefault: true, isActive: true } });
    if (!template) {
      template = await prisma.certificateTemplate.create({
        data: {
          title: "Mặc định",
          svgTemplate: "<svg>Default template</svg>",
          placeholder: JSON.stringify({}),
          isDefault: true,
          isActive: true,
        },
      });
    }

    const number = `CERT-${course.slug.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Date.now().toString(36).toUpperCase()}`;

    const certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        courseId,
        templateId: template.id,
        enrollmentId: enrollment.id,
        certificateNumber: number,
        studentName: user.fullName || user.name || user.email || "Học viên",
        courseTitle: course.title,
        instructorName: course.instructor?.fullName || null,
        completionDate: new Date(),
        metadata: JSON.stringify({}),
      },
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/certificates/generate]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}