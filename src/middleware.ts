import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("localhost")) {
    const url = req.nextUrl.clone();
    url.host = "127.0.0.1" + host.slice("localhost".length);
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next|favicon|api/auth/callback).*)",
};
