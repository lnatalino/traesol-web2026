// src/app/admin/page.tsx
import type { ComponentType } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminHero } from "@/components/admin/AdminHero";
import {
  Mail,
  Megaphone,
  Send,
  Stethoscope,
  Users,
  ClipboardList,
  BriefcaseBusiness,
} from "lucide-react";

type ShortcutCard = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const SECTIONS: ShortcutCard[] = [
  {
    title: "Operativos",
    description: "Crear, publicar y cerrar operativos médicos.",
    href: "/admin/operativos",
    icon: Stethoscope,
  },
  {
    title: "Novedades",
    description: "Gestiona noticias y comunicados de prensa.",
    href: "/admin/novedades",
    icon: Megaphone,
  },
  {
    title: "Voluntarios",
    description: "Busca, edita y revisa perfiles de voluntarios.",
    href: "/admin/voluntarios",
    icon: Users,
  },
  {
    title: "Inscripciones",
    description: "Aprueba postulaciones e invita a voluntarios.",
    href: "/admin/inscripciones",
    icon: ClipboardList,
  },
  {
    title: "Invitaciones",
    description: "Envía invitaciones masivas a voluntarios para operativos.",
    href: "/admin/invitaciones",
    icon: Send,
  },
  {
    title: "Mensajería",
    description: "Envía correos personalizados y comunicados a tu base de voluntarios.",
    href: "/admin/mensajeria",
    icon: Mail,
  },
  {
    title: "Empresas",
    description: "Gestiona el catálogo de servicios para empresas.",
    href: "/admin/empresas/productos",
    icon: BriefcaseBusiness,
  },
];

export default async function AdminHome() {
  const store = await cookies();
  const role = store.get("traesol-role")?.value || "";
  const email = store.get("traesol-email")?.value || "";

  const ok = role === "admin" || role === "editor";
  if (!ok) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="space-y-8">
      <AdminHero
        eyebrow="Traesol · Admin"
        title="Panel de administración"
        description="Gestiona operativos, novedades, voluntarios e invitaciones desde una misma interfaz pensada para equipos colaborativos."
        rightSlot={(
          <form action="/api/auth/simple-logout" method="POST">
            <button className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-inner transition hover:bg-white/20">
              Cerrar sesión
            </button>
          </form>
        )}
        footer={(
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
              <dt className="text-xs uppercase tracking-wide text-white/70">Rol asignado</dt>
              <dd className="mt-1 text-xl font-semibold">{role}</dd>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
              <dt className="text-xs uppercase tracking-wide text-white/70">Sesión activa</dt>
              <dd className="mt-1 text-xl font-semibold">{email || "—"}</dd>
            </div>
          </dl>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ icon: Icon, ...section }) => (
          <article
            key={section.href}
            className="group flex flex-col justify-between rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-lg shadow-blue-950/5 ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-600">{section.description}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Link
                href={section.href}
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition group-hover:gap-2"
              >
                Ingresar
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
