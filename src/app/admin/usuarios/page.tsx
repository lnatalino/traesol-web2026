// src/app/admin/usuarios/page.tsx
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import UsuariosClient from "./UsuariosClient";

export const metadata = { title: "Usuarios · Admin Traesol" };

export default async function UsuariosPage() {
  const session = await getAdminSession();

  if (!session.allowed) {
    redirect("/mi-cuenta/login?next=/admin/usuarios");
  }

  // Solo superadmin puede acceder a este módulo
  if (!session.isSuperAdmin) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-slate-600">
          Administra voluntarios y administradores del sistema.
        </p>
      </div>
      <UsuariosClient isSuperAdmin={true} />
    </div>
  );
}
