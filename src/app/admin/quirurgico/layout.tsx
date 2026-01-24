import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuirurgicoTabs } from "./QuirurgicoTabs";

export default function AdminQuirurgicoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-100 bg-white/95 p-6 shadow-sm">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Quirúrgico</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Operativos quirúrgicos</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Pacientes, logística y comunicaciones de operativos médico-quirúrgicos.
            </p>
          </div>
          <QuirurgicoTabs />
        </div>
      </section>
      {children}
    </div>
  );
}
