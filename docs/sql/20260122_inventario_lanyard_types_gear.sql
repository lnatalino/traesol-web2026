-- 20260122_inventario_lanyard_types_gear.sql
-- Extensión del módulo de inventario para soportar:
-- 1) Tipos de lanyard por tema/cáncer
-- 2) Estado de equipamiento por voluntario
-- 3) Historial de entregas auditado
-- 4) Tema de lanyard asociado a operativos

BEGIN;

-- ============================================================================
-- 1) TABLA: lanyard_types (catálogo de tipos de lanyard por tema/cáncer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lanyard_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ribbon_color_name TEXT NOT NULL, -- Nombre del color (ej: "Rosado")
  ribbon_hex TEXT, -- Color hex opcional (ej: "#ec4899")
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para lanyard_types
ALTER TABLE public.lanyard_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lanyard_types' AND policyname = 'lanyard_types_public_read'
  ) THEN
    CREATE POLICY "lanyard_types_public_read" ON public.lanyard_types FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lanyard_types' AND policyname = 'lanyard_types_admin_all'
  ) THEN
    CREATE POLICY "lanyard_types_admin_all" ON public.lanyard_types
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Insertar tipos de lanyard iniciales (si no existen)
INSERT INTO public.lanyard_types (name, slug, ribbon_color_name, ribbon_hex, description, display_order)
VALUES
  ('Cáncer de mama', 'mama', 'Rosado', '#ec4899', 'Cinta rosada - concientización cáncer de mama', 1),
  ('Cáncer de próstata', 'prostata', 'Celeste', '#38bdf8', 'Cinta celeste - concientización cáncer de próstata', 2),
  ('Cáncer cervicouterino', 'cervicouterino', 'Teal', '#14b8a6', 'Cinta teal - concientización cáncer cervicouterino', 3),
  ('Cáncer de pulmón', 'pulmon', 'Blanco', '#f8fafc', 'Cinta blanca - concientización cáncer de pulmón', 4),
  ('Melanoma / Piel', 'melanoma', 'Negro', '#1e293b', 'Cinta negra - concientización melanoma', 5),
  ('Genérico / Sin tema', 'generico', 'Azul Traesol', '#0b4dbf', 'Lanyard genérico de Traesol', 0)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2) OPERATIVOS: agregar campo para tema de lanyard
-- ============================================================================
ALTER TABLE public.operativos 
  ADD COLUMN IF NOT EXISTS lanyard_type_id UUID REFERENCES public.lanyard_types(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.operativos.lanyard_type_id IS 'Tema de lanyard sugerido para este operativo (determina color de cinta)';

-- ============================================================================
-- 3) INVENTARIO_ITEMS: agregar referencia a lanyard_type para items temáticos
-- ============================================================================
ALTER TABLE public.inventario_items
  ADD COLUMN IF NOT EXISTS lanyard_type_id UUID REFERENCES public.lanyard_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variante TEXT, -- Para tallas u otras variantes
  ADD COLUMN IF NOT EXISTS stock_reservado INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS umbral_reorden INTEGER DEFAULT 0;

COMMENT ON COLUMN public.inventario_items.lanyard_type_id IS 'Para lanyards temáticos, referencia al tipo/color';
COMMENT ON COLUMN public.inventario_items.variante IS 'Variante del item (ej: talla S, M, L, XL)';
COMMENT ON COLUMN public.inventario_items.stock_reservado IS 'Stock reservado para operativos pendientes';
COMMENT ON COLUMN public.inventario_items.umbral_reorden IS 'Cantidad mínima antes de alertar reorden';

-- ============================================================================
-- 4) TABLA: volunteer_gear_status (estado de equipamiento por voluntario)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.volunteer_gear_status (
  volunteer_id UUID PRIMARY KEY REFERENCES public.voluntarios(id) ON DELETE CASCADE,
  has_lanyard BOOLEAN NOT NULL DEFAULT FALSE,
  has_id_card BOOLEAN NOT NULL DEFAULT FALSE,
  lanyard_type_id UUID REFERENCES public.lanyard_types(id) ON DELETE SET NULL,
  uniform_cycles_since_issue INTEGER NOT NULL DEFAULT 0,
  uniform_last_issued_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.volunteer_gear_status IS 'Estado actual del equipamiento de cada voluntario';
COMMENT ON COLUMN public.volunteer_gear_status.has_lanyard IS 'Si tiene lanyard entregado';
COMMENT ON COLUMN public.volunteer_gear_status.has_id_card IS 'Si tiene credencial entregada';
COMMENT ON COLUMN public.volunteer_gear_status.lanyard_type_id IS 'Tipo de lanyard actual (si aplica)';
COMMENT ON COLUMN public.volunteer_gear_status.uniform_cycles_since_issue IS 'Operativos asistidos desde última entrega de uniforme';
COMMENT ON COLUMN public.volunteer_gear_status.uniform_last_issued_at IS 'Fecha de última entrega de uniforme';

-- RLS para volunteer_gear_status
ALTER TABLE public.volunteer_gear_status ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'volunteer_gear_status' AND policyname = 'gear_status_admin_all'
  ) THEN
    CREATE POLICY "gear_status_admin_all" ON public.volunteer_gear_status
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- 5) TABLA: inventory_deliveries (historial de entregas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES public.voluntarios(id) ON DELETE CASCADE,
  operativo_id UUID REFERENCES public.operativos(id) ON DELETE SET NULL,
  item_id UUID NOT NULL REFERENCES public.inventario_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT -- email del admin que registró
);

