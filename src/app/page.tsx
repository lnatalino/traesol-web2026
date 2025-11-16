import { createSupabaseServer } from "@/lib/supabaseServer";
import Carousel, { type Slide } from "@/components/Carousel";
import CTAButtons from "@/components/CTAButtons";
import OperativosCarousel from "@/components/OperativosCarousel";
import Metrics from "@/components/Metrics";
import Novedades from "@/components/Novedades";
import { getCarruselNovedades, getUltimasNovedades } from "@/lib/novedades";

type OperativoRow = {
  id: string;
  titulo: string;
  slug: string;
  fecha_inicio: string | null;
  lugar: string | null;
  imagen_cabecera_url: string | null;
  operativo_imagenes?: Array<{ url: string | null; path: string | null }>;
};

export default async function HomePage() {
  const supabase = createSupabaseServer();

  // 1) Banners activos para el hero
  const { data: banners } = await supabase
    .from("carrusel_fotos")
    .select("id,titulo,imagen_url,link_url")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const [novedadesCarrusel, novedadesLista] = await Promise.all([
    getCarruselNovedades(8),
    getUltimasNovedades(6),
  ]);

  const resolvePortada = (item: { imagen_portada_url: string | null; imagenes?: Array<{ url: string }> }) =>
    item.imagen_portada_url || item.imagenes?.[0]?.url || "/placeholder.png";

  // 3) Próximos operativos (publicados y con fecha desde hoy)
  const hoy = new Date().toISOString().slice(0, 10);
  const { data: ops } = await supabase
    .from("operativos")
    .select("id,titulo,slug,fecha_inicio,lugar,imagen_cabecera_url,operativo_imagenes(url,path)")
    .eq("estado", "publicado")
    .gte("fecha_inicio", hoy)
    .order("fecha_inicio", { ascending: true })
    .limit(3);

  // Sanitiza para el componente (evitar null -> string)
  const opsClean =
    (ops as OperativoRow[] | null)?.map((o) => ({
      id: String(o.id),
      titulo: o.titulo,
      slug: o.slug,
      fecha_inicio: o.fecha_inicio || "",
      lugar: o.lugar || "",
      imagen_cabecera_url: o.imagen_cabecera_url || null,
      imagenes: Array.isArray(o.operativo_imagenes)
        ? o.operativo_imagenes
            .filter((img) => typeof img?.url === "string" && img.url)
            .map((img, index) => ({ id: `${o.id}-${index}`, url: String(img.url), path: img.path ?? null }))
        : [],
    })) ?? [];

  // 4) Métricas para <Metrics m={...} />
  const { count: opsCount } = await supabase
    .from("operativos")
    .select("*", { count: "exact", head: true })
    .eq("estado", "publicado");

  const { count: volCount } = await supabase
    .from("voluntarios")
    .select("*", { count: "exact", head: true });

  let atencionesSum = 0;
  try {
    const { data: ats } = await supabase
      .from("operativos")
      .select("atenciones_salud");
    if (Array.isArray(ats)) {
      atencionesSum = ats.reduce(
        (acc: number, r: any) => acc + (Number(r?.atenciones_salud) || 0),
        0
      );
    }
  } catch {
    // silencioso: si falla, queda en 0
  }

  const metricsForComponent = {
    operativos_publicados: opsCount || 0,
    voluntarios_total: volCount || 0,
    asistencias_marcadas: atencionesSum,
  };

  // HERO SLIDES: Mezcla banners + novedades destacadas, a prueba de null/undefined
  const heroSlidesBase: Slide[] = [
    ...((banners ?? []).map((b) => ({
      id: b.id,
      titulo: b.titulo ?? undefined,
      imagen_url: b.imagen_url ?? "/placeholder.png",
      href: b.link_url || null,
    })) as Slide[]),

    ...novedadesCarrusel.map((n) => ({
      id: n.id,
      titulo: n.titulo ?? undefined,
      imagen_url: resolvePortada(n),
      href: n.link_externo || (n.slug ? `/novedades/${n.slug}` : null),
    } satisfies Slide)),
  ].filter((s) => !!s.imagen_url);

  // Fallback: si no hay nada, muestra un slide neutro para evitar "pantalla vacía"
  const heroSlides: Slide[] =
    heroSlidesBase.length > 0
      ? heroSlidesBase
      : [
          {
            id: "fallback",
            titulo: "Fundación Traesol",
            imagen_url: "/placeholder.png",
            href: null,
          },
        ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <section>
        <Carousel slides={heroSlides} />
      </section>

      {/* CTAs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Únete y apoya</h2>
        <CTAButtons />
      </section>

      {/* Novedades */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Novedades</h2>
        <Novedades items={novedadesLista} />
      </section>

      {/* Próximos operativos */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Próximos operativos</h2>
        <OperativosCarousel items={opsClean as any} />
      </section>

      {/* Métricas */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Métricas en vivo</h2>
        <Metrics m={metricsForComponent} />
      </section>
    </main>
  );
}
