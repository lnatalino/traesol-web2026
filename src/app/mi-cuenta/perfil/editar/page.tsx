// src/app/mi-cuenta/perfil/editar/page.tsx
// Página de edición completa del perfil de voluntario
// Incluye TODOS los campos requeridos para postular a operativos
// Usa el componente ProfileForm centralizado
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import BackButton from "@/components/BackButton";
import ProfileForm from "@/components/forms/ProfileForm";
import type { ProfileFormData } from "@/lib/schemas/profile";

function EditarPerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, loading: sessionLoading, refresh } = useSession();

  const handleSave = async (_data: ProfileFormData) => {
    // Refrescar sesión para que otros componentes vean los cambios
    await refresh();
    
    // Si hay returnTo, redirigir ahí
    if (returnTo) {
      router.push(returnTo);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Loading
  if (sessionLoading) {
    return (
      <main className="container">
        <div className="max-w-3xl mx-auto mt-12 px-4">
          <div className="card text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Sin sesión
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/mi-cuenta/login?next=/mi-cuenta/perfil/editar";
    }
    return null;
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <BackButton fallback="/mi-cuenta" />
        
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-2xl font-semibold text-slate-900">
              Editar mi perfil
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Completa todos los campos para poder postular a operativos. Los campos 
              marcados con <span className="text-red-500">*</span> son obligatorios 
              para participar en operativos.
            </p>
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

export default function EditarPerfilPage() {
  return (
    <Suspense fallback={
      <main className="container">
        <div className="max-w-3xl mx-auto mt-12 px-4">
          <div className="card text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    }>
      <EditarPerfilContent />
    </Suspense>
  );
}
