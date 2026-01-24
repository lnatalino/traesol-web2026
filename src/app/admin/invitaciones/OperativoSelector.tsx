"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, MapPin, AlertTriangle } from "lucide-react";
import Link from "next/link";

export type OperativoOption = {
  id: string;
  titulo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string | null;
};

type Props = {
  operativos: OperativoOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Si true, sincroniza con query string */
  syncWithUrl?: boolean;
};

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return DATE_FORMAT.format(date);
}

export function OperativoSelector({ operativos, selectedId, onSelect, syncWithUrl = true }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    onSelect(value);
    
    if (syncWithUrl) {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("operativo", value);
      } else {
        params.delete("operativo");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  // Sin operativos disponibles
  if (operativos.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">No hay operativos disponibles</p>
            <p className="mt-1 text-sm text-amber-700">
              Para enviar invitaciones, debe existir al menos un operativo publicado y vigente (que no haya terminado).
            </p>
            <Link
              href="/admin/operativos"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              Ir a Operativos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedOp = operativos.find((op) => op.id === selectedId);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Operativo <span className="text-rose-500">*</span>
        </span>
        <select
          value={selectedId}
          onChange={(e) => handleChange(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">— Selecciona un operativo —</option>
          {operativos.map((op) => {
            const fecha = formatDate(op.fecha_inicio);
            const lugar = op.lugar || "";
            const label = [op.titulo || "Sin título", fecha, lugar].filter(Boolean).join(" · ");
            return (
              <option key={op.id} value={op.id}>
                {label}
              </option>
            );
          })}
        </select>
      </label>

      {/* Info del operativo seleccionado */}
      {selectedOp && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-blue-700">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(selectedOp.fecha_inicio)}
                {selectedOp.fecha_fin ? ` — ${formatDate(selectedOp.fecha_fin)}` : ""}
              </span>
            </div>
            {selectedOp.lugar && (
              <div className="flex items-center gap-1.5 text-blue-700">
                <MapPin className="h-4 w-4" />
                <span>{selectedOp.lugar}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
