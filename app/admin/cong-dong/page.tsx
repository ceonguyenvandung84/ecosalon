import { MessagesSquare, FileText, Flag } from "lucide-react";
import { DashboardShell } from "@/components/admin/dashboard-shell";
import { adminFetch } from "@/lib/data";

interface ThreadItem {
  id: string;
  title: string;
  author?: { fullName?: string; name?: string } | null;
}

export default async function CongDongDashboard() {
  const [catData, threadData] = await Promise.all([
    adminFetch("/api/admin/forum-categories"),
    adminFetch("/api/admin/forum/threads?limit=5"),
  ]);
  const categories = (catData?.categories ?? []).length;
  const threadsArr = (threadData?.threads as ThreadItem[]) ?? [];
  const threads = threadData?.total ?? threadsArr.length;
  return (
    <DashboardShell
      title="Quản lý Cộng đồng"
      description="Diễn đàn, bài đăng, vi phạm"
      action={{ label: "Quản lý diễn đàn", href: "/admin/dien-dan" }}
      cards={[
        { label: "Chuyên mục", value: categories, icon: MessagesSquare, href: "/admin/dien-dan", color: "text-blue-600" },
        { label: "Bài đăng", value: threads, icon: FileText, href: "/admin/dien-dan", color: "text-indigo-600" },
        { label: "Báo cáo vi phạm", value: 0, icon: Flag, href: "/admin/dien-dan?tab=reports", color: "text-red-600" },
      ]}
      recent={[{
        label: "Bài đăng gần đây",
        viewAllHref: "/admin/dien-dan",
        items: threadsArr.map((t) => ({ id: t.id, primary: t.title, secondary: t.author?.fullName ?? t.author?.name ?? "Ẩn danh", href: "#" })),
        emptyText: "Chưa có bài đăng nào",
      }]}
    />
  );
}
