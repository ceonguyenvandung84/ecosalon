import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import { InstructorProfileClient } from "./client";
import { parseJson, parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function InstructorProfilePage({ params }: { params: { slug: string } }) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ fullName: params.slug }, { id: params.slug }],
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
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Không tìm thấy giảng viên.</div>;
  }

  const profile = user.instructorProfile;
  const instructor = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatar: resolveImageUrl(user.avatarPath),
    bio: user.bio,
    phone: user.phone,
    profile: profile ? {
      title: profile.title,
      expertise: parseJsonArray(profile.expertise),
      education: profile.education,
      socialLinks: parseJson<Record<string, string>>(profile.socialLinks, {}),
      totalStudents: profile.totalStudents,
      totalRevenue: profile.totalRevenue,
      rating: profile.rating,
    } : null,
    courses: (user.courses ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      shortDesc: c.shortDesc ?? undefined,
      thumbnail: resolveImageUrl(c.thumbnailPath),
      price: c.price,
      discountPrice: c.discountPrice ?? undefined,
      level: c.level ?? undefined,
      durationHours: c.durationHours ?? undefined,
      studentsCount: c.studentsCount,
      lessonsCount: c._count?.lessons ?? 0,
      reviewsCount: c._count?.reviews ?? 0,
    })),
  };

  return <InstructorProfileClient instructor={instructor} />;
}
