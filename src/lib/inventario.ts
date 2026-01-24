import { createSupabaseServer } from "@/lib/supabaseServer";
import { isConfirmedEstado, normalizeInscripcionEstado } from "@/lib/inscripciones";
import {
  calcularNecesidadesPorOperativo,
  CREDENCIAL_SLUG,
  LANYARD_SLUG,
  NecesidadesOperativoVoluntarios,
  UNIFORME_SLUG,
} from "@/lib/inventario_rules";

type VoluntarioInventarioRow = {
  id: string;
  operativos_asistidos: number | null;
  uniformes_entregados: number | null;
};

export type PlanInventarioStockEntry = {
  itemId: string | null;
  cantidadActual: number | null;
  unidad: string | null;
};

export type PlanInventarioOperativo = {
  operativoId: string;
  totalVoluntarios: number;
  necesidades: NecesidadesOperativoVoluntarios;
  stock: {
    uniforme: PlanInventarioStockEntry;
    lanyard: PlanInventarioStockEntry;
    credencial: PlanInventarioStockEntry;
  };
};

const EMPTY_STOCK_ENTRY: PlanInventarioStockEntry = {
  itemId: null,
  cantidadActual: null,
  unidad: null,
};

function buildEmptyPlan(operativoId: string): PlanInventarioOperativo {
  return {
    operativoId,
    totalVoluntarios: 0,
    necesidades: calcularNecesidadesPorOperativo({ totalVoluntarios: 0, voluntariosInventario: [] }),
    stock: {
      uniforme: { ...EMPTY_STOCK_ENTRY },
      lanyard: { ...EMPTY_STOCK_ENTRY },
      credencial: { ...EMPTY_STOCK_ENTRY },
    },
  };
}

export async function getPlanInventarioOperativo(operativoId: string): Promise<PlanInventarioOperativo> {
  if (!operativoId) {
    return buildEmptyPlan("");
  }

  const supabase = createSupabaseServer();

  try {
    const { data: inscripciones, error: inscripcionesError } = await supabase
      .from("inscripciones")
      .select("voluntario_id,estado")
      .eq("operativo_id", operativoId);

    if (inscripcionesError) {
      throw inscripcionesError;
    }

    const confirmedVolunteerIds = new Set<string>();
    for (const row of inscripciones ?? []) {
      const estadoNormalizado = normalizeInscripcionEstado(row.estado);
      if (row.voluntario_id && isConfirmedEstado(estadoNormalizado)) {
        confirmedVolunteerIds.add(row.voluntario_id);
      }
    }

    const confirmedIdsArray = Array.from(confirmedVolunteerIds);
    const totalVoluntarios = confirmedIdsArray.length;

    let voluntariosInventario: Array<{ operativosAsistidos: number; uniformesEntregados: number }> = [];
    if (totalVoluntarios > 0) {
      const { data: voluntariosRaw, error: voluntariosError } = await supabase
        .from("voluntarios")
        .select("id,operativos_asistidos,uniformes_entregados")
        .in("id", confirmedIdsArray);

      if (voluntariosError) {
        throw voluntariosError;
      }

      const inventarioMap = new Map<string, VoluntarioInventarioRow>();
      for (const row of (voluntariosRaw ?? []) as VoluntarioInventarioRow[]) {
        if (row?.id) {
          inventarioMap.set(row.id, row);
        }
      }

      voluntariosInventario = confirmedIdsArray.map((id) => {
        const stats = inventarioMap.get(id);
        return {
          operativosAsistidos: stats?.operativos_asistidos ?? 0,
          uniformesEntregados: stats?.uniformes_entregados ?? 0,
        };
      });
    }

    const necesidades = calcularNecesidadesPorOperativo({
      totalVoluntarios,
      voluntariosInventario,
    });

    const slugList = [UNIFORME_SLUG, LANYARD_SLUG, CREDENCIAL_SLUG];
    const { data: inventarioItems, error: inventarioError } = await supabase
      .from("inventario_items")
      .select("id,slug,nombre,cantidad_actual,unidad")
      .in("slug", slugList);

    if (inventarioError) {
      throw inventarioError;
    }

    const stockMap = new Map<string, PlanInventarioStockEntry>();
    for (const item of inventarioItems ?? []) {
      stockMap.set(item.slug, {
        itemId: item.id ?? null,
        cantidadActual: typeof item.cantidad_actual === "number" ? item.cantidad_actual : null,
        unidad: item.unidad ?? null,
      });
    }

    const getStockEntry = (slug: string): PlanInventarioStockEntry => {
      const entry = stockMap.get(slug);
      return entry ? entry : { ...EMPTY_STOCK_ENTRY };
    };

    const stock = {
      uniforme: getStockEntry(UNIFORME_SLUG),
      lanyard: getStockEntry(LANYARD_SLUG),
      credencial: getStockEntry(CREDENCIAL_SLUG),
    } satisfies PlanInventarioOperativo["stock"];

    return {
      operativoId,
      totalVoluntarios,
      necesidades,
      stock,
    };
  } catch (error) {
    console.error("getPlanInventarioOperativo", error);
    return buildEmptyPlan(operativoId);
  }
}
