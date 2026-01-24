-- Fix Lanyard Type - Verificación de Esquema
-- Fecha: 2026-01-23
-- 
-- Este script verifica y corrige el esquema de volunteer_gear_status
-- para asegurar que usa lanyard_type_id correctamente

-- PASO 1: Verificar columnas actuales de volunteer_gear_status
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'volunteer_gear_status'
ORDER BY ordinal_position;

-- RESULTADO ESPERADO:
-- Debe incluir: lanyard_type_id (uuid, nullable)
-- NO debe incluir: lanyard_type, lanyard_types

-- PASO 2: Verificar Foreign Key a lanyard_types
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'volunteer_gear_status'
  AND tc.constraint_type = 'FOREIGN KEY';

-- RESULTADO ESPERADO:
-- Debe mostrar FK: volunteer_gear_status.lanyard_type_id -> lanyard_types.id

-- PASO 3: Verificar que la tabla lanyard_types existe
SELECT COUNT(*) as lanyard_types_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'lanyard_types';

-- RESULTADO ESPERADO: 1 (la tabla existe)

-- PASO 4: Verificar datos en lanyard_types
SELECT id, name, slug, ribbon_color_name, is_active
FROM public.lanyard_types
ORDER BY display_order;

-- RESULTADO ESPERADO: 4 registros activos
-- - general
-- - cancer_mama
-- - cancer_piel
-- - cancer_cervicouterino

-- ============================================================================
-- SI FALTA LA COLUMNA lanyard_type_id, EJECUTAR ESTA MIGRACION:
-- ============================================================================

-- Descomentar si es necesario:
/*
ALTER TABLE public.volunteer_gear_status
ADD COLUMN IF NOT EXISTS lanyard_type_id uuid NULL;

-- Agregar FK si existe lanyard_types
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='lanyard_types'
  ) THEN
    -- Eliminar constraint si existe (para recrear)
    ALTER TABLE public.volunteer_gear_status
    DROP CONSTRAINT IF EXISTS volunteer_gear_status_lanyard_type_id_fkey;
    
    -- Crear nuevo constraint
    ALTER TABLE public.volunteer_gear_status
    ADD CONSTRAINT volunteer_gear_status_lanyard_type_id_fkey
    FOREIGN KEY (lanyard_type_id) 
    REFERENCES public.lanyard_types(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Verificar que se creó correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='volunteer_gear_status'
  AND column_name = 'lanyard_type_id';
*/

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. La columna correcta es: lanyard_type_id (NO lanyard_type, NO lanyard_types)
-- 2. Los joins en Supabase deben usar: lanyard_type:lanyard_type_id(...)
--    donde "lanyard_type" es el alias del join y "lanyard_type_id" es la columna FK
-- 3. El código TypeScript accede al resultado con: item.lanyard_type (singular)
-- 4. NO usar: lanyard_types (plural) en el acceso al resultado
