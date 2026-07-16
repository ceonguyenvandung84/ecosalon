"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="text-7xl">⚠️</div>
      <h1 className="font-sans text-2xl font-bold">Lỗi trang quản trị</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Không thể tải trang quản trị. Vui lòng thử lại hoặc liên hệ bộ phận kỹ thuật nếu lỗi tiếp tục.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/admin")}>Về Dashboard</Button>
      </div>
    </div>
  );
}