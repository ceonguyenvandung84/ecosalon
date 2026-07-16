import { ShoppingBag, FolderTree, Tags, ClipboardList } from "lucide-react";
import { DashboardShell } from "@/components/admin/dashboard-shell";
import { adminFetch } from "@/lib/data";

interface OrderItem {
  id: string;
  orderCode: string;
  status: string;
  user?: { fullName?: string; email?: string } | null;
}

export default async function BanHangDashboard() {
  const [statsData, catData, brandData, ordersData] = await Promise.all([
    adminFetch("/api/admin/stats"),
    adminFetch("/api/admin/categories"),
    adminFetch("/api/admin/brands"),
    adminFetch("/api/admin/orders?limit=5"),
  ]);
  const s = statsData?.stats ?? {};
  const products = s.products ?? 0;
  const categories = (catData?.categories ?? []).length;
  const brands = (brandData?.brands ?? []).length;
  const ordersArr = (ordersData?.orders as OrderItem[]) ?? [];
  const orders = ordersData?.total ?? ordersArr.length;
  const ordersPending = ordersArr.filter((o) => o.status === "PENDING_PAYMENT").length;
  return (
    <DashboardShell
      title="Quản lý Bán hàng"
      description="Sản phẩm, danh mục, thương hiệu & đơn hàng"
      action={{ label: "Sản phẩm mới", href: "/admin/san-pham" }}
      cards={[
        { label: "Sản phẩm", value: products, icon: ShoppingBag, href: "/admin/san-pham", color: "text-blue-600" },
        { label: "Danh mục", value: categories, icon: FolderTree, href: "/admin/danh-muc", color: "text-emerald-600" },
        { label: "Thương hiệu", value: brands, icon: Tags, href: "/admin/thuong-hieu", color: "text-amber-600" },
        { label: "Đơn hàng", value: orders, icon: ClipboardList, href: "/admin/don-hang", color: "text-purple-600", badge: ordersPending > 0 ? `${ordersPending} chờ` : undefined },
      ]}
      recent={[{
        label: "Đơn hàng gần đây",
        viewAllHref: "/admin/don-hang",
        items: ordersArr.map((o) => ({ id: o.id, primary: o.orderCode, secondary: o.user?.fullName ?? o.user?.email ?? "", href: `/admin/don-hang/${o.id}`, badge: { text: o.status } })),
        emptyText: "Chưa có đơn hàng nào",
      }]}
    />
  );
}
