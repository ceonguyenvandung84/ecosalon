import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issueDate: "desc" },
    include: {
      course: { select: { id: true, title: true, slug: true } },
    },
  });

  return NextResponse.json({ certificates });
}