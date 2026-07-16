"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="text-7xl">⚠️</div>
      <h1 className="font-sans text-2xl font-bold">Trang này gặp sự cố</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Chúng tôi đã ghi nhận lỗi. Hãy thử lại hoặc quay về trang chủ.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <Button variant="outline" asChild><Link href="/">Về trang chủ</Link></Button>
      </div>
    </div>
  );
}