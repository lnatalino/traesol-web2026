-- =========================================================================
-- Migración: Sistema de cuentas de usuario (Mi cuenta) para voluntarios
-- Fecha: 2026-01-25
-- Descripción: 
--   Crear tabla user_profiles para perfiles de usuarios autenticados
--   con Supabase Auth. NO modifica tablas existentes.
-- =========================================================================

BEGIN;

-- =========================================================================
-- TABLA: user_profiles
-- Perfil de usuario vinculado a auth.users de Supabase
-- =========================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
      -- Datos personales
        rut TEXT UNIQUE,  -- Permitir NULL inicialmente, una vez guardado NO editable
          first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
              birthdate DATE,
                phone TEXT,
                  
                    -- Timestamps
                      created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ
                        );

                        -- Índices
                        CREATE INDEX IF NOT EXISTS idx_user_profiles_rut ON user_profiles(rut) WHERE rut IS NOT NULL;

                        -- =========================================================================
                        -- RLS (Row Level Security)
                        -- =========================================================================

                        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

                        -- Policy: Usuario puede leer su propio perfil
                        CREATE POLICY user_profiles_select_own ON user_profiles
                          FOR SELECT
                            USING (auth.uid() = id);

                            -- Policy: Usuario puede insertar su propio perfil
                            CREATE POLICY user_profiles_insert_own ON user_profiles
                              FOR INSERT
                                WITH CHECK (auth.uid() = id);

                                -- Policy: Usuario puede actualizar su propio perfil
                                CREATE POLICY user_profiles_update_own ON user_profiles
                                  FOR UPDATE
                                    USING (auth.uid() = id)
                                      WITH CHECK (auth.uid() = id);

                                      -- Policy: Service role tiene acceso total
                                      CREATE POLICY user_profiles_service_all ON user_profiles
                                        FOR ALL
                                          USING (auth.role() = 'service_role')
                                            WITH CHECK (auth.role() = 'service_role');

                                            -- =========================================================================
                                            -- TRIGGER: Actualizar updated_at automáticamente
                                            -- =========================================================================

                                            CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
                                            RETURNS TRIGGER AS $$
                                            BEGIN
                                              NEW.updated_at = NOW();
                                                RETURN NEW;
                                                END;
                                                $$ LANGUAGE plpgsql;

                                                DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;

                                                CREATE TRIGGER trg_user_profiles_updated_at
                                                  BEFORE UPDATE ON user_profiles
                                                    FOR EACH ROW
                                                      EXECUTE FUNCTION update_user_profiles_updated_at();

                                                      -- =========================================================================
                                                      -- COMENTARIOS
                                                      -- =========================================================================

                                                      COMMENT ON TABLE user_profiles IS 'Perfiles de usuarios autenticados con Supabase Auth (voluntarios con cuenta)';
                                                      COMMENT ON COLUMN user_profiles.rut IS 'RUT chileno, único y no editable una vez guardado';
                                                      COMMENT ON COLUMN user_profiles.first_name IS 'Nombre(s) del usuario';
                                                      COMMENT ON COLUMN user_profiles.last_name IS 'Apellido(s) del usuario';
                                                      COMMENT ON COLUMN user_profiles.birthdate IS 'Fecha de nacimiento (verificar >= 18 años en registro)';
                                                      COMMENT ON COLUMN user_profiles.phone IS 'Teléfono de contacto';

                                                      COMMIT;

                                                      -- =========================================================================
                                                      -- INSTRUCCIONES DE EJECUCIÓN
                                                      -- =========================================================================
                                                      -- 1. Ejecutar este script en Supabase SQL Editor
                                                      -- 2. Verificar que la tabla user_profiles se creó correctamente
                                                      -- 3. Verificar que las políticas RLS están activas
                                                      -- 4. La tabla auth.users ya existe como parte de Supabase Auth
                                                      -- =========================================================================
                                                      