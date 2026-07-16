import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { CertificateDocument } from "@/components/certificate/certificate-pdf";
import type { CertField } from "@/lib/types";
import { parseJson } from "@/lib/enums";

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
  const stream = await renderToStream(
    React.createElement(CertificateDocument, {
      studentName: cert.studentName,
      courseTitle: cert.courseTitle,
      instructorName: cert.instructorName,
      issueDate: new Date(cert.issueDate).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      certificateNumber: cert.certificateNumber,
      verifyUrl,
      template: {
        backgroundPath: cert.template?.backgroundPath ?? null,
        fields: parseJson<CertField[]>(cert.template?.fields, []),
      },
    }) as unknown as React.ReactElement
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream as unknown as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${cert.certificateNumber}.pdf"`,
    },
  });
}