// src/components/Footer.tsx
import Link from "next/link";
import { PUBLIC_CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/constants/publicContact";
import { Heart, Mail, MapPin, ExternalLink } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      {/* CTA decorativo superior */}
      <div className="relative">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-5 pt-16 pb-8">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-12">
          {/* Brand + Descripción */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Fundación Traesol</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Salud que transforma. Movilizamos equipos médicos, voluntariado y alianzas con empresas para llevar operativos de alto impacto a comunidades en Chile.
            </p>
            {/* Redes sociales */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-all hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11.001 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 .001 7 3.5 3.5 0 0 0-.001-7ZM18 6.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Navegación</h4>
            <ul className="space-y-3">
              {[
                { href: "/operativos", label: "Operativos" },
                { href: "/postular", label: "Hazte voluntario" },
                { href: "/empresas", label: "Empresas" },
                { href: "/sobre-nosotros", label: "Sobre nosotros" },
                { href: "/novedades", label: "Novedades" },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-5">Contacto</h4>
            <ul className="space-y-4">
              <li>
                <a
                  className="group flex items-start gap-3 text-sm text-slate-400 transition-colors hover:text-white"
                  href={`mailto:${PUBLIC_CONTACT_EMAIL}`}
                >
                  <Mail className="h-4 w-4 mt-0.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{PUBLIC_CONTACT_EMAIL}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin className="h-4 w-4 mt-0.5 text-slate-500" />
                <span>Santiago, Chile</span>
              </li>
              <li>
                <a
                  className="group flex items-start gap-3 text-sm text-slate-400 transition-colors hover:text-white"
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mt-0.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Instagram: @traesol</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-14 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {currentYear} Fundación Traesol. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacidad" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/contacto" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
