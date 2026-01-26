// src/app/restablecer-contrasena/page.tsx
// DEPRECADO: Redirige al sistema unificado

import { redirect } from "next/navigation";

export default function RestablecerContrasenaPage() {
  redirect("/mi-cuenta/olvido-contrasena");
}
