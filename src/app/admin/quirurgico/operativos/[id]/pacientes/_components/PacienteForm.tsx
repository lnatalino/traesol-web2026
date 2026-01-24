"use client";

// src/app/admin/quirurgico/operativos/[id]/pacientes/_components/PacienteForm.tsx
// Formulario para crear/editar pacientes

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Paciente, OperativoQuirurgicoSummary } from "@/lib/quirurgico/types";

interface PacienteFormProps {
  paciente?: Paciente | null;
  operativo: OperativoQuirurgicoSummary;
  onSuccess?: () => void;
}

export function PacienteForm({ paciente, operativo, onSuccess }: PacienteFormProps) {
  const router = useRouter();
  const isEdit = Boolean(paciente?.id);

  const [formData, setFormData] = useState({
    // Datos personales
    nombres: paciente?.nombres || "",
    apellidos: paciente?.apellidos || "",
    rut: paciente?.rut || "",
    fecha_nacimiento: paciente?.fecha_nacimiento || "",
    genero: paciente?.genero || "",
    
    // Contacto
    telefono: paciente?.telefono || "",
    email: paciente?.email || "",
    direccion: paciente?.direccion || "",
    ciudad_origen: paciente?.ciudad_origen || "",
    
    // Médico
    diagnostico: paciente?.diagnostico || "",
    cirugia_planificada: paciente?.cirugia_planificada || "",
    fecha_cirugia: paciente?.fecha_cirugia || "",
    hora_cirugia: paciente?.hora_cirugia || "",
    alta_hospitalaria_estimada: paciente?.alta_hospitalaria_estimada || "",
    
    // Logística
    requiere_vuelo: paciente?.requiere_vuelo || false,
    requiere_hospedaje: paciente?.requiere_hospedaje || false,
    fecha_llegada_ciudad: paciente?.fecha_llegada_ciudad || "",
    fecha_regreso_ciudad: paciente?.fecha_regreso_ciudad || "",
    
    // Admin
    notes_admin: paciente?.notes_admin || "",
    estado: paciente?.estado || "activo",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        operativo_quirurgico_id: operativo.id,
      };

      const url = isEdit
        ? `/api/admin/quirurgico/pacientes-v2/${paciente!.id}`
        : "/api/admin/quirurgico/pacientes-v2";

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/admin/quirurgico/operativos/${operativo.id}/pacientes/${result.paciente?.id || paciente?.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Datos personales */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Datos personales
        </legend>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nombres *
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Apellidos *
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              RUT
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                placeholder="12.345.678-9"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Fecha de nacimiento
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Género
              <select
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
          </div>
        </div>
      </fieldset>

      {/* Contacto */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Contacto
        </legend>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Teléfono
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Ciudad de origen
              <input
                type="text"
                name="ciudad_origen"
                value={formData.ciudad_origen}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Dirección
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
        </div>
      </fieldset>

      {/* Información médica */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Información médica
        </legend>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Diagnóstico
              <textarea
                name="diagnostico"
                value={formData.diagnostico}
                onChange={handleChange}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Cirugía planificada
              <textarea
                name="cirugia_planificada"
                value={formData.cirugia_planificada}
                onChange={handleChange}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Fecha de cirugía
              <input
                type="date"
                name="fecha_cirugia"
                value={formData.fecha_cirugia}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Hora de cirugía
              <input
                type="time"
                name="hora_cirugia"
                value={formData.hora_cirugia}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Alta hospitalaria estimada
              <input
                type="date"
                name="alta_hospitalaria_estimada"
                value={formData.alta_hospitalaria_estimada}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
        </div>
      </fieldset>

      {/* Logística */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Logística
        </legend>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requiere_vuelo"
                checked={formData.requiere_vuelo}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Requiere vuelo</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requiere_hospedaje"
                checked={formData.requiere_hospedaje}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Requiere hospedaje</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Fecha llegada a la ciudad
              <input
                type="date"
                name="fecha_llegada_ciudad"
                value={formData.fecha_llegada_ciudad}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Fecha regreso a su ciudad
              <input
                type="date"
                name="fecha_regreso_ciudad"
                value={formData.fecha_regreso_ciudad}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
        </div>
      </fieldset>

      {/* Admin */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Administración
        </legend>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Estado
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="activo">Activo</option>
                <option value="operado">Operado</option>
                <option value="alta">Alta</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Notas internas (solo admin)
              <textarea
                name="notes_admin"
                value={formData.notes_admin}
                onChange={handleChange}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Notas visibles solo para administradores..."
              />
            </label>
          </div>
        </div>
      </fieldset>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear paciente"}
        </button>
      </div>
    </form>
  );
}
