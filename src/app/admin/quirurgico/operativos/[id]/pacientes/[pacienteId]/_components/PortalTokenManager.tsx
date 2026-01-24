"use client";

// src/app/admin/quirurgico/operativos/[id]/pacientes/[pacienteId]/_components/PortalTokenManager.tsx
// Componente para gestionar el token de acceso al portal del paciente

import { useState } from "react";
import type { PacientePortalToken } from "@/lib/quirurgico/types";

interface Props {
  pacienteId: string;
  token: PacientePortalToken | null;
  pacienteNombre: string;
  onRefresh: () => void;
}

export function PortalTokenManager({ pacienteId, token, pacienteNombre, onRefresh }: Props) {
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [newTokenUrl, setNewTokenUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateToken = async () => {
    setGenerating(true);
    setNewTokenUrl(null);

    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/portal-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Expiración en 30 días por defecto
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.portal_url) {
        setNewTokenUrl(result.portal_url);
        onRefresh();
      } else {
        alert(result.error || "Error al generar el token");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar el token");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!token) return;
    if (!confirm("¿Revocar el acceso al portal para este paciente? El enlace dejará de funcionar.")) return;

    setRevoking(true);
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/portal-token`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNewTokenUrl(null);
        onRefresh();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = async () => {
    if (!newTokenUrl) return;
    
    try {
      await navigator.clipboard.writeText(newTokenUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error al copiar:", error);
    }
  };

  const isExpired = token?.expires_at && new Date(token.expires_at) < new Date();
  const isRevoked = token?.revoked_at !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Acceso al portal
        </h3>
      </div>

      {/* Estado actual del token */}
      {token ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Token activo</p>
              <p className="text-xs text-slate-500">
                Creado: {new Date(token.created_at).toLocaleDateString("es-CL")}
              </p>
              {token.expires_at && (
                <p className={`text-xs ${isExpired ? "text-rose-600" : "text-slate-500"}`}>
                  {isExpired ? "Expirado" : "Expira"}: {new Date(token.expires_at).toLocaleDateString("es-CL")}
                </p>
              )}
              {token.last_used_at && (
                <p className="text-xs text-slate-500">
                  Último uso: {new Date(token.last_used_at).toLocaleString("es-CL")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isRevoked ? (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                  Revocado
                </span>
              ) : isExpired ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  Expirado
                </span>
              ) : (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Activo
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={handleGenerateToken}
              disabled={generating}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? "Generando..." : "Generar nuevo enlace"}
            </button>
            {!isRevoked && (
              <button
                onClick={handleRevokeToken}
                disabled={revoking}
                className="rounded-full border border-rose-200 px-4 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                {revoking ? "Revocando..." : "Revocar acceso"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-600 mb-3">
            El paciente no tiene acceso al portal. Genera un enlace seguro para que pueda ver su información y subir documentos.
          </p>
          <button
            onClick={handleGenerateToken}
            disabled={generating}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generando..." : "Generar enlace de acceso"}
          </button>
        </div>
      )}

      {/* Mostrar nuevo enlace generado */}
      {newTokenUrl && (
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">¡Enlace generado!</span>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs text-slate-500 mb-1">Enlace de acceso al portal:</p>
            <code className="text-sm text-slate-900 break-all select-all">{newTokenUrl}</code>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </button>
            <a
              href={`mailto:?subject=Acceso%20al%20portal%20de%20paciente%20-%20Traesol&body=Hola%20${encodeURIComponent(pacienteNombre)},%0A%0AAqu%C3%AD%20est%C3%A1%20tu%20enlace%20de%20acceso%20al%20portal%20de%20paciente:%0A%0A${encodeURIComponent(newTokenUrl)}%0A%0AEste%20enlace%20es%20personal%20y%20expira%20en%2030%20d%C3%ADas.`}
              className="rounded-full border border-green-200 px-4 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Enviar por email
            </a>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>⚠️ Importante:</strong> Este enlace solo se muestra una vez. Copia y guárdalo ahora. 
              El token se almacena de forma segura (hash) y no puede recuperarse después.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
