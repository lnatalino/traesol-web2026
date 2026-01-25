-- 20260125_user_roles.sql
-- Sistema de roles unificado para auth.users
-- Permite que admins y superadmins accedan al panel /admin usando la misma sesión de Mi Cuenta

-- =========================================================================
-- 1. CREAR TABLA user_roles
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'admin', 'superadmin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comentarios
COMMENT ON TABLE public.user_roles IS 'Roles de usuario para control de acceso al panel admin';
COMMENT ON COLUMN public.user_roles.role IS 'volunteer=usuario normal, admin=acceso panel, superadmin=acceso total';

-- =========================================================================
-- 2. ÍNDICES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =========================================================================
-- 3. TRIGGER para updated_at
-- =========================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 4. ROW LEVEL SECURITY
-- =========================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio rol
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Solo service role puede insertar/actualizar roles (desde API admin)
-- No creamos policy de insert/update para usuarios normales
-- Los admins gestionan roles via API con service_role key

-- =========================================================================
-- 5. FUNCIÓN HELPER para obtener rol de un usuario
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_role, 'volunteer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 6. CREAR ROL PARA ADMINS EXISTENTES (opcional - manual o via seed)
-- =========================================================================

-- Para cada admin existente en admin_users que también tenga cuenta en auth.users,
-- puedes ejecutar manualmente:
-- INSERT INTO user_roles (user_id, role)
-- SELECT au.user_id, au.role
-- FROM admin_users au
-- JOIN auth.users u ON u.email = au.email
-- WHERE au.enabled = true
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- =========================================================================
-- VERIFICACIÓN
-- =========================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ Tabla user_roles creada correctamente';
  ELSE
    RAISE EXCEPTION '✗ Error: tabla user_roles no existe';
  END IF;
END $$;
