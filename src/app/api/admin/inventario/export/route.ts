import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "stock";

  try {
    if (type === "stock") {
      return await exportStock();
    } else if (type === "deliveries") {
      const startDate = searchParams.get("start_date");
      const endDate = searchParams.get("end_date");
      const operativoId = searchParams.get("operativo_id");
      return await exportDeliveries(startDate, endDate, operativoId);
    }

    return NextResponse.json({ error: "Tipo de exportación no válido" }, { status: 400 });
  } catch (err) {
    console.error("Error exportando:", err);
    return NextResponse.json(
      { error: "Error al exportar datos" },
      { status: 500 }
    );
  }
}

async function exportStock() {
  const { data, error } = await supabaseService
    .from("inventario_items")
    .select(`
      id,
      nombre,
      slug,
      descripcion,
      tipo_regla,
      variante,
      cantidad_actual,
      stock_reservado,
      umbral_reorden,
      unidad,
      activo,
      inventario_categorias:categoria_id(nombre),
      lanyard_type:lanyard_type_id(name, ribbon_color_name)
    `)
    .order("nombre");

  if (error) {
    throw error;
  }

  // Generar CSV
  const headers = [
    "ID",
    "Nombre",
    "Slug",
    "Categoría",
    "Tipo",
    "Variante",
    "Lanyard Tema",
    "Stock Disponible",
    "Stock Reservado",
    "Umbral Reorden",
    "Unidad",
    "Activo",
    "Descripción",
  ];

  const rows = (data ?? []).map((item: any) => [
    item.id,
    item.nombre,
    item.slug,
    item.inventario_categorias?.nombre || "",
    item.tipo_regla || "",
    item.variante || "",
    item.lanyard_type?.name || "",
    item.cantidad_actual || 0,
    item.stock_reservado || 0,
    item.umbral_reorden || 0,
    item.unidad || "",
    item.activo ? "Sí" : "No",
    item.descripcion || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventario_stock_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

async function exportDeliveries(
  startDate: string | null,
  endDate: string | null,
  operativoId: string | null
) {
  let query = supabaseService
    .from("inventory_deliveries")
    .select(`
      id,
      created_at,
      quantity,
      notes,
      voluntarios:volunteer_id(nombres, apellidos, email, rut),
      operativos:operativo_id(titulo),
      inventario_items:item_id(nombre, tipo_regla)
    `)
    .order("created_at", { ascending: false });

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }
  if (operativoId) {
    query = query.eq("operativo_id", operativoId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Generar CSV
  const headers = [
    "ID",
    "Fecha",
    "Voluntario RUT",
    "Voluntario Nombre",
    "Voluntario Email",
    "Item",
    "Tipo",
    "Cantidad",
    "Operativo",
    "Notas",
  ];

  const rows = (data ?? []).map((delivery: any) => [
    delivery.id,
    new Date(delivery.created_at).toLocaleDateString("es-CL"),
    delivery.voluntarios?.rut || "",
    `${delivery.voluntarios?.nombres || ""} ${delivery.voluntarios?.apellidos || ""}`.trim(),
    delivery.voluntarios?.email || "",
    delivery.inventario_items?.nombre || "",
    delivery.inventario_items?.tipo_regla || "",
    delivery.quantity || 1,
    delivery.operativos?.titulo || "",
    delivery.notes || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = operativoId
    ? `entregas_operativo_${new Date().toISOString().split("T")[0]}.csv`
    : `entregas_inventario_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
