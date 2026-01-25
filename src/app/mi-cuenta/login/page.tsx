// src/app/mi-cuenta/login/page.tsx
"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithEmailPassword } from "@/lib/userAuth";
import BackButton from "@/components/BackButton";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/mi-cuenta";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signInWithEmailPassword(email, password);

    if (!result.success) {
      setError(result.error || "Error al iniciar sesión");
      setLoading(false);
      return;
    }

    // Redirigir a la URL solicitada o a mi-cuenta
    const redirectTo = nextUrl.startsWith("/") ? nextUrl : "/mi-cuenta";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="container">
      <BackButton fallback="/" />
      
      <div className="max-w-md mx-auto mt-8">
        <div className="card">
          <h1 className="title mb-2">Iniciar sesión</h1>
          <p className="subtitle mb-6">Accede a tu cuenta de voluntario</p>

          {error && (
            <div className="alert error mb-4">{error}</div>
          )}

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

            <div>
              <label className="label mb-1">Contraseña</label>
              <input
                type="password"
                className="inp"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-center text-sm">
            <Link
              href="/mi-cuenta/olvido-contrasena"
              className="text-blue-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-slate-600">
            ¿No tienes cuenta?{" "}
            <Link
              href="/mi-cuenta/registro"
              className="text-blue-600 hover:underline font-medium"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginContent />
    </Suspense>
  );
}
