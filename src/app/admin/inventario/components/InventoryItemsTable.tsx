"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INVENTARIO_TIPO_REGLA_LABELS, type InventarioItem } from "@/lib/inventario/types";

type StockAlert = { type: "success" | "error"; message: string } | undefined;

type InventoryItemDetailCardProps = {
  item: InventoryListItem;
  stockValue: string;
  updating: boolean;
  alert?: StockAlert;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
};

type InventoryListItem = InventarioItem & {
  categoriaLabel: string;
};

export type InventoryItemsTableProps = {
  items: InventoryListItem[];
  errorMessage?: string;
};

const formatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const truncate = (value: string | null, max = 64): string => {
  if (!value) return "—";
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

export function InventoryItemsTable({ items, errorMessage }: InventoryItemsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(items);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stockValues, setStockValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const item of items) {
      initial[item.id] = String(item.cantidad_actual ?? 0);
    }
    return initial;
  });
  const [alerts, setAlerts] = useState<Record<string, StockAlert>>({});

  useEffect(() => {
    setLocalItems(items);
    setStockValues((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const item of items) {
        next[item.id] = prev[item.id] ?? String(item.cantidad_actual ?? 0);
      }
      return next;
    });
  }, [items]);

  const expandedItem = useMemo(() => localItems.find((item) => item.id === expandedId) ?? null, [localItems, expandedId]);

  const handleStockChange = (id: string, value: string) => {
    setStockValues((prev) => ({ ...prev, [id]: value }));
    setAlerts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleStockSubmit = async (item: InventoryListItem) => {
    const currentValue = stockValues[item.id] ?? "";
    if (!currentValue.trim()) {
      setAlerts((prev) => ({ ...prev, [item.id]: { type: "error", message: "Ingresa un valor válido." } }));
      return;
    }
    const parsed = Number.parseInt(currentValue, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setAlerts((prev) => ({ ...prev, [item.id]: { type: "error", message: "El stock no puede ser negativo." } }));
      return;
    }

    setUpdatingId(item.id);
    setAlerts((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    try {
      const response = await fetch("/api/admin/inventario/items/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, cantidad: parsed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        const friendly = payload?.message || "No se pudo actualizar el stock.";
        throw new Error(payload?.debug || friendly);
      }
      setAlerts((prev) => ({ ...prev, [item.id]: { type: "success", message: "Stock actualizado correctamente." } }));
      setStockValues((prev) => ({ ...prev, [item.id]: String(parsed) }));
      setLocalItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, cantidad_actual: parsed } : row)));
    } catch (error: any) {
      console.error("inventario quick stock update error", error);
      setAlerts((prev) => ({ ...prev, [item.id]: { type: "error", message: error?.message || "Error inesperado." } }));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="space-y-5 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      {localItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
          No encontramos ítems con los filtros actuales.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-600">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Tipo de regla</th>
                <th className="px-3 py-2">Uso</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {localItems.map((item) => {
                const tipoLabel = item.tipo_regla ? INVENTARIO_TIPO_REGLA_LABELS[item.tipo_regla] : "—";
                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-3 py-4">
                      <div className="font-semibold text-slate-900">{item.nombre}</div>
                      <div className="text-xs text-slate-400">Slug: {item.slug}</div>
                    </td>
                    <td className="px-3 py-4">{item.categoriaLabel || "Sin categoría"}</td>
                    <td className="px-3 py-4">
                      <div className="font-semibold text-slate-900">{item.cantidad_actual}</div>
                      <div className="text-xs text-slate-400">{item.unidad || "unidad"}</div>
                    </td>
                    <td className="px-3 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600">
                        {tipoLabel}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-500">{truncate(item.uso)}</td>
                    <td className="px-3 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <Link
                          href={`/admin/inventario/items/${item.id}`}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          {expandedId === item.id ? "Ocultar" : "Ver detalle"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {expandedItem ? (
        <InventoryItemDetailCard
          item={expandedItem}
          stockValue={stockValues[expandedItem.id] ?? String(expandedItem.cantidad_actual ?? 0)}
          updating={updatingId === expandedItem.id}
          alert={alerts[expandedItem.id]}
          onClose={() => setExpandedId(null)}
          onInputChange={(value) => handleStockChange(expandedItem.id, value)}
          onSubmit={() => handleStockSubmit(expandedItem)}
        />
      ) : null}
    </section>
  );
}

function InventoryItemDetailCard({
  item,
  stockValue,
  updating,
  alert,
  onClose,
  onInputChange,
  onSubmit,
}: InventoryItemDetailCardProps) {
  const tipoLabel = item.tipo_regla ? INVENTARIO_TIPO_REGLA_LABELS[item.tipo_regla] : "—";
  return (
    <div className="rounded-[32px] border border-slate-100 bg-white/95 p-6 text-sm text-slate-900 shadow-lg shadow-slate-900/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Detalle del ítem</p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-900">{item.nombre}</h3>
          <p className="text-sm text-slate-500">{item.categoriaLabel || "Sin categoría"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 transition hover:text-blue-800"
        >
          Cerrar
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Descripción</dt>
            <dd className="mt-1 text-sm text-slate-800">{item.descripcion || "Sin descripción"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Uso habitual</dt>
            <dd className="mt-1 text-sm text-slate-800">{item.uso || "Sin registro"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unidad</dt>
            <dd className="mt-1 text-sm text-slate-800">{item.unidad || "unidad"}</dd>
          </div>
        </dl>
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tipo de regla</dt>
            <dd className="mt-1">
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {tipoLabel}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Valor unitario</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {typeof item.valor_unitario === "number" ? formatter.format(item.valor_unitario) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stock disponible</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {item.cantidad_actual} {item.unidad || "unidad"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Edición rápida de stock</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex-1 text-sm font-semibold text-slate-700">
            <span className="text-xs uppercase tracking-widest text-slate-500">Stock disponible</span>
            <input
              type="number"
              min={0}
              value={stockValue}
              onChange={(event) => onInputChange(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={onSubmit}
            disabled={updating}
            className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? "Guardando..." : "Guardar stock"}
          </button>
        </div>
        {alert ? (
          <div
            className={`mt-3 rounded-2xl px-4 py-2 text-xs font-semibold ${
              alert.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {alert.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
