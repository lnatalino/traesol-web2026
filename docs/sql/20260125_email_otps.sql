-- 20260125_email_otps.sql
-- Sistema de OTP para verificación de email (reemplaza Magic Link)
-- Usamos hash SHA-256 para almacenar códigos de forma segura

-- =========================================================================
-- 1. CREAR TABLA email_otps
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Comentarios
COMMENT ON TABLE public.email_otps IS 'Códigos OTP de 6 dígitos para verificación de email y reset de contraseña';
COMMENT ON COLUMN public.email_otps.code_hash IS 'Hash SHA-256 del código (nunca almacenar plano)';
COMMENT ON COLUMN public.email_otps.purpose IS 'verify_email=activación de cuenta, reset_password=recuperar contraseña';
COMMENT ON COLUMN public.email_otps.expires_at IS 'Expira 15 minutos después de creación';
COMMENT ON COLUMN public.email_otps.used_at IS 'Timestamp cuando se usó (un solo uso)';

-- =========================================================================
-- 2. ÍNDICES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose ON public.email_otps(email, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_otps_user_id ON public.email_otps(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON public.email_otps(expires_at) WHERE used_at IS NULL;

-- =========================================================================
-- 3. ROW LEVEL SECURITY
-- =========================================================================

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Solo service role puede acceder (operaciones via API)
-- No hay políticas para usuarios normales - todo va por API con service_role

-- =========================================================================
-- 4. FUNCIÓN para invalidar OTPs anteriores del mismo propósito
-- =========================================================================

CREATE OR REPLACE FUNCTION public.invalidate_previous_otps(
  p_email text,
  p_purpose text
)
RETURNS void AS $$
BEGIN
  UPDATE public.email_otps
  SET used_at = now()
  WHERE email = p_email
    AND purpose = p_purpose
    AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 5. FUNCIÓN para limpiar OTPs expirados (para cron job opcional)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.email_otps
  WHERE expires_at < now() - interval '1 day';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- VERIFICACIÓN
-- =========================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_otps' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ Tabla email_otps creada correctamente';
  ELSE
    RAISE EXCEPTION '✗ Error: tabla email_otps no existe';
  END IF;
END $$;
