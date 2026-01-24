// src/components/public/PublicSection.tsx
import { ReactNode } from "react";
import { PublicSectionHeader } from "./PublicSectionHeader";

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  variant?: "default" | "highlight" | "dashed";
  className?: string;
};

const variantStyles = {
  default: "border-slate-200 bg-white/95",
  highlight: "border-blue-100 bg-gradient-to-br from-blue-50/80 to-white",
  dashed: "border-dashed border-blue-200 bg-white/80",
};

export function PublicSection({
  eyebrow,
  title,
  subtitle,
  rightAction,
  children,
  variant = "default",
  className = "",
}: Props) {
  const showHeader = eyebrow || title || subtitle || rightAction;
  
  return (
    <section
      className={className || `rounded-3xl border p-6 shadow-lg sm:p-8 ${variantStyles[variant]}`}
    >
      {showHeader && (
        <PublicSectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          rightAction={rightAction}
        />
      )}
      {showHeader ? <div className="mt-6">{children}</div> : children}
    </section>
  );
}
