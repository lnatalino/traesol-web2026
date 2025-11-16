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

  // HERO SLIDES: Solo novedades con portada disponible
  const heroSlides: Slide[] = novedadesCarrusel
    .map((n) => ({
      id: n.id,
      titulo: n.titulo ?? undefined,
      imagen_url: resolvePortada(n),
      href: n.link_externo || (n.slug ? `/novedades/${n.slug}` : null),
    } satisfies Slide))
    .filter((s) => !!s.imagen_url);

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 lg:px-6">
        <section className="rounded-[32px] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-10 text-white shadow-2xl sm:px-10">
          <div className="grid items-stretch gap-10 lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Fundación Traesol</p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Salud colaborativa para cada territorio</h1>
              <p className="text-base text-white/80 sm:text-lg">
                Movilizamos equipos médicos, voluntariado y alianzas con empresas para llevar operativos, educación y atención a las comunidades que más lo necesitan.
              </p>
            </div>
            <div className="flex h-full items-stretch">
              <Carousel slides={heroSlides} variant="hero" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Acciones inmediatas</p>
              <h2 className="text-3xl font-semibold text-slate-900">Únete y apoya</h2>
            </div>
            <p className="text-sm text-slate-600 max-w-xl">
              Postula a operativos, dona o vincula a tu empresa con nuestros programas. Cada paso suma.
            </p>
          </div>
          <div className="mt-8">
            <CTAButtons />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Impacto</p>
              <h2 className="text-3xl font-semibold text-slate-900">Métricas en vivo</h2>
            </div>
            <p className="text-sm text-slate-600 max-w-xl">Actualizamos estos datos constantemente para transparentar nuestro trabajo.</p>
          </div>
          <div className="mt-8">
            <Metrics m={metricsForComponent} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Historias recientes</p>
              <h2 className="text-3xl font-semibold text-slate-900">Novedades</h2>
            </div>
            <p className="text-sm text-slate-500 max-w-xl">
              Descubre los últimos operativos, campañas y testimonios publicados por la fundación.
            </p>
          </div>
          <div className="mt-6">
            <Novedades items={novedadesLista} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Agenda</p>
              <h2 className="text-3xl font-semibold text-slate-900">Próximos operativos</h2>
            </div>
            <p className="text-sm text-slate-500 max-w-xl">
              Organiza tu participación con anticipación y revisa los cupos disponibles.
            </p>
          </div>
          <div className="mt-6">
            <OperativosCarousel items={opsClean as any} />
          </div>
        </section>
      </div>
    </main>
  );
}
