import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ brands });
  } catch (e) {
    console.error("GET /api/brands error:", e);
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
