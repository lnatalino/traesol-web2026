"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, Loader2, HeartHandshake } from "lucide-react";

type ApiResponse = {
  ok: boolean;
  error?: string;
  message?: string;
  already_responded?: boolean;
  current_estado?: string;
};

function RechazarInvitacionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No se proporcionó un token de invitación válido.");
      return;
    }

    async function processRejection() {
      try {
        const res = await fetch("/api/invitaciones/rechazar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data: ApiResponse = await res.json();

        if (data.ok) {
          setStatus("success");
          setMessage(data.message || "Has rechazado la invitación.");
          setAlreadyResponded(!!data.already_responded);
        } else {
          setStatus("error");
          setMessage(data.error || "Ocurrió un error al procesar tu respuesta.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Error de conexión. Por favor, intenta nuevamente.");
      }
    }

    processRejection();
  }, [token]);

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

          {/* Estado: Éxito (rechazado) */}
          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <HeartHandshake className="h-10 w-10 text-slate-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {alreadyResponded ? "Invitación ya procesada" : "Entendemos"}
              </h1>
              <p className="text-slate-600 mb-6">{message}</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-200">
                <p className="text-slate-600 text-sm">
                  Siempre hay más oportunidades para sumarte. 
                  Te invitamos a explorar otros operativos o mantenerte al tanto de nuestras novedades.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href="/operativos"
                  className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition"
                >
                  Ver otros operativos
                </a>
                <a
                  href="/"
                  className="block w-full px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition"
                >
                  Ir al inicio
                </a>
              </div>
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

export default function RechazarInvitacionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RechazarInvitacionContent />
    </Suspense>
  );
}
