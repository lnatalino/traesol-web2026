import type { Database } from "@/lib/database.types";

// Heads-up: future inventory forms should keep reusing `toSlug` from `@/lib/slug`
// to normalize slugs once the UI is in place.

type InventarioCategoriaRow = Database["public"]["Tables"]["inventario_categorias"]["Row"];
type InventarioItemRow = Database["public"]["Tables"]["inventario_items"]["Row"];
type LanyardTypeRow = Database["public"]["Tables"]["lanyard_types"]["Row"];
type VolunteerGearStatusRow = Database["public"]["Tables"]["volunteer_gear_status"]["Row"];
type InventoryDeliveryRow = Database["public"]["Tables"]["inventory_deliveries"]["Row"];

export const INVENTARIO_TIPO_REGLA = {
  UNIFORME: "UNIFORME",
  LANYARD: "LANYARD",
  CREDENCIAL: "CREDENCIAL",
  GENERICA: "GENERICA",
} as const;

export type InventarioTipoRegla = keyof typeof INVENTARIO_TIPO_REGLA;
export type InventarioTipoReglaValue = (typeof INVENTARIO_TIPO_REGLA)[InventarioTipoRegla];

export const INVENTARIO_TIPO_REGLA_LABELS: Record<InventarioTipoReglaValue, string> = {
  [INVENTARIO_TIPO_REGLA.UNIFORME]: "Uniforme",
  [INVENTARIO_TIPO_REGLA.LANYARD]: "Lanyard",
  [INVENTARIO_TIPO_REGLA.CREDENCIAL]: "Credencial",
  [INVENTARIO_TIPO_REGLA.GENERICA]: "Genérico",
};

export type InventarioCategoria = InventarioCategoriaRow;

export type InventarioCategoriaOption = Pick<InventarioCategoria, "id" | "nombre" | "slug">;

export type InventarioItemListRow = InventarioItem & {
  categoria_nombre: string | null;
};

export type InventarioItem = Omit<InventarioItemRow, "tipo_regla"> & {
  tipo_regla: InventarioTipoReglaValue | null;
};

// Lanyard Types
export type LanyardType = LanyardTypeRow;

export type LanyardTypeOption = Pick<LanyardType, "id" | "name" | "slug" | "ribbon_color_name" | "ribbon_hex">;

// Volunteer Gear Status
export type VolunteerGearStatus = VolunteerGearStatusRow;

// Inventory Deliveries
export type InventoryDelivery = InventoryDeliveryRow;

export type DeliveryWithDetails = InventoryDelivery & {
  voluntario?: {
    id: string;
    nombres: string | null;
    apellidos: string | null;
    email: string | null;
  };
  operativo?: {
    id: string;
    titulo: string | null;
    slug: string | null;
  };
  item?: {
    id: string;
    nombre: string;
    slug: string;
    tipo_regla: string | null;
  };
};
