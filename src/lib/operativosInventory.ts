import { isConfirmedEstado, normalizeInscripcionEstado } from "@/lib/inscripciones";
import type { InventarioItem } from "@/lib/inventario/types";
import { supabaseService } from "@/lib/supabaseService";

export type OperativoNeeds = {
  totalVoluntarios: number;
  uniformesNecesarios: number;
  lanyardsNecesarios: number;
  credencialesNecesarias: number;
};

const ZERO_NEEDS: OperativoNeeds = {
  totalVoluntarios: 0,
  uniformesNecesarios: 0,
  lanyardsNecesarios: 0,
  credencialesNecesarias: 0,
};

const VOLUNTARIO_ITEM_SLUGS = {
  uniforme: "uniforme-voluntario",
  lanyard: "lanyard-voluntario",
  credencial: "credencial-voluntario",
} as const;

export async function calculateOperativoNeeds(operativoId: string): Promise<OperativoNeeds> {
  if (!operativoId) return ZERO_NEEDS;

  try {
    const { data: operativoRows, error: operativoError } = await supabaseService
      .from("inscripciones")
      .select("voluntario_id,estado")
      .eq("operativo_id", operativoId);

    if (operativoError) throw operativoError;

    type InscripcionRow = { voluntario_id: string | null; estado: string | null };
    const confirmedRows = ((operativoRows ?? []) as InscripcionRow[]).filter((row) =>
      isConfirmedEstado(normalizeInscripcionEstado(row.estado))
    );
    const voluntarioIds = Array.from(
      new Set(confirmedRows.map((row) => row.voluntario_id).filter((value): value is string => Boolean(value)))
    );

    if (!voluntarioIds.length) {
      return {
        totalVoluntarios: 0,
        uniformesNecesarios: 0,
        lanyardsNecesarios: 0,
        credencialesNecesarias: 0,
      };
    }

    const { data: historialRows, error: historialError } = await supabaseService
      .from("inscripciones")
      .select("voluntario_id,estado")
      .in("voluntario_id", voluntarioIds);

    if (historialError) throw historialError;

    const confirmedCounts = new Map<string, number>();
    for (const id of voluntarioIds) confirmedCounts.set(id, 0);

    for (const row of (historialRows ?? []) as InscripcionRow[]) {
      if (!row.voluntario_id) continue;
      const estado = normalizeInscripcionEstado(row.estado);
      if (!isConfirmedEstado(estado)) continue;
      confirmedCounts.set(row.voluntario_id, (confirmedCounts.get(row.voluntario_id) ?? 0) + 1);
    }

    let uniformesNecesarios = 0;
    for (const id of voluntarioIds) {
      const totalConfirmados = confirmedCounts.get(id) ?? 0;
      const needsUniforme = totalConfirmados > 0 && ((totalConfirmados - 1) % 3 === 0);
      if (needsUniforme) {
        uniformesNecesarios += 1;
      }
    }

    const totalVoluntarios = voluntarioIds.length;

    return {
      totalVoluntarios,
      uniformesNecesarios,
      lanyardsNecesarios: totalVoluntarios,
      credencialesNecesarias: totalVoluntarios,
    };
  } catch (error) {
    console.error("calculateOperativoNeeds", error);
    return ZERO_NEEDS;
  }
}

export type OperativoInventarioResumen = {
  needs: OperativoNeeds;
  stock: {
    uniforme?: InventarioItem;
    lanyard?: InventarioItem;
    credencial?: InventarioItem;
  };
  faltantes: {
    uniformes: number;
    lanyards: number;
    credenciales: number;
  };
};

const ZERO_INVENTARIO_RESUMEN: OperativoInventarioResumen = {
  needs: ZERO_NEEDS,
  stock: {},
  faltantes: {
    uniformes: 0,
    lanyards: 0,
    credenciales: 0,
  },
};

export async function getInventarioSnapshotForOperativo(operativoId: string): Promise<OperativoInventarioResumen> {
  if (!operativoId) return ZERO_INVENTARIO_RESUMEN;

  const needs = await calculateOperativoNeeds(operativoId);

  try {
    const slugList = Object.values(VOLUNTARIO_ITEM_SLUGS);
    const { data, error } = await supabaseService
      .from("inventario_items")
      .select("*")
      .in("slug", slugList);

    if (error) throw error;

    const items = (data ?? []) as InventarioItem[];
    const stock = {
      uniforme: items.find((item) => item.slug === VOLUNTARIO_ITEM_SLUGS.uniforme),
      lanyard: items.find((item) => item.slug === VOLUNTARIO_ITEM_SLUGS.lanyard),
      credencial: items.find((item) => item.slug === VOLUNTARIO_ITEM_SLUGS.credencial),
    } satisfies OperativoInventarioResumen["stock"];

    const getCantidad = (item?: InventarioItem) => (typeof item?.cantidad_actual === "number" ? item.cantidad_actual : 0);

    const faltantes = {
      uniformes: Math.max(0, needs.uniformesNecesarios - getCantidad(stock.uniforme)),
      lanyards: Math.max(0, needs.lanyardsNecesarios - getCantidad(stock.lanyard)),
      credenciales: Math.max(0, needs.credencialesNecesarias - getCantidad(stock.credencial)),
    } satisfies OperativoInventarioResumen["faltantes"];

    return {
      needs,
      stock,
      faltantes,
    };
  } catch (error) {
    console.error("getInventarioSnapshotForOperativo", error);
    return {
      needs,
      stock: {},
      faltantes: {
        uniformes: Math.max(0, needs.uniformesNecesarios),
        lanyards: Math.max(0, needs.lanyardsNecesarios),
        credenciales: Math.max(0, needs.credencialesNecesarias),
      },
    };
  }
}
