// src/app/paciente/portal/page.tsx
// Página pública del portal del paciente con verificación de token

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
  try {
    const params = await searchParams;
    const token = typeof params.token === "string" ? params.token : null;

    if (!token) {
      return <PortalInvalido mensaje="No se proporcionó un enlace de acceso válido." />;
    }

    // Verificar el token en el servidor
    let result;
    try {
      result = await verifyPortalToken(token);
    } catch (verifyError) {
      console.error("[portal] verifyPortalToken error:", verifyError);
      return <PortalInvalido mensaje="Error al verificar el enlace. Por favor, intente más tarde." />;
    }

    if (!result.valid || !result.pacienteId) {
      return <PortalInvalido mensaje={result.error || "Enlace inválido o expirado"} />;
    }

    // Crear sesión segura (cookie httpOnly)
    try {
      await createPortalSession(result.pacienteId);
    } catch (sessionError) {
      console.error("[portal] createPortalSession error:", sessionError);
      // Continuar sin sesión, el cliente usará el token como fallback
    }

    // Mostrar contenido del portal, pasando el token para fallback
    return <PortalContenido pacienteId={result.pacienteId} portalToken={token} />;
  } catch (error) {
    // Capturar cualquier error no manejado para evitar pantalla blanca
    console.error("[portal] unhandled error:", error);
    return <PortalInvalido mensaje="Ocurrió un error inesperado. Por favor, contacte al equipo de Traesol." />;
  }
}
