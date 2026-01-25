// src/components/NavbarCTA.tsx
// CTA condicional en navbar: "Hazte voluntario" o "Postular a operativo"
"use client";

import Link from "next/link";
import { useUserSession } from "@/lib/hooks/useUserSession";

interface NavbarCTAProps {
  className?: string;
  onClick?: () => void;
}

export default function NavbarCTA({ className = "", onClick }: NavbarCTAProps) {
  const { user, loading } = useUserSession();

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

  // Si hay sesión, mostrar "Postular a operativo"
  if (user) {
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
