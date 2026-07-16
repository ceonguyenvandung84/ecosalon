import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.youtube.com https://i.ytimg.com https://*.amazonaws.com https://*.r2.cloudflarestorage.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "connect-src 'self' https://*.amazonaws.com https://*.r2.cloudflarestorage.com",
      "font-src 'self'",
      "media-src 'self' https://*.amazonaws.com https://*.r2.cloudflarestorage.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  return res;
}

async function isMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "maintenance_mode" },
      select: { value: true },
    });
    return setting?.value === "true";
  } catch {
    return false;
  }
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth?.token;
    const path = req.nextUrl.pathname;

    const isAdmin = token?.role === "ADMIN";
    const isMaintenance = await isMaintenanceMode();

    if (isMaintenance && !isAdmin && !path.startsWith("/admin") && path !== "/") {
      if (path !== "/maintenance") {
        return NextResponse.redirect(new URL("/maintenance", req.url));
      }
    }

    if (path.startsWith("/admin")) {
      if (!token || token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return addSecurityHeaders(NextResponse.next());
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/dang-nhap",
    },
  }
);

export const config = {
  matcher: [
    "/((?!/api/maintenance|_next/static|_next/image|favicon).*)",
  ],
};
