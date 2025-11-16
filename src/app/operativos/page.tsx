import OperativoCard from "@/components/OperativoCard";

export const dynamic = "force-dynamic";

type Operativo = {
  id: string; titulo: string; slug: string;
  fecha_inicio: string | null; lugar: string | null;
  imagen_cabecera_url: string | null;
  operativo_imagenes?: Array<{ url: string | null; path: string | null }>;
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function fetchOperativos(): Promise<Operativo[]> {
  const res = await fetch(
    `${URL}/rest/v1/operativos?estado=eq.publicado&select=id,titulo,slug,fecha_inicio,lugar,imagen_cabecera_url,operativo_imagenes(url,path)&order=fecha_inicio.asc`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function OperativosPage() {
  const ops = await fetchOperativos();

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Operativos</p>
          <h1 className="text-4xl font-semibold text-slate-900">Próximos operativos</h1>
          <p className="text-base text-slate-600">Conoce las fechas y territorios donde estaremos presentes.</p>
        </header>

        {ops.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            Aún no hay operativos publicados.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {ops.map((op) => {
              const resumen = op.lugar
                ? `Operativo en ${op.lugar} para acercar atención especializada.`
                : "Operativo Traesol en preparación; te avisaremos el territorio pronto.";
              const portada =
                op.imagen_cabecera_url || op.operativo_imagenes?.[0]?.url || "https://placehold.co/800x400?text=Operativo";
              return (
                <OperativoCard
                  key={op.id}
                  href={`/operativos/${op.slug}`}
                  titulo={op.titulo}
                  fecha={op.fecha_inicio}
                  lugar={op.lugar}
                  imagen={portada}
                  resumen={resumen}
                  variant="full"
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
