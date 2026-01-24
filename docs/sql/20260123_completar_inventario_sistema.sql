-- 20260123_completar_inventario_sistema.sql
-- Completa el sistema de inventario con funcionalidad de decrementar stock
-- y trigger para incrementar ciclos de uniforme al confirmar asistencia
--
-- IMPORTANTE: Este script es AUTOSUFICIENTE y puede ejecutarse en una base vacía.
-- Crea TODAS las dependencias necesarias usando IF NOT EXISTS.
--
-- PREREQUISITOS MÍNIMOS:
-- - Tabla voluntarios debe existir
-- - Tabla inscripciones debe existir
-- - Tabla inventario_items debe existir
-- - Tabla operativos debe existir
--
-- ORDEN DE EJECUCIÓN INTERNO:
-- 1) lanyard_types (catálogo de temas)
-- 2) volunteer_gear_status (depende de lanyard_types)
-- 3) inventory_deliveries
-- 4) Funciones RPC
-- 5) Triggers
-- 6) Migración de datos
-- 7) Vistas y optimizaciones

BEGIN;

-- ============================================================================
-- 1) CREAR TABLA lanyard_types (tipos de lanyard por tema/cáncer)
-- ============================================================================
-- Debe existir ANTES de volunteer_gear_status porque es FK

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

COMMENT ON TABLE public.lanyard_types IS 'Catálogo de tipos de lanyard por tema/cáncer con colores de cinta';
COMMENT ON COLUMN public.lanyard_types.ribbon_color_name IS 'Nombre descriptivo del color (ej: Rosado)';
COMMENT ON COLUMN public.lanyard_types.ribbon_hex IS 'Código hexadecimal del color';

-- RLS para lanyard_types (lectura pública, escritura admin)
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

-- Insertar tipos de lanyard por defecto (SOLO los 4 tipos reales usados actualmente)
-- IMPORTANTE: NO agregar otros tipos sin consultar con el equipo
INSERT INTO public.lanyard_types (name, slug, ribbon_color_name, ribbon_hex, description, display_order, is_active)
VALUES
  ('Sin cinta / General', 'general', 'Sin color', NULL, 'Lanyard general sin cinta temática', 0, true),
  ('Cáncer de mama', 'cancer_mama', 'Rosado', '#ec4899', 'Cinta rosada - concientización cáncer de mama', 1, true),
  ('Cáncer de piel', 'cancer_piel', 'Naranja', '#f97316', 'Cinta naranja - concientización cáncer de piel', 2, true),
  ('Cáncer cérvico-uterino', 'cancer_cervicouterino', 'Verde agua', '#14b8a6', 'Cinta verde agua (teal) - concientización cáncer cérvico-uterino', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2) CREAR TABLA volunteer_gear_status (estado de equipamiento por voluntario)
-- ============================================================================
-- AHORA SÍ podemos referenciar lanyard_types como FK

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

-- Habilitar RLS
ALTER TABLE public.volunteer_gear_status ENABLE ROW LEVEL SECURITY;

-- Crear policy si no existe
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
-- 3) CREAR TABLA inventory_deliveries (historial de entregas)
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

-- Habilitar RLS
ALTER TABLE public.inventory_deliveries ENABLE ROW LEVEL SECURITY;

