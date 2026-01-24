"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  QuirurgicoPacienteWithOperativo,
  OperativoQuirurgicoSummary,
  QuirurgicoComunicacion,
} from "@/lib/quirurgico";
import { buildQuirurgicoPortalUrl, normalizeRut } from "@/lib/quirurgico";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type FormMode = "create" | "edit";
type SendEmailResponse = { success: boolean; message: string };

type FormValues = {
  nombre_completo: string;
  rut: string;
  rut_ultimos4: string;
  email: string;
  telefono: string;
  telefono_emergencia: string;
  nombre_contacto_emergencia: string;
  ciudad_origen: string;
  operativo_quirurgico_id: string;
  requiere_vuelo: boolean;
  requiere_hospedaje: boolean;
  fecha_cirugia: string;
  hora_cirugia: string;
  fecha_llegada_ciudad: string;
  fecha_regreso_ciudad: string;
  diagnostico: string;
  cirugia_planificada: string;
  comentarios_paciente: string;
  portal_token: string;
  portal_is_active: boolean;
  alta_hospitalaria_estimada: string;
  vuelo_ida_fecha: string;
  vuelo_ida_numero: string;
  vuelo_ida_hora_salida: string;
  vuelo_ida_hora_llegada: string;
  vuelo_regreso_fecha: string;
  vuelo_regreso_hora_salida: string;
  vuelo_regreso_hora_llegada: string;
  hotel_nombre: string;
  hotel_direccion: string;
  hotel_checkin_inicial: string;
  hotel_checkout_inicial: string;
  hotel_checkin_post_cirugia: string;
  hotel_checkout_final: string;
  visita_enfermera_fecha: string;
  primera_kine_fecha: string;
  segunda_kine_fecha: string;
  curacion_fecha: string;
  dias_estimados_santiago: string;
};

type SurgicalPatientFormProps = {
  mode: FormMode;
  initialData?: QuirurgicoPacienteWithOperativo | null;
  operativos: OperativoQuirurgicoSummary[];
  portalBaseUrl?: string | null;
  comunicaciones?: QuirurgicoComunicacion[];
};

type FieldErrorKey = "nombre_completo" | "rut" | "operativo_quirurgico_id";
type FormErrors = Partial<Record<FieldErrorKey, string>>;

const emptyForm: FormValues = {
  nombre_completo: "",
  rut: "",
  rut_ultimos4: "",
  email: "",
  telefono: "",
  telefono_emergencia: "",
  nombre_contacto_emergencia: "",
  ciudad_origen: "",
  operativo_quirurgico_id: "",
  requiere_vuelo: false,
  requiere_hospedaje: false,
  fecha_cirugia: "",
  hora_cirugia: "",
  fecha_llegada_ciudad: "",
  fecha_regreso_ciudad: "",
  diagnostico: "",
  cirugia_planificada: "",
  comentarios_paciente: "",
  portal_token: "",
  portal_is_active: true,
  alta_hospitalaria_estimada: "",
  vuelo_ida_fecha: "",
  vuelo_ida_numero: "",
  vuelo_ida_hora_salida: "",
  vuelo_ida_hora_llegada: "",
  vuelo_regreso_fecha: "",
  vuelo_regreso_hora_salida: "",
  vuelo_regreso_hora_llegada: "",
  hotel_nombre: "",
  hotel_direccion: "",
  hotel_checkin_inicial: "",
  hotel_checkout_inicial: "",
  hotel_checkin_post_cirugia: "",
  hotel_checkout_final: "",
  visita_enfermera_fecha: "",
  primera_kine_fecha: "",
  segunda_kine_fecha: "",
  curacion_fecha: "",
  dias_estimados_santiago: "",
};

function toInputValue(value?: string | null): string {
  return value ?? "";
}

function formatCreatedAt(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_TIME_FORMAT.format(date);
}

