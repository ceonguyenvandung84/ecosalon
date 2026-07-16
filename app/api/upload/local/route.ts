import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOC_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip", "application/x-zip-compressed", "text/plain", "text/csv"];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES];
const MAX_SIZE = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Thiếu file." }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Chỉ chấp nhận ảnh, PDF, DOC, Excel, ZIP, TXT, CSV." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File tối đa 20MB." }, { status: 400 });

    const ext = path.extname(file.name) || ".jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeName), buffer);

    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch {
    return NextResponse.json({ error: "Upload thất bại." }, { status: 500 });
  }
}
