// src/app/api/auth/simple-logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();

  // Limpiar todas las cookies de sesión de Traesol
  const traesolCookies = [
    "traesol-role",
    "traesol-email",
    "traesol-pending-email",
  ];
  
  for (const name of traesolCookies) {
    try {
      cookieStore.delete({ name, path: "/" });
    } catch {
      // Ignorar si ya no existe
    }
  }

  // Limpiar cookies de Supabase Auth
  // Las cookies de Supabase tienen prefijo "sb-" seguido del project ref
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (
      cookie.name.startsWith("sb-") ||
      cookie.name.includes("supabase") ||
      cookie.name.includes("auth-token")
    ) {
      try {
        cookieStore.delete({ name: cookie.name, path: "/" });
      } catch {
        // Ignorar errores de eliminación
      }
    }
  }

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
