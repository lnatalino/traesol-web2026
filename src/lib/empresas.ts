import { Database } from "@/lib/database.types";

type EmpresaProductoTable = Database["public"]["Tables"]["empresa_productos"];
export type EmpresaProductoRowBase = EmpresaProductoTable["Row"];
type EmpresaProductoInsertBase = EmpresaProductoTable["Insert"];
type EmpresaProductoUpdateBase = EmpresaProductoTable["Update"];

export type EmpresaProductoCategoria = Database["public"]["Enums"]["empresa_producto_categoria"];

export type EmpresaProductoPackItemDetalle = {
  id: string;
  nombre?: string;
  cantidad: number;
};

export type EmpresaProductoDetalles = {
  descripcionLarga?: string;
  incluye?: string[];
  notasInternas?: string;
  pack?: {
    items: EmpresaProductoPackItemDetalle[];
  } | null;
} & Record<string, unknown>;

export const DEFAULT_EMPRESA_PRODUCTO_DETALLES: EmpresaProductoDetalles = { pack: null };

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
  return normalized.length ? normalized : undefined;
}

function normalizePackItems(value: unknown): EmpresaProductoPackItemDetalle[] {
  if (!Array.isArray(value)) return [];
  const items: EmpresaProductoPackItemDetalle[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id : typeof raw.producto_id === "string" ? raw.producto_id : null;
    if (!id) continue;
    const nombre = typeof raw.nombre === "string" ? raw.nombre : undefined;
    const cantidadValue = Number(raw.cantidad);
    const cantidad = Number.isFinite(cantidadValue) ? Math.max(1, Math.round(cantidadValue)) : 1;
    items.push({ id, nombre, cantidad });
  }
  return items;
}

export function normalizeEmpresaProductoDetalles(value: unknown): EmpresaProductoDetalles {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_EMPRESA_PRODUCTO_DETALLES };
  }

  const source = value as Record<string, unknown>;
  const descripcionLarga = typeof source.descripcionLarga === "string" ? source.descripcionLarga : undefined;
  const incluye = normalizeStringArray(source.incluye);
  const notasInternas = typeof source.notasInternas === "string" ? source.notasInternas : undefined;
  let pack: EmpresaProductoDetalles["pack"] = null;
  if (source.pack && typeof source.pack === "object") {
    const packRecord = source.pack as Record<string, unknown>;
    const items = normalizePackItems(packRecord.items);
    pack = { items };
  }

  const extras = Object.fromEntries(
    Object.entries(source).filter(([key]) => !["descripcionLarga", "incluye", "notasInternas", "pack"].includes(key))
  );

  return {
    ...extras,
    descripcionLarga,
    incluye,
    notasInternas,
    pack,
  } satisfies EmpresaProductoDetalles;
}

export type EmpresaProductoRow = Omit<EmpresaProductoRowBase, "detalles_json"> & {
  detalles_json: EmpresaProductoDetalles;
};

export type EmpresaProductoInsert = Omit<EmpresaProductoInsertBase, "detalles_json"> & {
  detalles_json: EmpresaProductoDetalles;
};

export type EmpresaProductoUpdate = Omit<EmpresaProductoUpdateBase, "detalles_json"> & {
  detalles_json?: EmpresaProductoDetalles;
};

export type EmpresaPackItemView = {
  id: string;
  productoBaseId: string;
  nombre: string;
  resumen?: string | null;
  categoria?: EmpresaProductoCategoria | null;
  cantidad: number;
  productoDetalle?: EmpresaProductoRow | null;
};

export type EmpresaProductoWithPackItems = EmpresaProductoRow & {
  packItems?: EmpresaPackItemView[];
};

export function mapEmpresaProductoRow(row: EmpresaProductoRowBase): EmpresaProductoRow {
  return {
    ...row,
    detalles_json: normalizeEmpresaProductoDetalles(row.detalles_json),
  };
}

export function mapEmpresaProductoRows(rows: EmpresaProductoRowBase[]): EmpresaProductoRow[] {
  return rows.map(mapEmpresaProductoRow);
}
export type EmpresaPackItemRow = Database["public"]["Tables"]["empresa_pack_items"]["Row"];
export type EmpresaPackItemInsert = Database["public"]["Tables"]["empresa_pack_items"]["Insert"];
export type EmpresaMetricsRow = Database["public"]["Tables"]["empresa_metrics"]["Row"];

