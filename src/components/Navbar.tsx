"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/operativos", label: "Operativos" },
  { href: "/contacto", label: "Contacto" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/empresas", label: "Empresas" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = useMemo(
    () => (href: string) => (pathname === href ? "nav-link-active" : "nav-link"),
    [pathname]
  );

  // URL pública del logo desde Supabase o Cloudflare (defínela en .env.local)
  const logoUrl =
    process.env.NEXT_PUBLIC_LOGO_URL?.trim() || "/logo-traesol.svg";

  return (
    <div className="nav-shell">
      <nav className="nav flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="brand flex items-center gap-2" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Traesol"
            width={96}
            height={96}
            className="hidden sm:inline-block object-contain"
            style={{
              maxHeight: "100px",
              width: "auto",
              marginRight: "12px",
              verticalAlign: "middle",
            }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              if (el.src.endsWith("/logo-traesol.svg")) {
                el.style.display = "none";
              } else {
                el.src = "/logo-traesol.svg";
              }
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
          <Link href="/postular" className="btn-primary text-sm">
            Hazte voluntario
          </Link>
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
              <Link
                href="/postular"
                className="btn-primary w-fit text-sm"
                onClick={() => setOpen(false)}
              >
                Hazte voluntario
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
