"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import UserAvatar from "@/components/UserAvatar";
import NavbarCTA from "@/components/NavbarCTA";
import { Menu, X, ChevronRight } from "lucide-react";

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
  const [scrolled, setScrolled] = useState(false);

  // Detectar scroll para efecto visual en navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = useMemo(
    () => (href: string) => (pathname === href ? "nav-link-active" : "nav-link"),
    [pathname]
  );

  // Logo local desde /public/branding
  const logoUrl = "/branding/logo-traesol.png";

  return (
    <div className={`nav-shell ${scrolled ? "nav-shell-scrolled" : ""}`}>
      <nav className="nav flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="brand flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Traesol"
            width={140}
            height={140}
            className="hidden sm:inline-block object-contain"
            style={{
              maxHeight: "130px",
              width: "auto",
              marginRight: "10px",
              verticalAlign: "middle",
            }}
          />
          {/* Mobile: compact logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Traesol"
            width={36}
            height={36}
            className="sm:hidden object-contain"
            style={{ maxHeight: "36px", width: "auto" }}
          />
          <span className="text-lg font-semibold text-gray-800 tracking-tight">Traesol</span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-links hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href)}>
              {l.label}
            </Link>
          ))}
          <div className="ml-2 pl-3 border-l border-slate-200 flex items-center gap-3">
            <NavbarCTA />
            <UserAvatar />
          </div>
        </div>

        {/* Mobile trigger */}
        <button
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu - fullscreen drawer */}
      <div
        className={`md:hidden fixed inset-x-0 top-[57px] bottom-0 z-50 transition-all duration-300 ease-in-out ${
          open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        {/* Menu panel */}
        <div
          className={`relative bg-white h-full overflow-y-auto transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <div className="px-5 py-4 space-y-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                  pathname === l.href
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                }`}
                onClick={() => setOpen(false)}
              >
                <span>{l.label}</span>
                {pathname === l.href && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            ))}

            {/* CTA y acceso usuario */}
            <div className="pt-4 mt-3 border-t border-slate-100 space-y-3">
              <NavbarCTA className="w-full justify-center text-base py-3.5" onClick={() => setOpen(false)} />
              <div className="flex items-center gap-3 px-4 py-3">
                <UserAvatar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
