import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authLimiter } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const { allowed } = authLimiter(`signup:${ip}`);
    if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    const { email, password, fullName, refCode } = parsed.data;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký." },
        { status: 409 }
      );
    }

    // Resolve referral code to an approved affiliate (self-referral not allowed since user is new)
    let referredByAffiliateId: string | null = null;
    if (refCode) {
      const aff = await prisma.affiliate.findUnique({ where: { code: refCode } });
      if (aff && aff.status === "APPROVED") referredByAffiliateId = aff.id;
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashed, fullName, role: "USER", referredByAffiliateId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra, vui lòng thử lại." },
      { status: 500 }
    );
  }
}
