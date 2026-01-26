// src/app/mi-cuenta/perfil/page.tsx
// Página de perfil completo de voluntario - muestra formulario completo directamente
// con banner de advertencia sobre completar datos para poder postular
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import BackButton from "@/components/BackButton";
import ProfileForm from "@/components/forms/ProfileForm";
import { AlertTriangle, Info } from "lucide-react";
import type { ProfileFormData } from "@/lib/schemas/profile";

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, loading: sessionLoading, refresh } = useSession();

  const handleSave = async (_data: ProfileFormData) => {
    // Refrescar sesión para que otros componentes vean los cambios
    await refresh();
    
    // Si hay returnTo, redirigir ahí (ej: después de postular)
    if (returnTo) {
      router.push(returnTo);
    }
  };

  const handleCancel = () => {
    router.push("/mi-cuenta");
  };

  // Loading
  if (sessionLoading) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Sin sesión - redirigir a login
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/mi-cuenta/login?next=/mi-cuenta/perfil";
    }
    return (
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Redirigiendo...</h2>
            <p className="text-slate-600 mb-4">Te llevamos al inicio de sesión.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <BackButton fallback="/mi-cuenta" />
        
        {/* Banner de advertencia */}
        <div className="mt-6 mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                Es importante completar todos tus datos
              </h3>
              <p className="text-sm text-amber-800 mt-1">
                Para postular a operativos, necesitas tener tu perfil completo. Si faltan 
                datos obligatorios, <strong>no podrás postular ni ser convocado/a</strong> a 
                participar en nuestras actividades.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-2xl font-semibold text-slate-900">
              Mi perfil
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Completa tu información personal para participar en operativos. Los campos 
              marcados con <span className="text-red-500">*</span> son requeridos para postular.
            </p>
          </div>

          {/* Tip de información */}
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex gap-2 items-start">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Asegúrate de completar talla de polera, restricciones 
                alimentarias y tu profesión para que podamos coordinarte mejor en los operativos.
              </p>
            </div>
          </div>

          <div className="p-6">
            <ProfileForm
              userId={user.id}
              userEmail={user.email || ""}
              mode="edit"
              onSave={handleSave}
              onCancel={handleCancel}
              submitLabel={returnTo ? "Guardar y continuar" : "Guardar cambios"}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    }>
      <PerfilContent />
    </Suspense>
  );
}