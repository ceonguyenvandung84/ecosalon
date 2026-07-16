import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { apiLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const { allowed } = apiLimiter(`password:${ip}`);
  if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
    if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const currentPassword = (body?.currentPassword ?? "").toString();
    const newPassword = (body?.newPassword ?? "").toString();
    const confirmPassword = (body?.confirmPassword ?? "").toString();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ các trường." }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Mật khẩu xác nhận không khớp." }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "Mật khẩu mới phải khác mật khẩu hiện tại." }, { status: 400 });
    }

    const u = await prisma.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, u.password);
    if (!ok) return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: u.id },
      data: { password: hashed, passwordChangedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Đổi mật khẩu thất bại." }, { status: 500 });
  }
}