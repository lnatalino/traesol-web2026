// src/app/api/auth/simple-logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();

  // Limpiar todas las cookies de sesión
  cookieStore.delete({ name: "traesol-role", path: "/" });
  cookieStore.delete({ name: "traesol-email", path: "/" });
  cookieStore.delete({ name: "traesol-pending-email", path: "/" });

  // Verificar si es una llamada AJAX o form submission
  const acceptHeader = req.headers.get("accept") || "";
  const isAjax = acceptHeader.includes("application/json") || 
                 req.headers.get("x-requested-with") === "XMLHttpRequest";

  if (isAjax) {
    // Retornar JSON para llamadas desde código
    return NextResponse.json({ success: true });
  }

  // Redirigir para form submissions directos
  return NextResponse.redirect(new URL("/", req.url), 303);
}
