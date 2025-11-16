"use client";

import { useMemo, useState } from "react";
import {
  EMPRESA_PRODUCTO_CATEGORIA_LABELS,
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

type SelectedProductState = {
  quantity: number;
  note: string;
};

type EmpresasFormProps = {
  productos: EmpresaProductoRow[];
};

type ProductoCardProps = {
  producto: EmpresaProductoRow;
  selected: SelectedProductState | undefined;
  onToggle: () => void;
  onUpdate: (partial: Partial<SelectedProductState>) => void;
};

function extractHighlights(detalles: unknown): string[] {
  if (!detalles) return [];
  if (Array.isArray(detalles)) {
    return detalles.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof detalles === "object") {
    const candidates = ["bullets", "beneficios", "puntos", "items", "incluye"] as const;
    for (const key of candidates) {
      const value = (detalles as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    }
  }
  return [];
}

function ProductoCard({ producto, selected, onToggle, onUpdate }: ProductoCardProps) {
  const highlights = extractHighlights(producto.detalles_json);
  const isSelected = Boolean(selected);

  return (
    <article
      className={`rounded-3xl border bg-white/90 p-6 shadow-sm transition hover:shadow-md ${
        isSelected ? "border-blue-500 shadow-md" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {EMPRESA_PRODUCTO_CATEGORIA_LABELS[producto.categoria]}
            </p>
            <h3 className="text-xl font-semibold text-slate-900">{producto.nombre}</h3>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              isSelected
                ? "bg-blue-600 text-white shadow"
                : "border border-slate-300 bg-white text-slate-700 hover:border-blue-400"
            }`}
          >
            {isSelected ? "Seleccionado" : "Agregar"}
          </button>
        </div>
        <p className="text-sm text-slate-600">
          {producto.descripcion_corta || producto.descripcion_larga || "Programa corporativo Traesol."}
        </p>
        {highlights.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {highlights.map((item, index) => (
              <li key={`${producto.id}-hl-${index}`}>{item}</li>
            ))}
          </ul>
        ) : null}
        {producto.descripcion_larga && !highlights.length ? (
          <p className="text-sm text-slate-500">{producto.descripcion_larga}</p>
        ) : null}
        {isSelected ? (
          <div className="mt-3 grid gap-4 border-t border-slate-200 pt-4 text-sm">
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Cantidad estimada</span>
              <input
                type="number"
                min={1}
                value={selected?.quantity ?? 1}
                onChange={(event) => {
                  const value = Math.max(1, Number(event.target.value) || 1);
                  onUpdate({ quantity: value });
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Notas / objetivo</span>
              <input
                type="text"
                value={selected?.note ?? ""}
                onChange={(event) => onUpdate({ note: event.target.value })}
                placeholder="Ej: jornada para 30 colaboradores"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function EmpresasForm({ productos }: EmpresasFormProps) {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, SelectedProductState>>({});
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const orderedProductos = useMemo(() => productos ?? [], [productos]);

  const selectedList = useMemo(
    () => orderedProductos.filter((producto) => Boolean(selectedProducts[producto.id])),
    [orderedProductos, selectedProducts],
  );

  const selectedCount = selectedList.length;

  const setField = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleProduct = (productoId: string) => {
    setSelectedProducts((prev) => {
      if (prev[productoId]) {
        const next = { ...prev };
        delete next[productoId];
        return next;
      }
      return {
        ...prev,
        [productoId]: { quantity: 1, note: "" },
      } satisfies Record<string, SelectedProductState>;
    });
  };

  const updateSelection = (productoId: string, partial: Partial<SelectedProductState>) => {
    setSelectedProducts((prev) => {
      const current = prev[productoId] ?? { quantity: 1, note: "" };
      return {
        ...prev,
        [productoId]: { ...current, ...partial },
      };
    });
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
      const payload = {
        email: form.email.trim(),
        nombre_empresa: form.nombreEmpresa.trim(),
        nombre_persona: form.nombrePersona.trim(),
        cargo: form.cargo.trim(),
        telefono: form.telefono.trim(),
        ciudad: form.ciudad.trim(),
        desea_reunion: form.deseaReunion,
        mensaje: form.mensaje.trim(),
        selecciones: selectedList.map((producto) => {
          const meta = selectedProducts[producto.id];
          return {
            productoId: producto.id,
            cantidad: meta?.quantity ?? 1,
            nota: meta?.note?.trim() || null,
          };
        }),
      };

      const response = await fetch("/api/empresas/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        const baseMessage = data?.message || data?.error || "No pudimos registrar tu solicitud.";
        const debugMessage = data?.supabaseError
          ? `${baseMessage} Detalle: ${data.supabaseError}`
          : baseMessage;
        throw new Error(debugMessage);
      }

      setFeedback({ type: "success", message: "¡Gracias! Registramos tu solicitud y te contactaremos pronto." });
      setForm(initialForm);
      setSelectedProducts({});
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
    <section className="space-y-6">
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
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {orderedProductos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
              Aún no tenemos productos publicados en el catálogo. Escríbenos igualmente y te contactaremos.
            </div>
          ) : (
            orderedProductos.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                selected={selectedProducts[producto.id]}
                onToggle={() => toggleProduct(producto.id)}
                onUpdate={(partial) => updateSelection(producto.id, partial)}
              />
            ))
          )}
        </div>
        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="mb-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contacto</p>
              <h2 className="text-2xl font-semibold text-slate-900">Cuéntanos de tu empresa</h2>
              <p className="text-sm text-slate-500">Responderemos en menos de 48 horas hábiles.</p>
            </div>
            <div className="space-y-4 text-sm">
              <label className="space-y-1">
                <span className="font-medium text-slate-700">Correo de contacto *</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-700">Nombre de la empresa *</span>
                <input
                  required
                  value={form.nombreEmpresa}
                  onChange={(event) => setField("nombreEmpresa", event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-700">Nombre de la persona de contacto</span>
                <input
                  value={form.nombrePersona}
                  onChange={(event) => setField("nombrePersona", event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  autoComplete="name"
                />
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-700">Cargo</span>
                <input
                  value={form.cargo}
                  onChange={(event) => setField("cargo", event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="font-medium text-slate-700">Teléfono</span>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(event) => setField("telefono", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-medium text-slate-700">Ciudad</span>
                  <input
                    value={form.ciudad}
                    onChange={(event) => setField("ciudad", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
              <label className="space-y-1">
                <span className="font-medium text-slate-700">¿Buscan una reunión?</span>
                <select
                  value={form.deseaReunion}
                  onChange={(event) => setField("deseaReunion", event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option>Sí</option>
                  <option>No</option>
                  <option>Aún no lo sé</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-700">Cuéntanos qué necesitan</span>
                <textarea
                  value={form.mensaje}
                  onChange={(event) => setField("mensaje", event.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Ej: voluntariado corporativo, talleres de salud mental, operativos patrocinados..."
                />
              </label>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? "Enviando…" : "Enviar solicitud"}
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">
                También puedes escribirnos a contacto@fundaciontraesol.cl
              </p>
            </div>
          </form>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Selección del catálogo</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {selectedCount} {selectedCount === 1 ? "producto" : "productos"}
              </span>
            </div>
            {selectedCount === 0 ? (
              <p className="text-sm text-slate-500">Selecciona los programas que te interesan en el listado izquierdo.</p>
            ) : (
              <ul className="space-y-3 text-sm text-slate-700">
                {selectedList.map((producto) => {
                  const meta = selectedProducts[producto.id];
                  return (
                    <li key={`res-${producto.id}`} className="rounded-2xl border border-slate-200 p-3">
                      <p className="font-semibold text-slate-900">{producto.nombre}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {EMPRESA_PRODUCTO_CATEGORIA_LABELS[producto.categoria]}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Cantidad estimada: <strong>{meta?.quantity ?? 1}</strong>
                      </p>
                      {meta?.note ? (
                        <p className="text-sm text-slate-500">Notas: {meta.note}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