-- Crear policy si no existe
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

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_inventory_deliveries_volunteer ON public.inventory_deliveries(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deliveries_operativo ON public.inventory_deliveries(operativo_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deliveries_item ON public.inventory_deliveries(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deliveries_created ON public.inventory_deliveries(created_at DESC);

-- ============================================================================
-- 4) AGREGAR COLUMNAS A TABLAS EXISTENTES (si no existen)
-- ============================================================================

-- Agregar lanyard_type_id a operativos (para tema del operativo)
ALTER TABLE public.operativos 
  ADD COLUMN IF NOT EXISTS lanyard_type_id UUID REFERENCES public.lanyard_types(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.operativos.lanyard_type_id IS 'Tema de lanyard sugerido para este operativo (determina color de cinta)';

-- Agregar columnas a inventario_items (para variantes y control de stock)
ALTER TABLE public.inventario_items
  ADD COLUMN IF NOT EXISTS lanyard_type_id UUID REFERENCES public.lanyard_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variante TEXT,
  ADD COLUMN IF NOT EXISTS stock_reservado INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS umbral_reorden INTEGER DEFAULT 0;

COMMENT ON COLUMN public.inventario_items.lanyard_type_id IS 'Para lanyards temáticos, referencia al tipo/color';
COMMENT ON COLUMN public.inventario_items.variante IS 'Variante del item (ej: talla S, M, L, XL)';
COMMENT ON COLUMN public.inventario_items.stock_reservado IS 'Stock reservado para operativos pendientes';
COMMENT ON COLUMN public.inventario_items.umbral_reorden IS 'Cantidad mínima antes de alertar reorden';

-- ============================================================================
-- 5) FUNCIÓN RPC: Decrementar stock de manera atómica
-- ============================================================================
CREATE OR REPLACE FUNCTION public.decrement_inventory_stock(
  p_item_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inventario_items
  SET cantidad_actual = GREATEST(cantidad_actual - p_quantity, 0)
  WHERE id = p_item_id;
END;
$$;

COMMENT ON FUNCTION public.decrement_inventory_stock IS 'Decrementa el stock de un item de inventario de forma segura';

-- ============================================================================
-- 6) FUNCIÓN Y TRIGGER: Incrementar uniform_cycles_since_issue al asistir
-- ============================================================================

-- Función que se ejecuta cuando una inscripción cambia a "asistio"
CREATE OR REPLACE FUNCTION public.increment_uniform_cycle_on_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo procesar si el estado cambió a "asistio"
  IF NEW.estado = 'asistio' AND (OLD.estado IS NULL OR OLD.estado != 'asistio') THEN
    
    -- Verificar si existe gear_status para este voluntario
    IF EXISTS (
      SELECT 1 FROM public.volunteer_gear_status 
      WHERE volunteer_id = NEW.voluntario_id
    ) THEN
      -- Incrementar el contador de ciclos
      UPDATE public.volunteer_gear_status
      SET 
        uniform_cycles_since_issue = uniform_cycles_since_issue + 1,
        updated_at = NOW()
      WHERE volunteer_id = NEW.voluntario_id;
    ELSE
      -- Crear registro si no existe (con ciclo en 1 porque ya asistió)
      INSERT INTO public.volunteer_gear_status (
        volunteer_id,
        has_lanyard,
        has_id_card,
        uniform_cycles_since_issue
      ) VALUES (
        NEW.voluntario_id,
        TRUE, -- Por defecto tiene kit base
        TRUE,
        1     -- Primera asistencia
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.increment_uniform_cycle_on_attendance IS 
  'Incrementa el contador de operativos desde última entrega de uniforme cuando un voluntario asiste';

-- Crear trigger en tabla inscripciones
DROP TRIGGER IF EXISTS trigger_increment_uniform_cycle ON public.inscripciones;

CREATE TRIGGER trigger_increment_uniform_cycle
  AFTER INSERT OR UPDATE OF estado
  ON public.inscripciones
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_uniform_cycle_on_attendance();

COMMENT ON TRIGGER trigger_increment_uniform_cycle ON public.inscripciones IS 
  'Trigger que incrementa ciclos de uniforme cuando voluntario asiste a operativo';

-- ============================================================================
-- 7) MIGRACIÓN DE DATOS: Crear gear_status para voluntarios existentes
-- ============================================================================

-- Insertar gear_status para voluntarios que no lo tienen
-- (Se ejecuta de forma idempotente)
INSERT INTO public.volunteer_gear_status (
  volunteer_id,
  has_lanyard,
  has_id_card,
  uniform_cycles_since_issue,
  uniform_last_issued_at,
  notes
)
SELECT 
  v.id,
  TRUE, -- Por defecto tienen kit base
  TRUE,
  -- Calcular ciclos actuales basado en operativos_asistidos y uniformes_entregados
  CASE 
    WHEN v.uniformes_entregados > 0 THEN 
      COALESCE(v.operativos_asistidos, 0) % 5
    ELSE 
      COALESCE(v.operativos_asistidos, 0)
  END,
  v.ultima_entrega_uniforme_en,
  v.nota_inventario
FROM public.voluntarios v
WHERE NOT EXISTS (
  SELECT 1 FROM public.volunteer_gear_status g 
  WHERE g.volunteer_id = v.id
)
ON CONFLICT (volunteer_id) DO NOTHING;

-- ============================================================================
-- 8) VISTA AUXILIAR: Resumen de entregas recientes por voluntario
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_volunteer_recent_deliveries AS
SELECT 
  d.volunteer_id,
  v.nombres,
  v.apellidos,
  v.email,
  d.id AS delivery_id,
  d.item_id,
  i.nombre AS item_name,
  i.tipo_regla,
  d.quantity,
  d.operativo_id,
  o.titulo AS operativo_titulo,
  d.notes,
  d.created_at,
  d.created_by
FROM public.inventory_deliveries d
INNER JOIN public.voluntarios v ON v.id = d.volunteer_id
INNER JOIN public.inventario_items i ON i.id = d.item_id
LEFT JOIN public.operativos o ON o.id = d.operativo_id
ORDER BY d.created_at DESC;

COMMENT ON VIEW public.vw_volunteer_recent_deliveries IS 
  'Vista con historial de entregas de inventario por voluntario';

-- ============================================================================
-- 9) ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_volunteer_gear_status_cycles 
  ON public.volunteer_gear_status(uniform_cycles_since_issue) 
  WHERE uniform_cycles_since_issue >= 5;

