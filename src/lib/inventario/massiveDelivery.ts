/**
 * Lógica de entrega masiva de inventario para operativos
 * Calcula requerimientos por voluntario y ejecuta entregas en transacción
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

type InventarioItem = Database["public"]["Tables"]["inventario_items"]["Row"];
type VolunteerGearStatus = Database["public"]["Tables"]["volunteer_gear_status"]["Row"];
type LanyardType = Database["public"]["Tables"]["lanyard_types"]["Row"];

// ============================================================================
// TIPOS
// ============================================================================

export type VolunteerRequirement = {
  volunteer_id: string;
  volunteer_name: string;
  needs_lanyard: boolean;
  needs_id_card: boolean;
  needs_uniform: boolean;
  uniform_cycles: number;
};

export type ItemRequirement = {
  item_id: string | null;
  item_name: string;
  item_type: string; // 'lanyard', 'id_card', 'uniform_shirt', 'uniform_pants'
  required_qty: number;
  available_qty: number;
  missing_qty: number;
  status: "ok" | "insufficient" | "not_found";
  lanyard_type_slug?: string;
};

export type DeliverySimulation = {
  operativo_id: string;
  operativo_titulo: string;
  lanyard_theme_slug: string | null;
  total_confirmados: number;
  summary: {
    kits_pendientes: number;
    uniformes_por_reponer: number;
  };
  requirements: ItemRequirement[];
  per_volunteer: VolunteerRequirement[];
  can_execute: boolean;
  blocking_items: string[];
};

export type DeliveryExecutionResult = {
  success: boolean;
  message: string;
  deliveries_created: number;
  volunteers_updated: number;
  items_decremented: string[];
  errors?: string[];
};

// ============================================================================
// CONFIGURACIÓN DE ITEMS
// ============================================================================

// Mapeo de tipo_regla a nombres de items que deben existir en inventory_items
const ITEM_TIPOS = {
  KIT_BASE_LANYARD: "kit_base_lanyard",
  KIT_BASE_CREDENCIAL: "kit_base_credencial",
  UNIFORME_POLERA: "uniforme_polera",
  UNIFORME_PANTALON: "uniforme_pantalon",
} as const;

// ============================================================================
// FUNCIÓN PRINCIPAL: SIMULAR ENTREGA
// ============================================================================

export async function simulateOperativoDelivery(
  supabase: SupabaseClient<Database>,
  operativo_id: string
): Promise<DeliverySimulation> {
  // 1) Obtener operativo con tema de lanyard
  const { data: operativo, error: opError } = (await supabase
    .from("operativos")
    .select("id, titulo, lanyard_type_id, lanyard_type:lanyard_type_id(slug)")
    .eq("id", operativo_id)
    .single()) as any;

  if (opError || !operativo) {
    throw new Error(`Operativo no encontrado: ${opError?.message || "ID inválido"}`);
  }

  const lanyard_theme_slug =
    (operativo.lanyard_type as unknown as LanyardType)?.slug || "general";

  // 2) Obtener voluntarios confirmados para este operativo
  const { data: inscripciones, error: inscError } = (await supabase
    .from("inscripciones")
    .select(
      `
      id,
      voluntario_id,
      voluntarios!inner(id, nombres, apellidos),
      volunteer_gear_status(
        has_lanyard,
        has_id_card,
        uniform_cycles_since_issue,
        uniform_last_issued_at
      )
    `
    )
    .eq("operativo_id", operativo_id)
    .eq("estado", "confirmado")) as any;

  if (inscError) {
    throw new Error(`Error al obtener confirmados: ${inscError.message}`);
  }

  const confirmados = inscripciones || [];

  // 3) Calcular requerimientos por voluntario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perVolunteer: VolunteerRequirement[] = confirmados.map((insc: any) => {
    const vol = insc.voluntarios as any;
    const gear = (insc.volunteer_gear_status as any)?.[0] || {
      has_lanyard: false,
      has_id_card: false,
      uniform_cycles_since_issue: 0,
    };

    return {
      volunteer_id: insc.voluntario_id,
      volunteer_name: `${vol.nombres} ${vol.apellidos}`,
      needs_lanyard: !gear.has_lanyard,
      needs_id_card: !gear.has_id_card,
      needs_uniform: gear.uniform_cycles_since_issue >= 5,
      uniform_cycles: gear.uniform_cycles_since_issue,
    };
  });

  // 4) Agregar requerimientos totales
  const needed_lanyards = perVolunteer.filter((v) => v.needs_lanyard).length;
  const needed_id_cards = perVolunteer.filter((v) => v.needs_id_card).length;
  const needed_uniforms = perVolunteer.filter((v) => v.needs_uniform).length;

  // 5) Obtener inventario disponible
  const { data: allItems, error: itemsError } = (await supabase
    .from("inventario_items")
    .select("id, nombre, tipo_regla, cantidad_actual, lanyard_type:lanyard_type_id(slug)")) as any;

  if (itemsError) {
    throw new Error(`Error al obtener inventario: ${itemsError.message}`);
  }

  const items = allItems || [];

  // Helper: buscar item por tipo_regla y lanyard_type_slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findItem = (tipo: string, lanyardSlug?: string) => {
    return items.find((i: any) => {
      const matchTipo = i.tipo_regla === tipo;
      if (!lanyardSlug) return matchTipo;
      const itemLanyardSlug = (i.lanyard_type as any)?.slug;
      return matchTipo && itemLanyardSlug === lanyardSlug;
    });
  };

  // 6) Construir requirements
  const requirements: ItemRequirement[] = [];

  // Lanyards (según tema del operativo)
  if (needed_lanyards > 0) {
    const lanyardItem = findItem(ITEM_TIPOS.KIT_BASE_LANYARD, lanyard_theme_slug);
    const available = lanyardItem?.cantidad_actual || 0;
    requirements.push({
      item_id: lanyardItem?.id || null,
      item_name: `Lanyard ${lanyard_theme_slug}`,
      item_type: "lanyard",
      required_qty: needed_lanyards,
      available_qty: available,
      missing_qty: Math.max(0, needed_lanyards - available),
      status: !lanyardItem
        ? "not_found"
        : available >= needed_lanyards
        ? "ok"
        : "insufficient",
      lanyard_type_slug: lanyard_theme_slug,
    });
  }

  // Credenciales
  if (needed_id_cards > 0) {
    const idCardItem = findItem(ITEM_TIPOS.KIT_BASE_CREDENCIAL);
    const available = idCardItem?.cantidad_actual || 0;
    requirements.push({
      item_id: idCardItem?.id || null,
      item_name: "Credencial / ID Card",
      item_type: "id_card",
      required_qty: needed_id_cards,
      available_qty: available,
      missing_qty: Math.max(0, needed_id_cards - available),
      status: !idCardItem
        ? "not_found"
        : available >= needed_id_cards
        ? "ok"
        : "insufficient",
    });
  }

  // Uniformes (polera)
  if (needed_uniforms > 0) {
    const shirtItem = findItem(ITEM_TIPOS.UNIFORME_POLERA);
    const available = shirtItem?.cantidad_actual || 0;
    requirements.push({
      item_id: shirtItem?.id || null,
      item_name: "Polera uniforme",
      item_type: "uniform_shirt",
      required_qty: needed_uniforms,
      available_qty: available,
      missing_qty: Math.max(0, needed_uniforms - available),
      status: !shirtItem
        ? "not_found"
        : available >= needed_uniforms
        ? "ok"
        : "insufficient",
    });
  }

  // Uniformes (pantalón)
  if (needed_uniforms > 0) {
    const pantsItem = findItem(ITEM_TIPOS.UNIFORME_PANTALON);
    const available = pantsItem?.cantidad_actual || 0;
    requirements.push({
      item_id: pantsItem?.id || null,
      item_name: "Pantalón uniforme",
      item_type: "uniform_pants",
      required_qty: needed_uniforms,
      available_qty: available,
      missing_qty: Math.max(0, needed_uniforms - available),
      status: !pantsItem
        ? "not_found"
        : available >= needed_uniforms
        ? "ok"
        : "insufficient",
    });
  }

  // 7) Determinar si se puede ejecutar
  const blockingItems = requirements
    .filter((r) => r.status !== "ok")
    .map((r) => r.item_name);

  const canExecute = blockingItems.length === 0;

  return {
    operativo_id,
    operativo_titulo: operativo.titulo || "Sin título",
    lanyard_theme_slug,
    total_confirmados: confirmados.length,
    summary: {
      kits_pendientes: Math.max(needed_lanyards, needed_id_cards),
      uniformes_por_reponer: needed_uniforms,
    },
    requirements,
    per_volunteer: perVolunteer,
    can_execute: canExecute,
    blocking_items: blockingItems,
  };
}

// ============================================================================
// FUNCIÓN PRINCIPAL: EJECUTAR ENTREGA
// ============================================================================

export async function executeOperativoDelivery(
  supabase: SupabaseClient<Database>,
  operativo_id: string,
  admin_email: string
): Promise<DeliveryExecutionResult> {
  // 1) Simular primero para validar
  const simulation = await simulateOperativoDelivery(supabase, operativo_id);

  if (!simulation.can_execute) {
    return {
      success: false,
      message: `No se puede ejecutar: faltan items (${simulation.blocking_items.join(", ")})`,
      deliveries_created: 0,
      volunteers_updated: 0,
      items_decremented: [],
      errors: simulation.blocking_items,
    };
  }

  // 2) Ejecutar en TRANSACCIÓN (simulada con múltiples operaciones atómicas)
  // NOTA: Supabase JS no soporta transacciones directas, debemos usar RPC o hacer rollback manual

  const deliveries_created: string[] = [];
  const volunteers_updated: string[] = [];
  const items_decremented: string[] = [];
  const errors: string[] = [];

  try {
    // Por cada voluntario que necesita items
    for (const vol of simulation.per_volunteer) {
      const deliveriesToCreate: Array<{
        volunteer_id: string;
        operativo_id: string;
        item_id: string;
        quantity: number;
        notes: string | null;
        created_by: string;
      }> = [];

      // Encontrar item_id correspondiente a cada requerimiento
      const lanyardReq = simulation.requirements.find((r) => r.item_type === "lanyard");
      const idCardReq = simulation.requirements.find((r) => r.item_type === "id_card");
      const shirtReq = simulation.requirements.find((r) => r.item_type === "uniform_shirt");
      const pantsReq = simulation.requirements.find((r) => r.item_type === "uniform_pants");

      if (vol.needs_lanyard && lanyardReq?.item_id) {
        deliveriesToCreate.push({
          volunteer_id: vol.volunteer_id,
          operativo_id,
          item_id: lanyardReq.item_id,
          quantity: 1,
          notes: `Entrega masiva - Operativo ${simulation.operativo_titulo}`,
          created_by: admin_email,
        });
      }

      if (vol.needs_id_card && idCardReq?.item_id) {
        deliveriesToCreate.push({
          volunteer_id: vol.volunteer_id,
          operativo_id,
          item_id: idCardReq.item_id,
          quantity: 1,
          notes: `Entrega masiva - Operativo ${simulation.operativo_titulo}`,
          created_by: admin_email,
        });
      }

      if (vol.needs_uniform) {
        if (shirtReq?.item_id) {
          deliveriesToCreate.push({
            volunteer_id: vol.volunteer_id,
            operativo_id,
            item_id: shirtReq.item_id,
            quantity: 1,
            notes: `Entrega masiva - Reposición uniforme (${vol.uniform_cycles} ciclos)`,
            created_by: admin_email,
          });
        }
        if (pantsReq?.item_id) {
          deliveriesToCreate.push({
            volunteer_id: vol.volunteer_id,
            operativo_id,
            item_id: pantsReq.item_id,
            quantity: 1,
            notes: `Entrega masiva - Reposición uniforme (${vol.uniform_cycles} ciclos)`,
            created_by: admin_email,
          });
        }
      }

      // Insertar deliveries
      if (deliveriesToCreate.length > 0) {
        const { data, error } = (await supabase
          .from("inventory_deliveries")
          .insert(deliveriesToCreate as any)
          .select("id")) as any;

        if (error) {
          errors.push(`Error al crear deliveries para ${vol.volunteer_name}: ${error.message}`);
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deliveries_created.push(...(data?.map((d: any) => d.id) || []));
      }

      // Actualizar volunteer_gear_status
      const gearUpdate: Partial<VolunteerGearStatus> = {
        updated_at: new Date().toISOString(),
      };

      if (vol.needs_lanyard) {
        gearUpdate.has_lanyard = true;
        gearUpdate.lanyard_type_id = simulation.lanyard_theme_slug
          ? (
              (await supabase
                .from("lanyard_types")
                .select("id")
                .eq("slug", simulation.lanyard_theme_slug)
                .single()) as any
            ).data?.id || null
          : null;
      }

      if (vol.needs_id_card) {
        gearUpdate.has_id_card = true;
      }

      if (vol.needs_uniform) {
        gearUpdate.uniform_cycles_since_issue = 0;
        gearUpdate.uniform_last_issued_at = new Date().toISOString();
      }

      const { error: gearError } = await supabase
        .from("volunteer_gear_status")
        .upsert({
          volunteer_id: vol.volunteer_id,
          ...gearUpdate,
        } as any);

      if (gearError) {
        errors.push(
          `Error al actualizar gear_status de ${vol.volunteer_name}: ${gearError.message}`
        );
        continue;
      }

      volunteers_updated.push(vol.volunteer_id);
    }

    // Decrementar stock de items usados
    for (const req of simulation.requirements) {
      if (req.item_id && req.required_qty > 0) {
        const { error: stockError } = (await (supabase as any).rpc("decrement_inventory_stock", {
          p_item_id: req.item_id,
          p_quantity: req.required_qty,
        })) as any;

        if (stockError) {
          errors.push(`Error al decrementar stock de ${req.item_name}: ${stockError.message}`);
          continue;
        }

        items_decremented.push(req.item_name);
      }
    }

    const success = errors.length === 0;

    return {
      success,
      message: success
        ? `Entrega exitosa: ${deliveries_created.length} entregas, ${volunteers_updated.length} voluntarios actualizados`
        : `Entrega parcial con errores: ${errors.length} errores encontrados`,
      deliveries_created: deliveries_created.length,
      volunteers_updated: volunteers_updated.length,
      items_decremented,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error crítico durante la ejecución: ${error.message}`,
      deliveries_created: 0,
      volunteers_updated: 0,
      items_decremented: [],
      errors: [error.message],
    };
  }
}
