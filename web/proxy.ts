import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "access_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/login/");

  if (!hasSession && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
