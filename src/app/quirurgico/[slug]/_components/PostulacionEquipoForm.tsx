// src/app/quirurgico/[slug]/_components/PostulacionEquipoForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

type Props = {
  operativoId: string;
  operativoTitulo: string;
};

type FormData = {
  nombres: string;
  apellidos: string;
  rut: string;
  email: string;
  telefono: string;
  profesion: string;
  especialidad: string;
  registro_superint: string;
  anos_experiencia: string;
  experiencia_pabellon: string;
  certificaciones: string;
  disponibilidad_completa: boolean;
  notas_disponibilidad: string;
};

const profesionOptions = [
  "Médico/a Cirujano/a",
  "Médico/a Anestesiólogo/a",
  "Enfermero/a",
  "Instrumentista Quirúrgico/a",
  "Técnico/a en Enfermería (TENS)",
  "Kinesiólogo/a",
  "Arsenalero/a",
  "Nutricionista",
  "Psicólogo/a",
  "Trabajador/a Social",
  "Paramédico",
  "Estudiante de Medicina",
  "Estudiante de Enfermería",
  "Otro profesional de salud",
];

const experienciaPabellonOptions = [
  "Sin experiencia",
  "Menos de 1 año",
  "1-3 años",
  "3-5 años",
  "Más de 5 años",
];

export function PostulacionEquipoForm({ operativoId, operativoTitulo }: Props) {
  const [formData, setFormData] = useState<FormData>({
    nombres: "",
    apellidos: "",
    rut: "",
    email: "",
    telefono: "",
    profesion: "",
    especialidad: "",
    registro_superint: "",
    anos_experiencia: "",
    experiencia_pabellon: "",
    certificaciones: "",
    disponibilidad_completa: true,
    notas_disponibilidad: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/quirurgico/postulacion-equipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operativo_quirurgico_id: operativoId,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al enviar postulación");
      }

      setSubmitStatus("success");
      setFormData({
        nombres: "",
        apellidos: "",
        rut: "",
        email: "",
        telefono: "",
        profesion: "",
        especialidad: "",
        registro_superint: "",
        anos_experiencia: "",
        experiencia_pabellon: "",
        certificaciones: "",
        disponibilidad_completa: true,
        notas_disponibilidad: "",
      });
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-3" />
        <h3 className="text-lg font-semibold text-green-800 mb-1">
          ¡Postulación enviada!
        </h3>
        <p className="text-sm text-green-700">
          Hemos recibido tu postulación para el operativo &quot;{operativoTitulo}&quot;. 
          Te contactaremos pronto.
        </p>
        <button
          type="button"
          onClick={() => setSubmitStatus("idle")}
          className="mt-4 text-sm font-medium text-green-700 hover:text-green-800 underline"
        >
          Enviar otra postulación
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitStatus === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Nombres */}
      <div>
        <label htmlFor="nombres" className="block text-sm font-medium text-slate-700 mb-1">
          Nombres *
        </label>
        <input
          type="text"
          id="nombres"
          name="nombres"
          value={formData.nombres}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
          placeholder="Juan Pablo"
        />
      </div>

      {/* Apellidos */}
      <div>
        <label htmlFor="apellidos" className="block text-sm font-medium text-slate-700 mb-1">
          Apellidos *
        </label>
        <input
          type="text"
          id="apellidos"
          name="apellidos"
          value={formData.apellidos}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
          placeholder="González Pérez"
        />
      </div>

      {/* RUT */}
      <div>
        <label htmlFor="rut" className="block text-sm font-medium text-slate-700 mb-1">
          RUT
        </label>
        <input
          type="text"
          id="rut"
          name="rut"
          value={formData.rut}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
          placeholder="12.345.678-9"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Correo electrónico *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
          placeholder="juan@ejemplo.com"
        />
      </div>

      {/* Teléfono */}
      <div>
        <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          id="telefono"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
          placeholder="+56 9 1234 5678"
        />
      </div>

      {/* Profesión */}
      <div>
        <label htmlFor="profesion" className="block text-sm font-medium text-slate-700 mb-1">
          Profesión *
        </label>
        <select
          id="profesion"
          name="profesion"
          value={formData.profesion}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition bg-white"
        >
          <option value="">Selecciona una opción</option>
          {profesionOptions.map((prof) => (
            <option key={prof} value={prof}>
              {prof}
            </option>
          ))}
        </select>
      </div>

      {/* Especialidad */}
      <div>
        <label htmlFor="especialidad" className="block text-sm font-medium text-slate-700 mb-1">
          Especialidad (si aplica)
        </label>
        <input
          type="text"
          id="especialidad"
          name="especialidad"
          value={formData.especialidad}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
          placeholder="Ej: Cirugía plástica, Pediatría"
        />
      </div>

      {/* Registro Superint */}
      <div>
        <label htmlFor="registro_superint" className="block text-sm font-medium text-slate-700 mb-1">
          Registro Superintendencia
        </label>
        <input
          type="text"
          id="registro_superint"
          name="registro_superint"
          value={formData.registro_superint}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
          placeholder="Número de registro"
        />
      </div>

      {/* Años de experiencia */}
      <div>
        <label htmlFor="anos_experiencia" className="block text-sm font-medium text-slate-700 mb-1">
          Años de experiencia profesional
        </label>
        <input
          type="number"
          id="anos_experiencia"
          name="anos_experiencia"
          value={formData.anos_experiencia}
          onChange={handleChange}
          min="0"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
          placeholder="5"
        />
      </div>

      {/* Experiencia en pabellón */}
      <div>
        <label htmlFor="experiencia_pabellon" className="block text-sm font-medium text-slate-700 mb-1">
          Experiencia en pabellón
        </label>
        <select
          id="experiencia_pabellon"
          name="experiencia_pabellon"
          value={formData.experiencia_pabellon}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition bg-white"
        >
          <option value="">Selecciona una opción</option>
          {experienciaPabellonOptions.map((exp) => (
            <option key={exp} value={exp}>
              {exp}
            </option>
          ))}
        </select>
      </div>

      {/* Certificaciones */}
      <div>
        <label htmlFor="certificaciones" className="block text-sm font-medium text-slate-700 mb-1">
          Certificaciones relevantes
        </label>
        <textarea
          id="certificaciones"
          name="certificaciones"
          value={formData.certificaciones}
          onChange={handleChange}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition resize-none"
          placeholder="BLS, ACLS, cursos especializados..."
        />
      </div>

      {/* Disponibilidad completa */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="disponibilidad_completa"
          name="disponibilidad_completa"
          checked={formData.disponibilidad_completa}
          onChange={handleChange}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
        />
        <label htmlFor="disponibilidad_completa" className="text-sm text-slate-700">
          Tengo disponibilidad completa para las fechas del operativo
        </label>
      </div>

      {/* Notas de disponibilidad */}
      {!formData.disponibilidad_completa && (
        <div>
          <label htmlFor="notas_disponibilidad" className="block text-sm font-medium text-slate-700 mb-1">
            Notas sobre disponibilidad
          </label>
          <textarea
            id="notas_disponibilidad"
            name="notas_disponibilidad"
            value={formData.notas_disponibilidad}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition resize-none"
            placeholder="Indica las fechas en que estarías disponible..."
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </span>
        ) : (
          "Enviar postulación"
        )}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Al enviar aceptas nuestra{" "}
        <a href="/privacidad" className="underline hover:text-slate-700">
          política de privacidad
        </a>
        .
      </p>
    </form>
  );
}
