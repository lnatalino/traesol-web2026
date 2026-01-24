// src/components/public/PublicPageLayout.tsx
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Background variant */
  bg?: "slate" | "white" | "gradient";
};

const bgStyles = {
  slate: "bg-slate-50",
  white: "bg-white",
  gradient: "bg-gradient-to-b from-slate-50 to-white",
};

/**
 * Layout wrapper para páginas públicas.
 * Proporciona contenedor con max-width, padding y background consistentes.
 */
export function PublicPageLayout({ children, className = "", bg = "slate" }: Props) {
  return (
    <main className={bgStyles[bg]}>
      <div className={`mx-auto max-w-6xl space-y-10 px-4 py-12 lg:px-6 ${className}`}>
        {children}
      </div>
    </main>
  );
}
