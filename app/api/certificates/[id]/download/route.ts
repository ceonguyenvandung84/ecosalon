import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";
import { parseJson } from "@/lib/enums";
import type { CertField } from "@/lib/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      course: { select: { title: true, slug: true } },
      template: { select: { backgroundPath: true, fields: true } },
    },
  });

  if (!cert) return NextResponse.json({ error: "Không tìm thấy chứng chỉ" }, { status: 404 });
  if (cert.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/certificate/verify/${cert.certificateNumber}`;
  const issueDate = new Date(cert.issueDate).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const fields = parseJson<CertField[]>(cert.template?.fields, []);
  const fieldRows = fields
    .map(
      (f) =>
        `<tr><td style="padding:6px 12px;border:1px solid #ddd">${f.label}</td><td style="padding:6px 12px;border:1px solid #ddd">${f.value}</td></tr>`
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Chứng chỉ ${cert.certificateNumber}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px}
.cert{border:2px solid #c9a14a;padding:32px;border-radius:12px}
h1{color:#7a5c13;text-align:center}
.meta{margin-top:24px}
table{width:100%;border-collapse:collapse;margin-top:16px}
.foot{margin-top:24px;color:#888;font-size:13px}
</style></head><body><div class="cert">
<h1>CHỨNG NHẬN HOÀN THÀNH</h1>
<p style="text-align:center">Chứng nhận ông/bà <b>${cert.studentName}</b> đã hoàn thành khóa học</p>
<h2 style="text-align:center">${cert.courseTitle}</h2>
<p style="text-align:center">Giảng viên: ${cert.instructorName}</p>
<div class="meta"><table><tr><td style="padding:6px 12px;border:1px solid #ddd">Số chứng chỉ</td><td style="padding:6px 12px;border:1px solid #ddd">${cert.certificateNumber}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #ddd">Ngày cấp</td><td style="padding:6px 12px;border:1px solid #ddd">${issueDate}</td></tr>${fieldRows}</table></div>
<div class="foot">Xác thực tại: <a href="${verifyUrl}">${verifyUrl}</a></div>
</div></body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="certificate-${cert.certificateNumber}.html"`,
    },
  });
}
