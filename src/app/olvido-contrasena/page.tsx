// src/app/olvido-contrasena/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";

export default function OlvidoContrasenaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok && data.error) {
        setError(data.error);
      } else {
        setSent(true);
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Revisa tu correo</h1>
          <p className="text-slate-600 mb-6">
            Si el email <strong>{email}</strong> está registrado, recibirás un código de 6 dígitos para restablecer tu contraseña.
          </p>
          <Link
            href={`/restablecer-contrasena?email=${encodeURIComponent(email)}`}
            className="btn-primary inline-flex items-center gap-2"
          >
            Tengo el código
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            ¿No recibiste el correo?{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-brand hover:underline"
            >
              Solicitar nuevamente
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand mb-6"
      >
        <ArrowLeft size={16} />
        Volver al login
      </Link>

      <h1 className="text-2xl font-semibold mb-2">Recuperar contraseña</h1>
      <p className="text-slate-600 mb-6">
        Ingresa tu email y te enviaremos un código de verificación.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoComplete="email"
            className="inp w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar código"
          )}
        </button>
      </form>
    </div>
  );
}
