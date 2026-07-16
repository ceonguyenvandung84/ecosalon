import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ids: [] });
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      select: { productId: true },
    });
    return NextResponse.json({ ids: items.map((i) => i.productId) });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}
