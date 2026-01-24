import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { volunteer_id, operativo_id, notes } = body;

    if (!volunteer_id) {
      return NextResponse.json({ error: "volunteer_id es requerido" }, { status: 400 });
    }

    // Buscar items de uniforme (polera y pantalón)
    // Cast temporal porque inventario_items puede no estar en tipos generados
    const { data: uniformItems, error: itemsError } = await supabaseService
      .from("inventario_items")
      .select("id, nombre, slug, tipo_regla")
      .eq("tipo_regla", "UNIFORME")
      .eq("activo", true)
      .limit(2) as { data: Array<{ id: string; nombre: string; slug: string; tipo_regla: string }> | null; error: unknown };

    if (itemsError || !uniformItems || uniformItems.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron items de uniforme en inventario" },
        { status: 400 }
      );
    }

    // Registrar entregas para cada item de uniforme
    const deliveries: any[] = [];
    for (const item of uniformItems) {
      const { data: delivery, error: deliveryError } = await supabaseService
        .from("inventory_deliveries")
        .insert({
          volunteer_id,
          operativo_id: operativo_id || null,
          item_id: item.id,
          quantity: 1,
          notes: notes || null,
          created_by: session.email,
        } as any)
        .select()
        .single();

      if (deliveryError) {
        console.error("Error registrando entrega:", deliveryError);
        continue;
      }

      deliveries.push(delivery);

      // Decrementar stock
      await (supabaseService as any).rpc("decrement_inventory_stock", {
        p_item_id: item.id,
        p_quantity: 1,
      });
    }

    // Actualizar gear_status: resetear contador y fecha
    const { error: gearUpdateError } = await supabaseService
      .from("volunteer_gear_status")
      .upsert({
        volunteer_id,
        uniform_cycles_since_issue: 0,
        uniform_last_issued_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

    if (gearUpdateError) {
      console.error("Error actualizando gear_status:", gearUpdateError);
    }

    return NextResponse.json({
      success: true,
      data: deliveries,
      message: "Entrega de uniforme registrada correctamente",
    });
  } catch (err) {
    console.error("Error registrando uniforme:", err);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
