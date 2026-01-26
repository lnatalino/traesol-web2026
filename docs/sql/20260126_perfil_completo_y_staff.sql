-- =========================================================================
-- Migración: Campos completos para perfil de voluntario/staff
-- Fecha: 2026-01-26
-- Descripción: 
--   Añade TODOS los campos necesarios para el formulario largo de voluntario
--   y para staff (admin/superadmin que participan en operativos)
-- =========================================================================

-- =========================================================================
-- PARTE 1: Campos adicionales en user_profiles
-- =========================================================================

DO $$ 
BEGIN
    -- === DATOS PERSONALES ===
    
    -- Nacionalidad
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'nacionalidad') THEN
        ALTER TABLE user_profiles ADD COLUMN nacionalidad TEXT;
        COMMENT ON COLUMN user_profiles.nacionalidad IS 'Nacionalidad del usuario';
    END IF;

    -- Género
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'genero') THEN
        ALTER TABLE user_profiles ADD COLUMN genero TEXT;
        COMMENT ON COLUMN user_profiles.genero IS 'Género (Masculino/Femenino/Otro)';
    END IF;

    -- Identificación nacional (extranjeros sin RUT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'id_nacional') THEN
        ALTER TABLE user_profiles ADD COLUMN id_nacional TEXT;
        COMMENT ON COLUMN user_profiles.id_nacional IS 'ID nacional para extranjeros sin RUT';
    END IF;

    -- Pasaporte
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'pasaporte') THEN
        ALTER TABLE user_profiles ADD COLUMN pasaporte TEXT;
        COMMENT ON COLUMN user_profiles.pasaporte IS 'Número de pasaporte (opcional)';
    END IF;

    -- Es extranjero (sin RUT chileno)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'extranjero') THEN
        ALTER TABLE user_profiles ADD COLUMN extranjero BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN user_profiles.extranjero IS 'True si es extranjero sin RUT chileno';
    END IF;

    -- === CONTACTO ===
    
    -- Dirección completa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'direccion') THEN
        ALTER TABLE user_profiles ADD COLUMN direccion TEXT;
        COMMENT ON COLUMN user_profiles.direccion IS 'Dirección completa del usuario';
    END IF;

    -- Comuna
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'comuna') THEN
        ALTER TABLE user_profiles ADD COLUMN comuna TEXT;
        COMMENT ON COLUMN user_profiles.comuna IS 'Comuna de residencia';
    END IF;

    -- Instagram
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'instagram') THEN
        ALTER TABLE user_profiles ADD COLUMN instagram TEXT;
        COMMENT ON COLUMN user_profiles.instagram IS 'Usuario de Instagram (@usuario)';
    END IF;

    -- === PROFESIÓN ===
    
    -- Profesión
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'profesion') THEN
        ALTER TABLE user_profiles ADD COLUMN profesion TEXT;
        COMMENT ON COLUMN user_profiles.profesion IS 'Profesión principal';
    END IF;

    -- Profesión otro (si seleccionó "Otro")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'profesion_otro') THEN
        ALTER TABLE user_profiles ADD COLUMN profesion_otro TEXT;
        COMMENT ON COLUMN user_profiles.profesion_otro IS 'Descripción si profesión es Otro';
    END IF;

    -- Especialidad médica (si aplica)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'especialidad') THEN
        ALTER TABLE user_profiles ADD COLUMN especialidad TEXT;
        COMMENT ON COLUMN user_profiles.especialidad IS 'Especialidad médica si aplica';
    END IF;

    -- === LOGÍSTICA / TALLAS ===
    
    -- Talla de polera
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'talla_polera') THEN
        ALTER TABLE user_profiles ADD COLUMN talla_polera TEXT;
        COMMENT ON COLUMN user_profiles.talla_polera IS 'Talla de polera (XS, S, M, L, XL, XXL, XXXL)';
    END IF;

    -- Talla de pantalón
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'talla_pantalon') THEN
        ALTER TABLE user_profiles ADD COLUMN talla_pantalon TEXT;
        COMMENT ON COLUMN user_profiles.talla_pantalon IS 'Talla de pantalón (36, 38, 40, 42, 44, 46, 48, 50)';
    END IF;

    -- === ALIMENTACIÓN ===
    
    -- Restricciones alimentarias / alergias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'restricciones_alimentarias') THEN
        ALTER TABLE user_profiles ADD COLUMN restricciones_alimentarias TEXT;
        COMMENT ON COLUMN user_profiles.restricciones_alimentarias IS 'Restricciones y alergias alimentarias';
    END IF;

    -- Es vegetariano/vegano
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'alimentarias_veg') THEN
        ALTER TABLE user_profiles ADD COLUMN alimentarias_veg BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN user_profiles.alimentarias_veg IS 'True si es vegetariano/vegano';
    END IF;

    -- === CREDENCIAL ===
    
    -- Nombre para credencial
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'nombre_credencial') THEN
        ALTER TABLE user_profiles ADD COLUMN nombre_credencial TEXT;
        COMMENT ON COLUMN user_profiles.nombre_credencial IS 'Nombre corto para credencial del operativo';
    END IF;

    -- === VOLUNTARIO ESPECÍFICO ===
    
    -- Disponibilidad anual (solo voluntarios, NO staff)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'disponibilidad_anual') THEN
        ALTER TABLE user_profiles ADD COLUMN disponibilidad_anual TEXT;
        COMMENT ON COLUMN user_profiles.disponibilidad_anual IS 'Disponibilidad anual para voluntariado (solo voluntarios)';
    END IF;

    -- Motivación
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'motivacion') THEN
        ALTER TABLE user_profiles ADD COLUMN motivacion TEXT;
        COMMENT ON COLUMN user_profiles.motivacion IS 'Motivación para ser voluntario';
    END IF;

    -- === TIPO DE PERFIL / STAFF ===
    
    -- Tipo de perfil (volunteer o staff)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'profile_type') THEN
        ALTER TABLE user_profiles ADD COLUMN profile_type TEXT DEFAULT 'volunteer';
        COMMENT ON COLUMN user_profiles.profile_type IS 'Tipo de perfil: volunteer (voluntario) o staff (admin/directivo)';
    END IF;

    -- Cargo interno (solo staff)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'cargo_interno') THEN
        ALTER TABLE user_profiles ADD COLUMN cargo_interno TEXT;
        COMMENT ON COLUMN user_profiles.cargo_interno IS 'Cargo interno en Traesol (solo staff)';
    END IF;

    -- Verificado (email confirmado)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'verified') THEN
        ALTER TABLE user_profiles ADD COLUMN verified BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN user_profiles.verified IS 'True si el email fue verificado';
    END IF;

