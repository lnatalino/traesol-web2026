import Link from "next/link";

import type { PublicNovedadListItem } from "@/lib/novedades";

export default function Novedades({ items }: { items: PublicNovedadListItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Aún no hay novedades publicadas.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((n) => {
        const href = n.link_externo || (n.slug ? `/novedades/${n.slug}` : "#");
        const portada = n.imagen_portada_url || n.imagenes?.[0]?.url || "/placeholder.png";
        return (
          <article
            key={String(n.id)}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Link href={href}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portada}
                alt={n.titulo || "Novedad"}
                className="h-44 w-full object-cover"
              />
              <div className="space-y-2 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Novedad</p>
                <h3 className="text-lg font-semibold leading-snug text-slate-900">{n.titulo || "Novedad"}</h3>
                {n.bajada ? (
                  <p className="text-sm text-slate-600 line-clamp-3">{n.bajada}</p>
                ) : null}
                {n.fecha_publicacion ? (
                  <p className="text-xs text-slate-500">
                    {new Date(n.fecha_publicacion).toLocaleDateString("es-CL")}
                  </p>
                ) : null}
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
