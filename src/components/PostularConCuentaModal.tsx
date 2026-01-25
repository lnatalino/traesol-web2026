// src/components/PostularConCuentaModal.tsx
// Modal para postular a operativo usando la cuenta del usuario
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserSession } from "@/lib/hooks/useUserSession";
import { isVolunteerProfileComplete, formatRut, type UserProfile } from "@/lib/userAuth";

interface PostularConCuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  operativoId: string;
  operativoSlug: string;
  operativoTitulo: string;
}

export default function PostularConCuentaModal({
  isOpen,
  onClose,
  operativoId,
  operativoSlug,
  operativoTitulo,
}: PostularConCuentaModalProps) {
  const router = useRouter();
  const { user, profile, loading, refresh } = useUserSession();
  const [confirmado, setConfirmado] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Refrescar perfil al abrir el modal
  useEffect(() => {
    if (isOpen && user) {
      refresh();
    }
  }, [isOpen, user, refresh]);

  // Reset estados al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setConfirmado(false);
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const profileStatus = isVolunteerProfileComplete(profile);
  const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";

  async function handleSubmit() {
    if (!user || !profile) return;
    if (!confirmado) {
      setError("Debes confirmar que tus datos son correctos");
      return;
    }

    setError("");
    setSending(true);

    try {
      // Usar el mismo endpoint que el formulario normal
      const payload = {
        nombres: profile.first_name,
        apellidos: profile.last_name,
        rut: profile.rut?.replace(/\./g, "").replace(/-/g, "").toUpperCase(),
        email: user.email,
        telefono: profile.phone || null,
        fecha_nacimiento: profile.birthdate || null,
        // Campos opcionales que el usuario puede no tener
        nacionalidad: null,
        genero: null,
        direccion: null,
        instagram: null,
        profesion: "No especificada",
        profesion_otro: null,
        especialidad: null,
        talla_polera: null,
        talla_pantalon: null,
        alimentarias_alergias: null,
        alimentarias_veg: false,
        alimentarias_otro: null,
        nombre_credencial: `${profile.first_name} ${profile.last_name}`.trim(),
        tipo_postulacion: "especifica",
        operativo_id: operativoId,
        disponibilidad_anual: null,
        motivacion: "Postulación desde Mi cuenta",
        // Flag para indicar que viene de cuenta autenticada
        from_user_account: true,
        user_id: user.id,
      };

      const res = await fetch("/api/postulaciones/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Error al enviar postulación");
      }

      setSuccess(true);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/postular/gracias");
      }, 2000);
    } catch (err) {
      console.error("[PostularConCuenta] error:", err);
      setError(err instanceof Error ? err.message : "Error al enviar postulación");
    } finally {
      setSending(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Perfil incompleto
  if (!profileStatus.isComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Completa tu perfil
            </h2>
            <p className="text-slate-600 mb-4">
              Para postular con tu cuenta necesitas completar los siguientes datos:
            </p>
            <ul className="text-left bg-slate-50 rounded-lg p-4 mb-6">
              {profileStatus.missingFields.map((field) => (
                <li key={field} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-red-500">✕</span> {field}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 btn-outline"
              >
                Cancelar
              </button>
              <Link
                href={`/mi-cuenta/perfil?returnTo=${encodeURIComponent(currentUrl)}`}
                className="flex-1 btn-primary text-center"
                onClick={onClose}
              >
                Completar perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              ¡Postulación enviada!
            </h2>
            <p className="text-slate-600">
              Tu postulación a <strong>{operativoTitulo}</strong> ha sido recibida. 
              Te contactaremos pronto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Modal principal con datos del perfil
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Postular a operativo
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {operativoTitulo}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {/* Datos del perfil */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-slate-900">Tus datos</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Nombre</span>
                <p className="font-medium text-slate-900">{profile?.first_name}</p>
              </div>
              <div>
                <span className="text-slate-500">Apellido</span>
                <p className="font-medium text-slate-900">{profile?.last_name}</p>
              </div>
              <div>
                <span className="text-slate-500">RUT</span>
                <p className="font-medium text-slate-900">
                  {profile?.rut ? formatRut(profile.rut) : "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Email</span>
                <p className="font-medium text-slate-900 truncate">{user?.email}</p>
              </div>
              {profile?.phone && (
                <div className="col-span-2">
                  <span className="text-slate-500">Teléfono</span>
                  <p className="font-medium text-slate-900">{profile.phone}</p>
                </div>
              )}
            </div>

            <Link
              href={`/mi-cuenta/perfil?returnTo=${encodeURIComponent(currentUrl)}`}
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              onClick={onClose}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar mis datos
            </Link>
          </div>

          {/* Checkbox de confirmación */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Confirmo que mis datos son correctos y deseo postular a este operativo.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-outline"
            disabled={sending}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!confirmado || sending}
            className="flex-1 btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Enviando..." : "Confirmar y enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
