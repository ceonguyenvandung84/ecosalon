"use client";

import { useEffect, useState, use } from "react";
import { Loader2, Award, CheckCircle2, XCircle } from "lucide-react";

export default function CertificateVerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<{ studentName: string; courseTitle: string; issueDate: string; instructorName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/certificates/verify/${code}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) { setError(data.error); } else { setData(data); }
      })
      .catch(() => setError("Không thể kết nối"))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : error ? (
        <div className="max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
          <h1 className="font-sans text-2xl font-bold mb-2">Chứng chỉ không hợp lệ</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : !data ? null : (
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="font-sans text-2xl font-bold mb-1">Chứng chỉ hợp lệ</h1>
          <Award className="mx-auto my-6 h-20 w-20 text-primary" />
          <p className="text-lg font-semibold">{data.studentName}</p>
          <p className="text-muted-foreground mb-4">đã hoàn thành khóa học</p>
          <p className="text-xl font-bold text-primary mb-4">{data.courseTitle}</p>
          <p className="text-sm text-muted-foreground">
            Cấp ngày: {new Date(data.issueDate).toLocaleDateString("vi-VN")}
            {data.instructorName && <> &middot; Giảng viên: {data.instructorName}</>}
          </p>
        </div>
      )}
    </div>
  );
}