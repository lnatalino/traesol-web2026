// src/app/api/auth/simple-logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();

  cookieStore.delete({ name: "traesol-role", path: "/" });
  cookieStore.delete({ name: "traesol-email", path: "/" });

  return NextResponse.redirect(new URL("/", req.url), 303);
}
