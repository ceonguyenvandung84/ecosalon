import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

function escapeCsv(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: string[][], headers: string[]): string {
  return [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") ?? "";

  try {
    if (type === "customers") {
      const users = await prisma.user.findMany({
        where: { role: "USER" },
        orderBy: { createdAt: "desc" },
        select: { id: true, fullName: true, email: true, phone: true, isActive: true, createdAt: true, tags: true },
      });
      const headers = ["ID", "Họ tên", "Email", "SĐT", "Kích hoạt", "Ngày tạo", "Tags"];
      const rows = users.map((u) => [
        u.id, u.fullName, u.email, u.phone ?? "",
        u.isActive ? "Có" : "Không",
        u.createdAt.toISOString().split("T")[0] ?? "",
        parseJsonArray(u.tags).join("; "),
      ]);
      const csv = toCsv(rows, headers);
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="khach-hang.csv"' },
      });
    }

    if (type === "orders") {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, email: true } }, items: true },
      });
      const headers = ["Mã đơn", "Khách hàng", "Email", "Tổng tiền", "Trạng thái", "Ngày tạo", "Sản phẩm"];
      const rows = orders.map((o) => [
        o.orderCode,
        o.customerName,
        o.customerEmail ?? "",
        String(o.total),
        o.status,
        o.createdAt.toISOString().split("T")[0] ?? "",
        o.items.map((it) => it.productTitle).join("; "),
      ]);
      const csv = toCsv(rows, headers);
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="don-hang.csv"' },
      });
    }

    if (type === "products") {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: { category: { select: { name: true } }, brand: { select: { name: true } } },
      });
      const headers = ["ID", "Tên", "SKU", "Danh mục", "Thương hiệu", "Giá", "Giảm %", "Tồn kho", "Đã bán", "Hiển thị"];
      const rows = products.map((p) => [
        p.id, p.title, p.sku ?? "", p.category?.name ?? "", p.brand?.name ?? "",
        String(p.price), String(p.discountPercent), String(p.stock), String(p.soldCount),
        p.isPublished ? "Có" : "Không",
      ]);
      const csv = toCsv(rows, headers);
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="san-pham.csv"' },
      });
    }

    if (type === "courses") {
      const courses = await prisma.course.findMany({
        orderBy: { createdAt: "desc" },
        include: { category: { select: { name: true } }, _count: { select: { enrollments: true } } },
      });
      const headers = ["ID", "Tiêu đề", "Danh mục", "Giá", "Giá KM", "Cấp độ", "Học viên", "Hiển thị"];
      const rows = courses.map((c) => [
        c.id, c.title, c.category?.name ?? "", String(c.price),
        c.discountPrice ? String(c.discountPrice) : "", c.level,
        String(c._count.enrollments), c.isPublished ? "Có" : "Không",
      ]);
      const csv = toCsv(rows, headers);
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="khoa-hoc.csv"' },
      });
    }

    return NextResponse.json({ error: "Thiếu tham số type (customers|orders|products|courses)." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Xuất dữ liệu thất bại." }, { status: 500 });
  }
}
