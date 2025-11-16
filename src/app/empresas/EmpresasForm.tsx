"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EMPRESA_PRODUCTO_CATEGORIA_LABELS,
  getCategoriaLabel,
  type EmpresaProductoCategoria,
  type EmpresaProductoRow,
} from "@/lib/empresas";

const REQUIRED_MESSAGE = "Completa los campos obligatorios";

const initialForm = {
  email: "",
  nombreEmpresa: "",
  nombrePersona: "",
  cargo: "",
  telefono: "",
  ciudad: "",
  deseaReunion: "Sí",
  mensaje: "",
};

type ContactFormState = typeof initialForm;

type Feedback = { type: "success" | "error"; message: string } | null;

type CartConfig = Record<string, string | number | null>;

type CartItem = {
  productoId: string;
  titulo: string;
  categoria: EmpresaProductoCategoria;
  cantidad: number;
  config?: CartConfig | null;
};

type ConfigField = {
  name: string;
  label: string;
  type: "number" | "text" | "textarea" | "select";
  placeholder?: string;
  helper?: string;
  options?: { value: string; label: string }[];
  summaryLabel?: string;
};

type VideoMeta =
  | { kind: "youtube" | "vimeo"; src: string }
  | { kind: "mp4"; src: string }
  | { kind: "link"; src: string };

const CATEGORY_BADGE_STYLES: Partial<Record<EmpresaProductoCategoria, string>> = {
  tunnel_educativo: "bg-rose-100 text-rose-700",
  operativo_especialidades: "bg-indigo-100 text-indigo-700",
  operativo_quirurgico: "bg-amber-100 text-amber-800",
  pack: "bg-emerald-100 text-emerald-700",
  jornada_actualizacion: "bg-slate-100 text-slate-600",
};

const CONFIG_FIELDS: Partial<Record<EmpresaProductoCategoria, ConfigField[]>> = {
  tunnel_educativo: [
    {
      name: "numero_tuneles",
      label: "Número de túneles",
      summaryLabel: "Túneles",
      type: "number",
      placeholder: "Ej: 2",
    },
    {
      name: "dias",
      label: "Días de duración",
      summaryLabel: "Días",
      type: "number",
      placeholder: "Ej: 4",
    },
    {
      name: "comentario_tunel",
      label: "Comentario u opciones especiales",
      summaryLabel: "Comentario",
      type: "textarea",
      helper: "Estos datos son referenciales para ajustar mejor la propuesta.",
    },
  ],
  operativo_especialidades: [
    {
      name: "tipo_operativo_especialidades",
      label: "Tipo de operativo",
      summaryLabel: "Tipo",
      type: "select",
      options: [
        { value: "Multiespecialidad", label: "Multiespecialidad" },
        { value: "Traumatología", label: "Traumatología" },
        { value: "Mama", label: "Mama" },
        { value: "Otorrinolaringología", label: "Otorrinolaringología" },
        { value: "Geriatría", label: "Geriatría" },
        { value: "Otro", label: "Otro" },
      ],
    },
    {
      name: "meta_atenciones",
      label: "Meta aproximada de atenciones",
      summaryLabel: "Meta",
      type: "number",
      placeholder: "Ej: 600",
    },
    {
      name: "dias",
      label: "Días estimados de operativo",
      summaryLabel: "Días",
      type: "number",
      placeholder: "Ej: 3",
    },
    {
      name: "comentario_operativo",
      label: "Comentario u objetivos",
      summaryLabel: "Comentario",
      type: "textarea",
    },
  ],
  operativo_quirurgico: [
    {
      name: "numero_cirugias",
      label: "Número aproximado de cirugías",
      summaryLabel: "Cirugías",
      type: "number",
      placeholder: "Ej: 25",
    },
    {
      name: "tipo_cirugia",
      label: "Tipo de cirugía",
      summaryLabel: "Tipo",
      type: "select",
      options: [
        { value: "Reconstrucción mamaria", label: "Reconstrucción mamaria" },
        { value: "Reconstrucción traumatológica", label: "Reconstrucción traumatológica" },
        { value: "Cirugía general", label: "Cirugía general" },
        { value: "Otro", label: "Otro" },
      ],
    },
    {
      name: "comentario_quirurgico",
      label: "Comentario u objetivos",
      summaryLabel: "Comentario",
      type: "textarea",
    },
  ],
  pack: [
    {
      name: "ajustes_pack",
      label: "Ajustes deseados",
      summaryLabel: "Ajustes",
      type: "textarea",
      helper: "Cuéntanos si quieres ajustar la cantidad de operativos, túneles u otros componentes.",
    },
  ],
};

