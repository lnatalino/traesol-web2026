-- SQL Migration: Añadir campos de logística a user_profiles
-- Fecha: 2026-01-26
-- Descripción: Añade campos necesarios para postulación a operativos
--              y diferenciación entre voluntarios y staff

-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- Solo si las columnas no existen ya

-- 1. Campos de logística para voluntarios (uniforme, alimentación)
DO $$ 
BEGIN
    -- Talla de polera
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'talla_polera') THEN
        ALTER TABLE user_profiles ADD COLUMN talla_polera TEXT;
        COMMENT ON COLUMN user_profiles.talla_polera IS 'Talla de polera para uniforme (XS, S, M, L, XL, XXL, XXXL)';
    END IF;

    -- Talla de pantalón
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'talla_pantalon') THEN
        ALTER TABLE user_profiles ADD COLUMN talla_pantalon TEXT;
        COMMENT ON COLUMN user_profiles.talla_pantalon IS 'Talla de pantalón (36, 38, 40, 42, 44, 46, 48, 50)';
    END IF;

    -- Restricciones alimentarias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'restricciones_alimentarias') THEN
        ALTER TABLE user_profiles ADD COLUMN restricciones_alimentarias TEXT;
        COMMENT ON COLUMN user_profiles.restricciones_alimentarias IS 'Restricciones alimentarias del usuario (vegetariano, alergias, etc.)';
    END IF;

    -- Dirección
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
END $$;

-- 2. Campo para diferenciar tipo de perfil (staff vs voluntario)
-- Esto prepara la base para el futuro sistema de staff/admin
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'profile_type') THEN
        ALTER TABLE user_profiles ADD COLUMN profile_type TEXT DEFAULT 'volunteer';
        COMMENT ON COLUMN user_profiles.profile_type IS 'Tipo de perfil: volunteer (voluntario) o staff (admin/directivo)';
    END IF;
END $$;

-- 3. Verificar que las columnas fueron creadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('talla_polera', 'talla_pantalon', 'restricciones_alimentarias', 
                    'direccion', 'comuna', 'instagram', 'profile_type')
ORDER BY column_name;
