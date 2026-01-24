"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Send } from "lucide-react";

const TEMAS = [
  { value: "", label: "Selecciona un tema" },
  { value: "operativo_salud", label: "Organizar operativo de salud" },
  { value: "tunnel_educativo", label: "Túneles educativos" },
  { value: "capacitaciones", label: "Capacitaciones y jornadas" },
  { value: "voluntariado", label: "Voluntariado corporativo" },
  { value: "donacion", label: "Donación o aporte" },
  { value: "otro", label: "Otro" },
];

const initialForm = {
  nombrePersona: "",
  nombreEmpresa: "",
  cargo: "",
  email: "",
  telefono: "",
  tema: "",
  mensaje: "",
};

type ContactFormState = typeof initialForm;
type Feedback = { type: "success" | "error"; message: string } | null;

export function EmpresasContactForm() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [sending, setSending] = useState(false);

  const setField = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!form.email.trim() || !form.nombrePersona.trim()) {
      setFeedback({ type: "error", message: "Por favor completa tu nombre y correo." });
      return;
    }

    setSending(true);
    try {
      const payload = {
        email: form.email.trim(),
        nombre_persona: form.nombrePersona.trim(),
        nombre_empresa: form.nombreEmpresa.trim(),
        cargo: form.cargo.trim(),
        telefono: form.telefono.trim(),
        tema: form.tema,
        mensaje: form.mensaje.trim(),
        desea_reunion: "Sí",
      };

      const response = await fetch("/api/empresas-contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "No pudimos enviar tu mensaje.");
      }

      setFeedback({
        type: "success",
        message: "¡Gracias por contactarnos! Te responderemos en un plazo máximo de 48 horas hábiles.",
      });
      setForm(initialForm);
    } catch (error: any) {
      setFeedback({ type: "error", message: error?.message || "Ocurrió un error al enviar el formulario." });
    } finally {
      setSending(false);
    }
  }

  if (feedback?.type === "success") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-emerald-900">¡Mensaje enviado!</h3>
        <p className="mt-2 text-emerald-700">{feedback.message}</p>
        <button
          type="button"
          onClick={() => setFeedback(null)}
          className="mt-6 rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Contacto directo</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Cuéntanos qué necesita tu organización
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Te contactaremos en menos de 48 horas hábiles para orientarte.
        </p>
      </div>

      {feedback?.type === "error" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Tu nombre <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              required
              value={form.nombrePersona}
              onChange={(e) => setField("nombrePersona", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Juan Pérez"
              autoComplete="name"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Correo electrónico <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="juan@empresa.cl"
              autoComplete="email"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Empresa u organización</span>
            <input
              type="text"
              value={form.nombreEmpresa}
              onChange={(e) => setField("nombreEmpresa", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Nombre de tu empresa"
              autoComplete="organization"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Cargo</span>
            <input
              type="text"
              value={form.cargo}
              onChange={(e) => setField("cargo", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ej: Gerente de RRHH"
              autoComplete="organization-title"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Teléfono</span>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setField("telefono", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="+56 9 1234 5678"
              autoComplete="tel"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">¿Qué te interesa?</span>
            <select
              value={form.tema}
              onChange={(e) => setField("tema", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {TEMAS.map((tema) => (
                <option key={tema.value} value={tema.value}>
                  {tema.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Cuéntanos más</span>
          <textarea
            value={form.mensaje}
            onChange={(e) => setField("mensaje", e.target.value)}
            className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="¿Qué necesita tu organización? ¿Cuántas personas participarían? ¿En qué fechas?"
          />
        </label>

        <div className="pt-2">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {sending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Enviar mensaje
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Revisaremos tu mensaje y te escribiremos para coordinar una reunión o enviarte una propuesta. 
          Toda la información es confidencial.
        </p>
      </form>
    </div>
  );
}
