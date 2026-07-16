import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/dang-nhap?callbackUrl=/admin");
  if ((session?.user as { role?: string })?.role !== "ADMIN") redirect("/");
  return (
    <div className="flex min-h-screen bg-secondary/30">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
