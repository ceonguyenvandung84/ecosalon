"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="text-7xl">⚠️</div>
      <h1 className="font-sans text-2xl font-bold">Đã có lỗi xảy ra</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Hệ thống gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại hoặc quay về trang chủ.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>Về trang chủ</Button>
      </div>
    </div>
  );
}