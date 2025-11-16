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
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Próximos operativos</h1>
      <p className="text-gray-600 mb-6">Conoce nuestras próximas fechas y postula.</p>

      {ops.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-gray-600">
          Aún no hay operativos publicados.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {ops.map(op=>(
            <a key={op.id} href={`/operativos/${op.slug}`} className="rounded-2xl overflow-hidden border bg-white hover:shadow-md transition">
              <div className="relative h-40 bg-gray-100">
                {/* usamos <img> para no tocar next.config */}
                <img
                    src={op.imagen_cabecera_url || op.operativo_imagenes?.[0]?.url || "https://placehold.co/800x400?text=Operativo"}
                  alt={op.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{op.titulo}</h3>
                <p className="text-sm text-gray-500">
                  {op.fecha_inicio ? new Date(op.fecha_inicio).toLocaleDateString() : "Fecha por confirmar"}
                  {op.lugar ? ` · ${op.lugar}` : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
