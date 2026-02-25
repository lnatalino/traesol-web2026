import Link from "next/link";

import type { PublicNovedadListItem } from "@/lib/novedades";

export default function Novedades({ items }: { items: PublicNovedadListItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center text-sm text-slate-500">
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
            className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.08)]"
          >
            <Link href={href}>
              <div className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={portada}
                  alt={n.titulo || "Novedad"}
                  className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="space-y-2.5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Novedad</p>
                <h3 className="text-lg font-semibold leading-snug text-slate-900 group-hover:text-blue-600 transition-colors duration-150">{n.titulo || "Novedad"}</h3>
                {n.bajada ? (
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{n.bajada}</p>
                ) : null}
                {n.fecha_publicacion ? (
                  <p className="text-xs text-slate-400 font-medium">
                    {new Date(n.fecha_publicacion).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
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
