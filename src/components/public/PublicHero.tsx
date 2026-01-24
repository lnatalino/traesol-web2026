// src/components/public/PublicHero.tsx
import { ReactNode } from "react";

type Props = {
  /** Small badge/eyebrow text above title (e.g. "Fundación Traesol") */
  eyebrow?: string;
  /** Main title - large and prominent */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Optional meta text below subtitle (e.g. "Última actualización: ...") */
  meta?: string;
  /** Text alignment */
  align?: "center" | "left";
  /** Additional content below the text (CTAs, metrics, etc.) */
  children?: ReactNode;
};

/**
 * PublicHero - Hero/banner principal para páginas públicas.
 * 
 * Diseño institucional premium con:
 * - Fondo gradiente oscuro/azul
 * - Centrado por defecto
 * - Spacing generoso
 * - Full-width dentro del contenedor
 * 
 * Basado en el diseño de la página de Privacidad.
 */
export function PublicHero({
  eyebrow,
  title,
  subtitle,
  meta,
  align = "center",
  children,
}: Props) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  const maxWidthClass = align === "center" ? "max-w-4xl mx-auto" : "max-w-4xl";

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-24">
      <div className={`${maxWidthClass} px-4 ${alignClass}`}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400 mb-4">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className={`text-lg text-slate-300 ${align === "center" ? "max-w-2xl mx-auto" : "max-w-2xl"}`}>
            {subtitle}
          </p>
        )}
        {meta && (
          <p className="mt-6 text-sm text-slate-400">
            {meta}
          </p>
        )}
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
