// src/app/cambiar-contrasena/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";

export default function CambiarContrasenaPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Validaciones en tiempo real
  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!hasMinLength) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al cambiar la contraseña.");
      } else {
        setSuccess(true);
        // Redirigir al admin después de 2 segundos
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">¡Contraseña actualizada!</h1>
            <p className="text-slate-600 mb-6">
              Tu contraseña ha sido cambiada correctamente.<br />
              Redirigiendo al panel...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header con logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido/a a Traesol</h1>
          <p className="text-slate-600 mt-2">Panel de Administración</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Mensaje de bienvenida */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium">Configura tu contraseña personal</p>
                <p className="text-blue-700 text-sm mt-1">
                  Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contraseña temporal */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Contraseña temporal (la que recibiste por correo)
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña temporal"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {newPassword && (
                <p className={`text-xs ${hasMinLength ? "text-green-600" : "text-slate-500"}`}>
                  {hasMinLength ? "✓ Longitud correcta" : "Mínimo 8 caracteres"}
                </p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordsMatch ? "✓ Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !hasMinLength || !passwordsMatch}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Guardar nueva contraseña"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Fundación Traesol · Panel de Administración
        </p>
      </div>
    </div>
  );
}