const OPTIONAL_INFO_TEXT =
  "Esta información es opcional. Si prefieres, selecciona el servicio y te ayudamos a definir los detalles.";

function getBadgeClass(categoria: EmpresaProductoCategoria): string {
  return CATEGORY_BADGE_STYLES[categoria] ?? "bg-slate-100 text-slate-700";
}

function getResumen(producto: EmpresaProductoRow): string {
  return (
    producto.resumen_corto ||
    producto.descripcion_corta ||
    producto.descripcion_larga ||
    "Personalizamos este servicio con tu equipo para maximizar el impacto."
  );
}

function getCoverUrl(producto: EmpresaProductoRow): string | null {
  return producto.portada_url || producto.imagen_principal_url || null;
}

function buildConfigState(fields: ConfigField[], initialConfig?: CartConfig | null): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    const value = initialConfig?.[field.name];
    acc[field.name] = value === undefined || value === null ? "" : String(value);
    return acc;
  }, {});
}

function normalizeConfigPayload(
  categoria: EmpresaProductoCategoria,
  state: Record<string, string>,
): CartConfig | null {
  const fields = CONFIG_FIELDS[categoria] ?? [];
  const payload: CartConfig = {};
  fields.forEach((field) => {
    const raw = state[field.name];
    if (raw === undefined || raw === null) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (field.type === "number") {
      const num = Number(trimmed);
      if (!Number.isFinite(num)) return;
      payload[field.name] = num;
    } else {
      payload[field.name] = trimmed;
    }
  });
  return Object.keys(payload).length ? payload : null;
}

function truncateSummary(value: string | number): string {
  if (typeof value === "number") return String(value);
  const trimmed = value.trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
}

function formatConfigSummary(
  categoria: EmpresaProductoCategoria,
  config?: CartConfig | null,
): string | null {
  if (!config) return null;
  const fields = CONFIG_FIELDS[categoria] ?? [];
  const entries = fields
    .map((field) => {
      const raw = config[field.name];
      if (raw === undefined || raw === null || raw === "") return null;
      const label = field.summaryLabel ?? field.label;
      return `${label}: ${truncateSummary(raw)}`;
    })
    .filter((item): item is string => Boolean(item));
  return entries.length ? entries.join(", ") : null;
}

function detectVideoMeta(url: string | null | undefined): VideoMeta | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.includes("youtube") || lower.includes("youtu.be")) {
    const videoId = extractYouTubeId(trimmed);
    if (videoId) {
      return { kind: "youtube", src: `https://www.youtube.com/embed/${videoId}` };
    }
  }
  if (lower.includes("vimeo.com")) {
    const videoId = extractVimeoId(trimmed);
    if (videoId) {
      return { kind: "vimeo", src: `https://player.vimeo.com/video/${videoId}` };
    }
  }
  if (lower.endsWith(".mp4")) {
    return { kind: "mp4", src: trimmed };
  }
  return { kind: "link", src: trimmed };
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/\//g, "");
    }
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
    return parsed.pathname.split("/").pop() || null;
  } catch {
    return null;
  }
}

function extractVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const last = segments.pop();
    return last || null;
  } catch {
    return null;
  }
}

