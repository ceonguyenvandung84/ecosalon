import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";
import { sanitize, sanitizePlain } from "@/lib/sanitize";
import { apiLimiter } from "@/lib/rate-limit";
import { courseQuestionSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const questions = await prisma.courseQuestion.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, fullName: true, avatarPath: true } },
      _count: { select: { answers: true } },
      answers: { orderBy: { createdAt: "asc" }, take: 1, select: { id: true, content: true, createdAt: true, user: { select: { id: true, fullName: true } } } },
    },
  });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const { allowed } = apiLimiter(`qa:${ip}`);
  if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const parsed = courseQuestionSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    const question = await prisma.courseQuestion.create({
      data: { courseId: course.id, userId: user.id, title: sanitizePlain(parsed.data.title).trim(), content: sanitize(parsed.data.content).trim() },
      include: { user: { select: { id: true, fullName: true, avatarPath: true } } },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/courses/[slug]/questions]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}