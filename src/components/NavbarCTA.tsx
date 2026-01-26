// src/components/NavbarCTA.tsx
// CTA condicional en navbar según estado de sesión y rol
// Usa SessionProvider para datos SSR iniciales (sin flash)
"use client";

import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";

interface NavbarCTAProps {
  className?: string;
  onClick?: () => void;
}

export default function NavbarCTA({ className = "", onClick }: NavbarCTAProps) {
  const { user, role, loading } = useSession();

  // Mientras carga (solo si no hay datos SSR), mostrar placeholder
  if (loading && !user) {
    return (
      <div className={`btn-primary text-sm opacity-0 ${className}`} aria-hidden>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </div>
    );
  }

  // Si hay sesión
  if (user) {
    // Admin/superadmin: mostrar "Panel Admin"
    if (role === "admin" || role === "superadmin") {
      return (
        <Link
          href="/admin"
          className={`btn-primary text-sm ${className}`}
          onClick={onClick}
        >
          Panel Admin
        </Link>
      );
    }
    
    // Voluntario: mostrar "Postular a operativo"
    return (
      <Link
        href="/operativos"
        className={`btn-primary text-sm ${className}`}
        onClick={onClick}
      >
        Postular a operativo
      </Link>
    );
  }

  // Sin sesión: mantener el flujo original
  return (
    <Link
      href="/postular"
      className={`btn-primary text-sm ${className}`}
      onClick={onClick}
    >
      Hazte voluntario
    </Link>
  );
}
