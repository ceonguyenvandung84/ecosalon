import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/enums";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const body = await req.json();
    const { bio, expertise, experience, motivation } = body;

    if (!bio || !expertise || !experience) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin bắt buộc." }, { status: 400 });
    }

    const existingApp = await prisma.instructorApplication.findUnique({
      where: { userId: user.id },
    });

    if (existingApp && existingApp.status === "PENDING") {
      return NextResponse.json({ error: "Đơn ứng tuyển của bạn đang chờ được duyệt." }, { status: 400 });
    }

    const application = await prisma.instructorApplication.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        email: user.email || "",
        fullName: user.fullName || "",
        bio: bio || null,
        expertise: JSON.stringify(expertise || []),
        experience: experience || null,
        motivation: motivation || null,
        status: "PENDING",
      },
      update: {
        bio: bio || null,
        expertise: JSON.stringify(expertise || []),
        experience: experience || null,
        motivation: motivation || null,
        status: "PENDING",
        adminNote: null,
        reviewedBy: null,
        reviewedAt: null,
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (err) {
    console.error("[POST /api/instructor/apply]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const application = await prisma.instructorApplication.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({ application: application ? { ...application, expertise: parseJsonArray(application.expertise) } : null });
}