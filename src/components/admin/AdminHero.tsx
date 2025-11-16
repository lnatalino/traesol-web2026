import type { ReactNode } from "react";

export type AdminHeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  rightSlot?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

function joinClasses(base: string, extra?: string): string {
  if (!extra) return base;
  return `${base} ${extra}`;
}

export function AdminHero({
  eyebrow = "Traesol · Admin",
  title,
  description,
  actions,
  rightSlot,
  footer,
  className,
}: AdminHeroProps) {
  return (
    <header
      className={joinClasses(
        "rounded-[32px] border border-blue-500/30 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-2xl",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-[260px] flex-1 space-y-4">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">{eyebrow}</p>
          ) : null}
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
            {description ? <div className="text-sm text-white/80">{description}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2 text-sm">{actions}</div> : null}
        </div>
        {rightSlot ? <div className="flex-shrink-0">{rightSlot}</div> : null}
      </div>
      {footer ? <div className="mt-8">{footer}</div> : null}
    </header>
  );
}
