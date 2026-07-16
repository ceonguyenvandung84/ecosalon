"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4">
      <div className="text-8xl font-extrabold text-primary">404</div>
      <h1 className="font-sans text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Button asChild><Link href="/">Về trang chủ</Link></Button>
    </div>
  );
}