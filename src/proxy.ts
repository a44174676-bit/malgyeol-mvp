import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 치료사 영역 보호 — 보호자 포털(/portal)과 로그인, 업로드 API는 제외
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/korean/portal") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/korean/upload") ||
    pathname.startsWith("/api/audio");

  if (isPublic) return NextResponse.next();

  const session = request.cookies.get("mg_session")?.value;
  if (session !== process.env.APP_PASSWORD) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:png|jpg|svg|ico|css|js)).*)"],
};
