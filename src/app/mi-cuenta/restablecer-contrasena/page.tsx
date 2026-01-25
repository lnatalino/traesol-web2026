// src/app/mi-cuenta/restablecer-contrasena/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updatePassword } from "@/lib/userAuth";
import { createSupabaseBrowser } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

export default function RestablecerContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar que hay una sesión válida (desde el link de recovery)
    async function checkSession() {
      const supabase = createSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      setValidSession(!!session);
    }
    checkSession();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const result = await updatePassword(password);

    if (!result.success) {
      setError(result.error || "Error al actualizar contraseña");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirigir después de 2 segundos
    setTimeout(() => {
      router.push("/mi-cuenta");
    }, 2000);
  }

  if (validSession === null) {
    return (
      <main className="container">
        <div className="max-w-md mx-auto mt-12">
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

  if (validSession === false) {
    return (
      <main className="container">
        <BackButton fallback="/mi-cuenta/login" />

        <div className="max-w-md mx-auto mt-8">
          <div className="card text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="title mb-2">Enlace inválido o expirado</h1>
            <p className="text-slate-600 mb-4">
              El enlace de recuperación no es válido o ha expirado. 
              Solicita uno nuevo.
            </p>
            <Link href="/mi-cuenta/olvido-contrasena" className="btn-primary inline-flex">
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="container">
        <div className="max-w-md mx-auto mt-8">
          <div className="card text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="title mb-2">¡Contraseña actualizada!</h1>
            <p className="text-slate-600 mb-4">
              Tu contraseña ha sido actualizada correctamente. 
              Redirigiendo a tu cuenta...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <BackButton fallback="/mi-cuenta/login" />

      <div className="max-w-md mx-auto mt-8">
        <div className="card">
          <h1 className="title mb-2">Nueva contraseña</h1>
          <p className="subtitle mb-6">Ingresa tu nueva contraseña</p>

          {error && <div className="alert error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="label mb-1">Nueva contraseña</label>
              <input
                type="password"
                className="inp"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label mb-1">Confirmar contraseña</label>
              <input
                type="password"
                className="inp"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
