import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import { parseJson, parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ fullName: slug }, { id: slug }],
        role: "INSTRUCTOR",
        isActive: true,
      },
      include: {
        instructorProfile: true,
        courses: {
          where: { isPublished: true },
          select: {
            id: true, title: true, slug: true, shortDesc: true,
            thumbnailPath: true, price: true, discountPrice: true,
            level: true, durationHours: true, studentsCount: true,
            _count: { select: { lessons: true, reviews: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên." }, { status: 404 });
    }

    const profile = user.instructorProfile;
    return NextResponse.json({
      instructor: {
        id: user.id,
        fullName: user.fullName,
        avatar: resolveImageUrl(user.avatarPath),
        bio: user.bio,
        profile: profile ? {
          title: profile.title,
          expertise: parseJsonArray(profile.expertise),
          education: profile.education,
          socialLinks: parseJson(profile.socialLinks, null),
          totalStudents: profile.totalStudents,
          totalRevenue: profile.totalRevenue,
          rating: profile.rating,
        } : null,
        courses: user.courses?.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          shortDesc: c.shortDesc,
          thumbnail: resolveImageUrl(c.thumbnailPath),
          price: c.price,
          discountPrice: c.discountPrice,
          level: c.level,
          durationHours: c.durationHours,
          studentsCount: c.studentsCount,
          lessonsCount: c._count?.lessons ?? 0,
          reviewsCount: c._count?.reviews ?? 0,
        })) ?? [],
      },
    });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
