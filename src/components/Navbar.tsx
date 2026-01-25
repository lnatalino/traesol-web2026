"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import NavbarCTA from "@/components/NavbarCTA";

// Links públicos del navbar (sin Admin, ahora está en el dropdown de usuario)
const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/operativos", label: "Operativos" },
  { href: "/contacto", label: "Contacto" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/empresas", label: "Empresas" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = useMemo(
    () => (href: string) => (pathname === href ? "nav-link-active" : "nav-link"),
    [pathname]
  );

  // Logo local desde /public/branding
  const logoUrl = "/branding/logo-traesol.png";

  return (
    <div className="nav-shell">
      <nav className="nav flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="brand flex items-center gap-2" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Traesol"
            width={140}
            height={140}
            className="hidden sm:inline-block object-contain"
            style={{
              maxHeight: "145px",
              width: "auto",
              marginRight: "14px",
              verticalAlign: "middle",
            }}
          />
          <span className="brand-dot sm:hidden" />
          <span className="text-lg font-semibold text-gray-800">Traesol</span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-links hidden md:flex items-center gap-5">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href)}>
              {l.label}
            </Link>
          ))}
          <NavbarCTA />
          <UserAvatar />
        </div>

        {/* Mobile trigger */}
        <button
          className="btn-ghost md:hidden text-xl"
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-b bg-white">
          <div className="container pt-0">
            <div className="grid gap-3 pb-3">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={isActive(l.href)}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <NavbarCTA className="w-fit" onClick={() => setOpen(false)} />
              {/* UserAvatar para móvil */}
              <div className="pt-2 border-t border-slate-100">
                <UserAvatar />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
