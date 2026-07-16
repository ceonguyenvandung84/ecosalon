"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function CertificatesPage() {
  const { data: session } = useSession();
  const [certs, setCerts] = useState<Array<{ id: string; courseTitle: string; issueDate: string; certificateNumber: string; isRevoked: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/certificates`)
      .then((r) => r.json())
      .then((d) => setCerts(d?.certificates ?? []))
      .catch(() => toast.error("Không tải được chứng chỉ"))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Award className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-sans text-2xl font-bold">Chứng chỉ của tôi</h1>
          <p className="text-sm text-muted-foreground">Chứng chỉ đã đạt được từ các khóa học.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : certs.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground rounded-xl border border-dashed">
          <Award className="mb-3 h-12 w-12" />
          <p className="font-medium">Chưa có chứng chỉ nào</p>
          <p className="text-sm mt-1">Hoàn thành khóa học để nhận chứng chỉ.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/khoa-hoc">Xem khóa học</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khóa học</TableHead>
                <TableHead>Ngày cấp</TableHead>
                <TableHead>Mã chứng chỉ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.courseTitle}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(c.issueDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.certificateNumber}</TableCell>
                  <TableCell>
                    {c.isRevoked ? (
                      <Badge variant="secondary">Đã thu hồi</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Hợp lệ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/api/certificates/${c.id}/download`} target="_blank" download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}