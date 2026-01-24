"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toSlug } from "@/lib/slug";
import type { InventarioCategoria } from "@/lib/inventario/types";

type AlertState = { type: "success" | "error"; message: string; debug?: string } | null;

type CategoryFormState = {
  id: string | null;
  nombre: string;
  slug: string;
  descripcion: string;
};

type CategoryManagerProps = {
  initialCategories: InventarioCategoria[];
  categoryCounts: Record<string, number>;
};

const emptyForm: CategoryFormState = {
  id: null,
  nombre: "",
  slug: "",
  descripcion: "",
};

const sortByName = (a: InventarioCategoria, b: InventarioCategoria) => a.nombre.localeCompare(b.nombre, "es");

export function CategoryManager({ initialCategories, categoryCounts }: CategoryManagerProps) {
  const [categories, setCategories] = useState<InventarioCategoria[]>([...initialCategories].sort(sortByName));
  const [counts, setCounts] = useState<Record<string, number>>(categoryCounts);
  const [form, setForm] = useState<CategoryFormState>({ ...emptyForm });
  const [alert, setAlert] = useState<AlertState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [slugConflict, setSlugConflict] = useState(false);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== "production";

  const editing = Boolean(form.id);

  const resetForm = () => {
    setForm(() => ({ ...emptyForm }));
    setSlugConflict(false);
  };

  const totalCategorias = categories.length;
  const totalItems = useMemo(() => Object.values(counts).reduce((acc, value) => acc + value, 0), [counts]);

  const handleEdit = (category: InventarioCategoria) => {
    setForm({
      id: category.id,
      nombre: category.nombre,
      slug: category.slug,
      descripcion: category.descripcion ?? "",
    });
    setAlert(null);
    setSlugConflict(false);
  };

  const handleDelete = async (category: InventarioCategoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${category.nombre}"?`)) return;
    setSubmitting(true);
    setAlert(null);
    setSlugConflict(false);
    try {
      const response = await fetch("/api/admin/inventario/categorias", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        const friendly = payload?.error || "No se pudo eliminar la categoría.";
        const debug = typeof payload?.debug === "string" ? payload.debug : payload?.error;
        console.error("inventario categorias delete error", { payload, status: response.status });
        setAlert({ type: "error", message: friendly, debug });
        return;
      }
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      setCounts((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
      if (form.id === category.id) {
        resetForm();
      }
      setAlert({ type: "success", message: "Categoría eliminada." });
      router.refresh();
    } catch (error: any) {
      console.error("inventario categorias delete fetch error", error);
      setAlert({ type: "error", message: error?.message || "Error eliminando la categoría.", debug: error?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSlug = () => {
    if (!form.nombre.trim()) return;
    setForm((prev) => ({ ...prev, slug: prev.slug.trim() || toSlug(prev.nombre) }));
    setSlugConflict(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.nombre.trim()) {
      setAlert({ type: "error", message: "Ingresa un nombre para la categoría." });
      return;
    }
    const safeSlug = (form.slug.trim() || toSlug(form.nombre)).toLowerCase();
    if (!safeSlug) {
      setAlert({ type: "error", message: "No pudimos generar un slug válido." });
      return;
    }

    setSubmitting(true);
    setAlert(null);
    setSlugConflict(false);

    try {
      const response = await fetch("/api/admin/inventario/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          nombre: form.nombre,
          slug: safeSlug,
          descripcion: form.descripcion.trim() || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok || !payload?.data) {
        if (payload?.code === "slug_exists") {
          setSlugConflict(true);
          const friendlyMessage = editing
            ? "Ese slug ya está en uso. Actualiza el texto o genera uno nuevo."
            : "Ya existe una categoría con ese slug. Prueba con otro nombre.";
          setAlert({ type: "error", message: friendlyMessage, debug: typeof payload?.debug === "string" ? payload.debug : undefined });
          slugInputRef.current?.focus();
          return;
        }
        const friendly = payload?.error || "No se pudo guardar la categoría.";
        const debug = typeof payload?.debug === "string" ? payload.debug : payload?.error;
        console.error("inventario categorias save error", { payload, status: response.status });
        setAlert({ type: "error", message: friendly, debug });
        return;
      }
      const saved: InventarioCategoria = payload.data;
      setCategories((prev) => {
        const next = [...prev];
        const index = next.findIndex((item) => item.id === saved.id);
        if (index >= 0) {
          next[index] = saved;
        } else {
          next.push(saved);
        }
        return next.sort(sortByName);
      });
      setCounts((prev) => ({ ...prev, [saved.id]: prev[saved.id] ?? 0 }));
      resetForm();
      setAlert({ type: "success", message: editing ? "Cambios guardados." : "Categoría creada." });
      router.refresh();
    } catch (error: any) {
      console.error("inventario categorias save fetch error", error);
      setAlert({ type: "error", message: error?.message || "Ocurrió un error al guardar.", debug: error?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {alert ? (
        <div
          className={`rounded-3xl border px-5 py-3 text-sm font-medium ${
            alert.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {alert.message}
          {alert.debug && isDev ? (
            <p className="mt-1 text-xs font-normal text-slate-600">{alert.debug}</p>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Estadísticas</p>
          <p className="text-sm text-slate-500">
            {totalCategorias} {totalCategorias === 1 ? "categoría" : "categorías"} registradas · {totalItems} ítems asociados
          </p>
        </header>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-slate-700">Nombre *</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                placeholder="Ej: Indumentaria"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Slug</span>
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600"
                >
                  Autocompletar
                </button>
              </div>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                value={form.slug}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setForm((prev) => ({ ...prev, slug: nextValue }));
                  if (slugConflict) {
                    setSlugConflict(false);
                  }
                }}
                ref={slugInputRef}
                placeholder="uniformes"
                aria-invalid={slugConflict}
                aria-describedby={slugConflict ? "inventario-slug-conflict" : undefined}
              />
              {slugConflict ? (
                <p id="inventario-slug-conflict" className="text-xs font-semibold text-rose-600">
                  El slug debe ser único.
                </p>
              ) : null}
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Descripción</span>
            <textarea
              className="min-h-[80px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.descripcion}
              onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
              placeholder="Detalle breve para otros administradores."
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {editing ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
              >
                Cancelar edición
              </button>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Guardando..." : editing ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Categorías registradas</p>
            <p className="text-sm text-slate-500">Administra los grupos disponibles para los ítems.</p>
          </div>
        </header>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm text-slate-600">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Descripción</th>
                <th className="px-3 py-2 text-right">Ítems</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-400">
                    Aún no registras categorías.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold text-slate-900">{category.nombre}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{category.slug}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{category.descripcion || "—"}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-slate-700">
                      {counts[category.id] ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(category)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleDelete(category)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
