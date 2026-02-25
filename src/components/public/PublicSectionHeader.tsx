// src/components/public/PublicSectionHeader.tsx
import { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  rightAction?: ReactNode;
};

export function PublicSectionHeader({ eyebrow, title, subtitle, rightAction }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl tracking-tight">{title}</h2>
        )}
        {subtitle && (
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </div>
  );
}
