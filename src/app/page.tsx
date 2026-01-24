import { createSupabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";
import Carousel, { type Slide } from "@/components/Carousel";
import CTAButtons from "@/components/CTAButtons";
import Metrics from "@/components/Metrics";
import Novedades from "@/components/Novedades";
import { PublicSection, PrimaryButtonLink } from "@/components/public";
import { getCarruselNovedades, getUltimasNovedades, type CarruselNovedad } from "@/lib/novedades";
import { getUpcomingOperativos, type AgendaOperativo } from "@/lib/operativosAgenda";
import { formatDateChile } from "@/components/public/DatePill";
import { Calendar, MapPin, ArrowRight, Stethoscope, Building2 } from "lucide-react";
import { publicTheme, getCardClasses, getHeroClasses, getPrimaryButtonClasses, getGhostButtonClasses } from "@/lib/theme/publicTheme";

type OperativoTableRow = {
  id: string;
  slug: string;
  titulo: string | null;
  fecha_inicio: string | null;
  lugar: string | null;
  imagen_cabecera_url: string | null;
  atenciones_salud: number | null;
};

export default async function HomePage() {
  const supabase = createSupabaseServer();

  // Fetch novedades y operativos en paralelo
  const [novedadesCarrusel, novedadesLista, upcomingOperativos] = await Promise.all([
    getCarruselNovedades(8),
    getUltimasNovedades(6),
    getUpcomingOperativos(3),
  ]);

  const resolvePortada = (item: CarruselNovedad): string =>
    item.imagen_portada_url || item.imagenes?.[0]?.url || "/placeholder.png";

  // Métricas para <Metrics m={...} />
  const { count: opsCount, error: opsCountError } = await supabase
    .from("operativos")
    .select("id", { count: "exact", head: true })
    .eq("estado", "publicado");
  if (opsCountError) {
    console.error("[home] operativos count error", opsCountError);
  }

  const { count: volCount, error: volunteerCountError } = await supabase
    .from("voluntarios")
    .select("id", { count: "exact", head: true });
  if (volunteerCountError) {
    console.error("[home] volunteers count error", volunteerCountError);
  }

  let atencionesSum = 0;
  try {
    const { data: ats, error: atencionesError } = await supabase
      .from("operativos")
      .select("atenciones_salud")
      .returns<Array<Pick<OperativoTableRow, "atenciones_salud">>>();
    if (atencionesError) throw atencionesError;
    if (Array.isArray(ats)) {
      atencionesSum = ats.reduce(
        (acc: number, row) => acc + (Number(row?.atenciones_salud) || 0),
        0
      );
    }
  } catch (error) {
    console.error("[home] atenciones sum error", error);
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

  const heroClasses = getHeroClasses();

  return (
    <main className={publicTheme.colors.surface.page}>
      {/* ========================================
          HERO: Solo headline, sin carrusel ni botones
          ======================================== */}
      <section className={heroClasses.section}>
        <div className={heroClasses.container}>
          <p className={heroClasses.eyebrow}>
            Fundación Traesol
          </p>
          <h1 className={heroClasses.title}>
            Salud colaborativa para cada territorio
          </h1>
          <p className={heroClasses.subtitle}>
            Movilizamos equipos médicos, voluntariado y alianzas con empresas para llevar operativos, educación y atención a las comunidades que más lo necesitan.
          </p>
        </div>
      </section>

      {/* ========================================
          CONTENIDO: Zona blanca con cards/islas
          ======================================== */}
      <div className={publicTheme.components.section.container}>
        
        {/* Carrusel de novedades - isla visual limpia */}
        {heroSlides.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <Carousel slides={heroSlides} variant="hero" />
          </section>
        )}

        {/* Quiénes somos - SIN conteos duplicados */}
        <section className={getCardClasses()}>
          <div className={publicTheme.spacing.cardInner}>
            <p className={publicTheme.components.eyebrow.primary}>
              Quiénes somos
            </p>
            <h2 className={`text-3xl font-semibold ${publicTheme.colors.text.primary}`}>
              Acercamos salud de excelencia a quienes más lo necesitan
            </h2>
            <p className={`text-base ${publicTheme.colors.text.secondary} leading-relaxed`}>
              Desde 2015, articulamos una red de especialistas y subespecialistas que donan su tiempo para apoyar al sistema público de salud, contribuyendo a disminuir listas de espera y acercando atención de excelencia a personas que viven lejos de centros de alta complejidad.
            </p>
            <Link
              href="/sobre-nosotros"
              className={publicTheme.components.link.primary}
            >
              Conoce más sobre nosotros <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Cómo colaborar */}
        <PublicSection
          eyebrow="Colabora"
          title="Únete y apoya"
          subtitle="Postula a operativos, dona o vincula a tu empresa con nuestros programas. Cada paso suma."
        >
          <CTAButtons />
        </PublicSection>

        {/* Métricas de impacto - ÚNICA FUENTE DE CONTEOS */}
        <PublicSection
          eyebrow="Impacto"
          title="Métricas en vivo"
          subtitle="Actualizamos estos datos constantemente para transparentar nuestro trabajo."
        >
          <Metrics m={metricsForComponent} />
        </PublicSection>

        {/* Novedades */}
        <PublicSection
          eyebrow="Historias recientes"
          title="Novedades"
          subtitle="Descubre los últimos operativos, campañas y testimonios publicados por la fundación."
          rightAction={
            <Link
              href="/novedades"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <Novedades items={novedadesLista} />
        </PublicSection>

        {/* Próximos Operativos */}
        <PublicSection
          eyebrow="Agenda"
          title="Próximos operativos"
          subtitle="Organiza tu participación con anticipación y revisa los cupos disponibles."
          rightAction={
            <Link
              href="/operativos"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {upcomingOperativos.length > 0 ? (
            <AgendaGrid items={upcomingOperativos} />
          ) : (
            <AgendaEmptyState />
          )}
        </PublicSection>

        {/* CTA Empresas con tema oscuro consistente */}
        <section className={`${getCardClasses()} ${publicTheme.colors.primaryDark.bg} text-white`}>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] items-center">
            <div className={publicTheme.spacing.cardInner}>
              <p className={publicTheme.components.eyebrow.onDark}>
                Empresas
              </p>
              <h2 className="text-3xl font-semibold">
                Conecta a tu equipo con el impacto social
              </h2>
              <p className={`text-base ${publicTheme.colors.text.onDarkMuted} max-w-2xl`}>
                Diseñamos operativos de salud, voluntariado corporativo y experiencias formativas que transforman a las comunidades y fortalecen la cultura interna de tu empresa.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/empresas"
                className={getPrimaryButtonClasses()}
              >
                <Building2 className="h-5 w-5" />
                Ver programas para empresas
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente de grid para la agenda
   ───────────────────────────────────────────────────────────────────────────── */
function AgendaGrid({ items }: { items: AgendaOperativo[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((op) => (
        <Link
          key={op.id}
          href={`/operativos/${op.slug}`}
          className={`group overflow-hidden rounded-2xl ${publicTheme.colors.surface.border} border ${publicTheme.colors.surface.card} shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg`}
        >
          <div className="aspect-video w-full bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={op.imagen}
              alt={op.titulo}
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          </div>
          <div className="p-5 space-y-3">
            <p className={publicTheme.components.eyebrow.primary}>
              Operativo
            </p>
            <h3 className={`text-lg font-semibold ${publicTheme.colors.text.primary} ${publicTheme.colors.primary.textHover} transition`}>
              {op.titulo}
            </h3>
            <div className={`flex flex-wrap items-center gap-3 text-sm ${publicTheme.colors.text.secondary}`}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className={`h-4 w-4 ${publicTheme.colors.text.muted}`} />
                {formatDateChile(op.fecha_inicio, "short")}
              </span>
              {op.lugar && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className={`h-4 w-4 ${publicTheme.colors.text.muted}`} />
                  {op.lugar}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AgendaEmptyState() {
  return (
    <div className={`rounded-2xl ${publicTheme.colors.surface.borderDashed} border bg-slate-50/50 p-8 text-center`}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${publicTheme.colors.accent.bg}`}>
        <Stethoscope className={`h-7 w-7 ${publicTheme.colors.accent.textStrong}`} />
      </div>
      <h3 className={`mt-4 text-lg font-semibold ${publicTheme.colors.text.primary}`}>
        Próximamente nuevos operativos
      </h3>
      <p className={`mt-2 text-sm ${publicTheme.colors.text.muted}`}>
        Estamos preparando nuevos operativos. Síguenos en redes sociales para enterarte primero.
      </p>
      <Link
        href="/postular"
        className={`mt-4 ${getPrimaryButtonClasses()}`}
      >
        Postúlate como voluntario
      </Link>
    </div>
  );
}
