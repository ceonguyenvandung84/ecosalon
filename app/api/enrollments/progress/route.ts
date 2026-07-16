import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnailPath: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    if (enrollments.length === 0) {
      return NextResponse.json([]);
    }

    const courseIds = enrollments.map((e) => e.courseId);
    const lessons = await prisma.lesson.findMany({
      where: { courseId: { in: courseIds }, isPublished: true },
      select: { id: true, courseId: true },
    });

    const lessonIds = lessons.map((l) => l.id);
    const progressRecords = await prisma.lessonProgress.findMany({
      where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
      select: { lessonId: true },
    });

    const completedLessonIds = new Set(progressRecords.map((p) => p.lessonId));
    const lessonsByCourse = new Map<string, string[]>();
    for (const lesson of lessons) {
      const existing = lessonsByCourse.get(lesson.courseId) || [];
      existing.push(lesson.id);
      lessonsByCourse.set(lesson.courseId, existing);
    }

    const result = enrollments.map((e) => {
      const courseLessonIds = lessonsByCourse.get(e.courseId) || [];
      const totalLessons = courseLessonIds.length;
      const completedLessons = courseLessonIds.filter((id) => completedLessonIds.has(id)).length;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return { ...e, totalLessons, completedLessons, progress };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}