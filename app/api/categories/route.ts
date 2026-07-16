import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { CategoryType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    const where: Prisma.CategoryWhereInput = type === "COURSE" || type === "PRODUCT" ? { type: type as CategoryType } : {};
    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("GET /api/categories error:", e);
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
