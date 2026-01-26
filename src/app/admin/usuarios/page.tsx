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

  // Admin puede ver voluntarios, superadmin puede ver todos
  // La lógica de filtrado está en el cliente y en los endpoints

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-slate-600">
          {session.isSuperAdmin 
            ? "Administra voluntarios y administradores del sistema." 
            : "Administra los voluntarios registrados."}
        </p>
      </div>
      <UsuariosClient isSuperAdmin={session.isSuperAdmin} />
    </div>
  );
}
