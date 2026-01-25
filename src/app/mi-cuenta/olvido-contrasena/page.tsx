// src/app/mi-cuenta/olvido-contrasena/page.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/userAuth";
import BackButton from "@/components/BackButton";

export default function OlvidoContrasenaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestPasswordReset(email);

    if (!result.success) {
      setError(result.error || "Error al solicitar recuperación");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="container">
        <BackButton fallback="/mi-cuenta/login" />

        <div className="max-w-md mx-auto mt-8">
          <div className="card text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="title mb-2">Revisa tu correo</h1>
            <p className="text-slate-600 mb-4">
              Si existe una cuenta con el email <strong>{email}</strong>, 
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link href="/mi-cuenta/login" className="btn-primary inline-flex">
              Volver al login
            </Link>
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
          <h1 className="title mb-2">Recuperar contraseña</h1>
          <p className="subtitle mb-6">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>

          {error && <div className="alert error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="label mb-1">Email</label>
              <input
                type="email"
                className="inp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-center text-sm text-slate-600">
            ¿Recordaste tu contraseña?{" "}
            <Link
              href="/mi-cuenta/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
