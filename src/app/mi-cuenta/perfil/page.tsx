// src/app/mi-cuenta/perfil/page.tsx
"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { updateUserProfile, formatRut, isValidRutFormat } from "@/lib/userAuth";
import BackButton from "@/components/BackButton";
import { createSupabaseBrowser } from "@/lib/supabase";

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, profile, loading, refresh } = useSession();
  
  // Necesitamos los datos completos del perfil (el contexto solo tiene firstName/lastName)
  const [fullProfile, setFullProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    birthdate: string | null;
    rut: string | null;
  } | null>(null);
  
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    birthdate: "",
    rut: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rutLocked, setRutLocked] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Cargar perfil completo desde DB
  useEffect(() => {
    async function loadFullProfile() {
      if (!user?.id) return;
      
      setLoadingProfile(true);
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, phone, birthdate, rut")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setFullProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          birthdate: data.birthdate || "",
          rut: data.rut ? formatRut(data.rut) : "",
        });
        setRutLocked(!!data.rut);
      }
      setLoadingProfile(false);
    }
    
    if (user) {
      loadFullProfile();
    }
  }, [user]);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleRutBlur() {
    if (form.rut && !rutLocked) {
      setField("rut", formatRut(form.rut));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validar RUT si se proporciona
    if (form.rut && !rutLocked && !isValidRutFormat(form.rut)) {
      setError("El formato del RUT no es válido");
      return;
    }

    setSaving(true);

    const updates: Parameters<typeof updateUserProfile>[0] = {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      birthdate: form.birthdate || null,
    };

    // Solo incluir RUT si no estaba bloqueado y se proporciona
    if (!rutLocked && form.rut) {
      updates.rut = form.rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
    }

    const result = await updateUserProfile(updates);

    if (!result.success) {
      setError(result.error || "Error al guardar");
      setSaving(false);
      return;
    }

    setSaving(false);
    await refresh();

    // Si se guardó RUT, bloquearlo
    if (!rutLocked && form.rut) {
      setRutLocked(true);
    }

    // Si hay returnTo, redirigir después de guardar
    if (returnTo) {
      router.push(returnTo);
    } else {
      setSuccess("Perfil actualizado correctamente");
    }
  }

  // Loading solo si no tenemos datos SSR
  if (loadingProfile && !fullProfile) {
    return (
      <main className="container">
        <div className="max-w-lg mx-auto mt-12">
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

  // Si no hay usuario, redirigir a login
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/mi-cuenta/login?next=/mi-cuenta/perfil";
    }
    return (
      <main className="container">
        <div className="max-w-md mx-auto mt-16 px-4">
          <div className="card text-center py-12">
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
    <main className="container">
      <BackButton fallback="/mi-cuenta" />

      <div className="max-w-lg mx-auto mt-8">
        <div className="card">
          <div className="flex items-start justify-between mb-2">
            <h1 className="title">Mi perfil</h1>
            <a
              href="/mi-cuenta/perfil/editar"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar completo
            </a>
          </div>
          <p className="subtitle mb-6">Actualiza tu información personal</p>

          {error && <div className="alert error mb-4">{error}</div>}
          {success && <div className="alert success mb-4">{success}</div>}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1">Nombre</label>
                <input
                  type="text"
                  className="inp"
                  value={form.first_name}
                  onChange={(e) => setField("first_name", e.target.value)}
                  placeholder="Juan"
                  required
                />
              </div>
              <div>
                <label className="label mb-1">Apellido</label>
                <input
                  type="text"
                  className="inp"
                  value={form.last_name}
                  onChange={(e) => setField("last_name", e.target.value)}
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label mb-1">Email</label>
              <input
                type="email"
                className="inp bg-slate-50"
                value={user.email || ""}
                disabled
                readOnly
              />
              <p className="text-xs text-slate-500 mt-1">
                El email no puede ser modificado
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  className="inp"
                  value={form.birthdate}
                  onChange={(e) => setField("birthdate", e.target.value)}
                />
              </div>
              <div>
                <label className="label mb-1">
                  RUT {rutLocked && <span className="text-slate-400">(bloqueado)</span>}
                </label>
                <input
                  type="text"
                  className={`inp ${rutLocked ? "bg-slate-50" : ""}`}
                  value={form.rut}
                  onChange={(e) => !rutLocked && setField("rut", e.target.value)}
                  onBlur={handleRutBlur}
                  placeholder="12.345.678-9"
                  disabled={rutLocked}
                  readOnly={rutLocked}
                />
                {rutLocked && (
                  <p className="text-xs text-slate-500 mt-1">
                    El RUT no puede ser modificado una vez guardado
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="label mb-1">Teléfono</label>
              <input
                type="tel"
                className="inp"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-600 mb-3">
              ¿Quieres postular a operativos? Completa tu perfil con todos los 
              datos requeridos (talla, restricciones alimentarias, profesión, etc.)
            </p>
            <a
              href="/mi-cuenta/perfil/editar"
              className="btn-secondary w-full justify-center"
            >
              Completar perfil para operativos →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <PerfilContent />
    </Suspense>
  );
}