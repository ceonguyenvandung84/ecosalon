import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-log";
import { apiLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const { allowed } = apiLimiter(`admin-user:${ip}`);
  if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
    try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
    if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (b?.role === "USER" || b?.role === "ADMIN" || b?.role === "INSTRUCTOR") data.role = b.role;
    if (typeof b?.isActive === "boolean") data.isActive = b.isActive;
    // Prevent admin from deactivating/demoting themselves
    if (params.id === admin.id && (data.role === "USER" || data.isActive === false)) {
      return NextResponse.json({ error: "Không thể tự thay đổi quyền của chính mình." }, { status: 400 });
    }
    // Prevent removing the last admin
    const isDemotingAdmin = data.role === "USER" || data.isActive === false;
    if (isDemotingAdmin) {
      const otherAdmins = await prisma.user.count({
        where: { role: "ADMIN", id: { not: params.id }, isActive: true },
      });
      if (otherAdmins === 0) {
        return NextResponse.json({ error: "Không thể thay đổi. Hệ thống cần ít nhất một admin hoạt động." }, { status: 400 });
      }
    }
    await prisma.user.update({ where: { id: params.id }, data });
    await logActivity({ userId: admin.id, action: "UPDATE", entity: "User", entityId: params.id, detail: `Cập nhật người dùng ${params.id}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}
