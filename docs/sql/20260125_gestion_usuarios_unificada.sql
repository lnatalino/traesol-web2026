-- 20260125_gestion_usuarios_unificada.sql
-- Sistema unificado de gestión de usuarios (voluntarios + admins)
-- IMPORTANTE: Ejecutar DESPUÉS de 20260125_user_profiles_verified.sql

-- =========================================================================
-- 1. AGREGAR CAMPO rut A user_profiles (si no existe)
-- =========================================================================

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS rut text;

-- Índice único para RUT (solo si tiene valor)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_rut_unique 
ON public.user_profiles(rut) 
WHERE rut IS NOT NULL AND rut != '';

-- =========================================================================
-- 2. AGREGAR CAMPOS ADICIONALES A user_profiles
-- =========================================================================

-- Campo enabled para soft-delete / deshabilitar usuarios
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

COMMENT ON COLUMN public.user_profiles.enabled IS 'false = usuario deshabilitado (soft-delete)';

-- Índice para queries de usuarios activos
CREATE INDEX IF NOT EXISTS idx_user_profiles_enabled 
ON public.user_profiles(enabled) 
WHERE enabled = true;

-- =========================================================================
-- 3. ASEGURAR TABLA user_roles EXISTE CON ESTRUCTURA CORRECTA
-- =========================================================================

-- La tabla ya debería existir, pero aseguramos estructura
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'admin', 'superadmin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION update_user_roles_updated_at();

-- Índice por rol para filtros
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =========================================================================
-- 4. FUNCIÓN RPC: Obtener usuarios con perfil y rol (para admin)
-- =========================================================================

CREATE OR REPLACE FUNCTION get_all_users_for_admin(
  p_role_filter text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  rut text,
  phone text,
  birthdate date,
  role text,
  verified boolean,
  enabled boolean,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Esta función solo debe ser llamada desde service_role o usuario autenticado con rol admin/superadmin
  -- La validación de permisos se hace en el endpoint
  
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    COALESCE(up.first_name, '')::text,
    COALESCE(up.last_name, '')::text,
    up.rut::text,
    up.phone::text,
    up.birthdate::date,
    COALESCE(ur.role, 'volunteer')::text,
    COALESCE(up.verified, false)::boolean,
    COALESCE(up.enabled, true)::boolean,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE 
    -- Filtro por rol
    (p_role_filter IS NULL OR COALESCE(ur.role, 'volunteer') = p_role_filter)
    -- Filtro de búsqueda
    AND (
      p_search IS NULL 
      OR p_search = ''
      OR au.email ILIKE '%' || p_search || '%'
      OR up.first_name ILIKE '%' || p_search || '%'
      OR up.last_name ILIKE '%' || p_search || '%'
      OR up.rut ILIKE '%' || p_search || '%'
    )
    -- Solo usuarios habilitados por defecto (o todos si es query específica)
    AND COALESCE(up.enabled, true) = true
  ORDER BY au.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =========================================================================
-- 5. FUNCIÓN RPC: Contar usuarios (para paginación)
-- =========================================================================

CREATE OR REPLACE FUNCTION count_users_for_admin(
  p_role_filter text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  total integer;
BEGIN
  SELECT COUNT(*)::integer INTO total
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE 
    (p_role_filter IS NULL OR COALESCE(ur.role, 'volunteer') = p_role_filter)
    AND (
      p_search IS NULL 
      OR p_search = ''
      OR au.email ILIKE '%' || p_search || '%'
      OR up.first_name ILIKE '%' || p_search || '%'
      OR up.last_name ILIKE '%' || p_search || '%'
      OR up.rut ILIKE '%' || p_search || '%'
    )
    AND COALESCE(up.enabled, true) = true;
  
  RETURN total;
END;
$$;

-- =========================================================================
-- 6. FUNCIÓN RPC: Obtener un usuario por ID
-- =========================================================================

CREATE OR REPLACE FUNCTION get_user_by_id_for_admin(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  rut text,
  phone text,
  birthdate date,
  role text,
  verified boolean,
  enabled boolean,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    COALESCE(up.first_name, '')::text,
    COALESCE(up.last_name, '')::text,
    up.rut::text,
    up.phone::text,
    up.birthdate::date,
    COALESCE(ur.role, 'volunteer')::text,
    COALESCE(up.verified, false)::boolean,
    COALESCE(up.enabled, true)::boolean,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE au.id = p_user_id;
END;
$$;

-- =========================================================================
-- 7. FUNCIÓN RPC: Contar superadmins activos (protección)
-- =========================================================================

CREATE OR REPLACE FUNCTION count_active_superadmins()
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_roles ur
  JOIN public.user_profiles up ON up.id = ur.user_id
  WHERE ur.role = 'superadmin'
    AND COALESCE(up.enabled, true) = true;
$$;

-- =========================================================================
-- 8. RLS POLICIES PARA user_profiles
-- =========================================================================

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: usuarios pueden actualizar su propio perfil (campos permitidos)
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: service_role puede todo (para admin API)
-- NOTA: service_role bypasses RLS por defecto, pero lo dejamos explícito

-- =========================================================================
-- 9. RLS POLICIES PARA user_roles
-- =========================================================================

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver su propio rol
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los cambios de rol SOLO via service_role (no hay policy para INSERT/UPDATE/DELETE para usuarios)

-- =========================================================================
-- 10. VERIFICACIÓN
-- =========================================================================

DO $$
DECLARE
  col_count integer;
BEGIN
  -- Verificar columnas en user_profiles
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
  AND column_name IN ('rut', 'enabled', 'verified');
  
  IF col_count >= 3 THEN
    RAISE NOTICE '✓ user_profiles tiene las columnas necesarias';
  ELSE
    RAISE EXCEPTION '✗ Faltan columnas en user_profiles';
  END IF;
  
  -- Verificar tabla user_roles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ Tabla user_roles existe';
  ELSE
    RAISE EXCEPTION '✗ Tabla user_roles no existe';
  END IF;
  
  -- Verificar funciones RPC
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_users_for_admin') THEN
    RAISE NOTICE '✓ Función get_all_users_for_admin existe';
  ELSE
    RAISE EXCEPTION '✗ Función get_all_users_for_admin no existe';
  END IF;
  
  RAISE NOTICE '✓ Migración de gestión de usuarios completada';
END $$;
