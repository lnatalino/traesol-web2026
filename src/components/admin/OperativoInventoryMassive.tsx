"use client";

import { useState } from "react";
import { AdminSectionCard } from "@/components/admin/operativos/AdminSectionCard";
import { StatTile } from "@/components/admin/ui/StatTile";
import { Package, CheckCircle2, AlertCircle, Loader2, PlayCircle } from "lucide-react";

type InventoryRequirement = {
  item_name: string;
  item_id: string;
  required: number;
  available: number;
  missing: number;
  status: "ok" | "insufficient";
};

type InventorySummary = {
  total_confirmed: number;
  kits_pending: number;
  uniforms_pending: number;
  requirements: InventoryRequirement[];
  has_missing: boolean;
};

type Props = {
  operativoId: string;
};

export function OperativoInventoryMassive({ operativoId }: Props) {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Simular entrega (no cambia DB)
  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/operativos/${operativoId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "simulate" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al simular entrega");
      }

      setSummary(data.summary);
      setSuccess("Simulación completada. Revisa los requerimientos abajo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar entrega (descuenta stock y registra)
  const handleExecute = async () => {
    if (!summary || summary.has_missing) {
      setError("No se puede ejecutar: hay items insuficientes");
      return;
    }

    if (!confirm("¿Confirmas ejecutar la entrega masiva? Esta acción es irreversible y descontará el stock.")) {
      return;
    }

    setExecuting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/operativos/${operativoId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "execute" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al ejecutar entrega");
      }

      setSuccess(data.message || "Entrega ejecutada exitosamente");
      // Refrescar simulación para ver nuevo estado
      setTimeout(() => handleSimulate(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <AdminSectionCard
      title="Inventario para confirmados"
      icon={<Package className="h-4 w-4" />}
      hint="Planifica y ejecuta la entrega masiva de kits, uniformes y equipamiento"
    >
      <div className="space-y-6">
        {/* Stats rápidos */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile
              label="Confirmados"
              value={summary.total_confirmed}
              icon={<CheckCircle2 className="h-5 w-5" />}
              highlight={summary.total_confirmed > 0}
              highlightVariant="blue"
            />
            <StatTile
              label="Kits pendientes"
              value={summary.kits_pending}
              icon={<Package className="h-5 w-5" />}
              highlight={summary.kits_pending > 0}
              highlightVariant="amber"
            />
            <StatTile
              label="Uniformes por reponer"
              value={summary.uniforms_pending}
              icon={<Package className="h-5 w-5" />}
              highlight={summary.uniforms_pending > 0}
              highlightVariant="amber"
            />
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSimulate}
            disabled={loading || executing}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Simular entrega
          </button>

          {summary && (
            <button
              onClick={handleExecute}
              disabled={executing || summary.has_missing}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Ejecutar entrega
            </button>
          )}
        </div>

        {/* Mensajes */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">{success}</p>
            </div>
          </div>
        )}

        {/* Tabla de requerimientos */}
        {summary && summary.requirements.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Item
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Requerido
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Disponible
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Faltante
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {summary.requirements.map((req) => (
                  <tr key={req.item_id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {req.item_name}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {req.required}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {req.available}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold ${
                      req.missing > 0 ? "text-red-600" : "text-slate-400"
                    }`}>
                      {req.missing > 0 ? req.missing : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {req.status === "ok" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Insuficiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!summary && !loading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              Simula la entrega para ver requerimientos
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Haz clic en "Simular entrega" para calcular qué items se necesitan para los voluntarios confirmados.
            </p>
          </div>
        )}
      </div>
    </AdminSectionCard>
  );
}
