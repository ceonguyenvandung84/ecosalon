import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { parseJson } from "@/lib/enums";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
        quiz: {
          select: { id: true, title: true, isPublished: true },
        },
      },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    const isEnrolled = user
      ? !!(await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
        }))
      : false;

    if (!isEnrolled && !lesson.isPreview) {
      return NextResponse.json({ error: "Bạn chưa đăng ký khóa học này" }, { status: 403 });
    }

    let completed = false;
    if (user && isEnrolled) {
      const lp = await prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      });
      completed = lp?.completed ?? false;
    }

    return NextResponse.json({
      ...lesson,
      attachments: parseJson(lesson.attachments, null),
      canView: true,
      completed,
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
