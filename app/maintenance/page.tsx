import { Construction } from "lucide-react";
import Link from "next/link";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-6">
          <Construction className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Đang bảo trì</h1>
        <p className="text-muted-foreground mb-6">
          Website đang được bảo trì. Vui lòng quay lại sau. Chúng tôi sẽ nhanh chóng trở lại!
        </p>
        <Link href="/">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Quay về trang chủ
          </button>
        </Link>
      </div>
    </div>
  );
}