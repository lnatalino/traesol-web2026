"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Calendar, MapPin } from "lucide-react";

type ApiResponse = {
  ok: boolean;
  error?: string;
  message?: string;
  already_responded?: boolean;
  current_estado?: string;
  operativo_id?: string;
  operativo_slug?: string;
  operativo_titulo?: string;
  requires_profile_completion?: boolean;
  token?: string;
};

function AceptarInvitacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "requires_profile">("loading");
  const [message, setMessage] = useState("");
  const [operativoTitulo, setOperativoTitulo] = useState<string | null>(null);
  const [operativoSlug, setOperativoSlug] = useState<string | null>(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No se proporcionó un token de invitación válido.");
      return;
    }

    async function processAcceptance() {
      try {
        const res = await fetch("/api/invitaciones/aceptar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data: ApiResponse = await res.json();

        if (data.requires_profile_completion) {
          // El usuario tiene cuenta pero perfil incompleto
          setStatus("requires_profile");
          setMessage(data.message || "Debes completar tu perfil antes de aceptar la invitación.");
          setOperativoTitulo(data.operativo_titulo || null);
          setPendingToken(data.token || token);
          return;
        }

        if (data.ok) {
          setStatus("success");
          setMessage(data.message || "¡Tu participación ha sido confirmada!");
          setOperativoTitulo(data.operativo_titulo || null);
          setOperativoSlug(data.operativo_slug || null);
          setAlreadyResponded(!!data.already_responded);

          // Redireccionar después de 3 segundos
          setTimeout(() => {
            const destination = data.operativo_slug
              ? `/operativos/${data.operativo_slug}`
              : "/operativos";
            router.push(destination);
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Ocurrió un error al procesar tu respuesta.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Error de conexión. Por favor, intenta nuevamente.");
      }
    }

    processAcceptance();
  }, [token, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="https://alohvwivubjhblpqunad.supabase.co/storage/v1/object/public/public-assets/logo-traesol.png"
              alt="Traesol"
              className="h-10 mx-auto"
            />
          </div>

          {/* Estado: Cargando */}
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Procesando tu respuesta...
              </h1>
              <p className="text-slate-600">
                Por favor espera un momento.
              </p>
            </>
          )}

          {/* Estado: Éxito */}
          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {alreadyResponded ? "Invitación ya procesada" : "¡Gracias por aceptar!"}
              </h1>
              <p className="text-slate-600 mb-4">{message}</p>
              
              {operativoTitulo && (
                <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">Te esperamos en:</p>
                  <p className="text-lg font-semibold text-slate-900">{operativoTitulo}</p>
                </div>
              )}

              <p className="text-sm text-slate-500">
                Serás redirigido automáticamente en unos segundos...
              </p>
              
              <a
                href={operativoSlug ? `/operativos/${operativoSlug}` : "/operativos"}
                className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Ir ahora →
              </a>
            </>
          )}

          {/* Estado: Requiere completar perfil */}
          {status === "requires_profile" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Completa tu perfil
              </h1>
              <p className="text-slate-600 mb-4">{message}</p>
              
              {operativoTitulo && (
                <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">Invitación pendiente para:</p>
                  <p className="text-lg font-semibold text-slate-900">{operativoTitulo}</p>
                </div>
              )}

              <div className="bg-amber-50 rounded-2xl p-4 mb-6 border border-amber-200">
                <p className="text-sm text-amber-800">
                  Para confirmar tu participación, necesitas completar los datos obligatorios de tu perfil: 
                  nombre, teléfono, RUT, talla de polera y restricciones alimentarias.
                </p>
              </div>
              
              <a
                href={`/mi-cuenta/perfil?redirect=/invitaciones/aceptar?token=${encodeURIComponent(pendingToken || "")}`}
                className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition"
              >
                Completar mi perfil
              </a>
            </>
          )}

          {/* Estado: Error */}
          {status === "error" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                No pudimos procesar tu respuesta
              </h1>
              <p className="text-slate-600 mb-6">{message}</p>
              
              <div className="space-y-3">
                <a
                  href="/operativos"
                  className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition"
                >
                  Ver operativos disponibles
                </a>
                <a
                  href="/contacto"
                  className="block w-full px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition"
                >
                  Contactar a Traesol
                </a>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Fundación Traesol · Transformando vidas
        </p>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="mb-6">
            <img
              src="https://alohvwivubjhblpqunad.supabase.co/storage/v1/object/public/public-assets/logo-traesol.png"
              alt="Traesol"
              className="h-10 mx-auto"
            />
          </div>
          <div className="flex justify-center mb-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Cargando...
          </h1>
        </div>
      </div>
    </main>
  );
}

export default function AceptarInvitacionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AceptarInvitacionContent />
    </Suspense>
  );
}
