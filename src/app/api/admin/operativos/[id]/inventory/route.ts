import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRoute } from "@/lib/supabaseRoute";
import { simulateOperativoDelivery, executeOperativoDelivery } from "@/lib/inventario/massiveDelivery";

/**
 * POST /api/admin/operativos/[id]/inventory
 * 
 * Endpoint para simular o ejecutar entrega masiva de inventario a voluntarios confirmados.
 * 
 * Body:
 * - mode: "simulate" | "execute"
 * 
 * Headers:
 * - Authorization: Bearer <token> (admin session)
 * 
 * Response:
 * - mode=simulate: DeliverySimulation
 * - mode=execute: DeliveryExecutionResult
 */

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseRoute();
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const params = await context.params;
  const operativo_id = params.id;

  if (!operativo_id) {
    return NextResponse.json({ error: "ID de operativo requerido" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { mode } = body as { mode: "simulate" | "execute" };

    if (!mode || !["simulate", "execute"].includes(mode)) {
      return NextResponse.json(
        { error: "Modo inválido. Usar 'simulate' o 'execute'" },
        { status: 400 }
      );
    }

    if (mode === "simulate") {
      const simulation = await simulateOperativoDelivery(supabase, operativo_id);
      return NextResponse.json(simulation, { status: 200 });
    }

    if (mode === "execute") {
      const result = await executeOperativoDelivery(supabase, operativo_id, user.email || "admin");
      
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ error: "Modo no implementado" }, { status: 400 });
  } catch (error: any) {
    console.error("[inventory/route] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar entrega de inventario" },
      { status: 500 }
    );
  }
}
