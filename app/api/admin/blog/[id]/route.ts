import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ post });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = (body.title as string).toString().trim();
    if (body.excerpt !== undefined) data.excerpt = (body.excerpt as string).toString().trim();
    if (body.content !== undefined) data.content = (body.content as string).toString().trim();
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
    if (body.isPublished !== undefined) data.isPublished = !!body.isPublished;
    if (body.isFeatured !== undefined) data.isFeatured = !!body.isFeatured;

    const post = await prisma.blogPost.update({ where: { id: params.id }, data });
    return NextResponse.json({ post });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    await prisma.blogPost.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
