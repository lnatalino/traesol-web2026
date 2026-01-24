-- =========================================================================
-- Migración: Casos Quirúrgicos (separación paciente/caso) + Encuestas
-- Fecha: 2026-01-24
-- Descripción: 
--   1) Separar perfil global de paciente de participación en operativo (caso)
--   2) Sistema completo de encuestas de satisfacción
-- =========================================================================

BEGIN;

-- =========================================================================
-- PARTE 1: CASOS QUIRÚRGICOS
-- =========================================================================

-- 1A. Ajustar tabla pacientes como PERFIL GLOBAL
-- Ya existe la tabla "pacientes", la ajustamos para que sea perfil global

-- Quitar la FK operativo_quirurgico_id de pacientes (ya no va aquí)
-- Pero primero verificamos si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pacientes' AND column_name = 'operativo_quirurgico_id'
  ) THEN
    -- Crear tabla casos_quirurgicos antes de mover datos
    NULL; -- Lo haremos después de crear la tabla casos
  END IF;
END $$;

-- 1B. Crear tabla casos_quirurgicos (participación en un operativo específico)
CREATE TABLE IF NOT EXISTS casos_quirurgicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  operativo_quirurgico_id UUID NOT NULL REFERENCES operativos_quirurgicos(id) ON DELETE CASCADE,
  
  -- Datos médicos del caso
  diagnostico TEXT,
  cirugia_planificada TEXT,
  fecha_cirugia DATE,
  hora_cirugia TIME,
  alta_hospitalaria_estimada DATE,
  
  -- Logística del caso
  requiere_vuelo BOOLEAN DEFAULT false,
  requiere_hospedaje BOOLEAN DEFAULT false,
  fecha_llegada_ciudad DATE,
  fecha_regreso_ciudad DATE,
  
  -- Info vuelo (si aplica)
  vuelo_ida_fecha TIMESTAMPTZ,
  vuelo_ida_numero TEXT,
  vuelo_ida_origen TEXT,
  vuelo_ida_destino TEXT,
  vuelo_regreso_fecha TIMESTAMPTZ,
  vuelo_regreso_numero TEXT,
  vuelo_regreso_origen TEXT,
  vuelo_regreso_destino TEXT,
  
  -- Info hotel (si aplica)
  hotel_nombre TEXT,
  hotel_direccion TEXT,
  hotel_checkin DATE,
  hotel_checkout DATE,
  
  -- Admin/estado
  notes_admin TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'operado', 'alta', 'cancelado')),
  patient_can_edit BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Índices para casos_quirurgicos
