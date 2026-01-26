// src/app/mi-cuenta/error.tsx
// Error boundary para rutas de Mi Cuenta - evita pantalla blanca
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MiCuentaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error para debugging
    console.error("[mi-cuenta/error]", error);
  }, [error]);

  return (
    <main className="container">
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="card text-center py-12">
          {/* Icono de error */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Algo salió mal
          </h1>
          
          <p className="text-slate-600 mb-6">
            Hubo un problema cargando esta página. Por favor intenta de nuevo.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="btn-primary"
            >
              Reintentar
            </button>
            
            <Link
              href="/mi-cuenta"
              className="btn-outline"
            >
              Ir a Mi cuenta
            </Link>
          </div>

          {/* Enlace a inicio si todo falla */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link 
              href="/" 
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
