import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      course: { select: { title: true, slug: true } },
      template: true,
    },
  });

  if (!cert) return NextResponse.json({ error: "Không tìm thấy chứng chỉ" }, { status: 404 });
  if (cert.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ certificate: cert });
}