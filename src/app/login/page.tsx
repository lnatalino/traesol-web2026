// src/app/login/page.tsx
// DEPRECADO: Este login viejo ahora redirige al sistema unificado
// TODO: Eliminar este archivo en una futura limpieza

import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = params.next || "";
  
  // Redirigir al login unificado preservando el parámetro next
  if (next) {
    redirect(`/mi-cuenta/login?next=${encodeURIComponent(next)}`);
  }
  redirect("/mi-cuenta/login");
}
