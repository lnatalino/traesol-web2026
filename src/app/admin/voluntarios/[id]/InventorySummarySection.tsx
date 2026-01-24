"use client";

import { FormEvent, useState } from "react";
import { getErrorMessage } from "@/lib/errors";

type UniformStatus = {
  label: string;
  description: string;
  className: string;
};

type Props = {
  voluntarioId: string;
  initialOperativos: number;
  initialUniformes: number;
  ultimaEntregaLabel: string;
  uniformeStatus: UniformStatus;
  notaInventario: string | null;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

function normalizeCounter(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

export function InventorySummarySection({
  voluntarioId,
  initialOperativos,
  initialUniformes,
  ultimaEntregaLabel,
  uniformeStatus,
  notaInventario,
}: Props) {
  const [values, setValues] = useState(() => ({
    operativos: initialOperativos ?? 0,
    uniformes: initialUniformes ?? 0,
    nota: notaInventario?.trim() ?? "",
  }));
  const [draft, setDraft] = useState(() => ({
    operativos: String(initialOperativos ?? 0),
    uniformes: String(initialUniformes ?? 0),
    nota: notaInventario ?? "",
  }));
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const sectionId = `inventario-${voluntarioId}`;

  function startEditing() {
    setDraft({
      operativos: String(values.operativos),
      uniformes: String(values.uniformes),
      nota: values.nota,
    });
    setFeedback(null);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft({
      operativos: String(values.operativos),
      uniformes: String(values.uniformes),
      nota: values.nota,
    });
    setFeedback(null);
    setEditing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setFeedback(null);
    const operativos = normalizeCounter(draft.operativos);
    const uniformes = normalizeCounter(draft.uniformes);
    const nota = draft.nota.trim();

    try {
      const formData = new FormData();
      formData.set("id", voluntarioId);
      formData.set("operativos_asistidos", String(operativos));
      formData.set("uniformes_entregados", String(uniformes));
      formData.set("nota_inventario", nota);

      const response = await fetch("/api/admin/voluntarios/inventario", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudieron guardar los cambios.");
      }

      setValues({ operativos, uniformes, nota });
      setDraft({ operativos: String(operativos), uniformes: String(uniformes), nota });
      setFeedback({ type: "success", message: "Inventario actualizado correctamente." });
      setEditing(false);
    } catch (error: unknown) {
      const message = getErrorMessage(error, "No se pudieron guardar los cambios.");
      setFeedback({ type: "error", message });
    } finally {
      setPending(false);
    }
  }

  return (
    <section id={sectionId} className="space-y-4 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Resumen de inventario personal</h2>
          <p className="text-sm text-slate-500">Datos internos para planificar entregas y renovaciones.</p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Editar inventario
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelEditing}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            disabled={pending}
          >
            Cancelar
          </button>
        )}
      </div>
      {feedback ? (
        <div
          className={`rounded-[24px] px-4 py-2 text-sm font-medium ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Operativos asistidos</p>
            {editing ? (
              <input
                type="number"
                min={0}
                name="operativos_asistidos"
                value={draft.operativos}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, operativos: event.target.value.replace(/[^\d]/g, "") }))
                }
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                inputMode="numeric"
              />
            ) : (
              <p className="mt-2 text-3xl font-semibold text-slate-900">{values.operativos}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">Conteo interno, no visible al voluntario.</p>
          </article>
          <article className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Uniformes entregados</p>
            {editing ? (
              <input
                type="number"
                min={0}
                name="uniformes_entregados"
                value={draft.uniformes}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, uniformes: event.target.value.replace(/[^\d]/g, "") }))
                }
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                inputMode="numeric"
              />
            ) : (
              <p className="mt-2 text-3xl font-semibold text-slate-900">{values.uniformes}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">Última entrega registrada: {ultimaEntregaLabel}</p>
          </article>
          <article className={`rounded-[28px] border border-transparent p-5 ring-1 ${uniformeStatus.className}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em]">Estado del uniforme</p>
            <p className="mt-2 text-base font-semibold">{uniformeStatus.label}</p>
            <p className="mt-1 text-xs">{uniformeStatus.description}</p>
          </article>
        </div>
        <div className="rounded-[28px] border border-slate-100 bg-white/90 p-5">
          <label className="block text-sm font-semibold text-slate-900" htmlFor={`${sectionId}-nota`}>
            Nota interna
          </label>
          <textarea
            id={`${sectionId}-nota`}
            name="nota_inventario"
            rows={4}
            value={editing ? draft.nota : values.nota}
            readOnly={!editing}
            onChange={(event) => editing && setDraft((prev) => ({ ...prev, nota: event.target.value }))}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 focus:outline-none ${
              editing
                ? "border-slate-300 bg-white focus:border-slate-900"
                : "border-transparent bg-slate-50 text-slate-600"
            }`}
            placeholder="Notas para próximas entregas o estados especiales."
          />
        </div>
        {editing ? (
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : null}
      </form>
    </section>
  );
}
