"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import ImageGalleryField from "@/app/admin/components/ImageGalleryField";
import {
  EMPRESA_PRODUCTO_CATEGORIA_LABELS,
  type EmpresaProductoCategoria,
  type EmpresaProductoRow,
  type EmpresaProductoDetalles,
  DEFAULT_EMPRESA_PRODUCTO_DETALLES,
  type EmpresaProductoPackItemDetalle,
} from "@/lib/empresas";
import { toSlug } from "@/lib/slug";
import { createSupabaseBrowser } from "@/lib/supabaseServer";

type EmpresaProductoFormProps = {
  mode: "create" | "edit";
  initialData?: EmpresaProductoRow | null;
};

type AlertState = { type: "success" | "error"; message: string } | null;

type LightProduct = {
  id: string;
  nombre: string;
  categoria: EmpresaProductoCategoria;
};

type PackItemView = {
  productoId: string;
  nombre: string;
  categoria: EmpresaProductoCategoria;
  cantidad: number;
};

const categoriaOptions = Object.entries(EMPRESA_PRODUCTO_CATEGORIA_LABELS);
const DEFAULT_CATEGORY = (categoriaOptions[0]?.[0] ?? "tunnel_educativo") as EmpresaProductoCategoria;

const sanitizeText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export default function EmpresaProductoForm({ mode, initialData }: EmpresaProductoFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [categoria, setCategoria] = useState<EmpresaProductoCategoria>(
    (initialData?.categoria as EmpresaProductoCategoria) ?? DEFAULT_CATEGORY,
  );
  const [orden, setOrden] = useState<number | undefined>(initialData?.orden ?? undefined);
  const [activo, setActivo] = useState(initialData?.activo ?? true);
  const [resumenCorto, setResumenCorto] = useState(initialData?.resumen_corto ?? "");
  const [descripcionLarga, setDescripcionLarga] = useState(initialData?.descripcion_larga ?? "");
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url ?? "");
  const [portadaUrl, setPortadaUrl] = useState<string | null>(
    initialData?.portada_url ?? initialData?.imagen_principal_url ?? null,
  );
  const [portadaUploading, setPortadaUploading] = useState(false);
  const [portadaError, setPortadaError] = useState<string | null>(null);
  const portadaInputRef = useRef<HTMLInputElement>(null);

  const [productosDisponibles, setProductosDisponibles] = useState<LightProduct[]>([]);
  const [productosLoading, setProductosLoading] = useState(true);
  const [productosError, setProductosError] = useState<string | null>(null);
  const [packItems, setPackItems] = useState<PackItemView[]>([]);
  const [packLoading, setPackLoading] = useState(false);
  const fetchedPackItemsRef = useRef(false);

  const [alert, setAlert] = useState<AlertState>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialProductId = initialData?.id ?? null;
  const showingPackSection = categoria === "pack";

  useEffect(() => {
    let active = true;
    async function loadProductos() {
      setProductosLoading(true);
      setProductosError(null);
      const { data, error } = await supabase
        .from("empresa_productos")
        .select("id,nombre,categoria")
        .order("nombre", { ascending: true });
      if (!active) return;
      if (error) {
        setProductosDisponibles([]);
        setProductosError(error.message || "No pudimos cargar el catálogo disponible.");
      } else {
        const mapped = (data ?? [])
          .filter((producto) => producto.id !== initialProductId)
          .map((producto) => ({
            id: producto.id,
            nombre: producto.nombre,
            categoria: (producto.categoria as EmpresaProductoCategoria) ?? DEFAULT_CATEGORY,
          }));
        setProductosDisponibles(mapped);
      }
      setProductosLoading(false);
    }
    loadProductos();
    return () => {
      active = false;
    };
  }, [supabase, initialProductId]);

  useEffect(() => {
    if (fetchedPackItemsRef.current) return;
    if (mode !== "edit" || !initialProductId || initialData?.categoria !== "pack") return;
    if (productosLoading) return;

    let active = true;
    fetchedPackItemsRef.current = true;
    setPackLoading(true);
    async function loadPackItems() {
      try {
        const { data, error } = await supabase
          .from("empresa_pack_items")
          .select("producto_id,cantidad")
          .eq("pack_id", initialProductId);
        if (!active) return;
        if (error) {
          setAlert({ type: "error", message: error.message || "No pudimos cargar el contenido del pack." });
          return;
        }
        const resolved = (data ?? []).map((item) => {
          const fallback = productosDisponibles.find((producto) => producto.id === item.producto_id);
          return {
            productoId: item.producto_id,
            nombre: fallback?.nombre ?? "Producto",
            categoria: fallback?.categoria ?? DEFAULT_CATEGORY,
            cantidad: item.cantidad ?? 1,
          } satisfies PackItemView;
        });
        setPackItems(resolved);
      } finally {
        if (active) setPackLoading(false);
      }
    }

    loadPackItems();

    return () => {
      active = false;
    };
  }, [mode, initialProductId, initialData?.categoria, productosLoading, productosDisponibles, supabase]);

  const packProductList = useMemo<LightProduct[]>(() => {
    if (!showingPackSection) return [];
    const base = productosDisponibles.filter((producto) => producto.id !== initialProductId);
    const knownIds = new Set(base.map((item) => item.id));
    const extras = packItems
      .filter((item) => !knownIds.has(item.productoId))
      .map((item) => ({ id: item.productoId, nombre: item.nombre, categoria: item.categoria }));
    return [...base, ...extras];
  }, [showingPackSection, productosDisponibles, initialProductId, packItems]);

  const handleGenerateSlug = () => {
    if (!nombre.trim()) return;
    setSlug((current) => current.trim() || toSlug(nombre));
  };

  const handlePortadaChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPortadaUploading(true);
    setPortadaError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/empresas/productos/upload-portada", {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "No pudimos subir la imagen.");
      }
      if (portadaUrl) {
        await fetch("/api/admin/empresas/productos/upload-portada", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: portadaUrl }),
        }).catch(() => null);
      }
      setPortadaUrl(payload.url);
    } catch (error: any) {
      setPortadaError(error?.message || "No se pudo subir la portada.");
    } finally {
      setPortadaUploading(false);
      if (portadaInputRef.current) portadaInputRef.current.value = "";
    }
  };

  const handleRemovePortada = async () => {
    if (!portadaUrl) return;
    try {
      await fetch("/api/admin/empresas/productos/upload-portada", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: portadaUrl }),
      });
    } catch {
      // No bloqueamos al usuario si falla la eliminación del archivo.
    } finally {
      setPortadaUrl(null);
    }
  };

  const handleAddPackProduct = (producto: LightProduct) => {
    setPackItems((prev) => {
      if (prev.some((item) => item.productoId === producto.id)) return prev;
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          categoria: producto.categoria,
          cantidad: 1,
        },
      ];
    });
  };

  const handleUpdatePackCantidad = (productoId: string, cantidad: number) => {
    const safeCantidad = Number.isFinite(cantidad) && cantidad > 0 ? Math.round(cantidad) : 1;
    setPackItems((prev) =>
        prev.map((item) => (item.productoId === productoId ? { ...item, cantidad: safeCantidad } : item)),
    );
  };

  const handleRemovePackProduct = (productoId: string) => {
    setPackItems((prev) => prev.filter((item) => item.productoId !== productoId));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlert(null);

    if (!nombre.trim()) {
      setAlert({ type: "error", message: "Ingresa un nombre para el producto." });
      return;
    }

    if (mode === "edit" && !initialProductId) {
      setAlert({ type: "error", message: "No encontramos el identificador del producto a editar." });
      return;
    }

    const safeSlug = (slug.trim() || toSlug(nombre)).toLowerCase();
    if (!safeSlug) {
      setAlert({ type: "error", message: "No pudimos generar un slug válido." });
      return;
    }

    const baseDetalles = initialData?.detalles_json ?? DEFAULT_EMPRESA_PRODUCTO_DETALLES;
    const normalizedPackItems: PackItemView[] =
      categoria === "pack"
        ? packItems
            .map((item) => {
              if (!item.productoId) return null;
              const safeCantidad = Number.isFinite(item.cantidad) && item.cantidad > 0 ? Math.round(item.cantidad) : 1;
              return { ...item, cantidad: Math.max(1, safeCantidad) };
            })
            .filter((item): item is PackItemView => Boolean(item))
        : [];

    const detallesPayload: EmpresaProductoDetalles = {
      ...(baseDetalles ?? DEFAULT_EMPRESA_PRODUCTO_DETALLES),
      pack:
        categoria === "pack"
          ? {
              items: normalizedPackItems.map((item) => ({
                id: item.productoId,
                nombre: item.nombre,
                cantidad: item.cantidad,
              })) satisfies EmpresaProductoPackItemDetalle[],
            }
          : null,
    };
    const safeDetalles = detallesPayload ?? DEFAULT_EMPRESA_PRODUCTO_DETALLES;

    const record = {
      nombre: nombre.trim(),
      slug: safeSlug,
      categoria,
      resumen_corto: sanitizeText(resumenCorto),
      descripcion_corta: sanitizeText(resumenCorto),
      descripcion_larga: sanitizeText(descripcionLarga),
      detalles_json: safeDetalles,
      orden: typeof orden === "number" ? orden : null,
      activo,
      video_url: sanitizeText(videoUrl),
      portada_url: portadaUrl,
      imagen_principal_url: portadaUrl,
    } satisfies Partial<EmpresaProductoRow>;

    setSubmitting(true);
    try {
      const endpoint = "/api/admin/empresas/productos";
      const method = mode === "create" ? "POST" : "PUT";
      const payload = {
        id: mode === "edit" ? initialProductId : undefined,
        data: record,
        packItems: normalizedPackItems.map((item) => ({ producto_id: item.productoId, cantidad: item.cantidad })),
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "No pudimos guardar el producto.");
      }

      setAlert({ type: "success", message: mode === "create" ? "Producto creado correctamente." : "Cambios guardados." });
      setTimeout(() => router.push("/admin/empresas/productos"), 1200);
    } catch (error: any) {
      setAlert({ type: "error", message: error?.message || "No pudimos guardar el producto." });
    } finally {
      setSubmitting(false);
    }
  };

  const existingGalleryImages: Array<{ id: string; url: string; path: string }> = [];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {alert ? (
        <div
          className={`rounded-[28px] border px-5 py-4 text-sm font-medium shadow-sm ${
            alert.type === "error"
              ? "border-rose-200/70 bg-rose-50/80 text-rose-900"
              : "border-emerald-200/70 bg-emerald-50/80 text-emerald-900"
          }`}
        >
          {alert.message}
        </div>
      ) : null}

      {productosError ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          {productosError}
        </div>
      ) : null}

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Información principal</p>
          <p className="text-sm text-slate-500">Define cómo se mostrará este servicio en el catálogo.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Nombre del producto *</span>
            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="Ej: Operativo de dermatología"
              required
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Categoría *</span>
            <select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value as EmpresaProductoCategoria)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              required
            >
              {categoriaOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Orden</span>
            <input
              type="number"
              value={orden ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setOrden(value === "" ? undefined : Number(value));
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="Ej: 10"
            />
            <span className="text-xs text-slate-500">Los productos con menor número aparecen primero.</span>
          </label>
          <div className="space-y-2 rounded-3xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
            <label className="flex items-center gap-3 font-medium text-slate-700">
              <input
                type="checkbox"
                checked={activo}
                onChange={(event) => setActivo(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Producto activo en el catálogo
            </label>
            <p className="text-xs text-slate-500">Si lo desactivas, dejará de ser visible en la página pública.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contenido público</p>
          <p className="text-sm text-slate-500">Estas descripciones aparecen en las tarjetas y en la vista de detalle.</p>
        </header>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">Resumen corto</span>
          <textarea
            value={resumenCorto}
            onChange={(event) => setResumenCorto(event.target.value)}
            className="min-h-[80px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            placeholder="Ej: Experiencia inmersiva para educar sobre cáncer de piel en tu organización."
          />
          <span className="text-xs text-slate-500">Se usa en las tarjetas del catálogo público.</span>
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">Descripción larga</span>
          <textarea
            value={descripcionLarga}
            onChange={(event) => setDescripcionLarga(event.target.value)}
            className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            placeholder="Incluye detalles, beneficios o contexto del servicio."
          />
        </label>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Configuración del botón / acción</p>
          <p className="text-sm text-slate-500">Define la URL que abre el botón y recursos de apoyo como videos.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Slug *</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                placeholder="operativo-especialidades"
                required
              />
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Generar
              </button>
            </div>
            <p className="text-xs text-slate-500">Se usa para construir la URL pública y el destino del botón.</p>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Video o recurso (URL)</span>
            <input
              type="url"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-slate-500">Opcional: se mostrará en la vista de detalle como recurso complementario.</p>
          </label>
        </div>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Imágenes y portada</p>
          <p className="text-sm text-slate-500">La portada aparece en el catálogo y puedes complementar con una galería.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-medium text-slate-700">Portada principal</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-36 w-full max-w-[220px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                {portadaUrl ? (
                  <img src={portadaUrl} alt="Portada del producto" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Sin portada</span>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <input
                  ref={portadaInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePortadaChange}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => portadaInputRef.current?.click()}
                    disabled={portadaUploading}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                  >
                    {portadaUploading ? "Subiendo…" : portadaUrl ? "Reemplazar imagen" : "Subir imagen"}
                  </button>
                  {portadaUrl ? (
                    <button
                      type="button"
                      onClick={handleRemovePortada}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Quitar portada
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  Usa imágenes JPG o PNG de hasta 10\u00a0MB. Se almacenan en el bucket público de Supabase.
                </p>
                {portadaError ? <p className="text-xs text-rose-600">{portadaError}</p> : null}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
            <p className="text-sm font-medium text-slate-700">Galería complementaria</p>
            <p className="text-xs text-slate-500">
              Estas imágenes aparecen como carrusel en la página pública del producto.
            </p>
            <div className="mt-4">
              <ImageGalleryField
                title="Galería de imágenes"
                description="Pronto conectaremos la galería con el almacenamiento real para estos productos."
                fieldPrefix="producto"
                existingImages={existingGalleryImages}
              />
            </div>
          </div>
        </div>
      </section>

      {showingPackSection ? (
        <section className="space-y-6 rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-6">
          <header className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contenido del pack</p>
            <p className="text-sm text-slate-500">Selecciona productos existentes para componer este pack.</p>
          </header>
          {productosLoading || packLoading ? (
            <p className="text-sm text-slate-500">Cargando opciones…</p>
          ) : packProductList.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay productos disponibles para agregar al pack.</p>
          ) : (
            <div className="space-y-4">
              {packProductList.map((producto) => {
                const existing = packItems.find((item) => item.productoId === producto.id);
                return (
                  <div
                    key={producto.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{producto.nombre}</div>
                      <div className="text-xs text-slate-500">
                        {EMPRESA_PRODUCTO_CATEGORIA_LABELS[producto.categoria]}
                      </div>
                    </div>
                    {existing ? (
                      <div className="flex flex-col items-start gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:gap-3">
                        <label className="flex items-center gap-2">
                          <span className="text-slate-500">Cantidad:</span>
                          <input
                            type="number"
                            min={1}
                            className="w-20 rounded-2xl border border-slate-200 bg-white px-2 py-1 text-right text-xs"
                            value={existing.cantidad}
                            onChange={(event) => handleUpdatePackCantidad(producto.id, Number(event.target.value) || 1)}
                          />
                        </label>
                        <button
                          type="button"
                          className="text-xs font-semibold text-rose-600 underline"
                          onClick={() => handleRemovePackProduct(producto.id)}
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={() => handleAddPackProduct(producto)}
                      >
                        Agregar al pack
                      </button>
                    )}
                  </div>
                );
              })}
              {packItems.length > 0 ? (
                <p className="text-xs text-slate-500">
                  Este pack incluye {packItems.length} producto(s). Se guardarán al guardar el formulario.
                </p>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/empresas/productos")}
          className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Guardando…" : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}
