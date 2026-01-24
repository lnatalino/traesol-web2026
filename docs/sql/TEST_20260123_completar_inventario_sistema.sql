-- TEST_20260123_completar_inventario_sistema.sql
-- Script de verificación ANTES de ejecutar la migración principal
-- Ejecutar primero este script para validar prerequisitos

-- ============================================================================
-- VERIFICACIÓN DE PREREQUISITOS
-- ============================================================================

DO $$
DECLARE
  tabla_existe BOOLEAN;
  error_msg TEXT := '';
BEGIN
  RAISE NOTICE '=== VERIFICANDO PREREQUISITOS MÍNIMOS ===';
  RAISE NOTICE '';
  
  -- 1. Verificar tabla voluntarios
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'voluntarios'
  ) INTO tabla_existe;
  
  IF tabla_existe THEN
    RAISE NOTICE '✓ Tabla voluntarios existe';
  ELSE
    error_msg := error_msg || '✗ FALTA: Tabla voluntarios' || E'\n';
  END IF;
  
  -- 2. Verificar tabla inscripciones
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inscripciones'
  ) INTO tabla_existe;
  
  IF tabla_existe THEN
    RAISE NOTICE '✓ Tabla inscripciones existe';
  ELSE
    error_msg := error_msg || '✗ FALTA: Tabla inscripciones' || E'\n';
  END IF;
  
  -- 3. Verificar tabla inventario_items
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inventario_items'
  ) INTO tabla_existe;
  
  IF tabla_existe THEN
    RAISE NOTICE '✓ Tabla inventario_items existe';
  ELSE
    error_msg := error_msg || '✗ FALTA: Tabla inventario_items' || E'\n';
  END IF;
  
  -- 4. Verificar tabla operativos
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'operativos'
  ) INTO tabla_existe;
  
  IF tabla_existe THEN
    RAISE NOTICE '✓ Tabla operativos existe';
  ELSE
    error_msg := error_msg || '✗ FALTA: Tabla operativos' || E'\n';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICANDO TABLAS QUE SERÁN CREADAS ===';
  RAISE NOTICE '';
  
  -- 5. Verificar tabla lanyard_types (se crea en el script principal)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'lanyard_types'
  ) INTO tabla_existe;
  
  IF tabla_existe THEN
    RAISE NOTICE '⚠ lanyard_types YA EXISTE (se usará IF NOT EXISTS)';
  ELSE
    RAISE NOTICE '✓ lanyard_types será creada por el script';
  END IF;
  
  -- 6. Verificar columnas en voluntarios
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'voluntarios' 
      AND column_name = 'operativos_asistidos'
  ) THEN
    RAISE NOTICE '✓ Columna voluntarios.operativos_asistidos existe';
  ELSE
    RAISE NOTICE '⚠ ADVERTENCIA: voluntarios.operativos_asistidos no existe (se usará 0 por defecto)';
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'voluntarios' 
      AND column_name = 'uniformes_entregados'
  ) THEN
    RAISE NOTICE '✓ Columna voluntarios.uniformes_entregados existe';
  ELSE
    RAISE NOTICE '⚠ ADVERTENCIA: voluntarios.uniformes_entregados no existe (se usará 0 por defecto)';
  END IF;
  
  -- 7. Verificar si las tablas target ya existen
  RAISE NOTICE '';
  RAISE NOTICE '=== ESTADO ACTUAL ===';
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'volunteer_gear_status'
  ) INTO tabla_existe;
  
  IF tabla_existe THEN
    RAISE NOTICE '⚠ volunteer_gear_status YA EXISTE (se usará IF NOT EXISTS)';
  ELSE
    RAISE NOTICE '✓ volunteer_gear_status será creada';
  END IF;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inventory_deliveries'
  ) INTO tabla_existe;
  
  IF tabla_existe THEN
    RAISE NOTICE '⚠ inventory_deliveries YA EXISTE (se usará IF NOT EXISTS)';
  ELSE
    RAISE NOTICE '✓ inventory_deliveries será creada';
  END IF;
  
  -- Verificar funciones existentes
  IF EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'decrement_inventory_stock' 
      AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE NOTICE '⚠ Función decrement_inventory_stock ya existe (será reemplazada)';
  ELSE
    RAISE NOTICE '✓ Función decrement_inventory_stock será creada';
  END IF;
  
  IF EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'increment_uniform_cycle_on_attendance' 
      AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE NOTICE '⚠ Función increment_uniform_cycle_on_attendance ya existe (será reemplazada)';
  ELSE
    RAISE NOTICE '✓ Función increment_uniform_cycle_on_attendance será creada';
  END IF;
  
  -- Resultado final
  RAISE NOTICE '';
  IF error_msg != '' THEN
    RAISE NOTICE '=== ERRORES ENCONTRADOS ===';
    RAISE NOTICE '%', error_msg;
    RAISE EXCEPTION 'NO EJECUTAR LA MIGRACIÓN: Faltan tablas prerequisito';
  ELSE
    RAISE NOTICE '=== ✓ LISTO PARA EJECUTAR MIGRACIÓN ===';
    RAISE NOTICE 'Todos los prerequisitos están OK';
  END IF;
END $$;