END $$;

-- =========================================================================
-- PARTE 2: Columna atenciones_salud en operativos (para métricas Home)
-- =========================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'operativos' AND column_name = 'atenciones_salud') THEN
        ALTER TABLE operativos ADD COLUMN atenciones_salud INTEGER NOT NULL DEFAULT 0;
        COMMENT ON COLUMN operativos.atenciones_salud IS 'Número total de atenciones de salud realizadas en este operativo';
    END IF;
END $$;

-- =========================================================================
-- PARTE 3: Tabla operativo_participantes (voluntarios + staff)
-- =========================================================================

-- Tipo de participante
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_kind') THEN
        CREATE TYPE participant_kind AS ENUM ('voluntario', 'staff');
    END IF;
END$$;

-- Tabla de participantes (unifica inscripciones de voluntarios y asignaciones de staff)
CREATE TABLE IF NOT EXISTS operativo_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operativo_id UUID NOT NULL REFERENCES operativos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de participante
    kind TEXT NOT NULL DEFAULT 'voluntario' CHECK (kind IN ('voluntario', 'staff')),
    
    -- Estado (aplica principalmente a voluntarios)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    
    -- Notas internas (para staff: cargo en el operativo; para voluntario: notas admin)
    notas TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    -- Un usuario no puede estar dos veces en el mismo operativo
    UNIQUE(operativo_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_operativo_participantes_operativo ON operativo_participantes(operativo_id);
CREATE INDEX IF NOT EXISTS idx_operativo_participantes_user ON operativo_participantes(user_id);
CREATE INDEX IF NOT EXISTS idx_operativo_participantes_kind ON operativo_participantes(kind);
CREATE INDEX IF NOT EXISTS idx_operativo_participantes_status ON operativo_participantes(status);

-- RLS
ALTER TABLE operativo_participantes ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver sus propias participaciones
DROP POLICY IF EXISTS operativo_participantes_select_own ON operativo_participantes;
CREATE POLICY operativo_participantes_select_own ON operativo_participantes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Service role tiene acceso total
DROP POLICY IF EXISTS operativo_participantes_service_all ON operativo_participantes;
CREATE POLICY operativo_participantes_service_all ON operativo_participantes
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_operativo_participantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_operativo_participantes_updated_at ON operativo_participantes;

CREATE TRIGGER trg_operativo_participantes_updated_at
    BEFORE UPDATE ON operativo_participantes
    FOR EACH ROW
    EXECUTE FUNCTION update_operativo_participantes_updated_at();

-- Comentarios
COMMENT ON TABLE operativo_participantes IS 'Participantes de operativos: voluntarios (postulación) y staff (asignación directa)';
COMMENT ON COLUMN operativo_participantes.kind IS 'Tipo: voluntario o staff';
COMMENT ON COLUMN operativo_participantes.status IS 'Estado: pending/accepted/rejected/cancelled (principalmente para voluntarios)';

-- =========================================================================
-- PARTE 4: Verificar que todo se creó correctamente
-- =========================================================================

-- Ver columnas de user_profiles
SELECT 'user_profiles' as tabla, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Ver columnas de operativos relevantes
SELECT 'operativos' as tabla, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'operativos' AND column_name = 'atenciones_salud';

-- Ver si operativo_participantes existe
SELECT 'operativo_participantes' as tabla, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'operativo_participantes'
ORDER BY ordinal_position;
