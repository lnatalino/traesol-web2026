"use client";

// src/app/admin/quirurgico/operativos/_components/OperativoForm.tsx
// Formulario para crear/editar operativos quirúrgicos

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OperativoQuirurgico } from "@/lib/quirurgico/types";

interface OperativoFormProps {
  operativo?: OperativoQuirurgico | null;
  onSuccess?: () => void;
}

type FormData = {
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  ciudad: string;
  lugar: string;
  imagen_cabecera_url: string;
  publicado: boolean;
  estado: string;
};

export function OperativoForm({ operativo, onSuccess }: OperativoFormProps) {
  const router = useRouter();
  const isEdit = Boolean(operativo?.id);

  const [formData, setFormData] = useState<FormData>({
    titulo: operativo?.titulo || "",
    descripcion: operativo?.descripcion || "",
    fecha_inicio: operativo?.fecha_inicio?.split("T")[0] || "",
    fecha_fin: operativo?.fecha_fin?.split("T")[0] || "",
    ciudad: operativo?.ciudad || "",
    lugar: operativo?.lugar || "",
    imagen_cabecera_url: operativo?.imagen_cabecera_url || "",
    publicado: operativo?.publicado || false,
    estado: operativo?.estado || "draft",
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
      const url = isEdit
        ? `/api/admin/quirurgico/operativos/${operativo!.id}`
        : "/api/admin/quirurgico/operativos";

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/admin/quirurgico/operativos/${result.operativo?.id || operativo?.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Título */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Título del operativo *
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: Operativo Quirúrgico Atacama 2026"
            />
          </label>
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Descripción
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Descripción del operativo..."
            />
          </label>
        </div>

        {/* Fecha inicio */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Fecha de inicio
            <input
              type="date"
              name="fecha_inicio"
              value={formData.fecha_inicio}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {/* Fecha fin */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Fecha de fin
            <input
              type="date"
              name="fecha_fin"
              value={formData.fecha_fin}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Ciudad
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: Copiapó"
            />
          </label>
        </div>

        {/* Lugar */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Lugar / Hospital
            <input
              type="text"
              name="lugar"
              value={formData.lugar}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: Hospital Regional de Copiapó"
            />
          </label>
        </div>

        {/* Imagen cabecera */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            URL de imagen de cabecera
            <input
              type="url"
              name="imagen_cabecera_url"
              value={formData.imagen_cabecera_url}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="https://..."
            />
          </label>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Estado
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="draft">Borrador</option>
              <option value="publicado">Publicado</option>
              <option value="cerrado">Cerrado (sin nuevas postulaciones)</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </label>
        </div>

        {/* Publicado */}
        <div className="flex items-center gap-3 pt-6">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="publicado"
              checked={formData.publicado}
              onChange={handleChange}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100"></div>
            <span className="ml-3 text-sm font-medium text-slate-700">
              Visible en público
            </span>
          </label>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4">
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
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear operativo"}
        </button>
      </div>
    </form>
  );
}