type ProductCardProps = {
  producto: EmpresaProductoRow;
  onViewDetails: (producto: EmpresaProductoRow) => void;
  onAdd: (producto: EmpresaProductoRow) => void;
};

function ProductCard({ producto, onViewDetails, onAdd }: ProductCardProps) {
  const coverUrl = getCoverUrl(producto);
  const categoria = producto.categoria as EmpresaProductoCategoria;
  const badgeClass = getBadgeClass(categoria);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={producto.nombre}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wide text-slate-400">
            Sin imagen
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {EMPRESA_PRODUCTO_CATEGORIA_LABELS[categoria]}
        </span>
        <h3 className="text-xl font-semibold text-slate-900">{producto.nombre}</h3>
        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onViewDetails(producto)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
          >
            Ver detalles
          </button>
          <button
            type="button"
            onClick={() => onAdd(producto)}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

type CartPanelProps = {
  items: CartItem[];
  onEdit: (productoId: string) => void;
  onRemove: (productoId: string) => void;
};

function CartPanel({ items, onEdit, onRemove }: CartPanelProps) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 p-6 text-sm text-slate-600 shadow-sm">
        <p className="font-semibold text-slate-900">Resumen de servicios seleccionados</p>
        <p className="mt-3 text-sm text-slate-500">
          Aún no has seleccionado ningún servicio. Explora el catálogo y agrega los que te interesen.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:sticky lg:top-6">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">Resumen de servicios seleccionados</p>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{items.length}</span>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          const categoria = item.categoria;
          const summary = formatConfigSummary(categoria, item.config);
          return (
            <li key={item.productoId} className="rounded-2xl border border-slate-200 p-4 text-sm">
              <p className="font-semibold text-slate-900">{item.titulo}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {EMPRESA_PRODUCTO_CATEGORIA_LABELS[categoria]}
              </p>
              {summary ? <p className="mt-2 text-sm text-slate-600">{summary}</p> : null}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => onEdit(item.productoId)}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Ver / editar
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.productoId)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type ProductDetailSheetProps = {
  product: EmpresaProductoRow | null;
  initialConfig?: CartConfig | null;
  onClose: () => void;
  onSave: (config: CartConfig | null) => void;
};

