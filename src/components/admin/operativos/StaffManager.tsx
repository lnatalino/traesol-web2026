// src/components/admin/operativos/StaffManager.tsx
// Componente para gestionar staff (admin/superadmin) asignado a un operativo
"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, X, Users, AlertCircle, Check } from "lucide-react";

interface StaffMember {
  id: string;
  user_id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  cargo_interno?: string | null;
  notas?: string | null;
}

interface AvailableUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  cargo_interno: string | null;
  role: string;
}

interface StaffManagerProps {
  operativoId: string;
  readOnly?: boolean;
}

export function StaffManager({ operativoId, readOnly = false }: StaffManagerProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [notas, setNotas] = useState("");

  // Cargar staff actual
  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/operativos/${operativoId}/staff`);
      const data = await res.json();
      if (data.ok) {
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error("[StaffManager] Error loading staff:", err);
    } finally {
      setLoading(false);
    }
  }, [operativoId]);

  // Cargar usuarios disponibles
  const loadAvailableUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/staff/available");
      const data = await res.json();
      if (data.ok) {
        setAvailableUsers(data.users || []);
      }
    } catch (err) {
      console.error("[StaffManager] Error loading available users:", err);
    }
  }, []);

  useEffect(() => {
    loadStaff();
    if (!readOnly) {
      loadAvailableUsers();
    }
  }, [loadStaff, loadAvailableUsers, readOnly]);

  // Agregar staff
  const handleAddStaff = async () => {
    if (!selectedUserId) {
      setError("Selecciona un usuario");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/operativos/${operativoId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUserId, notas }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Error al agregar staff");
      }

      setSuccess("Staff agregado correctamente");
      setShowAddModal(false);
      setSelectedUserId("");
      setNotas("");
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setAdding(false);
    }
  };

  // Remover staff
  const handleRemoveStaff = async (participantId: string) => {
    if (!confirm("¿Remover este miembro del equipo?")) return;

    setRemoving(participantId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `/api/admin/operativos/${operativoId}/staff?participantId=${participantId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Error al remover staff");
      }

      setSuccess("Staff removido correctamente");
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setRemoving(null);
    }
  };

  // Usuarios disponibles (no ya asignados)
  const assignedUserIds = new Set(staff.map(s => s.user_id));
  const filteredAvailable = availableUsers.filter(u => !assignedUserIds.has(u.id));

  const formatName = (user: { first_name?: string | null; last_name?: string | null; email?: string }) => {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    return name || user.email || "Sin nombre";
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <span>Cargando equipo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Equipo Traesol / Staff</h3>
          <span className="text-sm text-slate-500">({staff.length})</span>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <UserPlus className="h-4 w-4" />
            Agregar
          </button>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mx-5 mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="mx-5 mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Lista de staff */}
      <div className="p-5">
        {staff.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No hay staff asignado a este operativo.
          </p>
        ) : (
          <div className="space-y-2">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {formatName(member)}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {member.email}
                    {member.cargo_interno && (
                      <span className="ml-2 text-slate-400">• {member.cargo_interno}</span>
                    )}
                  </p>
                  {member.notas && (
                    <p className="text-xs text-slate-400 mt-1 italic">{member.notas}</p>
                  )}
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleRemoveStaff(member.id)}
                    disabled={removing === member.id}
                    className="ml-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Remover"
                  >
                    {removing === member.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para agregar */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h4 className="font-semibold text-slate-900">Agregar Staff</h4>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUserId("");
                  setNotas("");
                  setError("");
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Seleccionar miembro del equipo
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {filteredAvailable.map((user) => (
                    <option key={user.id} value={user.id}>
                      {formatName(user)} ({user.email})
                    </option>
                  ))}
                </select>
                {filteredAvailable.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    No hay más usuarios admin/superadmin disponibles.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notas / Rol en operativo (opcional)
                </label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Coordinador logística"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUserId("");
                  setNotas("");
                  setError("");
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddStaff}
                disabled={adding || !selectedUserId}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? "Agregando..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
