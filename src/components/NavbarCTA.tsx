// src/components/NavbarCTA.tsx
// CTA condicional en navbar según estado de sesión y rol
"use client";

import Link from "next/link";
import { useUserSession } from "@/lib/hooks/useUserSession";

interface NavbarCTAProps {
  className?: string;
  onClick?: () => void;
}

export default function NavbarCTA({ className = "", onClick }: NavbarCTAProps) {
  const { user, role, loading } = useUserSession();

  // Mientras carga, NO mostrar nada para evitar flash de "Hazte voluntario"
  // que luego cambia a "Postular a operativo"
  if (loading) {
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