COMMENT ON TABLE public.inventory_deliveries IS 'Historial de entregas de items a voluntarios';

-- RLS para inventory_deliveries
ALTER TABLE public.inventory_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_deliveries' AND policyname = 'deliveries_admin_all'
  ) THEN
    CREATE POLICY "deliveries_admin_all" ON public.inventory_deliveries
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_inventory_deliveries_volunteer ON public.inventory_deliveries(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deliveries_operativo ON public.inventory_deliveries(operativo_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deliveries_item ON public.inventory_deliveries(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deliveries_created ON public.inventory_deliveries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventario_items_lanyard_type ON public.inventario_items(lanyard_type_id);
CREATE INDEX IF NOT EXISTS idx_operativos_lanyard_type ON public.operativos(lanyard_type_id);

-- ============================================================================
-- 6) MIGRAR DATOS EXISTENTES: crear gear_status para voluntarios existentes
-- ============================================================================
-- Insertar status para voluntarios que no tienen (con kit base = true por defecto)
INSERT INTO public.volunteer_gear_status (
  volunteer_id,
  has_lanyard,
  has_id_card,
  uniform_cycles_since_issue,
  uniform_last_issued_at
)
SELECT 
  v.id,
  TRUE, -- has_lanyard por defecto
  TRUE, -- has_id_card por defecto
  COALESCE(v.operativos_asistidos, 0) % 5, -- ciclos desde última entrega
  v.ultima_entrega_uniforme_en
FROM public.voluntarios v
WHERE NOT EXISTS (
  SELECT 1 FROM public.volunteer_gear_status g WHERE g.volunteer_id = v.id
);

-- ============================================================================
-- 7) INSERTAR ITEMS DE INVENTARIO BASE (si no existen)
-- ============================================================================
-- Asegurar que existe la categoría "Kit voluntario"
INSERT INTO public.inventario_categorias (nombre, slug, descripcion)
VALUES ('Kit voluntario', 'kit-voluntario', 'Items del kit base de voluntarios')
ON CONFLICT (slug) DO NOTHING;

-- Insertar items base con los slugs esperados
INSERT INTO public.inventario_items (nombre, slug, categoria_id, tipo_regla, descripcion, unidad, cantidad_actual)
SELECT 
  'Lanyard genérico',
  'lanyard-voluntario',
  c.id,
  'LANYARD',
  'Porta credencial genérico de Traesol',
  'unidad',
  0
FROM public.inventario_categorias c WHERE c.slug = 'kit-voluntario'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.inventario_items (nombre, slug, categoria_id, tipo_regla, descripcion, unidad, cantidad_actual)
SELECT 
  'Credencial/Tarjeta ID',
  'credencial-voluntario',
  c.id,
  'CREDENCIAL',
  'Tarjeta de identificación de voluntario',
  'unidad',
  0
FROM public.inventario_categorias c WHERE c.slug = 'kit-voluntario'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.inventario_items (nombre, slug, categoria_id, tipo_regla, descripcion, unidad, cantidad_actual)
SELECT 
  'Uniforme completo',
  'uniforme-voluntario',
  c.id,
  'UNIFORME',
  'Set polera + pantalón voluntario',
  'set',
  0
FROM public.inventario_categorias c WHERE c.slug = 'kit-voluntario'
ON CONFLICT (slug) DO NOTHING;

-- Crear items de lanyard por cada tipo temático
INSERT INTO public.inventario_items (nombre, slug, categoria_id, tipo_regla, lanyard_type_id, descripcion, unidad, cantidad_actual)
SELECT 
  'Lanyard ' || lt.name,
  'lanyard-' || lt.slug,
  c.id,
  'LANYARD',
  lt.id,
  'Porta credencial color ' || lt.ribbon_color_name || ' - ' || lt.name,
  'unidad',
  0
FROM public.lanyard_types lt
CROSS JOIN public.inventario_categorias c 
WHERE c.slug = 'kit-voluntario'
  AND lt.slug != 'generico'
ON CONFLICT (slug) DO NOTHING;

COMMIT;