function ProductDetailSheet({ product, initialConfig, onClose, onSave }: ProductDetailSheetProps) {
  const open = Boolean(product);
  const categoria = (product?.categoria as EmpresaProductoCategoria) ?? "tunnel_educativo";
  const fields = CONFIG_FIELDS[categoria] ?? [];
  const [configState, setConfigState] = useState<Record<string, string>>(() => buildConfigState(fields, initialConfig));

  useEffect(() => {
    setConfigState(buildConfigState(CONFIG_FIELDS[categoria] ?? [], initialConfig));
  }, [product?.id, categoria, initialConfig]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !product) {
    return null;
  }

  const badgeClass = getBadgeClass(categoria);
  const resumen = getResumen(product);
  const coverUrl = getCoverUrl(product);
  const videoMeta = detectVideoMeta(product.video_url);

  const handleSave = () => {
    const normalized = normalizeConfigPayload(categoria, configState);
    onSave(normalized);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 p-3 sm:p-6" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="space-y-1">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
              {getCategoriaLabel(categoria)}
            </span>
            <h2 className="text-2xl font-semibold text-slate-900">{product.nombre}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-500 hover:text-slate-700"
            aria-label="Cerrar"
          >
            X
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {coverUrl ? (
            <img src={coverUrl} alt={`Portada de ${product.nombre}`} className="w-full rounded-2xl object-cover" />
          ) : null}
          {videoMeta ? (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-slate-900">Video de referencia</h3>
              {videoMeta.kind === "mp4" ? (
                <video controls className="w-full rounded-2xl">
                  <source src={videoMeta.src} />
                </video>
              ) : videoMeta.kind === "link" ? (
                <a
                  href={videoMeta.src}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-semibold text-blue-700 hover:underline"
                >
                  Ver video
                </a>
              ) : (
                <iframe
                  src={videoMeta.src}
                  title={product.nombre}
                  className="aspect-video w-full rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          ) : null}
          <div className="space-y-2">
            <p className="text-base text-slate-600">{resumen}</p>
            {product.descripcion_larga ? (
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">{product.descripcion_larga}</p>
            ) : null}
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Personaliza este servicio (opcional)</h3>
              <p className="text-xs text-slate-500">{OPTIONAL_INFO_TEXT}</p>
            </div>
            {fields.length ? (
              <div className="space-y-4">
                {fields.map((field) => {
                  if (field.type === "textarea") {
                    return (
                      <label key={field.name} className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">{field.label}</span>
                        <textarea
                          value={configState[field.name] ?? ""}
                          onChange={(event) =>
                            setConfigState((prev) => ({ ...prev, [field.name]: event.target.value }))
                          }
                          className="min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder={field.placeholder}
                        />
                        {field.helper ? <span className="text-xs text-slate-500">{field.helper}</span> : null}
                      </label>
                    );
                  }
                  if (field.type === "select") {
                    return (
                      <label key={field.name} className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">{field.label}</span>
                        <select
                          value={configState[field.name] ?? ""}
                          onChange={(event) =>
                            setConfigState((prev) => ({ ...prev, [field.name]: event.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <option value="">Selecciona una opción</option>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  return (
                    <label key={field.name} className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">{field.label}</span>
                      <input
                        type={field.type === "number" ? "number" : "text"}
                        value={configState[field.name] ?? ""}
                        onChange={(event) =>
                          setConfigState((prev) => ({ ...prev, [field.name]: event.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        placeholder={field.placeholder}
                      />
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No hay campos específicos para personalizar este servicio. Puedes continuar con la selección.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Agregar al resumen de servicios
          </button>
        </div>
      </div>
    </div>
  );
}

type EmpresasFormProps = {
  productos: EmpresaProductoRow[];
};

export default function EmpresasForm({ productos }: EmpresasFormProps) {
  const orderedProductos = useMemo(() => {
    return [...(productos ?? [])].sort((a, b) => {
      const ordenA = a.orden ?? 9999;
      const ordenB = b.orden ?? 9999;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [productos]);

  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [detailProduct, setDetailProduct] = useState<EmpresaProductoRow | null>(null);
  const [detailInitialConfig, setDetailInitialConfig] = useState<CartConfig | null>(null);

  const openDetail = (producto: EmpresaProductoRow) => {
    const existing = cartItems.find((item) => item.productoId === producto.id);
    setDetailInitialConfig(existing?.config ?? null);
    setDetailProduct(producto);
  };

  const handleDetailSave = (config: CartConfig | null) => {
    if (!detailProduct) return;
    setCartItems((prev) => {
      const filtered = prev.filter((item) => item.productoId !== detailProduct.id);
      return [
        ...filtered,
        {
          productoId: detailProduct.id,
          titulo: detailProduct.nombre,
          categoria: detailProduct.categoria as EmpresaProductoCategoria,
          cantidad: 1,
          config,
        },
      ];
    });
    setDetailProduct(null);
  };

  const removeFromCart = (productoId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productoId !== productoId));
  };

  const editFromCart = (productoId: string) => {
    const target = orderedProductos.find((producto) => producto.id === productoId);
    if (target) {
      openDetail(target);
    }
  };

  const setField = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!form.email.trim() || !form.nombreEmpresa.trim()) {
      setFeedback({ type: "error", message: REQUIRED_MESSAGE });
      return;
    }

    setSending(true);
    try {
      const carritoPayload = cartItems.length
        ? {
            items: cartItems.map((item) => ({
              productoId: item.productoId,
              titulo: item.titulo,
              categoria: item.categoria,
              cantidad: item.cantidad,
              config: item.config && Object.keys(item.config).length ? item.config : null,
            })),
          }
        : null;
      const legacySelecciones = cartItems.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        nota: formatConfigSummary(item.categoria, item.config),
      }));

      const payload = {
        email: form.email.trim(),
        nombre_empresa: form.nombreEmpresa.trim(),
        nombre_persona: form.nombrePersona.trim(),
        cargo: form.cargo.trim(),
        telefono: form.telefono.trim(),
        ciudad: form.ciudad.trim(),
        desea_reunion: form.deseaReunion,
        mensaje: form.mensaje.trim(),
        carrito: carritoPayload,
        selecciones: legacySelecciones,
      };

      const response = await fetch("/api/empresas/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        const baseMessage = data?.message || data?.error || "No pudimos registrar tu solicitud.";
        throw new Error(baseMessage);
      }

      setFeedback({ type: "success", message: "Hemos recibido tu solicitud. Te contactaremos en un plazo máximo de 48 horas hábiles." });
      setForm(initialForm);
      setCartItems([]);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error: any) {
      setFeedback({ type: "error", message: error?.message || "Ocurrió un error al enviar el formulario." });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="space-y-12">
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="space-y-6" id="catalogo">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Catálogo de servicios</p>
          <h2 className="text-3xl font-semibold text-slate-900">Explora las experiencias para empresas</h2>
          <p className="text-sm text-slate-600">
            Selecciona los servicios que te interesan, personaliza los detalles opcionales y envíanos tu resumen.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <div className="space-y-5">
            {orderedProductos.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 p-6 text-center text-sm text-slate-500">
                Aún no tenemos productos publicados en el catálogo. Escríbenos igualmente y te contactaremos.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {orderedProductos.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    onViewDetails={openDetail}
                    onAdd={openDetail}
                  />
                ))}
              </div>
            )}
          </div>
          <CartPanel items={cartItems} onEdit={editFromCart} onRemove={removeFromCart} />
        </div>
      </section>

      <section id="contacto" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Contacto</p>
            <h2 className="text-3xl font-semibold text-slate-900">Cuéntanos de tu organización</h2>
            <p className="text-sm text-slate-500">Responderemos en menos de 48 horas hábiles.</p>
          </div>
          <div className="space-y-4 text-sm">
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Correo de contacto *</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5"
                autoComplete="email"
              />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Nombre de la organización *</span>
              <input
                required
                value={form.nombreEmpresa}
                onChange={(event) => setField("nombreEmpresa", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5"
                placeholder="Empresa, municipio o institución"
              />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Nombre de la persona de contacto</span>
              <input
                value={form.nombrePersona}
                onChange={(event) => setField("nombrePersona", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5"
                autoComplete="name"
              />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Cargo</span>
              <input
                value={form.cargo}
                onChange={(event) => setField("cargo", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="font-medium text-slate-700">Teléfono</span>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(event) => setField("telefono", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5"
                />
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-700">Ciudad</span>
                <input
                  value={form.ciudad}
                  onChange={(event) => setField("ciudad", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5"
                />
              </label>
            </div>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">¿Buscan una reunión?</span>
              <select
                value={form.deseaReunion}
                onChange={(event) => setField("deseaReunion", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5"
              >
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Cuéntanos qué necesitan</span>
              <textarea
                value={form.mensaje}
                onChange={(event) => setField("mensaje", event.target.value)}
                className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-2.5"
                placeholder="Ej: voluntariado corporativo, talleres de salud mental, operativos patrocinados..."
              />
              <span className="text-xs text-slate-500">
                Revisaremos tu solicitud y te escribiremos a la brevedad para coordinar una reunión o enviarte una propuesta. Toda la información que compartas es confidencial.
              </span>
            </label>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {sending ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </form>
      </section>

      <ProductDetailSheet
        product={detailProduct}
        initialConfig={detailInitialConfig}
        onClose={() => setDetailProduct(null)}
        onSave={handleDetailSave}
      />
    </section>
  );
}
