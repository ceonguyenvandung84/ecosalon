import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const token = (body?.token ?? "").toString();
    const password = (body?.password ?? "").toString();
    if (!token || !password) {
      return NextResponse.json({ error: "Thiếu thông tin." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự." },
        { status: 400 }
      );
    }
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expires < new Date()) {
      return NextResponse.json(
        { error: "Liên kết không hợp lệ hoặc đã hết hạn." },
        { status: 400 }
      );
    }
    const hashed = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
