// src/app/admin/usuarios/UsuariosClient.tsx
"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Users,
  Loader2,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  Check,
  X,
  Shield,
  Edit,
  AlertCircle,
  Mail,
  Copy,
} from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  enabled: boolean;
  force_password_change: boolean;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visor",
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  editor: "bg-green-100 text-green-800",
  viewer: "bg-slate-100 text-slate-800",
};

interface UsuariosClientProps {
  isSuperAdmin?: boolean;
}

export default function UsuariosClient({ isSuperAdmin = false }: UsuariosClientProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal crear usuario
  const [showCreate, setShowCreate] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("editor");
  const [creating, setCreating] = useState(false);

  // Modal reset password
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Modal eliminar
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/usuarios");
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || "Error al cargar usuarios");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          firstName: newFirstName,
          lastName: newLastName,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setShowCreate(false);
        setNewEmail("");
        setNewFirstName("");
        setNewLastName("");
        setNewRole("editor");
        setSuccess(`Usuario creado. Se envió un email de bienvenida a ${newEmail}`);
        fetchUsers();
        // Limpiar mensaje de éxito después de 5 segundos
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Error al crear usuario");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleEnabled(user: AdminUser) {
    try {
      const res = await fetch(`/api/admin/usuarios/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !user.enabled }),
      });

      const data = await res.json();

      if (data.ok) {
        fetchUsers();
      } else {
        setError(data.error || "Error al actualizar usuario");
      }
    } catch {
      setError("Error de conexión");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser) return;
    setResetting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/usuarios/${resetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      const data = await res.json();

      if (data.ok) {
        setResetUser(null);
        setResetPassword("");
        fetchUsers();
      } else {
        setError(data.error || "Error al resetear contraseña");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/usuarios/${deleteUser.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.ok) {
        setDeleteUser(null);
        fetchUsers();
      } else {
        setError(data.error || "Error al eliminar usuario");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check size={16} />
          {success}
          <button onClick={() => setSuccess("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header con botón crear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-600">
          <Users size={20} />
          <span>{users.length} usuario{users.length !== 1 && "s"}</span>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <UserPlus size={18} />
            Crear usuario
          </button>
        )}
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Usuario</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rol</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Creado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
              return (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div>
                    {fullName && (
                      <span className="font-medium block">{fullName}</span>
                    )}
                    <span className={`text-sm ${fullName ? "text-slate-500" : "font-medium"}`}>
                      {user.email}
                    </span>
                    {user.force_password_change && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        Pendiente
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${ROLE_COLORS[user.role] || ROLE_COLORS.viewer}`}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleEnabled(user)}
                    className={`flex items-center gap-1 text-sm ${
                      user.enabled ? "text-green-600" : "text-red-600"
                    }`}
                    title={user.enabled ? "Deshabilitar" : "Habilitar"}
                  >
                    {user.enabled ? (
                      <>
                        <Check size={14} /> Activo
                      </>
                    ) : (
                      <>
                        <X size={14} /> Inactivo
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(user.created_at).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setResetUser(user)}
                      className="p-2 text-slate-600 hover:text-brand hover:bg-slate-100 rounded-lg transition-colors"
                      title="Resetear contraseña"
                    >
                      <RotateCcw size={16} />
                    </button>
                    {user.role !== "superadmin" && (
                      <button
                        onClick={() => setDeleteUser(user)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No hay usuarios registrados.
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus size={20} />
              Crear nuevo usuario
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nombre *</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    required
                    className="inp w-full"
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Apellido *</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    required
                    className="inp w-full"
                    placeholder="Pérez"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email (será el usuario) *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="inp w-full"
                  placeholder="usuario@traesol.cl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Rol</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="inp w-full"
                >
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Visor</option>
                </select>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-2 text-blue-700">
                  <Mail size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Se enviará un correo de bienvenida</p>
                    <p className="text-blue-600 mt-1">
                      El usuario recibirá una contraseña temporal y deberá cambiarla al iniciar sesión por primera vez.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setNewFirstName("");
                    setNewLastName("");
                    setNewEmail("");
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  Crear usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RotateCcw size={20} />
              Resetear contraseña
            </h2>
            <p className="text-slate-600 mb-4">
              Establecer nueva contraseña temporal para <strong>{resetUser.email}</strong>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nueva contraseña temporal</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    required
                    minLength={6}
                    className="inp w-full pr-20"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setResetPassword(generatePassword())}
                      className="text-xs text-brand hover:underline"
                    >
                      Generar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetUser(null);
                    setResetPassword("");
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {resetting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <Trash2 size={20} />
              Eliminar usuario
            </h2>
            <p className="text-slate-600 mb-4">
              ¿Estás seguro de que deseas eliminar al usuario <strong>{deleteUser.email}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
