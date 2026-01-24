"use client";

import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/errors";
import { CheckCircle, XCircle, Package, Shirt, CreditCard, Ribbon } from "lucide-react";

// Types
type LanyardType = {
  id: string;
  name: string;
  slug: string;
  ribbon_color_name: string;
  ribbon_hex: string | null;
  is_active: boolean;
};

type GearStatus = {
  volunteer_id: string;
  has_lanyard: boolean;
  has_id_card: boolean;
  lanyard_type_id: string | null;
  uniform_cycles_since_issue: number;
  uniform_last_issued_at: string | null;
  notes: string | null;
  lanyard_types?: LanyardType | null;
};

type Props = {
  voluntarioId: string;
  voluntarioNombre: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const UNIFORM_CYCLE_THRESHOLD = 5;

function formatDate(date: string | null): string {
  if (!date) return "Nunca";
  return new Date(date).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function VolunteerGearSection({ voluntarioId, voluntarioNombre }: Props) {
  const [gearStatus, setGearStatus] = useState<GearStatus | null>(null);
  const [lanyardTypes, setLanyardTypes] = useState<LanyardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Draft state for editing
  const [draft, setDraft] = useState<Partial<GearStatus>>({});

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [gearRes, typesRes] = await Promise.all([
          fetch(`/api/admin/voluntarios/${voluntarioId}/gear-status`),
          fetch("/api/admin/inventario/lanyard-types"),
        ]);

        const gearData = await gearRes.json();
        const typesData = await typesRes.json();

        if (gearData.data) {
          setGearStatus(gearData.data);
          setDraft(gearData.data);
        }
        if (typesData.data) {
          setLanyardTypes(typesData.data.filter((t: LanyardType) => t.is_active));
        }
      } catch (error) {
        console.error("Error fetching gear data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [voluntarioId]);

  function startEditing() {
    setDraft({ ...gearStatus });
    setFeedback(null);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft({ ...gearStatus });
    setFeedback(null);
    setEditing(false);
  }

  async function saveChanges() {
    if (saving) return;
    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/voluntarios/${voluntarioId}/gear-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      setGearStatus(data.data);
      setFeedback({ type: "success", message: "Equipamiento actualizado correctamente." });
      setEditing(false);
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error, "Error al guardar cambios") });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="animate-pulse space-y-4 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-[28px] bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  const status = gearStatus || {
    volunteer_id: voluntarioId,
    has_lanyard: false,
    has_id_card: false,
    lanyard_type_id: null,
    uniform_cycles_since_issue: 0,
    uniform_last_issued_at: null,
    notes: null,
  };

  const needsUniform = status.uniform_cycles_since_issue >= UNIFORM_CYCLE_THRESHOLD;
  const hasCompleteKit = status.has_lanyard && status.has_id_card;

  return (
    <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Equipamiento del voluntario</h2>
          <p className="text-sm text-slate-500">
            Kit base (lanyard + credencial) y estado de uniforme para {voluntarioNombre}.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Editar equipamiento
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveChanges}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-[24px] px-4 py-2 text-sm font-medium ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Kit Base Status */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Lanyard */}
        <article
          className={`rounded-[28px] border p-5 transition ${
            editing
              ? "border-slate-200 bg-white"
              : status.has_lanyard
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start justify-between">
            <Ribbon className={`h-5 w-5 ${status.has_lanyard ? "text-emerald-600" : "text-amber-600"}`} />
            {editing ? (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.has_lanyard ?? false}
                  onChange={(e) => setDraft((d) => ({ ...d, has_lanyard: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
              </label>
            ) : status.has_lanyard ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Lanyard</p>
          <p className={`mt-1 text-sm font-semibold ${status.has_lanyard ? "text-emerald-700" : "text-amber-700"}`}>
            {status.has_lanyard ? "Entregado" : "Pendiente"}
          </p>
        </article>

        {/* Credencial */}
        <article
          className={`rounded-[28px] border p-5 transition ${
            editing
              ? "border-slate-200 bg-white"
              : status.has_id_card
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start justify-between">
            <CreditCard className={`h-5 w-5 ${status.has_id_card ? "text-emerald-600" : "text-amber-600"}`} />
            {editing ? (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.has_id_card ?? false}
                  onChange={(e) => setDraft((d) => ({ ...d, has_id_card: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
              </label>
            ) : status.has_id_card ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Credencial</p>
          <p className={`mt-1 text-sm font-semibold ${status.has_id_card ? "text-emerald-700" : "text-amber-700"}`}>
            {status.has_id_card ? "Entregada" : "Pendiente"}
          </p>
        </article>

        {/* Uniforme Ciclo */}
        <article
          className={`rounded-[28px] border p-5 transition ${
            editing ? "border-slate-200 bg-white" : needsUniform ? "border-rose-200 bg-rose-50" : "border-slate-100 bg-slate-50"
          }`}
        >
          <div className="flex items-start justify-between">
            <Shirt className={`h-5 w-5 ${needsUniform ? "text-rose-600" : "text-slate-600"}`} />
            {!editing && needsUniform && <Package className="h-5 w-5 text-rose-600" />}
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Ciclo uniforme</p>
          {editing ? (
            <input
              type="number"
              min={0}
              max={10}
              value={draft.uniform_cycles_since_issue ?? 0}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  uniform_cycles_since_issue: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          ) : (
            <p className={`mt-1 text-2xl font-bold ${needsUniform ? "text-rose-700" : "text-slate-900"}`}>
              {status.uniform_cycles_since_issue} / {UNIFORM_CYCLE_THRESHOLD}
            </p>
          )}
          <p className={`mt-1 text-xs ${needsUniform ? "text-rose-600" : "text-slate-500"}`}>
            {needsUniform ? "Debe renovar uniforme" : "Uniforme vigente"}
          </p>
        </article>

        {/* Estado Kit */}
        <article
          className={`rounded-[28px] border p-5 ${
            hasCompleteKit ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start justify-between">
            <Package className={`h-5 w-5 ${hasCompleteKit ? "text-emerald-600" : "text-amber-600"}`} />
            {hasCompleteKit ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Kit base</p>
          <p className={`mt-1 text-sm font-semibold ${hasCompleteKit ? "text-emerald-700" : "text-amber-700"}`}>
            {hasCompleteKit ? "Completo" : "Incompleto"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Lanyard + Credencial</p>
        </article>
      </div>

      {/* Lanyard Type & Last Uniform */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tipo de Lanyard */}
        <div className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5">
          <label className="block text-sm font-semibold text-slate-900">Tipo de lanyard asignado</label>
          {editing ? (
            <select
              value={draft.lanyard_type_id ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, lanyard_type_id: e.target.value || null }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {lanyardTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.ribbon_color_name})
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              {status.lanyard_types ? (
                <>
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: status.lanyard_types.ribbon_hex || "#e2e8f0" }}
                  />
                  <span className="text-sm text-slate-700">
                    {status.lanyard_types.name} ({status.lanyard_types.ribbon_color_name})
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-500">Sin asignar</span>
              )}
            </div>
          )}
        </div>

        {/* Última entrega uniforme */}
        <div className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5">
          <label className="block text-sm font-semibold text-slate-900">Última entrega de uniforme</label>
          {editing ? (
            <input
              type="date"
              value={draft.uniform_last_issued_at?.split("T")[0] ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  uniform_last_issued_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          ) : (
            <p className="mt-2 text-sm text-slate-700">{formatDate(status.uniform_last_issued_at)}</p>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="rounded-[28px] border border-slate-100 bg-white/90 p-5">
        <label className="block text-sm font-semibold text-slate-900">Notas de equipamiento</label>
        <textarea
          rows={3}
          value={editing ? draft.notes ?? "" : status.notes ?? ""}
          readOnly={!editing}
          onChange={(e) => editing && setDraft((d) => ({ ...d, notes: e.target.value }))}
          placeholder="Notas sobre tallas, entregas especiales, etc."
          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-slate-900 focus:outline-none ${
            editing ? "border-slate-200 bg-white focus:border-slate-900" : "border-transparent bg-slate-50 text-slate-600"
          }`}
        />
      </div>
    </section>
  );
}
