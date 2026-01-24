// src/app/novedades/page.tsx
import { Newspaper } from "lucide-react";
import { getPublicNovedades, type PublicNovedadListItem } from "@/lib/novedades";
import { 
  PublicHero, 
  NovedadCard as NovedadCardComponent,
  EmptyState 
} from "@/components/public";

export const metadata = { title: "Novedades · Traesol" };

export default async function NovedadesPage() {
  const items = await getPublicNovedades();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <PublicHero
        eyebrow="Novedades"
        title="Últimas noticias"
        subtitle="Descubre los últimos operativos, campañas y testimonios publicados por la fundación."
      />

      {/* Grid de novedades */}
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 lg:px-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Sin novedades aún"
            message="Pronto publicaremos noticias y actualizaciones sobre nuestras actividades."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((n: PublicNovedadListItem) => (
              <NovedadItem key={n.id} item={n} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function NovedadItem({ item }: { item: PublicNovedadListItem }) {
  const portada = item.imagen_portada_url || item.imagenes?.[0]?.url || null;
  
  // Si tiene link externo, usamos ese slug, si no el interno
  const slug = item.link_externo || (item.slug ? item.slug : "#");
  const isExternal = !!item.link_externo;
  
  // Determinamos el tipo basado en si tiene link externo
  const tipo = item.link_externo ? "comunicado" : "noticia";

  // Si es link externo, usamos NovedadCard envuelto en un Link externo
  if (isExternal) {
    return (
      <a
        href={item.link_externo!}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <NovedadCardComponent
          slug=""
          titulo={item.titulo || "Novedad"}
          resumen={item.bajada || null}
          imagen={portada}
          fecha_publicacion={item.fecha_publicacion}
          tipo={tipo}
        />
      </a>
    );
  }

  return (
    <NovedadCardComponent
      slug={slug}
      titulo={item.titulo || "Novedad"}
      resumen={item.bajada || null}
      imagen={portada}
      fecha_publicacion={item.fecha_publicacion}
      tipo={tipo}
    />
  );
}
