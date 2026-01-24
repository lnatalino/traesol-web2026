// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ROLES = new Set(["superadmin", "admin", "editor", "viewer"]);

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

  const role = req.cookies.get("traesol-role")?.value || "";
  
  // Verificar si el rol está permitido
  if (!ALLOWED_ROLES.has(role)) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
