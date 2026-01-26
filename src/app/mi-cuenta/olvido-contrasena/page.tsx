// src/app/mi-cuenta/olvido-contrasena/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { Mail, ArrowRight, RefreshCw, ShieldCheck, Eye, EyeOff } from "lucide-react";
import BackButton from "@/components/BackButton";

type Step = "email" | "code" | "password" | "success";

export default function OlvidoContrasenaPage() {
  const [step, setStep] = useState<Step>("email");
  
  // Formulario
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer para reenvío
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Paso 1: Enviar código al email
  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "reset_password",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al enviar código");
        setLoading(false);
        return;
      }

      setStep("code");
      setCanResend(false);
      setResendTimer(60);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  // Paso 2: Verificar código y pasar a contraseña
  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    // Pasamos directo al paso de contraseña
    // La verificación real se hace al guardar la contraseña
    setStep("password");
  }

  // Paso 3: Establecer nueva contraseña
  async function handleResetPassword(e: FormEvent) {
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

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Si el código ya fue usado o expiró
        if (data.used || data.expired) {
          setError("El código ha expirado o ya fue usado. Solicita uno nuevo.");
          setStep("email");
          setCode("");
          setPassword("");
          setConfirmPassword("");
        } else {
          setError(data.error || "Error al actualizar contraseña");
        }
        setLoading(false);
        return;
      }

      setStep("success");
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  // Reenviar código
  async function handleResend() {
    if (!canResend) return;

    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "reset_password",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al reenviar código");
      } else {
        setCanResend(false);
        setResendTimer(60);
        setCode("");
      }
    } catch {
      setError("Error al reenviar. Intenta más tarde.");
    } finally {
      setResending(false);
    }
  }

  // Renderizar según el paso
  if (step === "success") {
    return (
      <main className="container">
        <div className="max-w-md mx-auto mt-12">
          <div className="card text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="title mb-2">¡Contraseña actualizada!</h1>
            <p className="text-slate-600 mb-6">
              Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión.
            </p>
            <Link href="/mi-cuenta/login" className="btn-primary inline-flex gap-2">
              Iniciar sesión <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (step === "password") {
    return (
      <main className="container">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setStep("code")}
            className="px-3 py-1.5 rounded-xl border shadow-sm hover:shadow transition text-sm"
          >
            ← Volver
          </button>
        </div>

        <div className="max-w-md mx-auto mt-8">
          <div className="card">
            <div className="w-12 h-12 rounded-full bg-sky-100 mx-auto mb-4 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-sky-600" />
            </div>
            <h1 className="title mb-2 text-center">Nueva contraseña</h1>
            <p className="subtitle mb-6 text-center">
              Ingresa tu nueva contraseña para <strong>{email}</strong>
            </p>

            {error && <div className="alert error mb-4">{error}</div>}

            <form onSubmit={handleResetPassword} className="grid gap-4">
              <div className="relative">
                <label className="label mb-1">Nueva contraseña</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="inp pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div>
                <label className="label mb-1">Confirmar contraseña</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="inp"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (step === "code") {
    return (
      <main className="container">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setStep("email")}
            className="px-3 py-1.5 rounded-xl border shadow-sm hover:shadow transition text-sm"
          >
            ← Volver
          </button>
        </div>

        <div className="max-w-md mx-auto mt-8">
          <div className="card">
            <div className="w-12 h-12 rounded-full bg-sky-100 mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-6 h-6 text-sky-600" />
            </div>
            <h1 className="title mb-2 text-center">Ingresa el código</h1>
            <p className="subtitle mb-6 text-center">
              Enviamos un código de 6 dígitos a <strong>{email}</strong>
            </p>

            {error && <div className="alert error mb-4">{error}</div>}

            <form onSubmit={handleVerifyCode} className="grid gap-4">
              <div>
                <label className="label mb-1">Código de verificación</label>
                <input
                  type="text"
                  className="inp text-center text-2xl tracking-widest font-mono"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1 text-center">
                  El código expira en 15 minutos
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center"
                disabled={loading || code.length !== 6}
              >
                {loading ? "Verificando..." : "Continuar"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleResend}
                disabled={!canResend || resending}
                className="text-sm text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                {resending
                  ? "Reenviando..."
                  : !canResend
                  ? `Reenviar código (${resendTimer}s)`
                  : "Reenviar código"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Paso inicial: ingresar email
  return (
    <main className="container">
      <BackButton fallback="/mi-cuenta/login" />

      <div className="max-w-md mx-auto mt-8">
        <div className="card">
          <h1 className="title mb-2">Recuperar contraseña</h1>
          <p className="subtitle mb-6">
            Ingresa tu email y te enviaremos un código de 6 dígitos para recuperar tu cuenta
          </p>

          {error && <div className="alert error mb-4">{error}</div>}

          <form onSubmit={handleSendCode} className="grid gap-4">
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
              {loading ? "Enviando..." : "Enviar código"}
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
