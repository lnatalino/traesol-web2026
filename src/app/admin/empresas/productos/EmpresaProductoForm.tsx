"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPRESA_PRODUCTO_CATEGORIA_LABELS,
  type EmpresaPackItemInsert,
  type EmpresaProductoCategoria,
  type EmpresaProductoRow,
} from "@/lib/empresas";
import { createSupabaseBrowser } from "@/lib/supabaseServer";

type EmpresaProductoFormProps = {
  mode: "create" | "edit";
  initialData?: EmpresaProductoRow;
};

const categoriaEntries = Object.entries(EMPRESA_PRODUCTO_CATEGORIA_LABELS) as Array<[
  EmpresaProductoCategoria,
  string,
]>;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type PackItemState = {
  producto_id: string;
  cantidad: number;
  nombre: string;
  categoria?: EmpresaProductoCategoria | null;
};

export default function EmpresaProductoForm({ mode, initialData }: EmpresaProductoFormProps) {
  if (mode === "edit" && !initialData) {
    console.error("EmpresaProductoForm: falta initialData en modo edit");
  }

  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const isEdit = mode === "edit";

  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [categoria, setCategoria] = useState<EmpresaProductoCategoria>(
    (initialData?.categoria as EmpresaProductoCategoria) ?? categoriaEntries[0][0],
  );
  const [descripcionCorta, setDescripcionCorta] = useState(initialData?.descripcion_corta ?? "");
  const [descripcionLarga, setDescripcionLarga] = useState(initialData?.descripcion_larga ?? "");
  const [imagenPrincipalUrl, setImagenPrincipalUrl] = useState(initialData?.imagen_principal_url ?? "");
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url ?? "");
  const [orden, setOrden] = useState<number | undefined>(initialData?.orden ?? undefined);
  const [activo, setActivo] = useState(initialData?.activo ?? true);
  const [productosDisponibles, setProductosDisponibles] = useState<EmpresaProductoRow[]>([]);
  const [packItems, setPackItems] = useState<PackItemState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadProductos() {
      if (categoria !== "pack") {
        setProductosDisponibles([]);
        setPackItems([]);
        return;
      }
      const { data, error } = await supabase
        .from("empresa_productos")
        .select("*")
        .eq("activo", true)
        .neq("categoria", "pack")
        .order("orden", { ascending: true })
        .order("nombre", { ascending: true });

      if (!isMounted) return;
      if (!error && Array.isArray(data)) {
        setProductosDisponibles(data as EmpresaProductoRow[]);
      }
    }

    loadProductos();
    return () => {
      isMounted = false;
    };
  }, [categoria, supabase]);

  useEffect(() => {
    let isMounted = true;
    async function loadPackItems() {
      if (!isEdit || !initialData || initialData.categoria !== "pack") return;
      const { data, error } = await supabase
        .from("empresa_pack_items")
        .select("producto_id,cantidad")
        .eq("pack_id", initialData.id);
      if (!isMounted || error || !Array.isArray(data)) return;
      const productoIds = data.map((row) => row.producto_id);
      const nombreMap = new Map<string, { nombre: string; categoria?: EmpresaProductoCategoria | null }>();
      if (productoIds.length > 0) {
        const { data: productosInfo } = await supabase
          .from("empresa_productos")
          .select("id,nombre,categoria")
          .in("id", productoIds);
        productosInfo?.forEach((prod) =>
          nombreMap.set(prod.id, {
            nombre: prod.nombre ?? "",
            categoria: prod.categoria as EmpresaProductoCategoria,
          }),
        );
      }
      if (!isMounted) return;
      setPackItems(
        data.map((row) => {
          const meta = nombreMap.get(row.producto_id) ?? { nombre: "", categoria: null };
          return {
            producto_id: row.producto_id,
            cantidad: row.cantidad ?? 1,
            nombre: meta.nombre,
            categoria: meta.categoria,
          } satisfies PackItemState;
        }),
      );
    }
    loadPackItems();
    return () => {
      isMounted = false;
    };
  }, [isEdit, initialData, supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedNombre = nombre.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedNombre || !trimmedSlug || !categoria) {
      setErrorMessage("Completa el nombre, slug y categoría.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const payload = {
      nombre: trimmedNombre,
      slug: trimmedSlug,
      categoria,
      descripcion_corta: descripcionCorta.trim() || null,
      descripcion_larga: descripcionLarga.trim() || null,
      detalles_json: isEdit ? initialData?.detalles_json ?? {} : {},
      orden: typeof orden === "number" ? orden : null,
      activo,
      imagen_principal_url: imagenPrincipalUrl.trim() || null,
      video_url: videoUrl.trim() || null,
    } satisfies Partial<EmpresaProductoRow>;

    let productoId: string | null = null;
    if (isEdit && initialData) {
      const { data: updated, error } = await supabase
        .from("empresa_productos")
        .update(payload)
        .eq("id", initialData.id)
        .select("id")
        .single();

      if (error || !updated) {
        setSubmitting(false);
        setErrorMessage(error?.message ?? "No se pudo guardar el producto.");
        return;
      }
      productoId = updated.id;
    } else {
      const { data: inserted, error } = await supabase
        .from("empresa_productos")
        .insert(payload)
        .select("id")
        .single();

      if (error || !inserted) {
        setSubmitting(false);
        setErrorMessage(error?.message ?? "No se pudo guardar el producto.");
        return;
      }
      productoId = inserted.id;
    }

    if (!productoId) {
      setSubmitting(false);
      setErrorMessage("No se pudo resolver el ID del producto.");
      return;
    }

    if (categoria !== "pack") {
      if (isEdit && initialData?.categoria === "pack") {
        await supabase.from("empresa_pack_items").delete().eq("pack_id", productoId);
      }
    } else {
      if (isEdit) {
        await supabase.from("empresa_pack_items").delete().eq("pack_id", productoId);
      }
      if (packItems.length > 0) {
        const itemsToInsert: EmpresaPackItemInsert[] = packItems.map((item) => ({
          pack_id: productoId!,
          producto_id: item.producto_id,
          cantidad: item.cantidad || 1,
        }));
        const { error: itemsError } = await supabase.from("empresa_pack_items").insert(itemsToInsert);
        if (itemsError) {
          console.error("Error al guardar items del pack", itemsError);
        }
      }
    }

    setSubmitting(false);

    router.push("/admin/empresas/productos");
    router.refresh();
  }

  function handleGenerateSlug() {
    if (!nombre.trim()) return;
    setSlug(slugify(nombre));
  }

  const packProductList: Array<Pick<EmpresaProductoRow, "id" | "nombre" | "categoria">> =
    categoria === "pack"
      ? [
          ...productosDisponibles,
          ...packItems
            .filter((item) => !productosDisponibles.some((prod) => prod.id === item.producto_id))
            .map((item) => ({
              id: item.producto_id,
              nombre: item.nombre,
              categoria: (item.categoria as EmpresaProductoCategoria) ?? categoriaEntries[0][0],
            })),
        ]
      : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Información básica</h2>
          <p className="text-xs text-slate-500">Completa el nombre, slug y categoría visible en el catálogo.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nombre *</span>
            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Slug *</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Generar
              </button>
            </div>
          </label>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Categoría *</span>
          <select
            value={categoria}
            onChange={(event) => setCategoria(event.target.value as EmpresaProductoCategoria)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          >
            {categoriaEntries.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Descripción</h2>
          <p className="text-xs text-slate-500">Comparte información breve y detallada del servicio.</p>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Descripción corta</span>
          <textarea
            value={descripcionCorta}
            onChange={(event) => setDescripcionCorta(event.target.value)}
            className="min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Descripción larga</span>
          <textarea
            value={descripcionLarga}
            onChange={(event) => setDescripcionLarga(event.target.value)}
            className="min-h-[140px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Medios</h2>
          <p className="text-xs text-slate-500">Enlaces opcionales para imagen principal y video de apoyo.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Imagen principal (URL)</span>
            <input
              type="text"
              value={imagenPrincipalUrl}
              onChange={(event) => setImagenPrincipalUrl(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Video (URL)</span>
            <input
              type="text"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Orden y visibilidad</h2>
          <p className="text-xs text-slate-500">Controla la posición en el catálogo y su estado público.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Orden</span>
            <input
              type="number"
              value={orden ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setOrden(value === "" ? undefined : Number(value));
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={activo}
              onChange={(event) => setActivo(event.target.checked)}
              className="h-4 w-4 rounded border"
            />
            Producto activo
          </label>
        </div>
      </section>

      {categoria === "pack" ? (
        <section className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Contenido del pack</h2>
            <p className="text-xs text-slate-500">
              Selecciona productos existentes para componer este pack e indica una cantidad estimada.
            </p>
          </div>
          {packProductList.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay productos simples disponibles para incluir en este pack.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Agregar productos al pack
              </div>
              <div className="space-y-3">
                {packProductList.map((producto) => {
                  const existing = packItems.find((item) => item.producto_id === producto.id);
                  return (
                    <div
                      key={producto.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{producto.nombre}</div>
                        <div className="text-xs text-slate-500">
                          {EMPRESA_PRODUCTO_CATEGORIA_LABELS[producto.categoria]}
                        </div>
                      </div>
                      {existing ? (
                        <div className="flex flex-col items-start gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Cantidad:</span>
                            <input
                              type="number"
                              min={1}
                              className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-xs"
                              value={existing.cantidad}
                              onChange={(event) => {
                                const cantidad = Math.max(1, Number(event.target.value) || 1);
                                setPackItems((prev) =>
                                  prev.map((item) =>
                                    item.producto_id === producto.id ? { ...item, cantidad } : item,
                                  ),
                                );
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 underline"
                            onClick={() =>
                              setPackItems((prev) => prev.filter((item) => item.producto_id !== producto.id))
                            }
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          onClick={() =>
                            setPackItems((prev) => [
                              ...prev,
                              {
                                producto_id: producto.id,
                                cantidad: 1,
                                nombre: producto.nombre,
                                categoria: producto.categoria as EmpresaProductoCategoria,
                              },
                            ])
                          }
                        >
                          Agregar al pack
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {packItems.length > 0 ? (
                <p className="text-xs text-slate-500">
                  Este pack incluye {packItems.length} producto(s). Se guardarán al guardar el pack.
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
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Guardando..." : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}
