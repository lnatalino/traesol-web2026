// src/app/api/auth/set-role-cookie/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = url.searchParams.get("role") || "volunteer";
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("traesol-role", role, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas (consistente con simple-login y otp/verify)
  });
  return res;
}
