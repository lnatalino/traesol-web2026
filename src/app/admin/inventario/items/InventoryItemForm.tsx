"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  INVENTARIO_TIPO_REGLA,
  INVENTARIO_TIPO_REGLA_LABELS,
  type InventarioItem,
  type InventarioTipoReglaValue,
} from "@/lib/inventario/types";
import { toSlug } from "@/lib/slug";

type InventoryItemFormProps = {
  mode: "create" | "edit";
  categories: Array<{ id: string; nombre: string }>;
  initialData?: InventarioItem | null;
};

type AlertState = { type: "success" | "error"; message: string; debug?: string } | null;

const ruleOptions = Object.values(INVENTARIO_TIPO_REGLA).map((value) => ({
  value,
  label: INVENTARIO_TIPO_REGLA_LABELS[value],
}));

const sanitize = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toPositiveInt = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
};

const toMoneyValue = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
};

export function InventoryItemForm({ mode, categories, initialData }: InventoryItemFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [categoriaId, setCategoriaId] = useState(initialData?.categoria_id ?? (categories[0]?.id ?? ""));
  const [tipoRegla, setTipoRegla] = useState<InventarioTipoReglaValue>(
    (initialData?.tipo_regla as InventarioTipoReglaValue | null) ?? INVENTARIO_TIPO_REGLA.GENERICA,
  );
  const [uso, setUso] = useState(initialData?.uso ?? "");
  const [descripcion, setDescripcion] = useState(initialData?.descripcion ?? "");
  const [unidad, setUnidad] = useState(initialData?.unidad ?? "unidad");
  const [cantidadActual, setCantidadActual] = useState(String(initialData?.cantidad_actual ?? 0));
  const [valorUnitario, setValorUnitario] = useState(
    typeof initialData?.valor_unitario === "number" ? String(initialData.valor_unitario) : "",
  );
  const [activo, setActivo] = useState(initialData?.activo ?? true);
  const [fotoUrl, setFotoUrl] = useState(initialData?.foto_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [slugConflict, setSlugConflict] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const isDev = process.env.NODE_ENV !== "production";

  const disabled = categories.length === 0;

  const submitLabel = mode === "create" ? "Crear ítem" : "Guardar cambios";

  const handleGenerateSlug = () => {
    if (!nombre.trim()) return;
    setSlug((current) => current.trim() || toSlug(nombre));
    setSlugConflict(false);
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAlert(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/inventario/items/upload-portada", {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "No pudimos subir la imagen.");
      }
      if (fotoUrl) {
        await fetch("/api/admin/inventario/items/upload-portada", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fotoUrl }),
        }).catch(() => null);
      }
      setFotoUrl(payload.url);
    } catch (error: any) {
      console.error("inventario items upload error", error);
      setAlert({ type: "error", message: error?.message || "No se pudo subir la imagen.", debug: error?.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!fotoUrl) return;
    try {
      await fetch("/api/admin/inventario/items/upload-portada", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fotoUrl }),
      });
    } catch {
      // No bloqueamos al usuario si falla la eliminación del archivo.
    } finally {
      setFotoUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) {
      setAlert({ type: "error", message: "Crea una categoría antes de registrar ítems." });
      return;
    }
    if (!nombre.trim()) {
      setAlert({ type: "error", message: "Ingresa un nombre para el ítem." });
      return;
    }
    if (!categoriaId) {
      setAlert({ type: "error", message: "Selecciona una categoría." });
      return;
    }

    const safeSlug = (slug.trim() || toSlug(nombre)).toLowerCase();
    if (!safeSlug) {
      setAlert({ type: "error", message: "No pudimos generar un slug válido." });
      return;
    }

    const payload = {
      id: initialData?.id,
      nombre: nombre.trim(),
      slug: safeSlug,
      categoria_id: categoriaId,
      tipo_regla: tipoRegla,
      uso: sanitize(uso),
      descripcion: sanitize(descripcion),
      unidad: sanitize(unidad) ?? "unidad",
      cantidad_actual: toPositiveInt(cantidadActual),
      valor_unitario: toMoneyValue(valorUnitario),
      foto_url: fotoUrl,
      activo,
    };

    setSubmitting(true);
    setAlert(null);
    setSlugConflict(false);

    try {
      const response = await fetch("/api/admin/inventario/items/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        if (result?.code === "slug_exists") {
          setSlugConflict(true);
          const friendly = mode === "create" ? "Ese slug ya está en uso. Prueba con otro nombre." : "Ese slug ya pertence a otro ítem.";
          setAlert({
            type: "error",
            message: friendly,
            debug: typeof result?.debug === "string" ? result.debug : undefined,
          });
          slugInputRef.current?.focus();
          return;
        }
        const friendly = result?.error || "No se pudo guardar el ítem.";
        const debug = typeof result?.debug === "string" ? result.debug : result?.error;
        console.error("inventario items save error", { result, status: response.status });
        setAlert({ type: "error", message: friendly, debug });
        return;
      }
      const message = mode === "create" ? "Ítem creado correctamente." : "Cambios guardados.";
      setAlert({ type: "success", message });
      setTimeout(() => {
        router.push("/admin/inventario?success=" + encodeURIComponent(message));
        router.refresh();
      }, 900);
    } catch (error: any) {
      console.error("inventario items save fetch error", error);
      setAlert({ type: "error", message: error?.message || "No pudimos guardar el ítem.", debug: error?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {alert ? (
        <div
          className={`rounded-[28px] border px-5 py-4 text-sm font-medium shadow-sm ${
            alert.type === "success"
              ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-900"
              : "border-rose-200/70 bg-rose-50/80 text-rose-900"
          }`}
        >
          {alert.message}
          {alert.debug && isDev ? (
            <p className="mt-1 text-xs font-normal text-slate-600">{alert.debug}</p>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Datos básicos</p>
          <p className="text-sm text-slate-500">Define el nombre, categoría y regla de asignación.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Nombre *</span>
            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="Ej: Uniforme clínico"
              required
              disabled={disabled}
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
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                if (slugConflict) {
                  setSlugConflict(false);
                }
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="uniforme-clinico"
              disabled={disabled}
              ref={slugInputRef}
              aria-invalid={slugConflict}
              aria-describedby={slugConflict ? "inventario-item-slug-conflict" : undefined}
            />
            {slugConflict ? (
              <p id="inventario-item-slug-conflict" className="text-xs font-semibold text-rose-600">
                Debe ser único.
              </p>
            ) : null}
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Categoría *</span>
            <select
              value={categoriaId}
              onChange={(event) => setCategoriaId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              required
              disabled={disabled}
            >
              {categories.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Tipo de regla *</span>
            <select
              value={tipoRegla}
              onChange={(event) => setTipoRegla(event.target.value as InventarioTipoReglaValue)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              required
              disabled={disabled}
            >
              {ruleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Uso y descripción</p>
          <p className="text-sm text-slate-500">Explica cuándo se entrega este ítem y detalles para el equipo.</p>
        </header>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold text-slate-700">Uso típico</span>
          <textarea
            value={uso}
            onChange={(event) => setUso(event.target.value)}
            className="min-h-[80px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            placeholder="Ej: Se entrega en la primera participación del voluntario."
            disabled={disabled}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold text-slate-700">Descripción detallada</span>
          <textarea
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            placeholder="Notas internas, tallas, condiciones de entrega"
            disabled={disabled}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-semibold text-slate-700">Unidad</span>
          <input
            type="text"
            value={unidad}
            onChange={(event) => setUnidad(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            placeholder="unidad, set, caja..."
            disabled={disabled}
          />
        </label>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Stock y valor</p>
          <p className="text-sm text-slate-500">Mantén actualizado el stock real y el costo referencial.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Cantidad actual</span>
            <input
              type="number"
              min={0}
              value={cantidadActual}
              onChange={(event) => setCantidadActual(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              disabled={disabled}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Valor unitario (CLP)</span>
            <input
              type="number"
              min={0}
              value={valorUnitario}
              onChange={(event) => setValorUnitario(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="Opcional"
              disabled={disabled}
            />
          </label>
          <label className="space-y-2 rounded-3xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700">
            <span>Estado</span>
            <div className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={activo}
                onChange={(event) => setActivo(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                disabled={disabled}
              />
              Ítem activo
            </div>
          </label>
        </div>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Imagen de portada</p>
          <p className="text-sm text-slate-500">Sube una foto para identificar el ítem rápidamente.</p>
        </header>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
          {fotoUrl ? (
            <div className="space-y-4">
              <img src={fotoUrl} alt={`Foto de ${nombre || "ítem"}`} className="mx-auto h-48 rounded-3xl object-cover" />
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <label className="cursor-pointer rounded-full bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  {uploading ? "Subiendo..." : "Reemplazar imagen"}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
                >
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-3 text-sm text-slate-500">
              <span>Arrastra una imagen o haz clic para subirla.</span>
              <span className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm">
                {uploading ? "Subiendo..." : "Seleccionar imagen"}
              </span>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
            </label>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/inventario")}
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={submitting || disabled}
          className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
