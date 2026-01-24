// src/app/admin/encuestas/nueva/page.tsx
// Página para crear una nueva encuesta

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, Heart } from "lucide-react";

export default function NuevaEncuestaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    tipo: "VOLUNTARIOS_OPERATIVO" as "VOLUNTARIOS_OPERATIVO" | "PACIENTES_QUIRURGICO",
    delay_days: 2,
    activo: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear la encuesta");
        return;
      }

      router.push(`/admin/encuestas/${data.template.id}`);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/encuestas"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Encuestas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Encuesta</h1>
        <p className="text-gray-600 mt-1">
          Crea un nuevo template de encuesta de satisfacción
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Nombre */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la encuesta *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Encuesta de satisfacción voluntarios 2026"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Breve descripción que verá el encuestado"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tipo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de encuesta
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, tipo: "VOLUNTARIOS_OPERATIVO" })}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  form.tipo === "VOLUNTARIOS_OPERATIVO"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  form.tipo === "VOLUNTARIOS_OPERATIVO" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Voluntarios</p>
                  <p className="text-sm text-gray-500">Operativos regulares</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, tipo: "PACIENTES_QUIRURGICO" })}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  form.tipo === "PACIENTES_QUIRURGICO"
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  form.tipo === "PACIENTES_QUIRURGICO" ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-500"
                }`}>
                  <Heart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Pacientes</p>
                  <p className="text-sm text-gray-500">Operativos quirúrgicos</p>
                </div>
              </button>
            </div>
          </div>

          {/* Delay */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enviar encuesta después de
            </label>
            <select
              value={form.delay_days}
              onChange={(e) => setForm({ ...form, delay_days: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 5, 7, 14].map((d) => (
                <option key={d} value={d}>
                  {d} día{d > 1 ? "s" : ""} después de finalizar el operativo
                </option>
              ))}
            </select>
          </div>

          {/* Activo */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Encuesta activa</p>
                <p className="text-sm text-gray-500">
                  Solo las encuestas activas se programan automáticamente
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/encuestas"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear Encuesta
          </button>
        </div>
      </form>
    </div>
  );
}
