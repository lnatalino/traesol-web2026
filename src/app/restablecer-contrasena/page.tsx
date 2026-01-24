// src/app/restablecer-contrasena/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

export default function RestablecerContrasenaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Obtener email de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  // Manejar input de código OTP
  function handleCodeChange(index: number, value: string) {
    // Solo permitir números
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus al siguiente input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    // Backspace mueve al anterior si está vacío
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    // Focus último input completado
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Ingresa el código completo de 6 dígitos.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/confirm-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: fullCode,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar la solicitud.");
      } else {
        setSuccess(true);
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">¡Contraseña actualizada!</h1>
          <p className="text-slate-600 mb-6">
            Tu contraseña ha sido restablecida correctamente. Serás redirigido al login...
          </p>
          <Link href="/login" className="btn-primary">
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <Link
        href="/olvido-contrasena"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand mb-6"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="text-2xl font-semibold mb-2">Restablecer contraseña</h1>
      <p className="text-slate-600 mb-6">
        Ingresa el código de 6 dígitos que recibiste por email y tu nueva contraseña.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email (solo lectura si viene de URL) */}
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

        {/* Código OTP */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Código de verificación</label>
          <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-semibold inp"
                autoComplete="one-time-code"
              />
            ))}
          </div>
        </div>

        {/* Nueva contraseña */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              autoComplete="new-password"
              className="inp w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Confirmar contraseña</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            required
            autoComplete="new-password"
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
              Procesando...
            </>
          ) : (
            "Restablecer contraseña"
          )}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-500">
        ¿No recibiste el código?{" "}
        <Link href="/olvido-contrasena" className="text-brand hover:underline">
          Solicitar nuevamente
        </Link>
      </p>
    </div>
  );
}
