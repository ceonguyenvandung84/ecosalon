import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      select: { id: true, courseId: true },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    const isEnrolled = !!(await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
    }));
    if (!isEnrolled) {
      return NextResponse.json({ error: "Bạn chưa đăng ký khóa học này" }, { status: 403 });
    }

    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    });

    let result;
    if (existing) {
      result = await prisma.lessonProgress.update({
        where: { id: existing.id },
        data: {
          completed: !existing.completed,
          completedAt: !existing.completed ? new Date() : null,
        },
      });
    } else {
      result = await prisma.lessonProgress.create({
        data: {
          userId: user.id,
          lessonId: lesson.id,
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    const courseLessonIds = await prisma.lesson.findMany({
      where: { courseId: lesson.courseId, isPublished: true },
      select: { id: true },
    });
    const totalLessons = courseLessonIds.length;
    const lessonIds = courseLessonIds.map((l) => l.id);

    const completedLessons = await prisma.lessonProgress.count({
      where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
    });
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    await prisma.enrollment.updateMany({
      where: { userId: user.id, courseId: lesson.courseId },
      data: { progress },
    });

    if (progress === 100 && result.completed) {
      const existingCert = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
      });

      if (!existingCert) {
        const quizzes = await prisma.quiz.findMany({
          where: {
            isPublished: true,
            lesson: { courseId: lesson.courseId },
          },
          select: { id: true },
        });
        const quizIds = quizzes.map((q) => q.id);
        const hasPassedQuiz = quizIds.length > 0
          ? !!(await prisma.quizAttempt.findFirst({
              where: { userId: user.id, quizId: { in: quizIds }, passed: true },
            }))
          : true;

        if (!hasPassedQuiz) {
          return NextResponse.json({
            completed: result.completed,
            courseProgress: progress,
            message: "Bạn cần pass ít nhất một quiz để nhận chứng chỉ.",
          });
        }

        const course = await prisma.course.findUnique({
          where: { id: lesson.courseId },
          select: { title: true, slug: true, instructor: { select: { fullName: true } } },
        });

        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
        });

        let template = await prisma.certificateTemplate.findFirst({ where: { isDefault: true, isActive: true } });
        if (!template) {
          template = await prisma.certificateTemplate.create({
            data: { title: "Mặc định", svgTemplate: "<svg></svg>", placeholder: JSON.stringify({}), isDefault: true, isActive: true },
          });
        }

        if (course && enrollment) {
          const number = `CERT-${course.slug.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Date.now().toString(36).toUpperCase()}`;
          await prisma.certificate.create({
            data: {
              userId: user.id,
              courseId: lesson.courseId,
              templateId: template.id,
              enrollmentId: enrollment.id,
              certificateNumber: number,
              studentName: user.fullName || user.name || "Học viên",
              courseTitle: course.title,
              instructorName: course.instructor?.fullName || null,
              completionDate: new Date(),
              metadata: JSON.stringify({}),
            },
          });
        }
      }
    }

    return NextResponse.json({ completed: result.completed, courseProgress: progress });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}