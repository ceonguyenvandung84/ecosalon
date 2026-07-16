import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
    const where: Prisma.CertificateWhereInput = {};
    if (search) {
      where.OR = [
        { certificateNumber: { contains: search } },
        { studentName: { contains: search } },
        { courseTitle: { contains: search } },
      ];
    }
    const [total, certificates] = await Promise.all([
      prisma.certificate.count({ where }),
      prisma.certificate.findMany({
        where,
        orderBy: { issueDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
          template: true,
        },
      }),
    ]);
    return NextResponse.json({ certificates, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch {
    return NextResponse.json({ certificates: [] });
  }
}
