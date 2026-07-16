import { GraduationCap, BookOpen, Brain, ScrollText } from "lucide-react";
import { DashboardShell } from "@/components/admin/dashboard-shell";
import { adminFetch } from "@/lib/data";

interface CourseItem {
  id: string;
  title: string;
  isPublished: boolean;
  category?: { name: string } | null;
}

export default async function DaoTaoDashboard() {
  const [statsData, coursesData] = await Promise.all([
    adminFetch("/api/admin/stats"),
    adminFetch("/api/admin/courses?limit=5"),
  ]);
  const s = statsData?.stats ?? {};
  const recentCourses = (coursesData?.courses as CourseItem[]) ?? [];
  return (
    <DashboardShell
      title="Quản lý Đào tạo"
      description="Khóa học, bài học, quiz & chứng chỉ"
      action={{ label: "Khóa học mới", href: "/admin/khoa-hoc" }}
      cards={[
        { label: "Khóa học", value: s.courses ?? 0, icon: GraduationCap, href: "/admin/khoa-hoc", color: "text-blue-600" },
        { label: "Bài học", value: s.lessons ?? 0, icon: BookOpen, href: "/admin/khoa-hoc", color: "text-indigo-600" },
        { label: "Quiz", value: s.quizzes ?? 0, icon: Brain, href: "/admin/quiz", color: "text-purple-600" },
        { label: "Chứng chỉ", value: s.certificates ?? 0, icon: ScrollText, href: "/admin/chung-chi", color: "text-green-600" },
      ]}
      recent={[{
        label: "Khóa học gần đây",
        viewAllHref: "/admin/khoa-hoc",
        items: recentCourses.map((c) => ({ id: c.id, primary: c.title, secondary: c.category?.name ?? "", href: `/admin/khoa-hoc/${c.id}`, badge: { text: c.isPublished ? "Hiển thị" : "Ẩn", variant: c.isPublished ? "default" : "secondary" as const } })),
        emptyText: "Chưa có khóa học nào",
      }]}
    />
  );
}
