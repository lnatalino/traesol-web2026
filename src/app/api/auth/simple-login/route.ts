// src/app/api/auth/simple-login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRoute } from "@/lib/supabaseRoute";
import crypto from "node:crypto";

/**
 * Espera: email, password, next
 * Usa tabla admin_users { id, email, password_hash, role, enabled, force_password_change }
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/admin");

  if (!email || !password) {
    const u = new URL("/login", req.url);
    u.searchParams.set("error", "missing");
    u.searchParams.set("next", next);
    return NextResponse.redirect(u, 303);
  }

  // Hash SHA-256 (igual al seed que ya habíamos conversado)
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  const supabase = createSupabaseRoute();
  const { data: user, error } = await supabase
    .from("admin_users")
    .select("id, role, enabled, force_password_change")
    .eq("email", email)
    .eq("password_hash", hash)
    .maybeSingle();

  if (error) {
    const u = new URL("/login", req.url);
    u.searchParams.set("error", "unknown");
    u.searchParams.set("next", next);
    return NextResponse.redirect(u, 303);
  }

  if (!user || user.enabled === false) {
    const u = new URL("/login", req.url);
    u.searchParams.set("error", "invalid");
    u.searchParams.set("next", next);
    return NextResponse.redirect(u, 303);
  }

  // Si el usuario debe cambiar su contraseña, redirigir a esa página
  if (user.force_password_change) {
    const cookieStore = await cookies();
    // Guardar email temporalmente para el cambio de contraseña
    cookieStore.set("traesol-pending-email", email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutos
    });
    return NextResponse.redirect(new URL("/cambiar-contrasena", req.url), 303);
  }

  const cookieStore = await cookies();
  cookieStore.set("traesol-role", String(user.role || "viewer"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  cookieStore.set("traesol-email", email, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  const target = next.startsWith("/") ? next : "/admin";
  return NextResponse.redirect(new URL(target, req.url), 303);
}