CREATE INDEX IF NOT EXISTS idx_casos_quirurgicos_paciente ON casos_quirurgicos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_casos_quirurgicos_operativo ON casos_quirurgicos(operativo_quirurgico_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_casos_quirurgicos_unique ON casos_quirurgicos(paciente_id, operativo_quirurgico_id);

-- RLS para casos_quirurgicos
ALTER TABLE casos_quirurgicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY casos_quirurgicos_service_all ON casos_quirurgicos
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 1C. Actualizar paciente_contactos para referenciar caso_id
-- Agregar columna caso_id (opcional por ahora para migración gradual)
ALTER TABLE paciente_contactos 
ADD COLUMN IF NOT EXISTS caso_id UUID REFERENCES casos_quirurgicos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_paciente_contactos_caso ON paciente_contactos(caso_id);

-- 1D. Actualizar paciente_requerimientos para referenciar caso_id
ALTER TABLE paciente_requerimientos
ADD COLUMN IF NOT EXISTS caso_id UUID REFERENCES casos_quirurgicos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_paciente_requerimientos_caso ON paciente_requerimientos(caso_id);

-- 1E. Actualizar paciente_archivos para referenciar caso_id
ALTER TABLE paciente_archivos
ADD COLUMN IF NOT EXISTS caso_id UUID REFERENCES casos_quirurgicos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_paciente_archivos_caso ON paciente_archivos(caso_id);

-- 1F. Actualizar paciente_portal_tokens para referenciar caso_id
ALTER TABLE paciente_portal_tokens
ADD COLUMN IF NOT EXISTS caso_id UUID REFERENCES casos_quirurgicos(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_paciente_portal_tokens_caso ON paciente_portal_tokens(caso_id) WHERE revoked_at IS NULL;

-- 1G. Migrar datos existentes de pacientes a casos_quirurgicos
-- Solo si hay datos con operativo_quirurgico_id
DO $$
DECLARE
  paciente_row RECORD;
BEGIN
  -- Verificar si la columna existe en pacientes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pacientes' AND column_name = 'operativo_quirurgico_id'
  ) THEN
    -- Migrar cada paciente que tenga operativo asignado
    FOR paciente_row IN 
      SELECT * FROM pacientes WHERE operativo_quirurgico_id IS NOT NULL
    LOOP
      INSERT INTO casos_quirurgicos (
        paciente_id,
        operativo_quirurgico_id,
        diagnostico,
        cirugia_planificada,
        fecha_cirugia,
        hora_cirugia,
        alta_hospitalaria_estimada,
        requiere_vuelo,
        requiere_hospedaje,
        fecha_llegada_ciudad,
        fecha_regreso_ciudad,
        notes_admin,
        estado,
        patient_can_edit,
        created_at
      )
      VALUES (
        paciente_row.id,
        paciente_row.operativo_quirurgico_id,
        paciente_row.diagnostico,
        paciente_row.cirugia_planificada,
        paciente_row.fecha_cirugia::DATE,
        paciente_row.hora_cirugia::TIME,
        paciente_row.alta_hospitalaria_estimada::DATE,
        COALESCE(paciente_row.requiere_vuelo, false),
        COALESCE(paciente_row.requiere_hospedaje, false),
        paciente_row.fecha_llegada_ciudad::DATE,
        paciente_row.fecha_regreso_ciudad::DATE,
        paciente_row.notes_admin,
        COALESCE(paciente_row.estado, 'activo'),
        COALESCE(paciente_row.patient_can_edit, false),
        paciente_row.created_at
      )
      ON CONFLICT (paciente_id, operativo_quirurgico_id) DO NOTHING;
    END LOOP;
    
    -- Actualizar referencias en tablas relacionadas
    UPDATE paciente_contactos pc
    SET caso_id = cq.id
    FROM casos_quirurgicos cq
    WHERE pc.paciente_id = cq.paciente_id
      AND pc.caso_id IS NULL;
    
    UPDATE paciente_requerimientos pr
    SET caso_id = cq.id
    FROM casos_quirurgicos cq
    WHERE pr.paciente_id = cq.paciente_id
      AND pr.caso_id IS NULL;
    
    UPDATE paciente_archivos pa
    SET caso_id = cq.id
    FROM casos_quirurgicos cq
    WHERE pa.paciente_id = cq.paciente_id
      AND pa.caso_id IS NULL;
    
    UPDATE paciente_portal_tokens pt
    SET caso_id = cq.id
    FROM casos_quirurgicos cq
    WHERE pt.paciente_id = cq.paciente_id
      AND pt.caso_id IS NULL;
  END IF;
END $$;


-- =========================================================================
-- PARTE 2: ENCUESTAS DE SATISFACCIÓN
-- =========================================================================

-- 2A. Tabla de templates de encuestas
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  nombre TEXT NOT NULL,
  descripcion TEXT,
  
  -- Tipo de encuesta
  tipo TEXT NOT NULL CHECK (tipo IN ('VOLUNTARIOS_OPERATIVO', 'PACIENTES_QUIRURGICO')),
  
  -- Configuración de envío
  delay_days INTEGER NOT NULL DEFAULT 1 CHECK (delay_days BETWEEN 1 AND 30),
  activo BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_survey_templates_tipo ON survey_templates(tipo);
CREATE INDEX IF NOT EXISTS idx_survey_templates_activo ON survey_templates(activo) WHERE activo = true;

ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY survey_templates_service_all ON survey_templates
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2B. Tabla de preguntas de encuesta
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES survey_templates(id) ON DELETE CASCADE,
  
  -- Contenido
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('rating', 'texto_libre', 'opcion_multiple')),
  
  -- Para rating: etiquetas
  rating_labels JSONB DEFAULT '{"1": "Muy insuficiente", "2": "Insuficiente", "3": "Regular", "4": "Bueno", "5": "Sobresaliente"}'::jsonb,
  
  -- Para opción múltiple
  opciones JSONB, -- ["Opción 1", "Opción 2", ...]
  
  -- Configuración
  requerida BOOLEAN DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_questions_template ON survey_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_orden ON survey_questions(template_id, orden);

ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY survey_questions_service_all ON survey_questions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2C. Tabla de asignaciones de encuesta (envíos programados)
CREATE TABLE IF NOT EXISTS survey_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_id UUID NOT NULL REFERENCES survey_templates(id) ON DELETE CASCADE,
  
  -- Referencia al operativo (para ambos tipos)
  operativo_id UUID REFERENCES operativos(id) ON DELETE SET NULL,
  operativo_quirurgico_id UUID REFERENCES operativos_quirurgicos(id) ON DELETE SET NULL,
  
  -- Destinatario (uno de estos será NOT NULL según tipo)
  voluntario_id UUID REFERENCES voluntarios(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos_quirurgicos(id) ON DELETE CASCADE,
  
  -- Email del destinatario (snapshot al momento de crear)
  email_destinatario TEXT NOT NULL,
  nombre_destinatario TEXT NOT NULL,
  
  -- Token único para acceder
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  
  -- Estado
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'abierto', 'completado', 'expirado')),
  
  -- Fechas
  fecha_programada DATE NOT NULL, -- Cuándo se debe enviar
  fecha_enviado TIMESTAMPTZ,
  fecha_abierto TIMESTAMPTZ,
  fecha_completado TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT survey_assignments_destinatario_check CHECK (
    (voluntario_id IS NOT NULL AND caso_id IS NULL) OR
    (voluntario_id IS NULL AND caso_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_survey_assignments_template ON survey_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_voluntario ON survey_assignments(voluntario_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_caso ON survey_assignments(caso_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_estado ON survey_assignments(estado);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_fecha_programada ON survey_assignments(fecha_programada) WHERE estado = 'pendiente';
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_assignments_token_hash ON survey_assignments(token_hash);

ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY survey_assignments_service_all ON survey_assignments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2D. Tabla de respuestas
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  assignment_id UUID NOT NULL REFERENCES survey_assignments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  
  -- Respuesta según tipo
  rating_value INTEGER CHECK (rating_value BETWEEN 1 AND 5),
  texto_value TEXT,
  opcion_value TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Una respuesta por pregunta por asignación
  CONSTRAINT survey_responses_unique UNIQUE (assignment_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_assignment ON survey_responses(assignment_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question ON survey_responses(question_id);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY survey_responses_service_all ON survey_responses
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2E. Vista para reportes de encuestas
CREATE OR REPLACE VIEW survey_stats AS
SELECT 
  st.id as template_id,
  st.nombre as template_nombre,
  st.tipo as template_tipo,
  COUNT(DISTINCT sa.id) as total_enviados,
  COUNT(DISTINCT sa.id) FILTER (WHERE sa.estado = 'completado') as total_completados,
  ROUND(
    COUNT(DISTINCT sa.id) FILTER (WHERE sa.estado = 'completado')::numeric / 
    NULLIF(COUNT(DISTINCT sa.id), 0) * 100, 
    2
  ) as tasa_respuesta,
  AVG(sr.rating_value) FILTER (WHERE sr.rating_value IS NOT NULL) as promedio_rating
FROM survey_templates st
LEFT JOIN survey_assignments sa ON sa.template_id = st.id
LEFT JOIN survey_responses sr ON sr.assignment_id = sa.id
GROUP BY st.id, st.nombre, st.tipo;

-- 2F. Función para programar encuestas de un operativo finalizado
CREATE OR REPLACE FUNCTION schedule_surveys_for_operativo(
  p_operativo_id UUID,
  p_tipo TEXT -- 'operativo' o 'quirurgico'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template RECORD;
  v_destinatario RECORD;
  v_count INTEGER := 0;
  v_fecha_fin DATE;
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Obtener fecha fin según tipo
  IF p_tipo = 'operativo' THEN
    SELECT fecha_fin INTO v_fecha_fin FROM operativos WHERE id = p_operativo_id;
  ELSE
    SELECT fecha_fin INTO v_fecha_fin FROM operativos_quirurgicos WHERE id = p_operativo_id;
  END IF;
  
  IF v_fecha_fin IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Buscar templates activos del tipo correspondiente
  FOR v_template IN 
    SELECT * FROM survey_templates 
    WHERE activo = true 
      AND tipo = CASE 
        WHEN p_tipo = 'operativo' THEN 'VOLUNTARIOS_OPERATIVO' 
        ELSE 'PACIENTES_QUIRURGICO' 
      END
  LOOP
    -- Programar para cada destinatario
    IF p_tipo = 'operativo' THEN
      -- Voluntarios confirmados del operativo
      FOR v_destinatario IN
        SELECT v.id as voluntario_id, v.email, v.nombre, v.apellido
        FROM inscripciones i
        JOIN voluntarios v ON v.id = i.voluntario_id
        WHERE i.operativo_id = p_operativo_id
          AND i.estado = 'confirmado'
          AND v.email IS NOT NULL
      LOOP
        -- Generar token único
        v_token := encode(gen_random_bytes(32), 'base64');
        v_token_hash := encode(sha256(v_token::bytea), 'hex');
        
        INSERT INTO survey_assignments (
          template_id,
          operativo_id,
          voluntario_id,
          email_destinatario,
          nombre_destinatario,
          token,
          token_hash,
          fecha_programada,
          expires_at
        )
        VALUES (
          v_template.id,
          p_operativo_id,
          v_destinatario.voluntario_id,
          v_destinatario.email,
          v_destinatario.nombre || ' ' || v_destinatario.apellido,
          v_token,
          v_token_hash,
          v_fecha_fin + v_template.delay_days,
          (v_fecha_fin + v_template.delay_days + 30)::TIMESTAMPTZ
        )
        ON CONFLICT DO NOTHING;
        
        v_count := v_count + 1;
      END LOOP;
    ELSE
      -- Pacientes/casos del operativo quirúrgico
      FOR v_destinatario IN
        SELECT cq.id as caso_id, p.email, p.nombres, p.apellidos
        FROM casos_quirurgicos cq
        JOIN pacientes p ON p.id = cq.paciente_id
        WHERE cq.operativo_quirurgico_id = p_operativo_id
          AND cq.estado IN ('operado', 'alta')
          AND p.email IS NOT NULL
      LOOP
        v_token := encode(gen_random_bytes(32), 'base64');
        v_token_hash := encode(sha256(v_token::bytea), 'hex');
        
        INSERT INTO survey_assignments (
          template_id,
          operativo_quirurgico_id,
          caso_id,
          email_destinatario,
          nombre_destinatario,
          token,
          token_hash,
          fecha_programada,
          expires_at
        )
        VALUES (
          v_template.id,
          p_operativo_id,
          v_destinatario.caso_id,
          v_destinatario.email,
          v_destinatario.nombres || ' ' || v_destinatario.apellidos,
          v_token,
          v_token_hash,
          v_fecha_fin + v_template.delay_days,
          (v_fecha_fin + v_template.delay_days + 30)::TIMESTAMPTZ
        )
        ON CONFLICT DO NOTHING;
        
        v_count := v_count + 1;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- =========================================================================
-- COMENTARIOS
-- =========================================================================

COMMENT ON TABLE casos_quirurgicos IS 'Participación de un paciente en un operativo quirúrgico específico';
COMMENT ON TABLE survey_templates IS 'Templates de encuestas de satisfacción (voluntarios o pacientes)';
COMMENT ON TABLE survey_questions IS 'Preguntas de una encuesta (rating 1-5, texto libre, opción múltiple)';
COMMENT ON TABLE survey_assignments IS 'Envíos programados de encuestas a destinatarios específicos';
COMMENT ON TABLE survey_responses IS 'Respuestas individuales a cada pregunta de una encuesta';

COMMIT;

-- =========================================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =========================================================================
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Verificar que las tablas se crearon correctamente
-- 3. Los datos existentes en pacientes se migran automáticamente a casos_quirurgicos
-- 4. El sistema de encuestas está listo para usar
-- =========================================================================
