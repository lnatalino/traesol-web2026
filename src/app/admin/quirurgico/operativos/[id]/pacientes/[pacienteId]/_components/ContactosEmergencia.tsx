"use client";

// src/app/admin/quirurgico/operativos/[id]/pacientes/[pacienteId]/_components/ContactosEmergencia.tsx
// Sección para gestionar contactos de emergencia del paciente

import { useState } from "react";
import type { PacienteContacto } from "@/lib/quirurgico/types";

interface Props {
  pacienteId: string;
  contactos: PacienteContacto[];
  onRefresh: () => void;
}

export function ContactosEmergencia({ pacienteId, contactos, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newContacto, setNewContacto] = useState({
    nombre: "",
    relacion: "",
    telefono: "",
    es_principal: false,
  });

  const handleAdd = async () => {
    if (!newContacto.nombre || !newContacto.telefono) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/contactos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContacto),
      });

      if (response.ok) {
        setNewContacto({ nombre: "", relacion: "", telefono: "", es_principal: false });
        setAdding(false);
        onRefresh();
      }
    } catch (error) {
      console.error("Error al agregar contacto:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactoId: string) => {
    if (!confirm("¿Eliminar este contacto de emergencia?")) return;
    
    setDeletingId(contactoId);
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/contactos/${contactoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error al eliminar contacto:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Contactos de emergencia
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            + Agregar
          </button>
        )}
      </div>

      {/* Lista de contactos */}
      {contactos.length === 0 && !adding ? (
        <p className="text-sm text-slate-500">No hay contactos de emergencia registrados.</p>
      ) : (
        <div className="space-y-3">
          {contactos.map((contacto) => (
            <div
              key={contacto.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{contacto.nombre}</span>
                  {contacto.es_principal && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Principal
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  {contacto.relacion && <span>{contacto.relacion} · </span>}
                  <span>{contacto.telefono}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(contacto.id)}
                disabled={deletingId === contacto.id}
                className="text-sm text-rose-600 hover:text-rose-800 disabled:opacity-50"
              >
                {deletingId === contacto.id ? "..." : "Eliminar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar */}
      {adding && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Nombre completo *"
              value={newContacto.nombre}
              onChange={(e) => setNewContacto({ ...newContacto, nombre: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Relación (ej: Madre)"
              value={newContacto.relacion}
              onChange={(e) => setNewContacto({ ...newContacto, relacion: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Teléfono *"
              value={newContacto.telefono}
              onChange={(e) => setNewContacto({ ...newContacto, telefono: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newContacto.es_principal}
                onChange={(e) => setNewContacto({ ...newContacto, es_principal: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm text-slate-700">Contacto principal</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newContacto.nombre || !newContacto.telefono}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
