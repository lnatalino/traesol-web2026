// Esta página legacy redirige a la nueva estructura basada en operativos
// Los pacientes ahora se acceden desde /admin/quirurgico/operativos/[id]/pacientes

import { redirect } from "next/navigation";

export default function LegacyPacientesPage() {
  redirect("/admin/quirurgico/operativos");
}
