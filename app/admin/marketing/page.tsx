import { Tag, FileText, Bell } from "lucide-react";
import { DashboardShell } from "@/components/admin/dashboard-shell";
import { adminFetch } from "@/lib/data";

interface PostItem {
  id: string;
  title: string;
  isPublished: boolean;
  category?: { name: string } | null;
}

export default async function MarketingDashboard() {
  const [couponData, blogData, notifData] = await Promise.all([
    adminFetch("/api/admin/coupons"),
    adminFetch("/api/admin/blog?limit=5"),
    adminFetch("/api/admin/notifications"),
  ]);
  const coupons = (couponData?.coupons ?? []).length;
  const posts = (blogData?.posts as PostItem[]) ?? [];
  const blogPosts = blogData?.total ?? posts.length;
  const notifications = (notifData?.notifications ?? []).length;
  return (
    <DashboardShell
      title="Marketing & Nội dung"
      description="Mã giảm giá, blog, thông báo"
      action={{ label: "Mã giảm giá mới", href: "/admin/ma-giam-gia" }}
      cards={[
        { label: "Mã giảm giá", value: coupons, icon: Tag, href: "/admin/ma-giam-gia", color: "text-rose-600" },
        { label: "Bài viết Blog", value: blogPosts, icon: FileText, href: "/admin/bai-viet", color: "text-blue-600" },
        { label: "Thông báo", value: notifications, icon: Bell, href: "/admin/thong-bao", color: "text-amber-600" },
      ]}
      recent={[{
        label: "Bài viết gần đây",
        viewAllHref: "/admin/bai-viet",
        items: posts.map((p) => ({ id: p.id, primary: p.title, secondary: p.category?.name ?? "", href: `/admin/bai-viet`, badge: { text: p.isPublished ? "Đã đăng" : "Nháp", variant: p.isPublished ? "default" : "secondary" as const } })),
        emptyText: "Chưa có bài viết nào",
      }]}
    />
  );
}
