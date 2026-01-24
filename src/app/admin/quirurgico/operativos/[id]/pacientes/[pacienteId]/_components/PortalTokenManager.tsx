"use client";

// src/app/admin/quirurgico/operativos/[id]/pacientes/[pacienteId]/_components/PortalTokenManager.tsx
// Componente para gestionar el token de acceso al portal del paciente
// Con 2 opciones: Enviar por email o Copiar link + texto preformateado

import { useState } from "react";
import type { PacientePortalToken } from "@/lib/quirurgico/types";

interface Props {
  pacienteId: string;
  token: PacientePortalToken | null;
  pacienteNombre: string;
  pacienteEmail?: string | null;
  onRefresh: () => void;
}

// Texto de email idéntico al que se envía por email (consistencia)
function getEmailText(nombre: string, url: string, expirationDate: string): string {
  return `Estimado/a ${nombre},

Ha sido registrado como paciente en un operativo quirúrgico de la Fundación Traesol.

Para completar su información y subir los documentos necesarios, ingrese al siguiente enlace:

${url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
¿Qué puede hacer en el portal?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Verificar y actualizar sus datos personales
• Agregar contactos de emergencia
• Subir exámenes y documentos médicos requeridos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Este enlace es PERSONAL E INTRANSFERIBLE. No lo comparta con terceros.
• El enlace expira el ${expirationDate}.
• Si el enlace expira, contacte al equipo de coordinación para solicitar uno nuevo.

Atentamente,
Fundación Traesol
https://fundaciontraesol.cl`;
}

export function PortalTokenManager({ pacienteId, token, pacienteNombre, pacienteEmail, onRefresh }: Props) {
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [sending, setSending] = useState(false);
  const [newTokenUrl, setNewTokenUrl] = useState<string | null>(null);
  const [expirationDateFormatted, setExpirationDateFormatted] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(pacienteEmail || "");
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Función para enviar email (regenera token y envía)
  const handleSendEmailOnly = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      setError("Por favor ingrese un email válido");
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/portal-token/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`Email enviado correctamente a ${emailInput}`);
        setShowSendEmailModal(false);
        setNewTokenUrl(result.portal_url);
        onRefresh();
      } else {
        setError(result.error || "Error al enviar el email");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error al enviar el email");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateToken = async (sendEmail: boolean = false, email?: string) => {
    if (sendEmail && !email) {
      setError("Por favor ingrese un email válido");
      return;
    }

    setGenerating(true);
    setNewTokenUrl(null);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/portal-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          sendEmail: sendEmail,
          email: email,
        }),
      });

      const result = await response.json();

      if (response.ok && result.portal_url) {
        setNewTokenUrl(result.portal_url);
        setExpirationDateFormatted(result.expiration_date_formatted || "en 30 días");
        onRefresh();
        
        if (sendEmail && result.email_sent) {
          setSuccess(`Email enviado correctamente a ${email}`);
          setShowEmailOption(false);
        }
      } else {
        setError(result.error || "Error al generar el token");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error al generar el token");
    } finally {
      setGenerating(false);
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      setError("Por favor ingrese un email válido");
      return;
    }
    setSending(true);
    await handleGenerateToken(true, emailInput);
  };

  const handleRevokeToken = async () => {
    if (!token) return;
    if (!confirm("¿Revocar el acceso al portal para este paciente? El enlace dejará de funcionar.")) return;

    setRevoking(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/portal-token`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNewTokenUrl(null);
        setSuccess("Acceso revocado correctamente");
        onRefresh();
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error al revocar el token");
    } finally {
      setRevoking(false);
    }
  };

  const handleCopyLink = async () => {
    if (!newTokenUrl) return;
    try {
      await navigator.clipboard.writeText(newTokenUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const handleCopyEmailText = async () => {
    if (!newTokenUrl) return;
    try {
      await navigator.clipboard.writeText(getEmailText(pacienteNombre, newTokenUrl, expirationDateFormatted));
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const isExpired = token?.expires_at && new Date(token.expires_at) < new Date();
  const isRevoked = token?.revoked_at !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Acceso al portal del paciente
        </h3>
      </div>

      {/* Mensajes de error/éxito */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

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

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => setShowSendEmailModal(true)}
              disabled={sending}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Enviar email
              </span>
            </button>
            <button
              onClick={() => handleGenerateToken(false)}
              disabled={generating}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {generating ? "Generando..." : "Regenerar enlace"}
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

          {/* Modal para enviar email con token existente */}
          {showSendEmailModal && (
            <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-blue-900">Enviar enlace por email</h4>
                <button
                  onClick={() => setShowSendEmailModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email del paciente *
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="paciente@ejemplo.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSendEmailOnly}
                  disabled={sending || !emailInput}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? "Enviando..." : "Enviar email"}
                </button>
                <button
                  onClick={() => setShowSendEmailModal(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Sin token - mostrar 2 opciones */
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <p className="text-sm text-slate-600">
            El paciente no tiene acceso al portal. Genera un enlace seguro para que pueda ver su información y subir documentos.
          </p>
          
          <div className="grid gap-3 sm:grid-cols-2">
            {/* OPCIÓN 1: Enviar por email */}
            <button
              onClick={() => setShowEmailOption(true)}
              className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-left hover:bg-blue-100 transition"
            >
              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-1">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Enviar por email
              </div>
              <p className="text-xs text-slate-600">
                Genera el token y envía automáticamente al email del paciente
              </p>
            </button>

            {/* OPCIÓN 2: Generar y copiar */}
            <button
              onClick={() => handleGenerateToken(false)}
              disabled={generating}
              className="rounded-xl border-2 border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-1">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                {generating ? "Generando..." : "Generar y copiar"}
              </div>
              <p className="text-xs text-slate-600">
                Genera el link y un texto para copiar/pegar manualmente
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Modal/sección para enviar por email */}
      {showEmailOption && !newTokenUrl && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-blue-900">Enviar acceso por email</h4>
            <button
              onClick={() => setShowEmailOption(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email del paciente *
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="paciente@ejemplo.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSendEmail}
              disabled={sending || !emailInput}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Generar y enviar email"}
            </button>
            <button
              onClick={() => setShowEmailOption(false)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Mostrar enlace generado + opciones para copiar */}
      {newTokenUrl && (
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 space-y-4">
          <div className="flex items-center gap-2 text-green-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">¡Enlace generado exitosamente!</span>
          </div>
          
          {/* Link para copiar */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs text-slate-500 mb-1 font-medium">Enlace de acceso:</p>
            <code className="text-sm text-slate-900 break-all select-all block">{newTokenUrl}</code>
            <button
              onClick={handleCopyLink}
              className="mt-2 rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              {copied ? "✓ Copiado" : "Copiar enlace"}
            </button>
          </div>

          {/* Texto de email preformateado */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs text-slate-500 mb-1 font-medium">Texto de email (para copiar y pegar):</p>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words max-h-40 overflow-y-auto bg-slate-50 p-2 rounded border">
              {getEmailText(pacienteNombre, newTokenUrl, expirationDateFormatted)}
            </pre>
            <button
              onClick={handleCopyEmailText}
              className="mt-2 rounded-full border border-green-600 px-4 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              {copiedEmail ? "✓ Texto copiado" : "Copiar texto de email"}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>⚠️ Importante:</strong> Este enlace solo se muestra una vez. Cópielo y guárdelo ahora. 
              El token se almacena de forma segura (hash) y no puede recuperarse después.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
