// src/app/mi-cuenta/login/page.tsx
"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithEmailPassword } from "@/lib/userAuth";
import { createSupabaseBrowser } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "";
  const justVerified = searchParams.get("verified") === "1";
  const emailFromVerify = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(emailFromVerify);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerifiedMsg, setShowVerifiedMsg] = useState(justVerified);

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

    // Obtener perfil y rol del usuario
    const supabase = createSupabaseBrowser();
    const userId = result.user?.id;

    if (!userId) {
      setError("Error al obtener sesión");
      setLoading(false);
      return;
    }

    // Obtener perfil y verificar estado
    const [profileResult, roleResult] = await Promise.all([
      supabase.from("user_profiles").select("verified").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    ]);

    const verified = profileResult.data?.verified ?? false;
    const dbRole = roleResult.data?.role || "volunteer";

    // Verificar rol efectivo PRIMERO (considera SUPERADMIN_EMAILS del servidor)
    let effectiveRole = dbRole;
    try {
      const roleRes = await fetch("/api/auth/check-role");
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        effectiveRole = roleData.role || dbRole;
      }
    } catch {
      // Usar rol de DB si falla
    }

    // REGLA DE NEGOCIO CRÍTICA:
    // Admin y superadmin NO requieren verificación OTP
    // Solo voluntarios necesitan verificar email
    const isAdmin = effectiveRole === "admin" || effectiveRole === "superadmin";
    
    // Si es voluntario no verificado, redirigir a verificación
    if (!isAdmin && !verified) {
      // Enviar OTP automáticamente
      try {
        await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "verify_email", userId }),
        });
      } catch (err) {
        console.error("[login] Error enviando OTP:", err);
      }
      
      router.push(`/mi-cuenta/verificar?email=${encodeURIComponent(email)}`);
      return;
    }

    // IMPORTANTE: Establecer cookie de rol para el middleware
    // Esto permite acceso a /admin sin doble login
    try {
      await fetch(`/api/auth/set-role-cookie?role=${effectiveRole}`);
    } catch {
      // Si falla, el usuario tendrá que usar /login para admin
    }

    // Determinar redirección según rol y parámetro next
    let redirectTo = "/mi-cuenta";

    if (nextUrl && nextUrl.startsWith("/")) {
      // Si hay next explícito, usarlo
      redirectTo = nextUrl;
    } else if (effectiveRole === "admin" || effectiveRole === "superadmin") {
      // Admin/superadmin va directo al panel
      redirectTo = "/admin";
    }

    // CRÍTICO: Usar window.location para navegación forzada
    // Esto evita que el estado de loading quede pegado
    window.location.href = redirectTo;
  }

  return (
    <main className="container">
      <BackButton fallback="/" />
      
      <div className="max-w-md mx-auto mt-8 px-4">
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />
          <h1 className="title mb-2 font-bold tracking-tight">Iniciar sesión</h1>
          <p className="subtitle mb-6">Accede a tu cuenta de voluntario</p>

          {showVerifiedMsg && (
            <div className="alert success mb-4">
              ✓ Email verificado correctamente. Ahora inicia sesión.
            </div>
          )}

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

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-sm">
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
