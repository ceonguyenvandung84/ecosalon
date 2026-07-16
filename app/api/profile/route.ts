import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { sanitizePlain } from "@/lib/sanitize";
import { apiLimiter } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [enrollments, wishlist] = await Promise.all([
      prisma.enrollment.count({ where: { userId: u.id } }),
      prisma.wishlist.count({ where: { userId: u.id } }),
    ]);
    return NextResponse.json({
      profile: {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        phone: u.phone,
        bio: u.bio,
        avatar: resolveImageUrl(u.avatarPath),
        createdAt: u.createdAt,
        enrollmentsCount: enrollments,
        wishlistCount: wishlist,
      },
    });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const { allowed } = apiLimiter(`profile:${ip}`);
  if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
    if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const phoneRegex = /^0[1-9]\d{8,9}$/;
    const phone = (body?.phone as string | undefined);
    if (phone !== undefined && phone.trim() !== "" && !phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)." }, { status: 400 });
    }
    const fullName = (body?.fullName as string | undefined);
    if (fullName !== undefined && fullName.trim().length > 100) {
      return NextResponse.json({ error: "Họ tên quá dài (tối đa 100 ký tự)." }, { status: 400 });
    }
    const bio = (body?.bio as string | undefined);
    if (bio !== undefined && bio.trim().length > 500) {
      return NextResponse.json({ error: "Giới thiệu quá dài (tối đa 500 ký tự)." }, { status: 400 });
    }
    const data: Prisma.UserUpdateInput = {};
    if (fullName !== undefined && fullName.trim()) data.fullName = sanitizePlain(fullName.trim());
    if (phone !== undefined) data.phone = phone.trim() || null;
    if (bio !== undefined) data.bio = sanitizePlain(bio.trim()) || null;
    if (typeof body?.avatarPath === "string" && body.avatarPath)
      data.avatarPath = body.avatarPath;
    const u = await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({
      success: true,
      profile: { fullName: u.fullName, phone: u.phone, bio: u.bio, avatar: resolveImageUrl(u.avatarPath) },
    });
  } catch {
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}
