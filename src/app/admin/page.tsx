// src/app/admin/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const SECTIONS = [
  {
    title: "Operativos",
    description: "Crear, publicar y cerrar operativos médicos.",
    href: "/admin/operativos",
  },
  {
    title: "Novedades",
    description: "Gestiona noticias y comunicados de prensa.",
    href: "/admin/novedades",
  },
  {
    title: "Voluntarios",
    description: "Busca, edita y revisa perfiles de voluntarios.",
    href: "/admin/voluntarios",
  },
  {
    title: "Inscripciones",
    description: "Aprueba postulaciones e invita a voluntarios.",
    href: "/admin/inscripciones",
  },
  {
    title: "Invitaciones",
    description: "Envía invitaciones masivas a voluntarios para operativos.",
    href: "/admin/invitaciones",
  },
  {
    title: "Mensajería",
    description: "Envía correos personalizados y comunicados a tu base de voluntarios.",
    href: "/admin/mensajeria",
  },
  {
    title: "Empresas",
    description: "Gestiona el catálogo de servicios para empresas.",
    href: "/admin/empresas/productos",
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
    <div className="min-h-[70vh] bg-slate-50 py-10">
      <div className="mx-auto max-w-4xl space-y-8 px-4">
        <header className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Traesol · Admin</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Panel de administración</h1>
              <p className="mt-1 text-sm text-slate-600">Gestiona operativos, novedades y voluntarios desde un solo lugar.</p>
            </div>
            <form action="/api/auth/simple-logout" method="POST">
              <button className="inline-flex items-center rounded-full border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
                Cerrar sesión
              </button>
            </form>
          </div>
          <dl className="mt-6 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Rol</dt>
              <dd className="text-base font-medium text-slate-900">{role}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Correo</dt>
              <dd className="text-base font-medium text-slate-900">{email || "—"}</dd>
            </div>
          </dl>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <article
              key={section.href}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-600">{section.description}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  href={section.href}
                  className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
                >
                  Ingresar →
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
