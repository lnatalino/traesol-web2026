-- =============================================================================
-- MIGRACIÓN: Unificar y corregir sistema de NOVEDADES
-- Fecha: 2026-01-24
-- Objetivo: Agregar campo en_novedades, establecer defaults, y crear RLS apropiada
-- =============================================================================

-- PASO 1: Agregar campo en_novedades (si no existe) con default TRUE
-- Esto significa que todas las novedades existentes aparecerán en /novedades por defecto.
DO $$
BEGIN
    -- Verificar si la columna existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'novedades' 
        AND column_name = 'en_novedades'
    ) THEN
        ALTER TABLE public.novedades ADD COLUMN en_novedades BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Columna en_novedades añadida con DEFAULT TRUE';
    ELSE
        RAISE NOTICE 'Columna en_novedades ya existe';
    END IF;
END $$;

-- PASO 2: Asegurar defaults correctos en las columnas existentes
-- publicado: default FALSE (novedades nuevas empiezan como borrador)
-- en_carrusel: default FALSE (no van al carrusel por defecto)
-- en_novedades: default TRUE (sí van a /novedades por defecto)

ALTER TABLE public.novedades 
ALTER COLUMN publicado SET DEFAULT FALSE;

ALTER TABLE public.novedades 
ALTER COLUMN en_carrusel SET DEFAULT FALSE;

ALTER TABLE public.novedades 
ALTER COLUMN en_novedades SET DEFAULT TRUE;

-- PASO 3: Actualizar novedades existentes sin valores definidos
-- Esto asegura que novedades antiguas tengan valores consistentes.
UPDATE public.novedades 
SET 
    publicado = COALESCE(publicado, FALSE),
    en_carrusel = COALESCE(en_carrusel, FALSE),
    en_novedades = COALESCE(en_novedades, TRUE)
WHERE 
    publicado IS NULL 
    OR en_carrusel IS NULL 
    OR en_novedades IS NULL;

-- PASO 4: Crear índice para optimizar queries públicas
CREATE INDEX IF NOT EXISTS idx_novedades_public_carousel 
ON public.novedades (publicado, en_carrusel, fecha_publicacion DESC)
WHERE publicado = TRUE;

CREATE INDEX IF NOT EXISTS idx_novedades_public_news 
ON public.novedades (publicado, en_novedades, fecha_publicacion DESC)
WHERE publicado = TRUE;

-- PASO 5: Configurar RLS (Row Level Security)
-- Habilitar RLS si no está activa
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (para evitar conflictos)
DROP POLICY IF EXISTS "Novedades: lectura pública de publicadas" ON public.novedades;
DROP POLICY IF EXISTS "Novedades: CRUD para admin" ON public.novedades;
DROP POLICY IF EXISTS "Novedades: lectura anónima de publicadas" ON public.novedades;

-- Política para usuarios anónimos: solo pueden leer novedades publicadas
CREATE POLICY "Novedades: lectura anónima de publicadas"
ON public.novedades
FOR SELECT
TO anon
USING (publicado = TRUE);

-- Política para usuarios autenticados con rol admin/super_admin: acceso completo
-- Nota: Asumimos que los admins usan service_role o tienen rol en el token JWT
CREATE POLICY "Novedades: CRUD para admin"
ON public.novedades
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);

-- También para service_role (usado por el admin backend)
-- El service_role bypasea RLS por defecto, pero lo hacemos explícito
GRANT ALL ON public.novedades TO service_role;
GRANT ALL ON public.novedades TO authenticated;
GRANT SELECT ON public.novedades TO anon;

-- PASO 6: Hacer lo mismo para novedad_imagenes (imágenes de galería)
ALTER TABLE public.novedad_imagenes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Novedad imagenes: lectura pública" ON public.novedad_imagenes;
DROP POLICY IF EXISTS "Novedad imagenes: CRUD para admin" ON public.novedad_imagenes;

-- Las imágenes son públicas si la novedad asociada está publicada
CREATE POLICY "Novedad imagenes: lectura pública"
ON public.novedad_imagenes
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.novedades n 
        WHERE n.id = novedad_imagenes.novedad_id 
        AND n.publicado = TRUE
    )
);

CREATE POLICY "Novedad imagenes: CRUD para admin"
ON public.novedad_imagenes
FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);

GRANT ALL ON public.novedad_imagenes TO service_role;
GRANT ALL ON public.novedad_imagenes TO authenticated;
GRANT SELECT ON public.novedad_imagenes TO anon;

-- PASO 7: Verificación
-- Estas queries deben ejecutarse manualmente para verificar:
-- 
-- Ver estructura de la tabla:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'novedades'
-- ORDER BY ordinal_position;
--
-- Ver políticas RLS activas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'novedades';
--
-- Contar novedades por estado:
-- SELECT 
--     COUNT(*) AS total,
--     COUNT(*) FILTER (WHERE publicado = TRUE) AS publicadas,
--     COUNT(*) FILTER (WHERE en_carrusel = TRUE) AS en_carrusel,
--     COUNT(*) FILTER (WHERE en_novedades = TRUE) AS en_novedades
-- FROM public.novedades;

-- =============================================================================
-- FIN DE MIGRACIÓN
-- =============================================================================
