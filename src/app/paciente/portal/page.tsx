// src/app/paciente/portal/page.tsx
// Página pública del portal del paciente con verificación de token

import { redirect } from "next/navigation";
import { verifyPortalToken } from "@/lib/quirurgico";
import { createPortalSession } from "@/lib/quirurgico/portalSession";
import { PortalInvalido } from "./_components/PortalInvalido";
import { PortalContenido } from "./_components/PortalContenido";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  searchParams: SearchParams;
}

export default async function PortalPacientePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  if (!token) {
    return <PortalInvalido mensaje="No se proporcionó un enlace de acceso válido." />;
  }

  // Verificar el token en el servidor
  const result = await verifyPortalToken(token);

  if (!result.valid || !result.pacienteId) {
    return <PortalInvalido mensaje={result.error || "Enlace inválido o expirado"} />;
  }

  // Crear sesión segura (cookie httpOnly)
  await createPortalSession(result.pacienteId);

  // Mostrar contenido del portal
  return <PortalContenido pacienteId={result.pacienteId} />;
}
