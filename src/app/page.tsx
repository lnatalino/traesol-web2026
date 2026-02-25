import { createSupabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";
import Carousel, { type Slide } from "@/components/Carousel";
import CTAButtons from "@/components/CTAButtons";
import Metrics from "@/components/Metrics";
import Novedades from "@/components/Novedades";
import ScrollReveal from "@/components/ScrollReveal";
import { PublicSection, PrimaryButtonLink } from "@/components/public";
import { getCarruselNovedades, getUltimasNovedades, type CarruselNovedad } from "@/lib/novedades";
import { getUpcomingOperativos, type AgendaOperativo } from "@/lib/operativosAgenda";
import { formatDateChile } from "@/components/public/DatePill";
import { Calendar, MapPin, ArrowRight, Stethoscope, Building2, Heart, Users } from "lucide-react";
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

  // Intentar obtener suma de atenciones de salud
  // NOTA: La columna atenciones_salud puede no existir en todas las instancias
  // En ese caso, usamos un fallback (0) para no romper el render
  let atencionesSum = 0;
  try {
    // Primero verificar si la columna existe con una query limitada
    const { error: testError } = await supabase
      .from("operativos")
      .select("id")
      .limit(1);
    
    // Si hay error de columna, usar valor placeholder
    if (!testError) {
      // Intentar query con atenciones_salud - puede fallar si la columna no existe
      const { data: ats } = await supabase
        .from("operativos")
        .select("atenciones_salud")
        .returns<Array<{ atenciones_salud: number | null }>>();
      
      if (Array.isArray(ats)) {
        atencionesSum = ats.reduce(
          (acc: number, row) => acc + (Number(row?.atenciones_salud) || 0),
          0
        );
      }
    }
  } catch {
    // Silenciar error - usar fallback de 0 para métricas
    // Esto permite que el Home renderice aunque la columna no exista
    atencionesSum = 0;
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
          HERO: Headline protagonista con gradiente profundo
          ======================================== */}
      <section className={heroClasses.section}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>
        <div className={heroClasses.container}>
          <p className={heroClasses.eyebrow}>
            Fundación Traesol
          </p>
          <h1 className={heroClasses.title}>
            Salud colaborativa para<br className="hidden sm:block" /> cada territorio
          </h1>
          <p className={heroClasses.subtitle}>
            Movilizamos equipos médicos, voluntariado y alianzas con empresas para llevar operativos, educación y atención a las comunidades que más lo necesitan.
          </p>
          {/* Hero CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/postular"
              className={getPrimaryButtonClasses()}
            >
              <Heart className="h-4 w-4" />
              Hazte voluntario
            </Link>
            <Link
              href="/operativos"
              className={getGhostButtonClasses()}
            >
              Ver operativos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          CONTENIDO: Zona blanca con cards/islas
          ======================================== */}
      <div className={publicTheme.components.section.container}>
        
        {/* Carrusel de novedades - isla visual limpia */}
        {heroSlides.length > 0 && (
          <ScrollReveal>
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <Carousel slides={heroSlides} variant="hero" />
            </section>
          </ScrollReveal>
        )}

        {/* Quiénes somos - SIN conteos duplicados */}
        <ScrollReveal>
          <section className={getCardClasses()}>
            <div className={publicTheme.spacing.cardInner}>
              <p className={publicTheme.components.eyebrow.primary}>
                Quiénes somos
              </p>
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${publicTheme.colors.text.primary}`}>
                Acercamos salud de excelencia a quienes más lo necesitan
              </h2>
              <p className={`text-base ${publicTheme.colors.text.secondary} leading-relaxed max-w-3xl`}>
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
        </ScrollReveal>

        {/* Cómo colaborar */}
        <ScrollReveal>
        <PublicSection
          eyebrow="Colabora"
          title="Únete y apoya"
          subtitle="Postula a operativos, dona o vincula a tu empresa con nuestros programas. Cada paso suma."
        >
          <CTAButtons />
        </PublicSection>
        </ScrollReveal>

        {/* Métricas de impacto - ÚNICA FUENTE DE CONTEOS */}
        <ScrollReveal>
        <PublicSection
          eyebrow="Impacto"
          title="Métricas en vivo"
          subtitle="Actualizamos estos datos constantemente para transparentar nuestro trabajo."
        >
          <Metrics m={metricsForComponent} />
        </PublicSection>
        </ScrollReveal>

        {/* Novedades */}
        <ScrollReveal>
        <PublicSection
          eyebrow="Historias recientes"
          title="Novedades"
          subtitle="Descubre los últimos operativos, campañas y testimonios publicados por la fundación."
          rightAction={
            <Link
              href="/novedades"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <Novedades items={novedadesLista} />
        </PublicSection>
        </ScrollReveal>

        {/* Próximos Operativos */}
        <ScrollReveal>
        <PublicSection
          eyebrow="Agenda"
          title="Próximos operativos"
          subtitle="Organiza tu participación con anticipación y revisa los cupos disponibles."
          rightAction={
            <Link
              href="/operativos"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
        </ScrollReveal>

        {/* CTA Empresas con tema oscuro premium */}
        <ScrollReveal>
        <section className={`${getCardClasses()} ${publicTheme.colors.primaryDark.bg} text-white relative overflow-hidden`}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] items-center">
            <div className={publicTheme.spacing.cardInner}>
              <p className={publicTheme.components.eyebrow.onDark}>
                Empresas
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Conecta a tu equipo con el impacto social
              </h2>
              <p className={`text-base ${publicTheme.colors.text.onDarkMuted} max-w-2xl leading-relaxed`}>
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
        </ScrollReveal>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente de grid para la agenda
   ───────────────────────────────────────────────────────────────────────────── */
function AgendaGrid({ items }: { items: AgendaOperativo[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((op) => (
        <Link
          key={op.id}
          href={`/operativos/${op.slug}`}
          className={`group overflow-hidden rounded-2xl ${publicTheme.colors.surface.border} border ${publicTheme.colors.surface.card} shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.08)]`}
        >
          <div className="aspect-video w-full bg-slate-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={op.imagen}
              alt={op.titulo}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-5 sm:p-6 space-y-3">
            <p className={publicTheme.components.eyebrow.primary}>
              Operativo
            </p>
            <h3 className={`text-lg font-bold ${publicTheme.colors.text.primary} ${publicTheme.colors.primary.textHover} transition-colors duration-150`}>
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
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-all group-hover:gap-2">
                Ver detalles
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AgendaEmptyState() {
  return (
    <div className={`rounded-2xl ${publicTheme.colors.surface.borderDashed} border bg-slate-50/50 p-10 text-center`}>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${publicTheme.colors.accent.bg}`}>
        <Stethoscope className={`h-8 w-8 ${publicTheme.colors.accent.textStrong}`} />
      </div>
      <h3 className={`mt-5 text-lg font-bold ${publicTheme.colors.text.primary}`}>
        Próximamente nuevos operativos
      </h3>
      <p className={`mt-2 text-sm ${publicTheme.colors.text.muted} max-w-sm mx-auto`}>
        Estamos preparando nuevos operativos. Síguenos en redes sociales para enterarte primero.
      </p>
      <Link
        href="/postular"
        className={`mt-6 ${getPrimaryButtonClasses()}`}
      >
        Postúlate como voluntario
      </Link>
    </div>
  );
}
