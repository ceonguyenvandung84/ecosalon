import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { certificateNumber: code },
    include: {
      user: { select: { fullName: true } },
      course: { select: { title: true, slug: true } },
    },
  });

  if (!cert) return NextResponse.json({ error: "Chứng chỉ không hợp lệ" }, { status: 404 });
  if (cert.isRevoked) return NextResponse.json({ error: "Chứng chỉ đã bị thu hồi" }, { status: 410 });

  return NextResponse.json({
    valid: true,
    studentName: cert.studentName,
    courseTitle: cert.courseTitle,
    issueDate: cert.issueDate,
    instructorName: cert.instructorName,
  });
}