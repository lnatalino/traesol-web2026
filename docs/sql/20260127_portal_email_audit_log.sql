-- =========================================================================
-- Migración: Audit Log para emails del Portal del Paciente
-- Fecha: 2026-01-27
-- Descripción: Registra cada envío de email del portal para auditoría
-- =========================================================================

-- Tabla de registro de emails enviados
CREATE TABLE IF NOT EXISTS paciente_portal_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  
  -- Info del email
  email_to TEXT NOT NULL,
  email_subject TEXT NOT NULL,
  
  -- Estado del envío
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  resend_email_id TEXT, -- ID devuelto por Resend
  error_message TEXT,
  
  -- Info del portal token asociado (si aplica)
  portal_token_id UUID REFERENCES paciente_portal_tokens(id) ON DELETE SET NULL,
  portal_url TEXT,
  
  -- Auditoría
  sent_by TEXT NOT NULL, -- Email del admin que envió
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índices inline no están soportados, se crean abajo
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_portal_email_log_paciente ON paciente_portal_email_log(paciente_id);
CREATE INDEX IF NOT EXISTS idx_portal_email_log_created ON paciente_portal_email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_email_log_status ON paciente_portal_email_log(status);

-- Comentarios
COMMENT ON TABLE paciente_portal_email_log IS 'Registro de todos los emails enviados del portal del paciente';
COMMENT ON COLUMN paciente_portal_email_log.resend_email_id IS 'ID único del email en el sistema Resend';
COMMENT ON COLUMN paciente_portal_email_log.status IS 'Estado: pending=encolado, sent=enviado exitosamente, failed=falló';

-- RLS
ALTER TABLE paciente_portal_email_log ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede insertar/leer (admins via API)
CREATE POLICY "service_role_all_portal_email_log" ON paciente_portal_email_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =========================================================================
-- Instrucciones de ejecución:
-- =========================================================================
-- 1. Ejecutar en Supabase SQL Editor
-- 2. Verificar que las tablas 'pacientes' y 'paciente_portal_tokens' existen
-- 3. Probar con: SELECT * FROM paciente_portal_email_log;
-- =========================================================================
