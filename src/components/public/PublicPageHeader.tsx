// src/components/public/PublicPageHeader.tsx
import { ReactNode } from "react";

type Props = {
  /** Small label above title */
  eyebrow?: string;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Right-aligned action slot (buttons, links, etc.) */
  rightAction?: ReactNode;
  /** Visual variant */
  variant?: "gradient" | "white" | "light";
  /** Additional content below the header */
  children?: ReactNode;
};

const variantStyles = {
  gradient: {
    container: "bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white shadow-2xl",
    eyebrow: "text-white/70",
    title: "text-white",
    description: "text-white/85",
  },
  white: {
    container: "border border-slate-200 bg-white shadow-lg",
    eyebrow: "text-blue-600",
    title: "text-slate-900",
    description: "text-slate-600",
  },
  light: {
    container: "border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white shadow-lg",
    eyebrow: "text-blue-600",
    title: "text-slate-900",
    description: "text-slate-600",
  },
};

/**
 * Header hero para páginas públicas.
 * Proporciona estructura consistente con eyebrow, título, descripción y acciones.
 */
export function PublicPageHeader({
  eyebrow,
  title,
  description,
  rightAction,
  variant = "gradient",
  children,
}: Props) {
  const styles = variantStyles[variant];

  return (
    <header className={`rounded-[32px] px-6 py-10 sm:px-10 ${styles.container}`}>
      {eyebrow && (
        <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${styles.eyebrow}`}>
          {eyebrow}
        </p>
      )}
      
      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className={`text-4xl font-semibold sm:text-5xl ${styles.title}`}>
            {title}
          </h1>
          {description && (
            <p className={`max-w-2xl text-base sm:text-lg ${styles.description}`}>
              {description}
            </p>
          )}
        </div>
        
        {rightAction && (
          <div className="flex-shrink-0">
            {rightAction}
          </div>
        )}
      </div>
      
      {children}
    </header>
  );
}
