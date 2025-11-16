"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EMPRESA_PRODUCTO_CATEGORIA_LABELS,
  type EmpresaProductoRow,
} from "@/lib/empresas";

const badgeClass = (activo: boolean): string =>
  activo
    ? "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
    : "inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600";

const badgeLabel = (activo: boolean): string => (activo ? "Activo" : "Inactivo");

type Alert = { type: "success" | "error"; message: string } | null;

type EmpresaProductosTableProps = {
  initialProductos: EmpresaProductoRow[];
};

export default function EmpresaProductosTable({ initialProductos }: EmpresaProductosTableProps) {
  const [productos, setProductos] = useState<EmpresaProductoRow[]>(initialProductos);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(() => new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<Alert>(null);

  const isEmpty = productos.length === 0;

  function setTogglePending(id: string, shouldAdd: boolean) {
    setPendingToggleIds((prev) => {
      const next = new Set(prev);
      if (shouldAdd) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  async function handleToggle(productoId: string, nextValue: boolean) {
    const previousValue = productos.find((item) => item.id === productoId)?.activo ?? false;
    setAlert(null);
    setTogglePending(productoId, true);
    setProductos((prev) => prev.map((item) => (item.id === productoId ? { ...item, activo: nextValue } : item)));

    try {
      const response = await fetch("/api/admin/empresas/productos/toggle-activo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productoId, activo: nextValue }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "No se pudo actualizar el estado");
      }
      setAlert({ type: "success", message: `Producto ${nextValue ? "activado" : "desactivado"}.` });
    } catch (error: any) {
      setProductos((prev) =>
        prev.map((item) => (item.id === productoId ? { ...item, activo: previousValue } : item)),
      );
      setAlert({ type: "error", message: error?.message || "No se pudo actualizar el estado." });
    } finally {
      setTogglePending(productoId, false);
    }
  }

  async function handleDelete(productoId: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que quieres eliminar este producto para empresas? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    setAlert(null);
    setDeletingId(productoId);
    try {
      const response = await fetch("/api/admin/empresas/productos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productoId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "No se pudo eliminar el producto");
      }
      setProductos((prev) => prev.filter((item) => item.id !== productoId));
      setAlert({ type: "success", message: "Producto eliminado correctamente." });
    } catch (error: any) {
      setAlert({ type: "error", message: error?.message || "No se pudo eliminar el producto." });
    } finally {
      setDeletingId(null);
    }
  }

  if (isEmpty) {
    return (
      <div className="space-y-4">
        {alert ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              alert.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {alert.message}
          </div>
        ) : null}
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
          Aún no has creado productos para empresas. Usa el botón “Nuevo producto” para agregar el primero.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alert ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            alert.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {alert.message}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Portada</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Orden</th>
              <th className="px-4 py-3 text-left">Activo</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productos.map((producto) => {
              const toggleDisabled = pendingToggleIds.has(producto.id) || deletingId === producto.id;
              const deleteDisabled = deletingId === producto.id || pendingToggleIds.has(producto.id);
              return (
                <tr key={producto.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-4">
                    {(() => {
                      const coverUrl = producto.portada_url || producto.imagen_principal_url;
                      return coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={`Portada de ${producto.nombre}`}
                          className="h-12 w-12 rounded-xl object-cover shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                          Sin foto
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    <Link
                      href={`/admin/empresas/productos/${producto.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {producto.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {EMPRESA_PRODUCTO_CATEGORIA_LABELS[producto.categoria]}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{producto.orden ?? "—"}</td>
                  <td className="px-4 py-4">
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-slate-300 accent-blue-600"
                        checked={producto.activo}
                        disabled={toggleDisabled}
                        onChange={(event) => handleToggle(producto.id, event.currentTarget.checked)}
                      />
                      <span className={badgeClass(producto.activo)}>{badgeLabel(producto.activo)}</span>
                    </label>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/empresas/productos/${producto.id}`}
                        className="text-blue-600 transition hover:text-blue-800"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(producto.id)}
                        disabled={deleteDisabled}
                        className="text-red-600 transition hover:text-red-700 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