export const EMPRESA_PRODUCTO_CATEGORIA_LABELS: Record<EmpresaProductoCategoria, string> = {
  tunnel_educativo: "Túnel educativo",
  operativo_especialidades: "Operativo médico de especialidades",
  operativo_quirurgico: "Operativo quirúrgico",
  jornada_actualizacion: "Jornada de actualización",
  pack: "Pack integral",
};

export const EMPRESA_PRODUCTO_CATEGORIA_PRIORITARIAS: EmpresaProductoCategoria[] = [
  "tunnel_educativo",
  "operativo_especialidades",
  "operativo_quirurgico",
  "pack",
];

export function getCategoriaLabel(value: EmpresaProductoCategoria | null | undefined): string {
  if (!value) return "Sin categoría";
  return EMPRESA_PRODUCTO_CATEGORIA_LABELS[value] ?? value.replace(/_/g, " ");
}

export type EmpresaMetricsValues = {
  operativosConEmpresas: number;
  colaboradoresMovilizados: number;
  regionesImpactadas: number;
};

export type EmpresaMetricsRecord = EmpresaMetricsValues & { updatedAt: string | null };

const EMPRESA_METRICS_FALLBACK: EmpresaMetricsRecord = {
  operativosConEmpresas: 40,
  colaboradoresMovilizados: 1200,
  regionesImpactadas: 10,
  updatedAt: null,
};

const EMPRESA_METRICS_SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

function normalizeValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function normalizePayload(payload: EmpresaMetricsValues): EmpresaMetricsValues {
  return {
    operativosConEmpresas: normalizeValue(payload.operativosConEmpresas),
    colaboradoresMovilizados: normalizeValue(payload.colaboradoresMovilizados),
    regionesImpactadas: normalizeValue(payload.regionesImpactadas),
  };
}

function mapMetrics(row?: Partial<EmpresaMetricsRow> | null): EmpresaMetricsRecord {
  if (!row) return EMPRESA_METRICS_FALLBACK;
  return {
    operativosConEmpresas: normalizeValue(row.operativos_con_empresas ?? EMPRESA_METRICS_FALLBACK.operativosConEmpresas),
    colaboradoresMovilizados: normalizeValue(
      row.colaboradores_movilizados ?? EMPRESA_METRICS_FALLBACK.colaboradoresMovilizados,
    ),
    regionesImpactadas: normalizeValue(row.regiones_impactadas ?? EMPRESA_METRICS_FALLBACK.regionesImpactadas),
    updatedAt: row.updated_at ?? null,
  };
}

export async function getEmpresaMetrics(): Promise<EmpresaMetricsRecord> {
  try {
    const { createSupabaseServer } = await import("@/lib/supabaseServer");
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from("empresa_metrics")
      .select("operativos_con_empresas,colaboradores_movilizados,regiones_impactadas,updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return mapMetrics(data?.[0] ?? null);
  } catch (err) {
    console.error("getEmpresaMetrics", err);
    return EMPRESA_METRICS_FALLBACK;
  }
}

export async function updateEmpresaMetrics(payload: EmpresaMetricsValues): Promise<EmpresaMetricsRecord> {
  const normalized = normalizePayload(payload);
  try {
    const { supabaseService } = await import("@/lib/supabaseService");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseService as any)
      .from("empresa_metrics")
      .upsert(
        [
          {
            id: EMPRESA_METRICS_SINGLETON_ID,
            operativos_con_empresas: normalized.operativosConEmpresas,
            colaboradores_movilizados: normalized.colaboradoresMovilizados,
            regiones_impactadas: normalized.regionesImpactadas,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" },
      )
      .select("operativos_con_empresas,colaboradores_movilizados,regiones_impactadas,updated_at")
      .single();

    if (error) throw error;
    return mapMetrics(data);
  } catch (err) {
    console.error("updateEmpresaMetrics", err);
    throw err;
  }
}

export const DEFAULT_EMPRESA_METRICS = EMPRESA_METRICS_FALLBACK;
