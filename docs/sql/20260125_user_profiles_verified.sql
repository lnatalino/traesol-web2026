-- 20260125_user_profiles_verified.sql
-- Agregar campo verified a user_profiles para bloquear acceso hasta verificar email

-- =========================================================================
-- 1. AGREGAR COLUMNA verified
-- =========================================================================

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Comentario
COMMENT ON COLUMN public.user_profiles.verified IS 'true cuando el usuario verificó su email via OTP';

-- =========================================================================
-- 2. MARCAR USUARIOS EXISTENTES COMO VERIFICADOS
-- =========================================================================

-- Los usuarios que ya tenían cuenta antes de este cambio se consideran verificados
-- (para no romper cuentas existentes)
UPDATE public.user_profiles
SET verified = true
WHERE verified IS NULL OR verified = false;

-- =========================================================================
-- 3. ÍNDICE para queries de verificación
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_verified ON public.user_profiles(verified) WHERE verified = false;

-- =========================================================================
-- VERIFICACIÓN
-- =========================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'verified'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✓ Columna verified agregada a user_profiles';
  ELSE
    RAISE EXCEPTION '✗ Error: columna verified no existe';
  END IF;
END $$;
