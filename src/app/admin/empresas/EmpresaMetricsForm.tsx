"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { EmpresaMetricsRecord } from "@/lib/empresas";

const inputStyles =
  "flex-1 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none";

type Status = { type: "idle" | "saving" | "success" | "error"; message?: string };

type FormState = Pick<EmpresaMetricsRecord, "operativosConEmpresas" | "colaboradoresMovilizados" | "regionesImpactadas">;

const formatNumber = (value: number) => new Intl.NumberFormat("es-CL").format(value);

export function EmpresaMetricsForm({ initialMetrics }: { initialMetrics: EmpresaMetricsRecord }) {
  const [values, setValues] = useState<FormState>({
    operativosConEmpresas: initialMetrics.operativosConEmpresas,
    colaboradoresMovilizados: initialMetrics.colaboradoresMovilizados,
    regionesImpactadas: initialMetrics.regionesImpactadas,
  });
  const [lastUpdated, setLastUpdated] = useState<string | null>(initialMetrics.updatedAt);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const formattedUpdatedAt = useMemo(() => {
    if (!lastUpdated) return "Aún no registrado";
    try {
      return new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastUpdated));
    } catch {
      return lastUpdated;
    }
  }, [lastUpdated]);

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    const parsed = Number(nextValue);
    setValues((prev) => ({
      ...prev,
      [field]: nextValue === "" || !Number.isFinite(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "saving" });

    try {
      const response = await fetch("/api/admin/empresas/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await response.json();
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo guardar");
      }

      setValues({
        operativosConEmpresas: json.data.operativosConEmpresas,
        colaboradoresMovilizados: json.data.colaboradoresMovilizados,
        regionesImpactadas: json.data.regionesImpactadas,
      });
      setLastUpdated(json.data.updatedAt ?? new Date().toISOString());
      setStatus({ type: "success", message: "Métricas actualizadas correctamente." });
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message || "Ocurrió un problema" });
    }
  };

  const disabled = status.type === "saving";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          Operativos con empresas
          <input
            type="number"
            min={0}
            className={inputStyles}
            value={values.operativosConEmpresas}
            onChange={handleChange("operativosConEmpresas")}
            inputMode="numeric"
          />
          <span className="text-xs text-slate-500">
            Total de operativos realizados junto a empresas. Actual: {formatNumber(values.operativosConEmpresas)}
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          Colaboradores movilizados
          <input
            type="number"
            min={0}
            className={inputStyles}
            value={values.colaboradoresMovilizados}
            onChange={handleChange("colaboradoresMovilizados")}
            inputMode="numeric"
          />
          <span className="text-xs text-slate-500">
            Personas de empresas que han participado en terreno.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          Regiones impactadas
          <input
            type="number"
            min={0}
            className={inputStyles}
            value={values.regionesImpactadas}
            onChange={handleChange("regionesImpactadas")}
            inputMode="numeric"
          />
          <span className="text-xs text-slate-500">Cantidad de regiones intervenidas con programas corporativos.</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <p>
          Última actualización: <span className="font-medium text-slate-700">{formattedUpdatedAt}</span>
        </p>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status.type === "saving" ? "Guardando..." : "Guardar métricas"}
        </button>
      </div>

      {status.type !== "idle" && status.message ? (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            status.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {status.message}
        </div>
      ) : null}
    </form>
  );
}
