import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Vui lòng nhập email." }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success-like response to avoid email enumeration
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 30);
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expires },
      });
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/dat-lai-mat-khau?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
