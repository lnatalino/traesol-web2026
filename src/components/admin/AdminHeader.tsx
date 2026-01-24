import type { ReactNode } from "react";

export type AdminHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminHeader({ eyebrow, title, description, action }: AdminHeaderProps) {
  return (
    <section className="rounded-[30px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">{eyebrow}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 max-w-2xl">{description}</p>
        </div>
        {action ? <div className="flex flex-wrap justify-end gap-3">{action}</div> : null}
      </div>
    </section>
  );
}
