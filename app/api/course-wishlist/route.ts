import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const items = await prisma.courseWishlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnailPath: true, price: true, discountPrice: true, category: { select: { name: true } }, instructorName: true },
        },
      },
    });
    const data = items.map((w) => ({
      id: w.id,
      courseId: w.courseId,
      course: {
        title: w.course?.title ?? "",
        slug: w.course?.slug ?? "",
        thumbnail: resolveImageUrl(w.course?.thumbnailPath),
        price: w.course?.price ?? 0,
        discountPrice: w.course?.discountPrice,
        category: w.course?.category?.name ?? "",
        instructorName: w.course?.instructorName ?? "",
      },
    }));
    return NextResponse.json({ wishlist: data });
  } catch {
    return NextResponse.json({ wishlist: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const courseId = (body?.courseId ?? "").toString();
    if (!courseId) return NextResponse.json({ error: "Thiếu courseId." }, { status: 400 });
    const existing = await prisma.courseWishlist.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (existing) {
      await prisma.courseWishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, inWishlist: false });
    }
    await prisma.courseWishlist.create({ data: { userId: user.id, courseId } });
    return NextResponse.json({ success: true, inWishlist: true });
  } catch {
    return NextResponse.json({ error: "Thao tác thất bại." }, { status: 500 });
  }
}