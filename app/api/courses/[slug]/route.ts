import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import { getSessionUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        lessons: { orderBy: { order: "asc" } },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true, avatarPath: true } } },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học." }, { status: 404 });
    }
    const ratings = course.reviews ?? [];
    const avg =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + (r?.rating ?? 0), 0) / ratings.length
        : 0;

    let isEnrolled = false;
    const user = await getSessionUser();
    if (user) {
      const enr = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });
      isEnrolled = !!enr;
    }

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDesc: course.shortDesc,
        description: course.description,
        thumbnail: resolveImageUrl(course.thumbnailPath),
        price: course.price,
        discountPrice: course.discountPrice,
        level: course.level,
        durationHours: course.durationHours,
        instructorName: course.instructorName,
        instructorBio: course.instructorBio,
        instructorAvatar: resolveImageUrl(course.instructorAvatar),
        category: course.category?.name ?? "",
        categorySlug: course.category?.slug ?? "",
        studentsCount: course.studentsCount,
        rating: Math.round(avg * 10) / 10,
        reviewsCount: ratings.length,
        lessons: (course.lessons ?? []).map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          durationMin: l.durationMin,
          isPreview: l.isPreview,
        })),
        reviews: ratings.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          userName: r.user?.fullName ?? "Ẩn danh",
          createdAt: r.createdAt,
        })),
        isEnrolled,
      },
    });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