CREATE INDEX IF NOT EXISTS idx_lanyard_types_slug 
  ON public.lanyard_types(slug);

CREATE INDEX IF NOT EXISTS idx_lanyard_types_active 
  ON public.lanyard_types(is_active, display_order) 
  WHERE is_active = TRUE;

COMMENT ON INDEX idx_volunteer_gear_status_cycles IS 
  'Índice para encontrar rápidamente voluntarios que necesitan renovación de uniforme';

COMMENT ON INDEX idx_lanyard_types_active IS 
  'Índice para queries de lanyards activos ordenados por display_order';

-- ============================================================================
-- 10) VERIFICACIÓN FINAL
-- ============================================================================
-- Mostrar resumen de tablas creadas/verificadas

DO $$
DECLARE
  lanyard_types_count INTEGER;
  gear_status_count INTEGER;
  deliveries_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO lanyard_types_count FROM public.lanyard_types;
  SELECT COUNT(*) INTO gear_status_count FROM public.volunteer_gear_status;
  SELECT COUNT(*) INTO deliveries_count FROM public.inventory_deliveries;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TABLAS CREADAS/VERIFICADAS:';
  RAISE NOTICE '  → lanyard_types: % registros (4 tipos reales: general, mama, piel, cérvico-uterino)', lanyard_types_count;
  RAISE NOTICE '  → volunteer_gear_status: % registros', gear_status_count;
  RAISE NOTICE '  → inventory_deliveries: % registros', deliveries_count;
  RAISE NOTICE '';
  RAISE NOTICE 'FUNCIONES CREADAS:';
  RAISE NOTICE '  → decrement_inventory_stock()';
  RAISE NOTICE '  → increment_uniform_cycle_on_attendance()';
  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGERS ACTIVOS:';
  RAISE NOTICE '  → trigger_increment_uniform_cycle en inscripciones';
  RAISE NOTICE '';
  RAISE NOTICE 'VISTAS CREADAS:';
  RAISE NOTICE '  → vw_volunteer_recent_deliveries';
  RAISE NOTICE '';
  RAISE NOTICE 'COLUMNAS AGREGADAS:';
  RAISE NOTICE '  → operativos.lanyard_type_id';
  RAISE NOTICE '  → inventario_items.lanyard_type_id, variante, stock_reservado, umbral_reorden';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sistema de inventario listo para usar';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
