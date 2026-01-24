"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeletePatientButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (status === "loading") return;
    if (!window.confirm(`¿Deseas eliminar a ${patientName}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/quirurgico/pacientes/${patientId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "No se pudo eliminar al paciente.");
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar al paciente.";
      setErrorMessage(message);
      setStatus("error");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <button
        type="button"
        onClick={handleDelete}
        disabled={status === "loading"}
        className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Eliminando…" : "Eliminar"}
      </button>
      {errorMessage ? <p className="text-[11px] text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
