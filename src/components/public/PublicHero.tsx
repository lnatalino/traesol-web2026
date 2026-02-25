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
    <section className="relative bg-gradient-to-br from-slate-950 via-blue-950/80 to-slate-900 text-white py-20 md:py-28 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>
      <div className={`relative z-10 ${maxWidthClass} px-5 ${alignClass}`}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-400/90 mb-5">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight leading-[1.1]">
          {title}
        </h1>
        {subtitle && (
          <p className={`text-lg md:text-xl text-slate-300/90 leading-relaxed ${align === "center" ? "max-w-2xl mx-auto" : "max-w-2xl"}`}>
            {subtitle}
          </p>
        )}
        {meta && (
          <p className="mt-6 text-sm text-slate-400">
            {meta}
          </p>
        )}
        {children && (
          <div className="mt-10">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
