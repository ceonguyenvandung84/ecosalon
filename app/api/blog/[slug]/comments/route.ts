import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { sanitize } from "@/lib/sanitize";
import { apiLimiter } from "@/lib/rate-limit";
import { blogCommentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const { allowed } = apiLimiter(`blog:${ip}`);
    if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const parsed = blogCommentSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    const content = sanitize(parsed.data.content).trim();

    const post = await prisma.blogPost.findFirst({ where: { slug: params.slug, isPublished: true }, select: { id: true, title: true, slug: true, authorId: true } });
    if (!post) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });

    const comment = await prisma.blogComment.create({
      data: { postId: post.id, userId: user.id, content },
      include: { user: { select: { fullName: true, avatarPath: true } } },
    });

    if (post.authorId && post.authorId !== user.id) {
      await createNotification({
        userId: post.authorId,
        type: "NEW_COMMENT",
        title: "Bình luận mới",
        message: `${user.name ?? "Một độc giả"} đã bình luận bài “${post.title}”.`,
        link: `/bai-viet/${post.slug}`,
      });
    }

    return NextResponse.json({ comment });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
