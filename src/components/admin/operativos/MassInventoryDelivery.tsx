"use client";

import { useState } from "react";
import { Package, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import type { DeliverySimulation } from "@/lib/inventario/massiveDelivery";

type Props = {
  operativoId: string;
  requirements: DeliverySimulation | null;
  onRefresh?: () => void;
};

type DeliveryStatus = "idle" | "simulating" | "executing" | "success" | "error";

export function MassInventoryDelivery({ operativoId, requirements, onRefresh }: Props) {
  const [status, setStatus] = useState<DeliveryStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  if (!requirements) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-lg font-semibold text-slate-700">
          No hay datos de inventario
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Configura los items de inventario y voluntarios confirmados para calcular requerimientos.
        </p>
      </div>
    );
  }

  // Adaptar nombres del tipo real
  const { summary, requirements: items, can_execute: canExecuteFromApi, blocking_items } = requirements;
  const totalMissing = items.filter(i => i.status === "insufficient" || i.status === "not_found").reduce((acc, i) => acc + i.missing_qty, 0);
  const totalRequired = items.reduce((acc, i) => acc + i.required_qty, 0);
  const volunteersCount = requirements.total_confirmados;
  const hasMissing = totalMissing > 0;
  const canExecute = canExecuteFromApi && totalRequired > 0;

  const handleSimulate = async () => {
    setStatus("simulating");
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/operativos/${operativoId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "simulate" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al simular entrega");
      }

      const data = await response.json();
      setSimulationResult(data);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    }
  };

  const handleExecute = async () => {
    if (!canExecute) return;

    const confirmed = window.confirm(
      `¿Confirmar entrega masiva?\n\n` +
      `Se entregarán ${totalRequired} items a ${volunteersCount} voluntarios.\n` +
      `Esta acción es irreversible y descuenta el inventario.`
    );

    if (!confirmed) return;

    setStatus("executing");
    setError(null);

    try {
      const response = await fetch(`/api/admin/operativos/${operativoId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "execute" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al ejecutar entrega");
      }

      const data = await response.json();
      setStatus("success");
      
      // Mostrar resultado y refrescar después de 2s
      setTimeout(() => {
        setStatus("idle");
        setSimulationResult(null);
        onRefresh?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Voluntarios confirmados"
          value={volunteersCount}
          icon={<Package className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          label="Items requeridos"
          value={totalRequired}
          icon={<Package className="h-5 w-5" />}
          color="slate"
        />
        <StatCard
          label="Items faltantes"
          value={totalMissing}
          icon={totalMissing > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          color={totalMissing > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Item</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Requerido</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Disponible</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Faltante</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={item.item_id || idx} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.item_name}</p>
                    {item.lanyard_type_slug && (
                      <p className="text-xs text-slate-500">{item.lanyard_type_slug}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-slate-900">{item.required_qty}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-medium text-slate-600">{item.available_qty}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${item.missing_qty > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.missing_qty}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.status === "ok" ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle className="h-3 w-3" />
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                      <AlertTriangle className="h-3 w-3" />
                      {item.status === "not_found" ? "No encontrado" : "Insuficiente"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-600" />
            <div>
              <h4 className="font-semibold text-rose-900">Error</h4>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div>
              <h4 className="font-semibold text-emerald-900">Entrega ejecutada</h4>
              <p className="text-sm text-emerald-700">
                Se registraron {totalRequired} entregas exitosamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {simulationResult && status === "idle" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">Simulación completada</h4>
              <p className="text-sm text-blue-700">
                {simulationResult.message || "La entrega puede ejecutarse sin problemas."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSimulate}
          disabled={status === "simulating" || status === "executing"}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "simulating" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Simulando...
            </>
          ) : (
            <>
              <Package className="h-4 w-4" />
              Simular entrega
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleExecute}
          disabled={!canExecute || status === "simulating" || status === "executing"}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "executing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ejecutando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Ejecutar entrega
            </>
          )}
        </button>

        {!canExecute && totalRequired > 0 && (
          <p className="flex items-center gap-2 text-sm text-rose-600">
            <AlertTriangle className="h-4 w-4" />
            No se puede ejecutar: hay items faltantes en inventario
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: "blue" | "slate" | "rose" | "emerald";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-50 text-slate-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
