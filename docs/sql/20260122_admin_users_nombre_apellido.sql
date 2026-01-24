-- 20260122_admin_users_nombre_apellido.sql
-- Agregar campos nombre y apellido a admin_users

ALTER TABLE admin_users 
  ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT NULL;

-- Comentarios
COMMENT ON COLUMN admin_users.first_name IS 'Nombre del usuario admin';
COMMENT ON COLUMN admin_users.last_name IS 'Apellido del usuario admin';
