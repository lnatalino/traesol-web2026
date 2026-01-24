-- 20251128_password_reset_codes.sql
-- Tabla para códigos OTP de recuperación de contraseña
-- Validez: 15 minutos | Solo para admin_users

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,               -- SHA-256 del código de 6 dígitos
  expires_at TIMESTAMPTZ NOT NULL,       -- created_at + 15 min
  used_at TIMESTAMPTZ DEFAULT NULL,      -- se marca al consumir
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT DEFAULT NULL,                  -- IP de quien solicitó
  user_agent TEXT DEFAULT NULL           -- UA de quien solicitó
);

-- Índice para búsquedas por email + código válido
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email 
  ON password_reset_codes(email, expires_at) 
  WHERE used_at IS NULL;

-- Política RLS: solo service_role (backend) puede leer/escribir
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No se dan permisos a anon/authenticated; solo service_role los usará

-- Agregar campo force_password_change a admin_users si no existe
ALTER TABLE admin_users 
  ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT false;

-- Agregar campo "superadmin" para distinguir quien puede crear usuarios
-- (alternativa: usar role = 'superadmin' directamente)
COMMENT ON TABLE password_reset_codes IS 
  'Códigos OTP de 6 dígitos para recuperación de contraseña admin. Validez 15 min.';
