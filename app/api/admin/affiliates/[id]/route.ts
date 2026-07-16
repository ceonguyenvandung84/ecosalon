import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const VALID = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        commissions: { orderBy: { createdAt: "desc" }, take: 100 },
        payouts: { orderBy: { createdAt: "desc" }, take: 100 },
        referredUsers: { select: { id: true, fullName: true, email: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 },
      },
    });
    if (!affiliate) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    return NextResponse.json({ affiliate });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const affiliate = await prisma.affiliate.findUnique({ where: { id: params.id } });
    if (!affiliate) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body?.status !== undefined) {
      const status = (body.status as string).toString();
      if (!VALID.includes(status)) return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
      data.status = status;
      if (status === "APPROVED" && !affiliate.approvedAt) data.approvedAt = new Date();
    }
    if (body?.commissionRate !== undefined) {
      const rate = Math.round(Number(body.commissionRate));
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) return NextResponse.json({ error: "Tỷ lệ hoa hồng không hợp lệ (0-100)." }, { status: 400 });
      data.commissionRate = rate;
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Không có thay đổi." }, { status: 400 });

    await prisma.affiliate.update({ where: { id: affiliate.id }, data });

    const newStatus = data.status as string | undefined;
    if (newStatus && newStatus !== affiliate.status) {
      const labels: Record<string, string> = {
        APPROVED: "đã được duyệt",
        REJECTED: "bị từ chối",
        SUSPENDED: "bị tạm khóa",
        PENDING: "đang chờ duyệt",
      };
      await createNotification({
        userId: affiliate.userId,
        type: "AFFILIATE_STATUS",
        title: "Cập nhật tài khoản tiếp thị",
        message: `Tài khoản tiếp thị liên kết của bạn ${labels[newStatus] ?? newStatus}.`,
        link: "/tiep-thi-lien-ket",
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Update affiliate error:", e);
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}