function formatRutInputValue(raw: string) {
  if (!raw) return "";
  const cleaned = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (!cleaned) return "";
  if (cleaned.length === 1) {
    return cleaned;
  }
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const bodyWithDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${bodyWithDots}-${dv}`;
}

const COMM_DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const COMMUNICATION_TYPE_LABELS: Record<string, string> = {
  confirmacion: "Confirmación de cirugía",
};

const EMAIL_TYPE_OPTIONS = [{ value: "confirmacion", label: "Confirmación de cirugía" }];

function formatCommunicationType(value: string) {
  return COMMUNICATION_TYPE_LABELS[value] || value;
}

function formatCommunicationDate(value: string) {
  try {
    return COMM_DATE_FORMAT.format(new Date(value));
  } catch {
    return value;
  }
}

export function SurgicalPatientForm({ mode, initialData, operativos, portalBaseUrl, comunicaciones = [] }: SurgicalPatientFormProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormValues>(() => {
    const normalizedRut = initialData?.rut ? normalizeRut(initialData.rut) : null;
    return {
      ...emptyForm,
      ...(initialData
        ? {
            nombre_completo: initialData.nombre_completo,
            rut: normalizedRut?.formateado ?? toInputValue(initialData.rut),
            rut_ultimos4: normalizedRut?.ultimos4 ?? toInputValue(initialData.rut_ultimos4),
            email: toInputValue(initialData.email),
            telefono: toInputValue(initialData.telefono),
            telefono_emergencia: toInputValue(initialData.telefono_emergencia),
            nombre_contacto_emergencia: toInputValue(initialData.nombre_contacto_emergencia),
            ciudad_origen: toInputValue(initialData.ciudad_origen),
            operativo_quirurgico_id: toInputValue(initialData.operativo_quirurgico_id),
            requiere_vuelo: Boolean(initialData.requiere_vuelo),
            requiere_hospedaje: Boolean(initialData.requiere_hospedaje),
            fecha_cirugia: toInputValue(initialData.fecha_cirugia),
            hora_cirugia: toInputValue(initialData.hora_cirugia),
            fecha_llegada_ciudad: toInputValue(initialData.fecha_llegada_ciudad),
            fecha_regreso_ciudad: toInputValue(initialData.fecha_regreso_ciudad),
            diagnostico: toInputValue(initialData.diagnostico),
            cirugia_planificada: toInputValue(initialData.cirugia_planificada),
            comentarios_paciente: toInputValue(initialData.comentarios_paciente),
            portal_token: toInputValue(initialData.portal_token),
            portal_is_active: Boolean(initialData.portal_is_active),
            alta_hospitalaria_estimada: toInputValue(initialData.alta_hospitalaria_estimada),
            vuelo_ida_fecha: toInputValue(initialData.vuelo_ida_fecha),
            vuelo_ida_numero: toInputValue(initialData.vuelo_ida_numero),
            vuelo_ida_hora_salida: toInputValue(initialData.vuelo_ida_hora_salida),
            vuelo_ida_hora_llegada: toInputValue(initialData.vuelo_ida_hora_llegada),
            vuelo_regreso_fecha: toInputValue(initialData.vuelo_regreso_fecha),
            vuelo_regreso_hora_salida: toInputValue(initialData.vuelo_regreso_hora_salida),
            vuelo_regreso_hora_llegada: toInputValue(initialData.vuelo_regreso_hora_llegada),
            hotel_nombre: toInputValue(initialData.hotel_nombre),
            hotel_direccion: toInputValue(initialData.hotel_direccion),
            hotel_checkin_inicial: toInputValue(initialData.hotel_checkin_inicial),
            hotel_checkout_inicial: toInputValue(initialData.hotel_checkout_inicial),
            hotel_checkin_post_cirugia: toInputValue(initialData.hotel_checkin_post_cirugia),
            hotel_checkout_final: toInputValue(initialData.hotel_checkout_final),
            visita_enfermera_fecha: toInputValue(initialData.visita_enfermera_fecha),
            primera_kine_fecha: toInputValue(initialData.primera_kine_fecha),
            segunda_kine_fecha: toInputValue(initialData.segunda_kine_fecha),
            curacion_fecha: toInputValue(initialData.curacion_fecha),
            dias_estimados_santiago: initialData.dias_estimados_santiago
              ? String(initialData.dias_estimados_santiago)
              : "",
          }
        : {}),
    };
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<
    { type: "success" | "error" | "loading"; message: string } | null
  >(null);
  const [emailType, setEmailType] = useState<string>(EMAIL_TYPE_OPTIONS[0]?.value ?? "confirmacion");

  const portalUrl = useMemo(
    () => buildQuirurgicoPortalUrl(formValues.portal_token, portalBaseUrl),
    [formValues.portal_token, portalBaseUrl]
  );

  const isFieldErrorKey = (value: string): value is FieldErrorKey =>
    value === "nombre_completo" || value === "rut" || value === "operativo_quirurgico_id";

  const clearFieldError = (name: string) => {
    if (!isFieldErrorKey(name)) return;
    setFormErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleRutChange = (value: string) => {
    const formatted = formatRutInputValue(value);
    const normalized = formatted ? normalizeRut(formatted) : null;
    setFormValues((prev) => ({
      ...prev,
      rut: formatted,
      rut_ultimos4: normalized?.ultimos4 ?? "",
    }));
    clearFieldError("rut");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (name === "rut") {
      handleRutChange(value);
      return;
    }
    setFormValues((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: checked }));
  };

  const handleEmailTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEmailType(event.target.value);
  };

  const handleGenerateToken = () => {
    const newToken = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setFormValues((prev) => ({ ...prev, portal_token: newToken }));
  };

  const handleCopyLink = async () => {
    try {
      if (!portalUrl) {
        throw new Error("Sin enlace disponible");
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(portalUrl);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2500);
        return;
      }
      if (typeof window !== "undefined") {
        window.prompt("Portal del paciente", portalUrl);
        setCopyStatus("idle");
        return;
      }
      throw new Error("Copiado no soportado");
    } catch (err) {
      console.error(err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2500);
    }
  };

  const handleOpenPortal = () => {
    if (!portalUrl || !formValues.portal_is_active) {
      return;
    }
    if (typeof window !== "undefined") {
      window.open(portalUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSendConfirmationEmail = async () => {
    if (!initialData?.id) {
      return;
    }

    if (!formValues.email) {
      setEmailFeedback({ type: "error", message: "El paciente no tiene correo electrónico registrado." });
      return;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `¿Enviar "${formatCommunicationType(emailType)}" a ${formValues.email}?`,
      );
      if (!confirmed) {
        return;
      }
    }

    setSendingEmail(true);
    setEmailFeedback({ type: "loading", message: "Enviando correo..." });

    try {
      const res = await fetch(`/api/admin/quirurgico/pacientes/${initialData.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: emailType }),
      });
      const payload = (await res.json()) as SendEmailResponse;

      if (!payload.success) {
        console.error("[quirurgico] enviar correo", { status: res.status, payload });
        setEmailFeedback({ type: "error", message: payload.message });
        return;
      }

      setEmailFeedback({ type: "success", message: payload.message || "Correo enviado correctamente." });
      router.refresh();
    } catch (error) {
      console.error("[quirurgico] enviar correo", error);
      const message = error instanceof Error ? error.message : "No se pudo enviar el correo. Intenta nuevamente.";
      setEmailFeedback({ type: "error", message });
    } finally {
      setSendingEmail(false);
    }
  };

  const normalizePayload = () => {
    const normalize = (value: string) => value.trim() || null;
    const normalizeNumber = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const normalizedRutValue = normalizeRut(formValues.rut);
    const payload = {
      nombre_completo: formValues.nombre_completo.trim(),
      rut: normalizedRutValue?.canonico ?? null,
      rut_ultimos4: normalizedRutValue?.ultimos4 ?? null,
      email: normalize(formValues.email),
      telefono: normalize(formValues.telefono),
      telefono_emergencia: normalize(formValues.telefono_emergencia),
      nombre_contacto_emergencia: normalize(formValues.nombre_contacto_emergencia),
      ciudad_origen: normalize(formValues.ciudad_origen),
      operativo_quirurgico_id: normalize(formValues.operativo_quirurgico_id),
      requiere_vuelo: Boolean(formValues.requiere_vuelo),
      requiere_hospedaje: Boolean(formValues.requiere_hospedaje),
      diagnostico: normalize(formValues.diagnostico),
      cirugia_planificada: normalize(formValues.cirugia_planificada),
      fecha_cirugia: normalize(formValues.fecha_cirugia),
      hora_cirugia: normalize(formValues.hora_cirugia),
      fecha_llegada_ciudad: normalize(formValues.fecha_llegada_ciudad),
      fecha_regreso_ciudad: normalize(formValues.fecha_regreso_ciudad),
      portal_token: normalize(formValues.portal_token),
      portal_is_active: Boolean(formValues.portal_is_active),
      comentarios_paciente: normalize(formValues.comentarios_paciente),
      alta_hospitalaria_estimada: normalize(formValues.alta_hospitalaria_estimada),
      vuelo_ida_fecha: normalize(formValues.vuelo_ida_fecha),
      vuelo_ida_numero: normalize(formValues.vuelo_ida_numero),
      vuelo_ida_hora_salida: normalize(formValues.vuelo_ida_hora_salida),
      vuelo_ida_hora_llegada: normalize(formValues.vuelo_ida_hora_llegada),
      vuelo_regreso_fecha: normalize(formValues.vuelo_regreso_fecha),
      vuelo_regreso_hora_salida: normalize(formValues.vuelo_regreso_hora_salida),
      vuelo_regreso_hora_llegada: normalize(formValues.vuelo_regreso_hora_llegada),
      hotel_nombre: normalize(formValues.hotel_nombre),
      hotel_direccion: normalize(formValues.hotel_direccion),
      hotel_checkin_inicial: normalize(formValues.hotel_checkin_inicial),
      hotel_checkout_inicial: normalize(formValues.hotel_checkout_inicial),
      hotel_checkin_post_cirugia: normalize(formValues.hotel_checkin_post_cirugia),
      hotel_checkout_final: normalize(formValues.hotel_checkout_final),
      visita_enfermera_fecha: normalize(formValues.visita_enfermera_fecha),
      primera_kine_fecha: normalize(formValues.primera_kine_fecha),
      segunda_kine_fecha: normalize(formValues.segunda_kine_fecha),
      curacion_fecha: normalize(formValues.curacion_fecha),
      dias_estimados_santiago: normalizeNumber(formValues.dias_estimados_santiago),
    };

    return payload;
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formValues.nombre_completo.trim()) {
      errors.nombre_completo = "El nombre completo es obligatorio.";
    }
    if (!formValues.rut.trim()) {
      errors.rut = "El RUT es obligatorio.";
    } else if (!normalizeRut(formValues.rut)) {
      errors.rut = "Ingresa un RUT válido (ej: 21.793.351-K).";
    }
    if (!formValues.operativo_quirurgico_id.trim()) {
      errors.operativo_quirurgico_id = "Selecciona un operativo quirúrgico.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const payload = normalizePayload();
      const url =
        mode === "create"
          ? "/api/admin/quirurgico/pacientes"
          : `/api/admin/quirurgico/pacientes/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No se pudo guardar el paciente.");
      }

      router.push("/admin/quirurgico/pacientes");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el paciente.";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const buildOperativoLabel = (op: OperativoQuirurgicoSummary) => {
    const location = [op.ciudad, op.lugar].filter(Boolean).join(" · ");
    return location ? `${op.titulo} · ${location}` : op.titulo;
  };

  const createdLabel = useMemo(() => formatCreatedAt(initialData?.created_at), [initialData?.created_at]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{errorMessage}</div>
      ) : null}

      <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Datos básicos</h2>
          <p className="text-sm text-slate-500">Información principal del paciente.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Nombre completo*
            <input
              name="nombre_completo"
              value={formValues.nombre_completo}
              onChange={handleInputChange}
              required
              aria-invalid={Boolean(formErrors.nombre_completo)}
              className={`mt-1 w-full rounded-2xl border px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                formErrors.nombre_completo ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {formErrors.nombre_completo ? (
              <p className="mt-1 text-xs text-rose-600">{formErrors.nombre_completo}</p>
            ) : null}
          </label>
          <label className="text-sm font-medium text-slate-700">
            RUT
            <input
              name="rut"
              value={formValues.rut}
              onChange={handleInputChange}
              placeholder="12.345.678-9"
              required
              aria-invalid={Boolean(formErrors.rut)}
              className={`mt-1 w-full rounded-2xl border px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                formErrors.rut ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {formErrors.rut ? <p className="mt-1 text-xs text-rose-600">{formErrors.rut}</p> : null}
          </label>
          <div>
            <span className="text-sm font-medium text-slate-700">Últimos 4 del RUT</span>
            <input
              name="rut_ultimos4"
              value={formValues.rut_ultimos4}
              readOnly
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600"
            />
            <p className="mt-1 text-xs text-slate-500">Se actualiza automáticamente al ingresar el RUT.</p>
          </div>
          {createdLabel ? (
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Creado el</span>
              <p>{createdLabel}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Contacto</h2>
          <p className="text-sm text-slate-500">Datos para comunicaciones y emergencias.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleInputChange}
              placeholder="paciente@correo.cl"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Teléfono
            <input
              name="telefono"
              value={formValues.telefono}
              onChange={handleInputChange}
              placeholder="+56 9 1234 5678"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Teléfono de emergencia
            <input
              name="telefono_emergencia"
              value={formValues.telefono_emergencia}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contacto de emergencia
            <input
              name="nombre_contacto_emergencia"
              value={formValues.nombre_contacto_emergencia}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Ciudad de origen
            <input
              name="ciudad_origen"
              value={formValues.ciudad_origen}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Operativo y logística</h2>
          <p className="text-sm text-slate-500">Asigna el operativo y define las necesidades de traslado.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Operativo asignado
            <select
              name="operativo_quirurgico_id"
              value={formValues.operativo_quirurgico_id}
              onChange={handleInputChange}
              required
              aria-invalid={Boolean(formErrors.operativo_quirurgico_id)}
              className={`mt-1 w-full rounded-2xl border px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                formErrors.operativo_quirurgico_id
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            >
              <option value="">Selecciona un operativo</option>
              {operativos.map((op) => (
                <option key={op.id} value={op.id}>
                  {buildOperativoLabel(op)}
                </option>
              ))}
            </select>
            {operativos.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">Debes crear al menos un operativo para asignarlo.</p>
            ) : null}
            {formErrors.operativo_quirurgico_id ? (
              <p className="mt-1 text-xs text-rose-600">{formErrors.operativo_quirurgico_id}</p>
            ) : null}
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fecha cirugía
            <input
              type="date"
              name="fecha_cirugia"
              value={formValues.fecha_cirugia}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Hora cirugía
            <input
              type="time"
              name="hora_cirugia"
              value={formValues.hora_cirugia}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fecha llegada ciudad
            <input
              type="date"
              name="fecha_llegada_ciudad"
              value={formValues.fecha_llegada_ciudad}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fecha regreso ciudad
            <input
              type="date"
              name="fecha_regreso_ciudad"
              value={formValues.fecha_regreso_ciudad}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Información médica</h2>
          <p className="text-sm text-slate-500">Diagnóstico y planificación de la cirugía.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Diagnóstico
            <textarea
              name="diagnostico"
              value={formValues.diagnostico}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Cirugía planificada
            <textarea
              name="cirugia_planificada"
              value={formValues.cirugia_planificada}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
        <label className="text-sm font-medium text-slate-700">
          Comentarios del paciente
          <textarea
            name="comentarios_paciente"
            value={formValues.comentarios_paciente}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Logística de viaje</h2>
          <p className="text-sm text-slate-500">Controla fechas de llegada/regreso y los vuelos coordinados.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="requiere_vuelo"
            checked={formValues.requiere_vuelo}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Requiere coordinación de vuelos
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Fecha llegada a la ciudad
            <input
              type="date"
              name="fecha_llegada_ciudad"
              value={formValues.fecha_llegada_ciudad}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fecha de regreso
            <input
              type="date"
              name="fecha_regreso_ciudad"
              value={formValues.fecha_regreso_ciudad}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Detalle de vuelos</p>
          <p className="text-xs text-slate-500">Completa estos campos solo si los vuelos ya están confirmados.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Fecha vuelo ida
            <input
              type="date"
              name="vuelo_ida_fecha"
              value={formValues.vuelo_ida_fecha}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Nº vuelo ida
            <input
              name="vuelo_ida_numero"
              value={formValues.vuelo_ida_numero}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Hora salida ida
            <input
              type="time"
              name="vuelo_ida_hora_salida"
              value={formValues.vuelo_ida_hora_salida}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Hora llegada ida
            <input
              type="time"
              name="vuelo_ida_hora_llegada"
              value={formValues.vuelo_ida_hora_llegada}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fecha vuelo regreso
            <input
              type="date"
              name="vuelo_regreso_fecha"
              value={formValues.vuelo_regreso_fecha}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Hora salida regreso
            <input
              type="time"
              name="vuelo_regreso_hora_salida"
              value={formValues.vuelo_regreso_hora_salida}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Hora llegada regreso
            <input
              type="time"
              name="vuelo_regreso_hora_llegada"
              value={formValues.vuelo_regreso_hora_llegada}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Hotel / Hospedaje</h2>
          <p className="text-sm text-slate-500">Registra la reserva y fechas clave del hospedaje.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="requiere_hospedaje"
            checked={formValues.requiere_hospedaje}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Requiere hospedaje
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Nombre del hotel
            <input
              name="hotel_nombre"
              value={formValues.hotel_nombre}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Dirección
            <input
              name="hotel_direccion"
              value={formValues.hotel_direccion}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Check-in inicial
            <input
              type="date"
              name="hotel_checkin_inicial"
              value={formValues.hotel_checkin_inicial}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Check-out inicial
            <input
              type="date"
              name="hotel_checkout_inicial"
              value={formValues.hotel_checkout_inicial}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Check-in post cirugía
            <input
              type="date"
              name="hotel_checkin_post_cirugia"
              value={formValues.hotel_checkin_post_cirugia}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Check-out final
            <input
              type="date"
              name="hotel_checkout_final"
              value={formValues.hotel_checkout_final}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Plan de recuperación</h2>
          <p className="text-sm text-slate-500">Fechas clave y días estimados en Santiago.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Alta hospitalaria estimada
            <input
              type="date"
              name="alta_hospitalaria_estimada"
              value={formValues.alta_hospitalaria_estimada}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Visita enfermera
            <input
              type="date"
              name="visita_enfermera_fecha"
              value={formValues.visita_enfermera_fecha}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            1ª sesión kinesióloga
            <input
              type="date"
              name="primera_kine_fecha"
              value={formValues.primera_kine_fecha}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            2ª sesión kinesióloga
            <input
              type="date"
              name="segunda_kine_fecha"
              value={formValues.segunda_kine_fecha}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Curación
            <input
              type="date"
              name="curacion_fecha"
              value={formValues.curacion_fecha}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Días estimados en Santiago
            <input
              type="number"
              min="0"
              name="dias_estimados_santiago"
              value={formValues.dias_estimados_santiago}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-blue-100 bg-blue-50/80 p-6 shadow-lg shadow-blue-900/10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Portal del paciente</h2>
            <p className="text-sm text-slate-600">
              Controla el acceso al portal y genera tokens seguros cuando necesites compartir el enlace.
            </p>
          </div>
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
            <span>Portal activo</span>
            <input
              type="checkbox"
              name="portal_is_active"
              checked={formValues.portal_is_active}
              onChange={handleCheckboxChange}
              className="h-5 w-10 rounded-full border-slate-300 text-blue-600"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Token actual
            <input
              name="portal_token"
              value={formValues.portal_token}
              readOnly
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900"
            />
          </label>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGenerateToken}
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:text-blue-900"
            >
              {formValues.portal_token ? "Regenerar token" : "Generar token"}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Enlace del portal</p>
          {portalUrl ? (
            <>
              <input
                value={portalUrl}
                readOnly
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-mono text-slate-700"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleOpenPortal}
                  disabled={!formValues.portal_is_active}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    formValues.portal_is_active
                      ? "border border-blue-200 text-blue-700 hover:border-blue-300 hover:text-blue-900"
                      : "border border-slate-200 text-slate-400"
                  }`}
                >
                  Abrir portal
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {copyStatus === "copied" ? "Link copiado" : copyStatus === "error" ? "Error al copiar" : "Copiar enlace"}
                </button>
              </div>
              {!formValues.portal_is_active ? (
                <p className="text-xs text-rose-600">Portal desactivado. Actívalo para compartir el enlace.</p>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-slate-500">Portal desactivado. Genera un token y actívalo para obtener el enlace.</p>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Comunicaciones</h2>
          <p className="text-sm text-slate-500">
            Envía un correo con el resumen clínico y logístico del operativo a este paciente y revisa los envíos previos.
          </p>
        </div>

        {formValues.email ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Tipo de correo
              <select
                value={emailType}
                onChange={handleEmailTypeChange}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {EMAIL_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2 sm:items-end">
              <button
                type="button"
                onClick={handleSendConfirmationEmail}
                disabled={sendingEmail}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingEmail ? "Enviando correo…" : "Enviar correo"}
              </button>
              {emailFeedback ? (
                <p
                  className={`text-sm ${
                    emailFeedback.type === "success"
                      ? "text-emerald-700"
                      : emailFeedback.type === "loading"
                        ? "text-slate-600"
                        : "text-rose-600"
                  }`}
                >
                  {emailFeedback.message}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            El paciente no tiene correo electrónico registrado. Agrega uno para poder enviarle comunicaciones.
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Historial reciente</h3>
          {comunicaciones.length ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Destinatario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comunicaciones.map((com) => (
                    <tr key={com.id}>
                      <td className="px-4 py-3 text-slate-600">{formatCommunicationDate(com.enviado_at)}</td>
                      <td className="px-4 py-3 text-slate-900">
                        <div className="font-semibold">{formatCommunicationType(com.tipo)}</div>
                        {com.subject ? <p className="text-xs font-normal text-slate-500">{com.subject}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{com.to_email}</div>
                        {com.body_preview ? (
                          <p className="text-xs text-slate-500">{com.body_preview}</p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No hay comunicaciones registradas todavía.</p>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/quirurgico/pacientes"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando…" : mode === "create" ? "Crear paciente" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
