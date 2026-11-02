import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/login", "/api/auth"];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (!session && !isPublic && !pathname.startsWith("/_next")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // RBAC route protection
  if (session) {
    const role = session.user?.role;
    // Admin only routes
    if (
      (pathname.startsWith("/users") ||
        pathname.startsWith("/audit-log") ||
        pathname.startsWith("/settings")) &&
      role !== "SYSTEM_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Laboratories route only for SYSTEM_ADMIN and LAB_ADMIN
    if (
      pathname.startsWith("/laboratories") &&
      role !== "SYSTEM_ADMIN" &&
      role !== "LAB_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
