// src/components/Footer.tsx
import Link from "next/link";
import { PUBLIC_CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/constants/publicContact";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 rounded-md bg-[var(--brand-600)]" />
            <span className="font-semibold text-[var(--brand-700)]">Traesol</span>
          </div>
          <p className="text-sm text-gray-600">
            Salud que transforma. Voluntariado médico y operativos de alto impacto.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[var(--brand-700)] hover:underline"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11.001 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 .001 7 3.5 3.5 0 0 0-.001-7ZM18 6.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
              </svg>
              @traesol
            </a>
          </div>
        </div>

        {/* Navegación */}
        <div>
          <h4 className="font-semibold mb-3">Navegación</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/operativos" className="link-brand">Operativos</Link></li>
            <li><Link href="/postular" className="link-brand">Hazte voluntario</Link></li>
            <li><Link href="/empresas" className="link-brand">Empresas</Link></li>
            <li><Link href="/contacto" className="link-brand">Contacto</Link></li>
            <li><Link href="/privacidad" className="link-brand">Política de Privacidad</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="font-semibold mb-3">Contáctanos</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a className="link-brand" href={`mailto:${PUBLIC_CONTACT_EMAIL}`}>
                {PUBLIC_CONTACT_EMAIL}
              </a>
            </li>
            <li className="text-gray-600">Santiago, Chile</li>
            <li>
              <a
                className="link-brand"
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram: @traesol
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
