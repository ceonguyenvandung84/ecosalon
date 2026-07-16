import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ids: [] });
  try {
    const items = await prisma.courseWishlist.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    });
    return NextResponse.json({ ids: items.map((i) => i.courseId) });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}