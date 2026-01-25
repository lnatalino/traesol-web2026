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

  // Mientras carga, mostrar el botón default para evitar flash
  if (loading) {
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
