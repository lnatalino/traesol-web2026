"use client";

import { useState } from "react";
import { Package, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { AdminSectionCard } from "@/components/admin/operativos/AdminSectionCard";
import type {
  DeliverySimulation,
  DeliveryExecutionResult,
  ItemRequirement,
} from "@/lib/inventario/massiveDelivery";

type Props = {
  operativoId: string;
  confirmadosCount: number;
};

/**
 * Sección de planificación y entrega masiva de inventario
 * Muestra cálculo de requerimientos, stock disponible y permite ejecutar entrega
 */
export function InventarioMasivoSection({ operativoId, confirmadosCount }: Props) {
  const [simulation, setSimulation] = useState<DeliverySimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<DeliveryExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simular entrega
  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/admin/operativos/${operativoId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "simulate" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al simular entrega");
      }

      const data: DeliverySimulation = await res.json();
      setSimulation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar entrega
  const handleExecute = async () => {
    if (!simulation?.can_execute) return;

    const confirmed = confirm(
      `¿Confirmar entrega masiva de inventario?\n\n` +
        `Se crearán ${simulation.summary.kits_pendientes} entregas de kit base y ` +
        `${simulation.summary.uniformes_por_reponer} reposiciones de uniforme.\n\n` +
        `Esta acción NO se puede deshacer.`
    );

    if (!confirmed) return;

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/admin/operativos/${operativoId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "execute" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al ejecutar entrega");
      }

      const data: DeliveryExecutionResult = await res.json();
      setResult(data);

      // Refrescar simulación después de ejecutar
      if (data.success) {
        setTimeout(handleSimulate, 1000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <AdminSectionCard
      title="Inventario para confirmados"
      hint="Calcula automáticamente los insumos necesarios según voluntarios confirmados y ejecuta la entrega masiva."
      icon={<Package className="h-4 w-4" />}
    >
      <div className="space-y-6">
        {/* Stats tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Confirmados" value={confirmadosCount} variant="neutral" />
          <StatTile
            label="Kits pendientes"
            value={simulation?.summary.kits_pendientes ?? "—"}
            variant="info"
          />
          <StatTile
            label="Uniformes por reponer"
            value={simulation?.summary.uniformes_por_reponer ?? "—"}
            variant="warning"
          />
        </div>

        {/* Mensaje de resultado */}
        {result && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              result.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {result.success ? "✓" : "⚠"} {result.message}
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs opacity-90">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            ⚠ {error}
          </div>
        )}

        {/* Tabla de requerimientos */}
        {simulation && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Item</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Requerido</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Disponible</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Faltante</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {simulation.requirements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No hay requerimientos para este operativo
                    </td>
                  </tr>
                ) : (
                  simulation.requirements.map((req) => (
                    <RequirementRow key={req.item_type} requirement={req} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSimulate}
            disabled={loading || executing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Simular entrega
          </button>

          <button
            onClick={handleExecute}
            disabled={
              executing ||
              loading ||
              !simulation ||
              !simulation.can_execute ||
              confirmadosCount === 0
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {executing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Ejecutar entrega
          </button>

          {simulation && !simulation.can_execute && simulation.blocking_items.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                Faltantes: {simulation.blocking_items.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Info disclaimer */}
        <p className="text-xs text-slate-500">
          💡 <strong>Tip:</strong> La simulación muestra qué items se entregarían sin modificar la
          base de datos. Al ejecutar, se registran las entregas, se actualizan los estados de
          equipamiento y se decrementa el stock automáticamente.
        </p>
      </div>
    </AdminSectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componentes auxiliares
   ───────────────────────────────────────────────────────────────────────────── */

function StatTile({
  label,
  value,
  variant,
}: {
  label: string;
  value: number | string;
  variant: "neutral" | "info" | "warning";
}) {
  const variantClasses = {
    neutral: "border-slate-200 bg-slate-50 text-slate-900",
    info: "border-blue-200 bg-blue-50 text-blue-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <div className={`rounded-xl border p-4 ${variantClasses[variant]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function RequirementRow({ requirement }: { requirement: ItemRequirement }) {
  const statusIcon = {
    ok: <CheckCircle className="h-4 w-4 text-emerald-600" />,
    insufficient: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    not_found: <XCircle className="h-4 w-4 text-rose-600" />,
  };

  const statusText = {
    ok: "OK",
    insufficient: "Insuficiente",
    not_found: "No encontrado",
  };

  const statusClass = {
    ok: "text-emerald-700",
    insufficient: "text-amber-700",
    not_found: "text-rose-700",
  };

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">
        {requirement.item_name}
        {requirement.lanyard_type_slug && (
          <span className="ml-2 text-xs text-slate-500">({requirement.lanyard_type_slug})</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-700">{requirement.required_qty}</td>
      <td className="px-4 py-3 text-slate-700">{requirement.available_qty}</td>
      <td className="px-4 py-3">
        <span className={requirement.missing_qty > 0 ? "font-semibold text-rose-700" : "text-slate-500"}>
          {requirement.missing_qty > 0 ? requirement.missing_qty : "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className={`inline-flex items-center gap-1.5 ${statusClass[requirement.status]}`}>
          {statusIcon[requirement.status]}
          <span className="text-xs font-semibold">{statusText[requirement.status]}</span>
        </div>
      </td>
    </tr>
  );
}
