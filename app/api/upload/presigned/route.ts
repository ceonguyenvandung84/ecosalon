import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { putFile, resolveImageUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

// Chỉ cho phép upload ảnh (avatar, cover bài viết, ảnh sản phẩm/khóa học...)
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Chỉ chấp nhận file ảnh (jpg, png, webp, gif, svg)." },
        { status: 400 }
      );
    }
    const buf = await req.arrayBuffer();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const cloudStoragePath = `public/uploads/${safeName}`;
    await putFile(cloudStoragePath, buf, contentType);
    return NextResponse.json({ url: resolveImageUrl(cloudStoragePath), cloudStoragePath });
  } catch {
    return NextResponse.json({ error: "Không tải được file lên." }, { status: 500 });
  }
}

