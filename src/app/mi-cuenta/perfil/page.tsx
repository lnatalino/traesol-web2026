// src/app/mi-cuenta/perfil/page.tsx
"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserSession } from "@/lib/hooks/useUserSession";
import { updateUserProfile, formatRut, isValidRutFormat } from "@/lib/userAuth";
import BackButton from "@/components/BackButton";

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, profile, loading, refresh } = useUserSession();
  
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

  // Middleware ya valida autenticación - no redirigir aquí

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        birthdate: profile.birthdate || "",
        rut: profile.rut ? formatRut(profile.rut) : "",
      });
      // Si ya tiene RUT guardado, bloquearlo
      setRutLocked(!!profile.rut);
    }
  }, [profile]);

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

  if (loading) {
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

  // Si no hay usuario después de cargar, mostrar mensaje (no null)
  // El middleware debería haber redirigido, pero por si acaso
  if (!user) {
    return (
      <main className="container">
        <div className="max-w-md mx-auto mt-16 px-4">
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Sesión no encontrada</h2>
            <p className="text-slate-600 mb-4">Inicia sesión para acceder a tu perfil.</p>
            <a href="/mi-cuenta/login" className="btn-primary">
              Iniciar sesión
            </a>
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
          <h1 className="title mb-2">Mi perfil</h1>
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