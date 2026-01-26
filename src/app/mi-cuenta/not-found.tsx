// src/app/mi-cuenta/not-found.tsx
// 404 para rutas no encontradas en Mi Cuenta
import Link from "next/link";

export default function MiCuentaNotFound() {
  return (
    <main className="container">
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="card text-center py-12">
          {/* Icono */}
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>

          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Página no encontrada
          </h1>
          
          <p className="text-slate-600 mb-6">
            La página que buscas no existe o ha sido movida.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/mi-cuenta"
              className="btn-primary w-full justify-center"
            >
              Ir a Mi cuenta
            </Link>
            
            <Link
              href="/"
              className="btn-outline w-full justify-center"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
