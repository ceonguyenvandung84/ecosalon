import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { apiLimiter } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const { allowed } = apiLimiter(`review:${ip}`);
  if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    const { rating, comment, courseId, productId } = parsed.data;
    await prisma.review.create({
      data: {
        userId: user.id,
        type: courseId ? "COURSE" : "PRODUCT",
        courseId,
        productId,
        rating,
        comment: comment || null,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gửi đánh giá thất bại." }, { status: 500 });
  }
}
