-- =====================================================
-- REESTRUCTURACIÓN MÓDULO QUIRÚRGICO COMPLETO
-- 20260124 - Traesol Web
-- =====================================================
-- CAMBIOS PRINCIPALES:
-- 1. Agregar campos faltantes a operativos_quirurgicos (publicado, estado mejorado)
-- 2. Migrar quirurgico_pacientes a nueva tabla "pacientes"
-- 3. Crear tablas: paciente_contactos, paciente_requerimientos, paciente_archivos
-- 4. Crear tabla paciente_portal_tokens para tokens seguros (hash)
-- 5. Crear tabla postulaciones_equipo_quirurgico para equipo clínico
-- 6. Agregar RLS a todas las tablas de pacientes
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ACTUALIZAR operativos_quirurgicos
-- =====================================================

-- Agregar columnas si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'operativos_quirurgicos' AND column_name = 'publicado') THEN
    ALTER TABLE public.operativos_quirurgicos ADD COLUMN publicado boolean NOT NULL DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'operativos_quirurgicos' AND column_name = 'ciudad') THEN
    ALTER TABLE public.operativos_quirurgicos ADD COLUMN ciudad text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'operativos_quirurgicos' AND column_name = 'lugar') THEN
    ALTER TABLE public.operativos_quirurgicos ADD COLUMN lugar text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'operativos_quirurgicos' AND column_name = 'imagen_cabecera_url') THEN
    ALTER TABLE public.operativos_quirurgicos ADD COLUMN imagen_cabecera_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'operativos_quirurgicos' AND column_name = 'updated_at') THEN
    ALTER TABLE public.operativos_quirurgicos ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END;
$$;

-- Actualizar columna estado para usar enum type
-- Estados: draft, publicado, cerrado, finalizado
COMMENT ON COLUMN public.operativos_quirurgicos.estado IS 
  'Estados: draft (borrador), publicado (visible público), cerrado (no acepta postulaciones), finalizado';

-- =====================================================
-- 2. CREAR NUEVA TABLA "pacientes" (más limpia)
-- =====================================================
-- Nota: Mantenemos quirurgico_pacientes existente para no romper nada.
-- Gradualmente migraremos a esta nueva estructura.

CREATE TABLE IF NOT EXISTS public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operativo_quirurgico_id uuid REFERENCES public.operativos_quirurgicos(id) ON DELETE SET NULL,
  
  -- Datos personales
  rut text,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  fecha_nacimiento date,
  genero text, -- M, F, Otro
  
  -- Contacto
  telefono text,
  email text,
  direccion text,
  ciudad_origen text,
  
  -- Médico
  diagnostico text,
  cirugia_planificada text,
  fecha_cirugia date,
  hora_cirugia time,
  alta_hospitalaria_estimada date,
  
  -- Logística
  requiere_vuelo boolean DEFAULT false,
  requiere_hospedaje boolean DEFAULT false,
  fecha_llegada_ciudad date,
  fecha_regreso_ciudad date,
  
  -- Admin
  notes_admin text,
  estado text DEFAULT 'activo', -- activo, operado, alta, cancelado
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.pacientes ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS pacientes_operativo_idx ON public.pacientes(operativo_quirurgico_id);
CREATE INDEX IF NOT EXISTS pacientes_rut_idx ON public.pacientes(rut);
CREATE INDEX IF NOT EXISTS pacientes_estado_idx ON public.pacientes(estado);

-- =====================================================
-- 3. CONTACTOS DE EMERGENCIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.paciente_contactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  relacion text, -- Madre, Padre, Hermano, Cónyuge, etc.
  telefono text NOT NULL,
  email text,
  es_principal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.paciente_contactos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS paciente_contactos_paciente_idx ON public.paciente_contactos(paciente_id);

-- =====================================================
-- 4. REQUERIMIENTOS (exámenes, documentos)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.paciente_requerimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  titulo text NOT NULL, -- Ej: "Hemograma", "ECG", "Radiografía de tórax"
  descripcion text,
  tipo text DEFAULT 'examen', -- examen, documento, consentimiento
  estado text DEFAULT 'pendiente', -- pendiente, recibido, aprobado, rechazado
  fecha_limite date,
  notas_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.paciente_requerimientos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS paciente_requerimientos_paciente_idx ON public.paciente_requerimientos(paciente_id);
CREATE INDEX IF NOT EXISTS paciente_requerimientos_estado_idx ON public.paciente_requerimientos(estado);

-- =====================================================
-- 5. ARCHIVOS SUBIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.paciente_archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  requerimiento_id uuid REFERENCES public.paciente_requerimientos(id) ON DELETE SET NULL,
  
  storage_path text NOT NULL, -- Ruta en Supabase Storage
  filename text NOT NULL,
  mimetype text,
  size_bytes integer,
  
  uploaded_by text DEFAULT 'paciente', -- paciente, admin
  notas text,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.paciente_archivos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS paciente_archivos_paciente_idx ON public.paciente_archivos(paciente_id);
CREATE INDEX IF NOT EXISTS paciente_archivos_requerimiento_idx ON public.paciente_archivos(requerimiento_id);

