// src/lib/inventario_rules.ts
// Reglas de inventario para asignación a voluntarios

export const UNIFORME_SLUG = "uniforme-voluntario";
export const LANYARD_SLUG = "lanyard-voluntario";
export const CREDENCIAL_SLUG = "credencial-voluntario";

/** Cada cuántos operativos se renueva el uniforme */
export const UNIFORME_CICLO_OPERATIVOS = 5;

// ============================================================================
// TYPES
// ============================================================================

export type NecesidadesOperativoVoluntarios = {
  uniformesNecesarios: number;
  lanyardsNecesarios: number;
  credencialesNecesarias: number;
  credencialesExtra: number;
  credencialesTotales: number;
};

export interface LanyardType {
  id: string;
  name: string;
  slug: string;
  ribbon_color_name: string;
  ribbon_hex?: string | null;
  is_active: boolean;
}

export interface VolunteerGearStatus {
  volunteer_id: string;
  has_lanyard: boolean;
  has_id_card: boolean;
  lanyard_type_id?: string | null;
  uniform_cycles_since_issue: number;
  uniform_last_issued_at?: string | null;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

type CalcularNecesidadesInput = {
  totalVoluntarios: number;
  voluntariosInventario?: Array<{
    operativosAsistidos: number | null | undefined;
    uniformesEntregados: number | null | undefined;
    gearStatus?: VolunteerGearStatus | null;
  }>;
};

/**
 * Calcula los insumos mínimos para un operativo en base al número de voluntarios confirmados.
 * Usa la regla de uniforme cada 5 operativos.
 */
export function calcularNecesidadesPorOperativo({
  totalVoluntarios,
  voluntariosInventario = [],
}: CalcularNecesidadesInput): NecesidadesOperativoVoluntarios {
  const safeTotal = Math.max(0, Math.floor(totalVoluntarios));

  const voluntariosConDatos = voluntariosInventario.slice(0, safeTotal);
  const faltantesPorDatos = Math.max(0, safeTotal - voluntariosConDatos.length);
  
  // Calcular uniformes necesarios (cada 5 operativos)
  const uniformesNecesarios = voluntariosConDatos.reduce((acc, voluntario) => {
    // Si tiene gear_status, usar el contador de ciclos
    if (voluntario.gearStatus) {
      const cycles = voluntario.gearStatus.uniform_cycles_since_issue ?? 0;
      // Necesita uniforme si ciclos >= 5 (o si nunca se le ha entregado)
      const needsUniforme = cycles >= UNIFORME_CICLO_OPERATIVOS;
      return acc + (needsUniforme ? 1 : 0);
    }
    // Fallback a lógica anterior
    const operativosAsistidos = Math.max(0, Math.floor(voluntario?.operativosAsistidos ?? 0));
    const uniformesEntregados = Math.max(0, Math.floor(voluntario?.uniformesEntregados ?? 0));
    const proximoUmbral = (uniformesEntregados + 1) * UNIFORME_CICLO_OPERATIVOS;
    const needsUniforme = operativosAsistidos >= proximoUmbral;
    return acc + (needsUniforme ? 1 : 0);
  }, faltantesPorDatos);

  // Lanyards: solo para quienes no tienen
  const lanyardsNecesarios = voluntariosConDatos.reduce((acc, voluntario) => {
    if (voluntario.gearStatus) {
      return acc + (voluntario.gearStatus.has_lanyard ? 0 : 1);
    }
    // Sin gear_status = voluntario nuevo = necesita lanyard
    return acc + 1;
  }, faltantesPorDatos);

  // Credenciales: solo para quienes no tienen
  const credencialesNecesarias = voluntariosConDatos.reduce((acc, voluntario) => {
    if (voluntario.gearStatus) {
      return acc + (voluntario.gearStatus.has_id_card ? 0 : 1);
    }
    // Sin gear_status = voluntario nuevo = necesita credencial
    return acc + 1;
  }, faltantesPorDatos);

  const credencialesExtra = 10;
  const credencialesTotales = credencialesNecesarias + credencialesExtra;

  return {
    uniformesNecesarios,
    lanyardsNecesarios,
    credencialesNecesarias,
    credencialesExtra,
    credencialesTotales,
  };
}

export type EstadoUniformeVoluntario = "sin-uniforme" | "vigente" | "debe-renovar";

type NecesitaRenovarUniformeInput = {
  operativosAsistidos: number;
  uniformesEntregados: number;
  gearStatus?: VolunteerGearStatus | null;
};

/**
 * Determina si un voluntario necesita renovar uniforme bajo la regla cada 5 operativos.
 */
export function necesitaRenovarUniforme({
  operativosAsistidos,
  uniformesEntregados,
  gearStatus,
}: NecesitaRenovarUniformeInput): EstadoUniformeVoluntario {
  // Si tiene gear_status, usar el contador de ciclos
  if (gearStatus) {
    const cycles = gearStatus.uniform_cycles_since_issue ?? 0;
    if (cycles >= UNIFORME_CICLO_OPERATIVOS) return "debe-renovar";
    if (gearStatus.uniform_last_issued_at) return "vigente";
    return "sin-uniforme";
  }

  // Fallback a lógica anterior
  const asistidos = Math.max(0, Math.floor(operativosAsistidos));
  const entregados = Math.max(0, Math.floor(uniformesEntregados));
  
  if (entregados === 0) {
    return asistidos > 0 ? "debe-renovar" : "sin-uniforme";
  }
  
  const ciclosCompletos = Math.floor(asistidos / UNIFORME_CICLO_OPERATIVOS);
  if (entregados >= ciclosCompletos + 1) return "vigente";
  return "debe-renovar";
}

/**
 * Determina si un voluntario necesita items del kit base
 */
export function necesitaKitBase(gearStatus?: VolunteerGearStatus | null): {
  needsLanyard: boolean;
  needsCredencial: boolean;
} {
  if (gearStatus) {
    return {
      needsLanyard: !gearStatus.has_lanyard,
      needsCredencial: !gearStatus.has_id_card,
    };
  }
  // Sin gear_status = voluntario nuevo = necesita todo
  return {
    needsLanyard: true,
    needsCredencial: true,
  };
}
