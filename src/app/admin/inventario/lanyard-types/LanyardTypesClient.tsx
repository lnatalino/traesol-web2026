"use client";

import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/errors";
import { Plus, Edit2, Trash2, Ribbon } from "lucide-react";

type LanyardType = {
  id: string;
  name: string;
  slug: string;
  ribbon_color_name: string;
  ribbon_hex: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const DEFAULT_FORM = {
  name: "",
  slug: "",
  ribbon_color_name: "",
  ribbon_hex: "#3b82f6",
  description: "",
  display_order: 0,
};

export function LanyardTypesClient() {
  const [types, setTypes] = useState<LanyardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchTypes();
  }, []);

  async function fetchTypes() {
    try {
      const response = await fetch("/api/admin/inventario/lanyard-types");
      const data = await response.json();
      if (data.data) {
        setTypes(data.data);
      }
    } catch (error) {
      setFeedback({ type: "error", message: "Error al cargar tipos de lanyard" });
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(true);
    setFeedback(null);
  }

  function startEdit(type: LanyardType) {
    setForm({
      name: type.name,
      slug: type.slug,
      ribbon_color_name: type.ribbon_color_name,
      ribbon_hex: type.ribbon_hex || "#3b82f6",
      description: type.description || "",
      display_order: type.display_order,
    });
    setEditingId(type.id);
    setShowForm(true);
    setFeedback(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFeedback(null);

    try {
      const url = editingId
        ? `/api/admin/inventario/lanyard-types/${editingId}`
        : "/api/admin/inventario/lanyard-types";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      setFeedback({ type: "success", message: editingId ? "Tipo actualizado" : "Tipo creado" });
      cancelForm();
      fetchTypes();
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "Error al guardar") });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este tipo de lanyard? Esta acción no se puede deshacer.")) return;

    try {
      const response = await fetch(`/api/admin/inventario/lanyard-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar");
      }

      setFeedback({ type: "success", message: "Tipo eliminado" });
      fetchTypes();
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "Error al eliminar") });
    }
  }

  async function toggleActive(type: LanyardType) {
    try {
      const response = await fetch(`/api/admin/inventario/lanyard-types/${type.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !type.is_active }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar");
      }

      fetchTypes();
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "Error al actualizar") });
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tipos de lanyard por tema</h2>
          <p className="text-sm text-slate-500">
            Colores de cinta por tipo de cáncer u otros temas de operativos.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            {editingId ? "Editar tipo de lanyard" : "Crear tipo de lanyard"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Cáncer de mama"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                  placeholder="Ej: mama"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre del color</label>
                <input
                  type="text"
                  value={form.ribbon_color_name}
                  onChange={(e) => setForm((f) => ({ ...f, ribbon_color_name: e.target.value }))}
                  placeholder="Ej: Rosado"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Color hex</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={form.ribbon_hex}
                    onChange={(e) => setForm((f) => ({ ...f, ribbon_hex: e.target.value }))}
                    className="h-10 w-16 cursor-pointer rounded border border-slate-200"
                  />
                  <input
                    type="text"
                    value={form.ribbon_hex}
                    onChange={(e) => setForm((f) => ({ ...f, ribbon_hex: e.target.value }))}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Orden de visualización</label>
                <input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción opcional del tipo de lanyard"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Color
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {types.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No hay tipos de lanyard definidos aún.
                </td>
              </tr>
            ) : (
              types.map((type) => (
                <tr key={type.id} className={!type.is_active ? "bg-slate-50 opacity-60" : ""}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-6 w-6 rounded-full border border-slate-200"
                        style={{ backgroundColor: type.ribbon_hex || "#e2e8f0" }}
                      />
                      <span className="text-sm text-slate-600">{type.ribbon_color_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Ribbon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{type.name}</span>
                    </div>
                    {type.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{type.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {type.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(type)}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        type.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {type.is_active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(type)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(type.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-rose-100 hover:text-rose-700"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
