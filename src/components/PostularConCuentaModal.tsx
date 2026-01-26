// src/components/PostularConCuentaModal.tsx
// Modal para postular a operativo usando la cuenta del usuario
// IMPORTANTE: Valida campos obligatorios COMPLETOS antes de permitir postulación
// Campos requeridos: RUT, Nombre, Apellido, Email, Teléfono, Talla uniforme, Restricciones alimentarias
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { formatRut } from "@/lib/userAuth";
import { createSupabaseBrowser } from "@/lib/supabase";

interface PostularConCuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  operativoId: string;
  operativoSlug: string;
  operativoTitulo: string;
}

// Campos obligatorios para postular (según encuesta voluntarios)
const CAMPOS_OBLIGATORIOS = [
  { key: "rut", label: "RUT" },
  { key: "first_name", label: "Nombre" },
  { key: "last_name", label: "Apellido" },
  { key: "phone", label: "Teléfono" },
  { key: "talla_polera", label: "Talla de polera" },
  { key: "restricciones_alimentarias", label: "Restricciones alimentarias" },
] as const;

// Perfil completo del voluntario (incluye campos de logística)
interface VoluntarioProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  rut: string | null;
  phone: string | null;
  birthdate: string | null;
  talla_polera: string | null;
  talla_pantalon: string | null;
  restricciones_alimentarias: string | null;
  direccion: string | null;
  comuna: string | null;
  instagram: string | null;
}

function validateVolunteerProfile(profile: VoluntarioProfile | null): { isComplete: boolean; missingFields: string[] } {
  if (!profile) {
    return { isComplete: false, missingFields: ["Perfil no encontrado"] };
  }

  const missing: string[] = [];

  for (const campo of CAMPOS_OBLIGATORIOS) {
    const value = profile[campo.key as keyof VoluntarioProfile];
    // Considerar vacío si es null, undefined, o string vacío
    if (value === null || value === undefined || (typeof value === "string" && !value.trim())) {
      missing.push(campo.label);
    }
  }

  return {
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}

export default function PostularConCuentaModal({
  isOpen,
  onClose,
  operativoId,
  operativoSlug,
  operativoTitulo,
}: PostularConCuentaModalProps) {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  
  // Estado del perfil completo (cargado de DB)
  const [fullProfile, setFullProfile] = useState<VoluntarioProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [confirmado, setConfirmado] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Cargar perfil completo del voluntario
  const loadFullProfile = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingProfile(true);
    try {
      const supabase = createSupabaseBrowser();
      const { data, error: dbError } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, rut, phone, birthdate, talla_polera, talla_pantalon, restricciones_alimentarias, direccion, comuna, instagram")
        .eq("id", user.id)
        .single();
      
      if (dbError) {
        console.error("[PostularConCuenta] Error cargando perfil:", dbError);
      }
      
      setFullProfile(data as VoluntarioProfile | null);
    } catch (err) {
      console.error("[PostularConCuenta] Error:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.id]);

  // Cargar perfil al abrir el modal
  useEffect(() => {
    if (isOpen && user) {
      loadFullProfile();
    }
  }, [isOpen, user, loadFullProfile]);

  // Reset estados al cerrar
  useEffect(() => {
    if (!isOpen) {
      setConfirmado(false);
      setError("");
      setSuccess(false);
      setFullProfile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const profileStatus = validateVolunteerProfile(fullProfile);
  const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";

  async function handleSubmit() {
    if (!user || !fullProfile) return;
    if (!confirmado) {
      setError("Debes confirmar que tus datos son correctos");
      return;
    }

    // Validación final antes de enviar
    const validation = validateVolunteerProfile(fullProfile);
    if (!validation.isComplete) {
      setError(`Faltan datos obligatorios: ${validation.missingFields.join(", ")}`);
      return;
    }

    setError("");
    setSending(true);

    try {
      const payload = {
        nombres: fullProfile.first_name,
        apellidos: fullProfile.last_name,
        rut: fullProfile.rut?.replace(/\./g, "").replace(/-/g, "").toUpperCase(),
        email: user.email,
        telefono: fullProfile.phone,
        fecha_nacimiento: fullProfile.birthdate || null,
        nacionalidad: null,
        genero: null,
        direccion: fullProfile.direccion || null,
        instagram: fullProfile.instagram || null,
        profesion: "No especificada",
        profesion_otro: null,
        especialidad: null,
        talla_polera: fullProfile.talla_polera,
        talla_pantalon: fullProfile.talla_pantalon || null,
        alimentarias_alergias: fullProfile.restricciones_alimentarias,
        alimentarias_veg: false,
        alimentarias_otro: null,
        nombre_credencial: `${fullProfile.first_name} ${fullProfile.last_name}`.trim(),
        tipo_postulacion: "especifica",
        operativo_id: operativoId,
        disponibilidad_anual: null,
        motivacion: "Postulación desde Mi cuenta",
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
  if (sessionLoading || loadingProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-sm text-slate-600">Cargando tu perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  // Perfil incompleto - mostrar campos faltantes
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
              Completa tu perfil para postular
            </h2>
            <p className="text-slate-600 mb-4">
              Para postular a un operativo necesitas completar todos los datos obligatorios:
            </p>
            <ul className="text-left bg-slate-50 rounded-lg p-4 mb-6 space-y-2">
              {profileStatus.missingFields.map((field) => (
                <li key={field} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-500 text-xs">✕</span>
                  </span>
                  {field}
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
                href={`/mi-cuenta/perfil/editar?returnTo=${encodeURIComponent(currentUrl)}`}
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

  // Modal principal: Confirmar datos antes de postular
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Confirmar postulación
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
            Operativo: <strong>{operativoTitulo}</strong>
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Datos del perfil - TODOS los campos obligatorios */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Tus datos de postulación</h3>
              <Link
                href={`/mi-cuenta/perfil/editar?returnTo=${encodeURIComponent(currentUrl)}`}
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                onClick={onClose}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Nombre</span>
                <p className="font-medium text-slate-900">{fullProfile?.first_name || "—"}</p>
              </div>
              <div>
                <span className="text-slate-500">Apellido</span>
                <p className="font-medium text-slate-900">{fullProfile?.last_name || "—"}</p>
              </div>
              <div>
                <span className="text-slate-500">RUT</span>
                <p className="font-medium text-slate-900">
                  {fullProfile?.rut ? formatRut(fullProfile.rut) : "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Email</span>
                <p className="font-medium text-slate-900 truncate">{user?.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Teléfono</span>
                <p className="font-medium text-slate-900">{fullProfile?.phone || "—"}</p>
              </div>
              <div>
                <span className="text-slate-500">Talla polera</span>
                <p className="font-medium text-slate-900">{fullProfile?.talla_polera || "—"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Restricciones alimentarias</span>
                <p className="font-medium text-slate-900">
                  {fullProfile?.restricciones_alimentarias || "Ninguna"}
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox de confirmación */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Confirmo que mis datos son correctos y deseo postular a este operativo. 
              Entiendo que la postulación está sujeta a aprobación.
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
            {sending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : (
              "Confirmar y enviar postulación"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
