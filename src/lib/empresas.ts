import { Database } from "@/lib/database.types";

export type EmpresaProductoRow = Database["public"]["Tables"]["empresa_productos"]["Row"];
export type EmpresaProductoInsert = Database["public"]["Tables"]["empresa_productos"]["Insert"];
export type EmpresaProductoCategoria = Database["public"]["Enums"]["empresa_producto_categoria"];
export type EmpresaPackItemRow = Database["public"]["Tables"]["empresa_pack_items"]["Row"];
export type EmpresaPackItemInsert = Database["public"]["Tables"]["empresa_pack_items"]["Insert"];

export const EMPRESA_PRODUCTO_CATEGORIA_LABELS: Record<EmpresaProductoCategoria, string> = {
  tunnel_educativo: "Túnel educativo",
  operativo_especialidades: "Operativo de especialidades",
  operativo_quirurgico: "Operativo quirúrgico",
  jornada_actualizacion: "Jornada de actualización",
  pack: "Pack integral",
};
