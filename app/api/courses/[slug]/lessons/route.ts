import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const user = await getSessionUser();
    const course = await prisma.course.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }

    const isEnrolled = user
      ? !!(await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
        }))
      : false;

    const lessons = await prisma.lesson.findMany({
      where: { courseId: course.id, isPublished: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        durationMin: true,
        isPreview: true,
        videoUrl: true,
        videoProvider: true,
        thumbnailPath: true,
      },
    });

    const progressMap: Record<string, boolean> = {};
    if (user && isEnrolled) {
      const completed = await prisma.lessonProgress.findMany({
        where: { userId: user.id, lessonId: { in: lessons.map((l) => l.id) }, completed: true },
        select: { lessonId: true },
      });
      for (const c of completed) progressMap[c.lessonId] = true;
    }

    const result = lessons.map((l) => ({
      ...l,
      canView: isEnrolled || l.isPreview,
      completed: progressMap[l.id] ?? false,
    }));

    return NextResponse.json({ lessons: result, isEnrolled });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
