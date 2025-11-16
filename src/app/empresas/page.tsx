import EmpresasForm from "./EmpresasForm";
import { EmpresasHeroMetrics } from "./EmpresasHeroMetrics";
import type { EmpresaProductoRow } from "@/lib/empresas";
import { getEmpresaMetrics } from "@/lib/empresas";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const supabase = createSupabaseServer();
  const productosQuery = supabase
    .from("empresa_productos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const [empresaMetrics, productosResponse] = await Promise.all([getEmpresaMetrics(), productosQuery]);
  const { data, error } = productosResponse;

  const productos = (data ?? []) as EmpresaProductoRow[];
  const errorMessage = error?.message ? `No pudimos cargar el catálogo: ${error.message}` : null;

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <section className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-8 py-12 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Programas para empresas</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Conecta a tu equipo con el impacto social</h1>
        <p className="mt-4 max-w-3xl text-lg text-white/90">
          Diseñamos operativos de salud, voluntariado corporativo y experiencias formativas que transforman a las
          comunidades y fortalecen la cultura interna de tu empresa.
        </p>
        <EmpresasHeroMetrics metrics={empresaMetrics} />
      </section>
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}
      <EmpresasForm productos={productos} />
    </main>
  );
}
