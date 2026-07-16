import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, _count: { select: { lessons: true, enrollments: true } } },
    });
    return NextResponse.json({
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        shortDesc: c.shortDesc,
        description: c.description,
        thumbnail: resolveImageUrl(c.thumbnailPath),
        thumbnailPath: c.thumbnailPath,
        price: c.price,
        discountPrice: c.discountPrice,
        level: c.level,
        durationHours: c.durationHours,
        category: c.category?.name ?? "",
        categoryId: c.categoryId,
        instructorName: c.instructorName,
        instructorBio: c.instructorBio,
        instructorId: c.instructorId,
        isPublished: c.isPublished,
        isFeatured: c.isFeatured,
        studentsCount: c.studentsCount,
        lessonsCount: c._count?.lessons ?? 0,
        metaTitle: c.metaTitle,
        metaDescription: c.metaDescription,
        ogImage: c.ogImage,
        requirements: parseJsonArray(c.requirements),
        objectives: parseJsonArray(c.objectives),
        tags: parseJsonArray(c.tags),
        prerequisiteIds: parseJsonArray(c.prerequisiteIds),
      })),
    });
  } catch {
    return NextResponse.json({ courses: [] });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    if (!b?.title || !b?.categoryId) {
      return NextResponse.json({ error: "Thiếu tiêu đề hoặc danh mục." }, { status: 400 });
    }
    let slug = slugify(b.title as string);
    const exists = await prisma.course.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString().slice(-5)}`;
    const course = await prisma.course.create({
      data: {
        title: b.title as string,
        slug,
        shortDesc: (b.shortDesc as string) ?? "",
        description: (b.description as string) ?? "",
        thumbnailPath: (b.thumbnailPath as string | null) ?? null,
        price: parseInt((b.price as string) ?? "0", 10) || 0,
        discountPrice: b.discountPrice ? parseInt(b.discountPrice as string, 10) : null,
        level: (b.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") ?? "BEGINNER",
        durationHours: parseInt((b.durationHours as string) ?? "0", 10) || 0,
        instructorName: (b.instructorName as string) ?? "SALON HAIR SYSTEM",
        instructorBio: (b.instructorBio as string | null) ?? null,
        instructorId: (b.instructorId as string | null) || null,
        categoryId: b.categoryId as string,
        isPublished: (b.isPublished as boolean) ?? true,
        isFeatured: (b.isFeatured as boolean) ?? false,
        metaTitle: (b.metaTitle as string | null) ?? null,
        metaDescription: (b.metaDescription as string | null) ?? null,
        ogImage: (b.ogImage as string | null) ?? null,
        requirements: JSON.stringify(Array.isArray(b.requirements) ? b.requirements : []),
        objectives: JSON.stringify(Array.isArray(b.objectives) ? b.objectives : []),
        tags: JSON.stringify(Array.isArray(b.tags) ? b.tags : []),
        prerequisiteIds: JSON.stringify(Array.isArray(b.prerequisiteIds) ? b.prerequisiteIds : []),
      },
    });
    await logActivity({ userId: admin.id, action: "CREATE", entity: "Course", entityId: course.id, detail: `Tạo khóa học "${course.title}"` });
    return NextResponse.json({ success: true, id: course.id });
  } catch {
    return NextResponse.json({ error: "Tạo khóa học thất bại." }, { status: 500 });
  }
}
