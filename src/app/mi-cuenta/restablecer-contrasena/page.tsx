// src/app/mi-cuenta/restablecer-contrasena/page.tsx
// Esta página ya no se usa - redirige al nuevo flujo de OTP
// El nuevo flujo está integrado en /mi-cuenta/olvido-contrasena

import { redirect } from "next/navigation";

export default function RestablecerContrasenaPage() {
  // Redirigir al nuevo flujo unificado de recuperación con OTP
  redirect("/mi-cuenta/olvido-contrasena");
}
