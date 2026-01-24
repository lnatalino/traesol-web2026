"use client";

import { useMemo, useState } from "react";
import type { SurgicalPortalPatient } from "@/lib/quirurgico";

type SurgicalPortalClientProps = {
  patient: SurgicalPortalPatient;
  portalToken: string;
};

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const TIME_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FORMAT.format(date);
}

function formatTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return null;
  return TIME_FORMAT.format(date);
}

function normalizeLastFourInput(raw: string): string | null {
  if (!raw) return null;
  const compact = raw
    .trim()
    .toUpperCase()
    .replace(/[.\s]/g, "")
    .replace(/[^0-9K-]/g, "");
  if (!compact) {
    return null;
  }

  let body = "";
  let dv = "";

  if (compact.includes("-")) {
    const [rawBody, rawDv] = compact.split("-", 2);
    body = (rawBody || "").replace(/[^0-9]/g, "");
    dv = (rawDv || "").replace(/[^0-9K]/g, "").charAt(0) ?? "";
  } else {
    const sanitized = compact.replace(/[^0-9K]/g, "");
    if (sanitized.length < 2) {
      return null;
    }
    body = sanitized.slice(0, -1);
    dv = sanitized.slice(-1);
  }

  if (!body || !dv) {
    return null;
  }

  const canonical = `${body}-${dv}`;
  return canonical.slice(-4).toUpperCase();
}

export function SurgicalPortalClient({ patient, portalToken }: SurgicalPortalClientProps) {
  const normalizedStoredPin = patient.rut_ultimos4?.trim().toUpperCase() ?? null;
  const requiresPin = Boolean(normalizedStoredPin);
  const [unlocked, setUnlocked] = useState(!requiresPin);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const fechaCirugia = formatDate(patient.fecha_cirugia);
  const horaCirugia = formatTime(patient.hora_cirugia);
  const fechaLlegada = formatDate(patient.fecha_llegada_ciudad);
  const fechaRegreso = formatDate(patient.fecha_regreso_ciudad);

  const bienvenida = useMemo(() => {
    if (!unlocked) {
      return "Ingresa los últimos 4 caracteres de tu RUT (incluyendo el dígito verificador) para ver tu operativo.";
    }
    return "Aquí encontrarás la información más reciente entregada por el equipo de Traesol.";
  }, [unlocked]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requiresPin) {
      setUnlocked(true);
      return;
    }

    const normalizedInput = normalizeLastFourInput(pinValue);

    if (!normalizedInput) {
      setPinError("Ingresa los últimos 4 caracteres de tu RUT, incluyendo el dígito verificador.");
      return;
    }

    if (normalizedStoredPin && normalizedInput !== normalizedStoredPin) {
      setPinError("Los dígitos ingresados no coinciden. Inténtalo nuevamente.");
      setPinValue("");
      return;
    }

    setPinError(null);
    setSubmitting(true);
    try {
      await fetch("/api/quirurgico/portal/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, token: portalToken }),
      });
    } catch (error) {
      console.error("[quirurgico] portal access", error);
    } finally {
      setSubmitting(false);
      setUnlocked(true);
      setConfirmation("¡Listo! Ya puedes revisar tu información actualizada.");
    }
  };

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Fundación Traesol</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Portal del paciente</h1>
        <p className="mt-2 text-base text-slate-600">{bienvenida}</p>
      </header>

      {confirmation && unlocked ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {confirmation}
        </div>
      ) : null}

      {!unlocked ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5"
        >
          <p className="text-sm text-slate-600">
            Hola <span className="font-semibold text-slate-900">{patient.nombre_completo}</span>, para tu seguridad necesitamos
            validar los últimos dígitos de tu RUT antes de mostrarte la información del operativo.
          </p>
          <label className="text-sm font-medium text-slate-700">
            Ingresa los últimos 4 de tu RUT (incluyendo dígito verificador)
            <input
              value={pinValue}
              onChange={(event) => {
                setPinValue(event.target.value);
                if (pinError) {
                  setPinError(null);
                }
              }}
              inputMode="text"
              autoComplete="off"
              maxLength={4}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-center text-2xl tracking-[0.4em] text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: 51-K"
            />
          </label>
          {pinError ? <p className="text-sm text-rose-600">{pinError}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Validando…" : "Ingresar"}
          </button>
        </form>
      ) : (
        <section className="space-y-6">
          <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Tu operativo</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Hola {patient.nombre_completo}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Diagnóstico</p>
                <p className="mt-2 text-base text-slate-900">{patient.diagnostico || "A definir con el equipo médico"}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Cirugía planificada</p>
                <p className="mt-2 text-base text-slate-900">{patient.cirugia_planificada || "Pronto te informaremos"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-blue-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">Fecha y hora</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {fechaCirugia || "A coordinar"}
                {horaCirugia ? <span className="text-sm font-normal text-slate-600"> · {horaCirugia} hrs</span> : null}
              </p>
            </div>
          </div>

          {patient.requiere_vuelo ? (
            <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Viaje</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Traslado coordinado por Traesol</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  Ciudad de origen: <span className="font-semibold text-slate-900">{patient.ciudad_origen || "Por confirmar"}</span>
                </li>
                <li>
                  Fecha de llegada: <span className="font-semibold text-slate-900">{fechaLlegada || "En coordinación"}</span>
                </li>
                <li>
                  Fecha de regreso: <span className="font-semibold text-slate-900">{fechaRegreso || "En coordinación"}</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-slate-600">
                Nuestro equipo se pondrá en contacto si hay ajustes. Recuerda mantener tu teléfono disponible.
              </p>
            </div>
          ) : null}

          {patient.requiere_hospedaje ? (
            <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Hospedaje</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Tu alojamiento está resuelto</h3>
              <p className="mt-2 text-sm text-slate-600">
                El equipo de Traesol coordinará tu hospedaje en Santiago. Te avisaremos los detalles por teléfono y correo en cuanto estén confirmados.
              </p>
            </div>
          ) : null}

          <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Contacto</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">¿Tienes dudas?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Escríbenos a <a className="font-semibold text-blue-600" href="mailto:quirurgicos@fundaciontraesol.cl">quirurgicos@fundaciontraesol.cl</a> o al WhatsApp
              <a className="font-semibold text-blue-600" href="https://wa.me/56999999999" target="_blank" rel="noreferrer">
                {" "}+56 9 9999 9999
              </a>
              .
            </p>
            {patient.telefono_emergencia || patient.nombre_contacto_emergencia ? (
              <p className="mt-2 text-sm text-slate-600">
                Contacto de emergencia registrado: {patient.nombre_contacto_emergencia || "—"} ({patient.telefono_emergencia || "sin teléfono"}).
              </p>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
