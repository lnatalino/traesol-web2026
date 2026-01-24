import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const volunteerId = searchParams.get("volunteerId");
  const operativoId = searchParams.get("operativoId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  let query = supabaseService
    .from("inventory_deliveries")
    .select(`
      *,
      voluntarios:volunteer_id(id, nombre, apellido, email),
      operativos:operativo_id(id, titulo, slug),
      inventario_items:item_id(id, nombre, slug, tipo_regla)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (volunteerId) {
    query = query.eq("volunteer_id", volunteerId);
  }
  if (operativoId) {
    query = query.eq("operativo_id", operativoId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { volunteer_id, operativo_id, item_id, quantity, notes } = body;

    if (!volunteer_id || !item_id) {
      return NextResponse.json(
        { error: "volunteer_id e item_id son requeridos" },
        { status: 400 }
      );
    }

    // Registrar la entrega
    // NOTA: Cast temporal porque inventory_deliveries puede no estar en los tipos generados
    const { data: delivery, error: deliveryError } = await supabaseService
      .from("inventory_deliveries")
      .insert({
        volunteer_id,
        operativo_id: operativo_id || null,
        item_id,
        quantity: quantity || 1,
        notes: notes || null,
        created_by: session.email,
      } as unknown as never)
      .select()
      .single();

    if (deliveryError) {
      return NextResponse.json({ error: deliveryError.message }, { status: 500 });
    }

    // Obtener info del item para saber qué tipo es
    // Cast temporal para evitar errores de tipo con tablas no generadas
    const { data: itemData } = await supabaseService
      .from("inventario_items")
      .select("slug, tipo_regla")
      .eq("id", item_id)
      .single() as { data: { slug: string; tipo_regla: string | null } | null; error: unknown };

    // Actualizar gear status del voluntario según el tipo de item
    if (itemData) {
      const tipoRegla = itemData.tipo_regla;
      const slug = itemData.slug;

      // Obtener o crear gear status
      const { data: existingStatus } = await supabaseService
        .from("volunteer_gear_status")
        .select("*")
        .eq("volunteer_id", volunteer_id)
        .maybeSingle();

      const updates: Record<string, unknown> = {
        volunteer_id,
        updated_at: new Date().toISOString(),
      };

      // Si es lanyard
      if (tipoRegla === "LANYARD" || slug.includes("lanyard")) {
        updates.has_lanyard = true;
        // Si el item tiene lanyard_type_id, actualizarlo
        const { data: fullItem } = await supabaseService
          .from("inventario_items")
          .select("lanyard_type_id")
          .eq("id", item_id)
          .single() as { data: { lanyard_type_id: string | null } | null; error: unknown };
        if (fullItem?.lanyard_type_id) {
          updates.lanyard_type_id = fullItem.lanyard_type_id;
        }
      }

      // Si es credencial
      if (tipoRegla === "CREDENCIAL" || slug.includes("credencial")) {
        updates.has_id_card = true;
      }

      // Si es uniforme
      if (tipoRegla === "UNIFORME" || slug.includes("uniforme")) {
        updates.uniform_cycles_since_issue = 0;
        updates.uniform_last_issued_at = new Date().toISOString();
      }

      // Solo actualizar si hay cambios relevantes más allá de volunteer_id y updated_at
      if (Object.keys(updates).length > 2) {
        if (existingStatus) {
          await supabaseService
            .from("volunteer_gear_status")
            .update(updates as unknown as never)
            .eq("volunteer_id", volunteer_id);
        } else {
          // Establecer valores por defecto para un nuevo registro
          await supabaseService.from("volunteer_gear_status").insert({
            ...updates,
            has_lanyard: updates.has_lanyard ?? false,
            has_id_card: updates.has_id_card ?? false,
            uniform_cycles_since_issue: updates.uniform_cycles_since_issue ?? 0,
          } as unknown as never);
        }
      }

      // Decrementar stock del item
      // Cast temporal por RPC no definido en tipos
      const { error: stockError } = await (supabaseService.rpc as Function)("decrement_inventory_stock", {
        p_item_id: item_id,
        p_quantity: quantity || 1,
      });

      // Si no existe el RPC, ignorar (el stock no se decrementa si falta la función)
      if (stockError) {
        console.warn("[inventario/deliveries] RPC decrement_inventory_stock no disponible");
      }
    }

    return NextResponse.json({ data: delivery }, { status: 201 });
  } catch (err) {
    console.error("Error registrando entrega:", err);
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 });
  }
}
