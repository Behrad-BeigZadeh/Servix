import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const refreshToken = req.cookies.get("refreshToken")?.value;

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

  if (refreshToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!refreshToken && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*"],
};
