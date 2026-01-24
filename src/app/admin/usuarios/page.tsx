// src/app/admin/usuarios/page.tsx
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import UsuariosClient from "./UsuariosClient";

export const metadata = { title: "Usuarios · Admin Traesol" };

export default async function UsuariosPage() {
  const session = await getAdminSession();

  if (!session.allowed) {
    redirect("/login?next=/admin/usuarios");
  }

  // Usar isSuperAdmin que considera SUPERADMIN_EMAILS y el rol efectivo
  if (!session.isSuperAdmin) {
    redirect("/admin?error=no_autorizado");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-slate-600">Administra los usuarios del panel administrativo.</p>
      </div>
      <UsuariosClient isSuperAdmin={session.isSuperAdmin} />
    </div>
  );
}
