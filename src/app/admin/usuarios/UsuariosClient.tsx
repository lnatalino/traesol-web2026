// src/app/admin/usuarios/UsuariosClient.tsx
// Gestión unificada de usuarios: voluntarios + administradores
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Users,
  Loader2,
  RotateCcw,
  Trash2,
  Check,
  X,
  Shield,
  Edit,
  AlertCircle,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
} from "lucide-react";

type UnifiedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  rut: string | null;
  phone: string | null;
  birthdate: string | null;
  role: "volunteer" | "admin" | "superadmin";
  verified: boolean;
  enabled: boolean;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  volunteer: "Voluntario",
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  volunteer: "bg-slate-100 text-slate-700",
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  superadmin: ShieldCheck,
  admin: Shield,
  volunteer: User,
};

interface UsuariosClientProps {
  isSuperAdmin?: boolean;
}

export default function UsuariosClient({ isSuperAdmin = false }: UsuariosClientProps) {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Modal crear usuario
  const [showCreate, setShowCreate] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRut, setNewRut] = useState("");
  const [newRole] = useState<"admin">("admin"); // Solo admin desde UI
  const [creating, setCreating] = useState(false);

  // Modal editar usuario
  const [editUser, setEditUser] = useState<UnifiedUser | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRut, setEditRut] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal eliminar
  const [deleteUser, setDeleteUser] = useState<UnifiedUser | null>(null);
  const [deletePermanent, setDeletePermanent] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal reenviar OTP
  const [resendUser, setResendUser] = useState<UnifiedUser | null>(null);
  const [resending, setResending] = useState(false);

  // Debounce búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (searchDebounced) params.set("search", searchDebounced);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String((page - 1) * PAGE_SIZE));

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotal(data.total);
      } else {
        setError(data.error || "Error al cargar usuarios");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchDebounced, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          firstName: newFirstName,
          lastName: newLastName,
          rut: newRut || undefined,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShowCreate(false);
        setNewEmail("");
        setNewFirstName("");
        setNewLastName("");
        setNewRut("");
        // newRole es constante "admin", no necesita reset
        setSuccess(`Administrador creado. Se envió un código a ${newEmail} para establecer contraseña.`);
        fetchUsers();
        setTimeout(() => setSuccess(""), 8000);
      } else {
        setError(data.error || "Error al crear usuario");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          rut: editRut || null,
          phone: editPhone || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEditUser(null);
        setSuccess("Usuario actualizado");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Error al actualizar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    setError("");

    try {
      const url = deletePermanent 
        ? `/api/admin/users/${deleteUser.id}?permanent=true`
        : `/api/admin/users/${deleteUser.id}`;
      
      const res = await fetch(url, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setDeleteUser(null);
        setDeletePermanent(false);
        setSuccess(deletePermanent ? "Usuario eliminado permanentemente" : "Usuario deshabilitado");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Error al eliminar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  async function handleResendOtp() {
    if (!resendUser) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${resendUser.id}/resend-otp`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setResendUser(null);
        setSuccess(data.message || "Código enviado");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Error al enviar código");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setResending(false);
    }
  }

  function openEdit(user: UnifiedUser) {
    setEditUser(user);
    setEditFirstName(user.first_name || "");
    setEditLastName(user.last_name || "");
    setEditRut(user.rut || "");
    setEditPhone(user.phone || "");
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError("")} className="ml-auto hover:bg-red-100 p-1 rounded">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check size={16} />
          {success}
          <button onClick={() => setSuccess("")} className="ml-auto hover:bg-green-100 p-1 rounded">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Tabs de filtro por rol */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => { setRoleFilter("all"); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                roleFilter === "all" ? "bg-white shadow text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => { setRoleFilter("admin"); setPage(1); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  roleFilter === "admin" ? "bg-white shadow text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Admins
              </button>
            )}
            <button
              onClick={() => { setRoleFilter("volunteer"); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                roleFilter === "volunteer" ? "bg-white shadow text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Voluntarios
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email, nombre, RUT..."
              className="inp pl-9 pr-4 py-2 w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            <Users className="inline w-4 h-4 mr-1" />
            {total} usuario{total !== 1 && "s"}
          </span>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <UserPlus size={18} />
              Crear Admin
            </button>
          )}
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Usuario</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">RUT</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tipo</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Estado</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Creado</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => {
                    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
                    const RoleIcon = ROLE_ICONS[user.role] || User;
                    const canEdit = isSuperAdmin || user.role === "volunteer";
                    // Superadmin puede eliminar cualquiera (el API protege el último superadmin)
                    // Admin normal solo puede eliminar voluntarios
                    const canDelete = isSuperAdmin || (!isSuperAdmin && user.role === "volunteer");
                    
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                              user.role === "superadmin" ? "bg-purple-100 text-purple-700" :
                              user.role === "admin" ? "bg-blue-100 text-blue-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {fullName ? fullName[0].toUpperCase() : user.email[0].toUpperCase()}
                            </div>
                            <div>
                              {fullName && (
                                <span className="font-medium block">{fullName}</span>
                              )}
                              <span className={`text-sm ${fullName ? "text-slate-500" : "font-medium"}`}>
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {user.rut || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${ROLE_COLORS[user.role]}`}>
                            <RoleIcon size={12} />
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-medium ${user.enabled ? "text-green-600" : "text-red-600"}`}>
                              {user.enabled ? "Activo" : "Deshabilitado"}
                            </span>
                            {user.role === "volunteer" && (
                              <span className={`text-xs ${user.verified ? "text-slate-500" : "text-amber-600"}`}>
                                {user.verified ? "Verificado" : "Sin verificar"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(user.created_at).toLocaleDateString("es-CL")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <button
                                onClick={() => openEdit(user)}
                                className="p-2 text-slate-600 hover:text-brand hover:bg-slate-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {isSuperAdmin && (user.role === "admin" || user.role === "superadmin") && (
                              <button
                                onClick={() => setResendUser(user)}
                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Enviar código para contraseña"
                              >
                                <Mail size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteUser(user)}
                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Deshabilitar"
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
            </div>

            {users.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No se encontraron usuarios{search ? ` que coincidan con "${search}"` : ""}.
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-slate-600">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Crear Admin */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              Crear nuevo Administrador
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
                <label className="text-sm font-medium">Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="inp w-full"
                  placeholder="admin@traesol.cl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">RUT (opcional)</label>
                <input
                  type="text"
                  value={newRut}
                  onChange={(e) => setNewRut(e.target.value)}
                  className="inp w-full"
                  placeholder="12.345.678-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Rol</label>
                <select
                  value={newRole}
                  className="inp w-full bg-gray-100"
                  disabled
                >
                  <option value="admin">Administrador</option>
                  {/* Superadmin solo puede crearse por script de servidor */}
                </select>
                <p className="text-xs text-gray-500">Superadmin solo puede crearse por script de servidor</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-2 text-blue-700">
                  <Mail size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Se enviará un código por email</p>
                    <p className="text-blue-600 mt-1">
                      El administrador recibirá un código de 6 dígitos para establecer su contraseña 
                      usando el flujo de &quot;Olvidé mi contraseña&quot;.
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
                    setNewRut("");
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
                  Crear admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Edit size={20} />
              Editar usuario
            </h2>
            <p className="text-sm text-slate-600 mb-4">{editUser.email}</p>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nombre</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="inp w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Apellido</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="inp w-full"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">RUT</label>
                <input
                  type="text"
                  value={editRut}
                  onChange={(e) => setEditRut(e.target.value)}
                  className="inp w-full"
                  placeholder="12.345.678-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Teléfono</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="inp w-full"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
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
              {deletePermanent ? "Eliminar permanentemente" : "Deshabilitar usuario"}
            </h2>
            <p className="text-slate-600 mb-4">
              ¿Estás seguro de que deseas {deletePermanent ? "eliminar permanentemente" : "deshabilitar"} al usuario <strong>{deleteUser.email}</strong>?
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {deletePermanent 
                ? "⚠️ Esta acción es IRREVERSIBLE. El usuario y todos sus datos serán eliminados."
                : "El usuario no podrá iniciar sesión pero sus datos se conservarán."
              }
            </p>
            
            {/* Checkbox para eliminación permanente - solo para superadmin */}
            {isSuperAdmin && (
              <label className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={deletePermanent}
                  onChange={(e) => setDeletePermanent(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-red-700">
                  Eliminar permanentemente (no se puede deshacer)
                </span>
              </label>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteUser(null);
                  setDeletePermanent(false);
                }}
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
                {deletePermanent ? "Eliminar" : "Deshabilitar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reenviar OTP */}
      {resendUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail size={20} className="text-blue-600" />
              Enviar código de contraseña
            </h2>
            <p className="text-slate-600 mb-4">
              Se enviará un código de 6 dígitos a <strong>{resendUser.email}</strong> para que pueda establecer o restablecer su contraseña.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setResendUser(null)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                {resending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                Enviar código
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
