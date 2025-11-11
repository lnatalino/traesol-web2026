import { createSupabaseServer } from "@/lib/supabaseServer";
import Carousel from "@/components/Carousel";
import CTAButtons from "@/components/CTAButtons";
import MetricBlocks from "@/components/MetricBlocks";
import OperativosCarousel from "@/components/OperativosCarousel";

type Slide = { id: string; titulo: string | null; imagen_url: string; link_url: string | null };
type Metrics = { operativos_publicados: number; voluntarios_total: number; asistencias_marcadas: number };
type Operativo = { id: string; titulo: string; slug: string; fecha_inicio: string; lugar: string | null; imagen_cabecera_url: string | null };

export default async function HomePage() {
  const supabase = createSupabaseServer();

  const { data: slides } = await supabase
    .from("carrusel_fotos")
    .select("id,titulo,imagen_url,link_url")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const { data: metricasRow } = await supabase.from("vw_metricas_home").select("*").single();

  const { data: ops } = await supabase
    .from("operativos")
    .select("id,titulo,slug,fecha_inicio,lugar,imagen_cabecera_url")
    .eq("estado", "publicado")
    .gte("fecha_inicio", new Date().toISOString().slice(0,10))
    .order("fecha_inicio", { ascending: true })
    .limit(3);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <section><Carousel slides={(slides as Slide[]) || []} /></section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Únete y apoya</h2>
        <CTAButtons />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Próximos operativos</h2>
        <OperativosCarousel items={(ops as Operativo[]) || []} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Métricas en vivo</h2>
        <MetricBlocks m={(metricasRow as Metrics) || { operativos_publicados: 0, voluntarios_total: 0, asistencias_marcadas: 0 }} />
      </section>
    </main>
  );
}
