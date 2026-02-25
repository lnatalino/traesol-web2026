// src/app/admin/layout.tsx
// Layout de admin - fuerza rendering dinámico para cookies de sesión
import { AdminShell } from "@/components/admin/AdminShell";

// Forzar rendering dinámico porque usamos cookies (admin session)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
