import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { generatePresignedUploadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

// Chỉ cho phép upload ảnh (avatar, cover bài viết, ảnh sản phẩm/khóa học...)
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_FILENAME_LENGTH = 200;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const fileName = (body?.fileName ?? "file").toString().slice(0, MAX_FILENAME_LENGTH);
    const contentType = (body?.contentType ?? "application/octet-stream").toString();

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Chỉ chấp nhận file ảnh (jpg, png, webp, gif, svg)." },
        { status: 400 }
      );
    }

    // Marketing/profile assets are public
    const { uploadUrl, cloudStoragePath } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      true
    );
    return NextResponse.json({ uploadUrl, cloudStoragePath });
  } catch {
    return NextResponse.json({ error: "Không tạo được link tải lên." }, { status: 500 });
  }
}
