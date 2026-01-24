-- =========================================================================
-- Migración: Flag de edición para pacientes en el portal
-- Fecha: 2026-01-24
-- Descripción: Permite que el Admin controle si un paciente puede editar sus datos
-- =========================================================================

-- Agregar columna patient_can_edit a la tabla pacientes
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS patient_can_edit BOOLEAN NOT NULL DEFAULT false;

-- Comentario
COMMENT ON COLUMN pacientes.patient_can_edit IS 'Si true, el paciente puede editar sus datos personales y contactos desde el portal';

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_pacientes_can_edit ON pacientes(patient_can_edit) WHERE patient_can_edit = true;

-- =========================================================================
-- Instrucciones de ejecución:
-- =========================================================================
-- 1. Ejecutar en Supabase SQL Editor
-- 2. Por defecto todos los pacientes tienen patient_can_edit = false
-- 3. El Admin debe activarlo manualmente por paciente
-- =========================================================================
