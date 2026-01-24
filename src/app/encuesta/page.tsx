// src/app/encuesta/page.tsx
// Página pública para completar encuestas de satisfacción

import { Suspense } from "react";
import EncuestaCliente from "./_components/EncuestaCliente";

export const metadata = {
  title: "Encuesta de Satisfacción - Fundación Traesol",
  description: "Tu opinión es muy importante para nosotros",
};

export default function EncuestaPage() {
  return (
    <Suspense fallback={<EncuestaLoading />}>
      <EncuestaCliente />
    </Suspense>
  );
}

function EncuestaLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Cargando encuesta...</p>
      </div>
    </div>
  );
}
