import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const content = (body.content ?? "").toString().trim();
    if (!content) return NextResponse.json({ error: "Vui lòng nhập nội dung ghi chú" }, { status: 400 });
    if (content.length > 2000)
      return NextResponse.json({ error: "Ghi chú quá dài (tối đa 2000 ký tự)" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });

    const note = await prisma.customerNote.create({
      data: { userId: params.id, authorId: admin.id, content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ note });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
