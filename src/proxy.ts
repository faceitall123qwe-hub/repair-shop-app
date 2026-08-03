import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Szybkie przekierowanie po obecności ciasteczka sesji.
// Właściwa walidacja sesji (DB) dzieje się w chronionym layoucie panelu.
export function proxy(req: NextRequest) {
  const isLogin = req.nextUrl.pathname === "/panel/login";
  const hasSession = req.cookies.has("serwis_session");
  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/panel/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/panel", "/panel/:path*"] };