-- =====================================================
-- 6. TOKENS DE PORTAL (seguros con hash)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.paciente_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL UNIQUE REFERENCES public.pacientes(id) ON DELETE CASCADE,
  
  -- El token NUNCA se guarda en plano, solo el hash
  token_hash text NOT NULL,
  
  -- Control de acceso
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text -- admin user id o 'system'
);

ALTER TABLE IF EXISTS public.paciente_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS paciente_portal_tokens_hash_idx ON public.paciente_portal_tokens(token_hash);
CREATE INDEX IF NOT EXISTS paciente_portal_tokens_expires_idx ON public.paciente_portal_tokens(expires_at);

-- =====================================================
-- 7. POSTULACIONES EQUIPO CLÍNICO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.postulaciones_equipo_quirurgico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operativo_quirurgico_id uuid NOT NULL REFERENCES public.operativos_quirurgicos(id) ON DELETE CASCADE,
  
  -- Datos personales
  nombres text NOT NULL,
  apellidos text NOT NULL,
  rut text,
  email text NOT NULL,
  telefono text,
  
  -- Profesión
  profesion text NOT NULL, -- Médico, Enfermera, Kinesiólogo, Tens, etc.
  especialidad text,
  registro_superint text, -- Registro Superintendencia de Salud
  anos_experiencia integer,
  
  -- Experiencia quirúrgica
  experiencia_pabellon text,
  certificaciones text,
  
  -- Disponibilidad
  disponibilidad_completa boolean DEFAULT true,
  notas_disponibilidad text,
  
  -- Admin
  estado text DEFAULT 'pendiente', -- pendiente, aprobado, rechazado, confirmado
  notas_admin text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.postulaciones_equipo_quirurgico ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS postulaciones_equipo_operativo_idx ON public.postulaciones_equipo_quirurgico(operativo_quirurgico_id);
CREATE INDEX IF NOT EXISTS postulaciones_equipo_estado_idx ON public.postulaciones_equipo_quirurgico(estado);
CREATE INDEX IF NOT EXISTS postulaciones_equipo_email_idx ON public.postulaciones_equipo_quirurgico(email);

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- PACIENTES: Solo service_role puede CRUD
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes' AND policyname = 'pacientes_service_all') THEN
    CREATE POLICY pacientes_service_all ON public.pacientes
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;

-- PACIENTE_CONTACTOS: Solo service_role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paciente_contactos' AND policyname = 'paciente_contactos_service_all') THEN
    CREATE POLICY paciente_contactos_service_all ON public.paciente_contactos
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;

-- PACIENTE_REQUERIMIENTOS: Solo service_role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paciente_requerimientos' AND policyname = 'paciente_requerimientos_service_all') THEN
    CREATE POLICY paciente_requerimientos_service_all ON public.paciente_requerimientos
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;

-- PACIENTE_ARCHIVOS: Solo service_role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paciente_archivos' AND policyname = 'paciente_archivos_service_all') THEN
    CREATE POLICY paciente_archivos_service_all ON public.paciente_archivos
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;

-- PACIENTE_PORTAL_TOKENS: Solo service_role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paciente_portal_tokens' AND policyname = 'paciente_portal_tokens_service_all') THEN
    CREATE POLICY paciente_portal_tokens_service_all ON public.paciente_portal_tokens
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;

-- POSTULACIONES_EQUIPO_QUIRURGICO: insert público para postulaciones, rest service_role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'postulaciones_equipo_quirurgico' AND policyname = 'postulaciones_equipo_public_insert') THEN
    CREATE POLICY postulaciones_equipo_public_insert ON public.postulaciones_equipo_quirurgico
      FOR INSERT
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'postulaciones_equipo_quirurgico' AND policyname = 'postulaciones_equipo_service_all') THEN
    CREATE POLICY postulaciones_equipo_service_all ON public.postulaciones_equipo_quirurgico
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;

-- OPERATIVOS_QUIRURGICOS: actualizar policies para público
DO $$
BEGIN
  -- Drop old policy if exists and recreate
  DROP POLICY IF EXISTS operativos_quirurgicos_public_select ON public.operativos_quirurgicos;
  
  CREATE POLICY operativos_quirurgicos_public_select ON public.operativos_quirurgicos
    FOR SELECT
    USING (publicado = true OR auth.role() = 'service_role');
END;
$$;

-- =====================================================
-- 9. STORAGE BUCKET (crear manualmente en Supabase Dashboard)
-- =====================================================
-- Bucket name: pacientes-archivos
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/*, application/pdf

-- NOTA: Los buckets se crean desde el dashboard de Supabase o via API,
-- no directamente desde SQL. Documentación de configuración:
/*
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'pacientes-archivos',
    'pacientes-archivos', 
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  );
  
  -- Storage RLS
  CREATE POLICY pacientes_archivos_service_all ON storage.objects
    FOR ALL
    USING (bucket_id = 'pacientes-archivos' AND auth.role() = 'service_role')
    WITH CHECK (bucket_id = 'pacientes-archivos' AND auth.role() = 'service_role');
*/

COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'paciente%';
