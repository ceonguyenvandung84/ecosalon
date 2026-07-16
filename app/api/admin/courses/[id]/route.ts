import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: { category: true, _count: { select: { lessons: true, enrollments: true } } },
    });
    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học." }, { status: 404 });
    }
    return NextResponse.json({ course });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (b?.title !== undefined) data.title = b.title;
    if (b?.shortDesc !== undefined) data.shortDesc = b.shortDesc;
    if (b?.description !== undefined) data.description = b.description;
    if (b?.thumbnailPath !== undefined) data.thumbnailPath = b.thumbnailPath || null;
    if (b?.thumbnailPublic !== undefined) data.thumbnailPublic = !!b.thumbnailPublic;
    if (b?.price !== undefined) data.price = parseInt(b.price as string, 10) || 0;
    if (b?.discountPrice !== undefined)
      data.discountPrice = b.discountPrice ? parseInt(b.discountPrice as string, 10) : null;
    if (b?.level !== undefined) data.level = b.level;
    if (b?.durationHours !== undefined) data.durationHours = parseInt(b.durationHours as string, 10) || 0;
    if (b?.instructorName !== undefined) data.instructorName = b.instructorName;
    if (b?.instructorBio !== undefined) data.instructorBio = b.instructorBio;
    if (b?.instructorId !== undefined) data.instructorId = b.instructorId || null;
    if (b?.categoryId !== undefined) data.categoryId = b.categoryId;
    if (b?.isPublished !== undefined) data.isPublished = !!b.isPublished;
    if (b?.isFeatured !== undefined) data.isFeatured = !!b.isFeatured;
    if (b?.metaTitle !== undefined) data.metaTitle = b.metaTitle || null;
    if (b?.metaDescription !== undefined) data.metaDescription = b.metaDescription || null;
    if (b?.ogImage !== undefined) data.ogImage = b.ogImage || null;
    if (b?.requirements !== undefined) data.requirements = JSON.stringify(Array.isArray(b.requirements) ? b.requirements : []);
    if (b?.objectives !== undefined) data.objectives = JSON.stringify(Array.isArray(b.objectives) ? b.objectives : []);
    if (b?.tags !== undefined) data.tags = JSON.stringify(Array.isArray(b.tags) ? b.tags : []);
    if (b?.prerequisiteIds !== undefined) data.prerequisiteIds = JSON.stringify(Array.isArray(b.prerequisiteIds) ? b.prerequisiteIds : []);
    await prisma.course.update({ where: { id: params.id }, data });
    await logActivity({ userId: admin.id, action: "UPDATE", entity: "Course", entityId: params.id, detail: `Cập nhật khóa học ${params.id}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await prisma.course.delete({ where: { id: params.id } });
    await logActivity({ userId: admin.id, action: "DELETE", entity: "Course", entityId: params.id, detail: `Xóa khóa học ${params.id}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Xóa thất bại." }, { status: 500 });
  }
}
