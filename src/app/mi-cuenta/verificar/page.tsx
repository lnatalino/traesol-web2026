// src/app/mi-cuenta/verificar/page.tsx
"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, RefreshCw, Mail } from "lucide-react";

function VerificarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!emailParam) {
      setError("Email no proporcionado");
      return;
    }

    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailParam,
          code,
          purpose: "verify_email",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Código inválido");
        setLoading(false);
        return;
      }

      setSuccess("¡Email verificado! Redirigiendo...");
      
      // Redirigir a mi cuenta después de un momento
      setTimeout(() => {
        router.push("/mi-cuenta");
        router.refresh();
      }, 1500);
    } catch {
      setError("Error al verificar. Intenta nuevamente.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend || !emailParam) return;

    setResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailParam,
          purpose: "verify_email",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al reenviar código");
        setResending(false);
        return;
      }

      setSuccess("Código reenviado. Revisa tu correo.");
      setCanResend(false);
      setResendTimer(60); // 60 segundos de cooldown
    } catch {
      setError("Error al reenviar. Intenta nuevamente.");
    } finally {
      setResending(false);
    }
  }

  // Formatear input para solo dígitos
  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verifica tu correo</h1>
          <p className="text-slate-600 mt-2">
            Ingresa el código de 6 dígitos que enviamos a
          </p>
          {emailParam && (
            <p className="text-blue-600 font-medium mt-1">{emailParam}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 text-center">
                Código de verificación
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="000000"
                className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] text-slate-900 placeholder-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                maxLength={6}
                required
                disabled={loading || !!success}
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6 || !!success}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Verificar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-600 text-center mb-3">
              ¿No recibiste el código?
            </p>
            <button
              onClick={handleResend}
              disabled={!canResend || resending || !!success}
              className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors inline-flex items-center justify-center gap-2 text-sm"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : resendTimer > 0 ? (
                <>Reenviar en {resendTimer}s</>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reenviar código
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-500 text-center">
            El código expira en 15 minutos y solo puede usarse una vez.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/mi-cuenta/login"
            className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <VerificarContent />
    </Suspense>
  );
}
