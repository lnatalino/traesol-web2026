# Mi cuenta - Fase 1: Autenticación de Voluntarios

## Resumen

Implementación del sistema de cuentas de usuario para voluntarios frecuentes usando Supabase Auth. Esta es una funcionalidad **aditiva** que NO modifica los flujos existentes de admin, voluntarios por RUT, encuestas, invitaciones o portal de pacientes.

## Funcionalidades implementadas

### 1. Autenticación con Supabase Auth
- ✅ Registro con email + contraseña
- ✅ Inicio de sesión
- ✅ Cierre de sesión
- ✅ Recuperación de contraseña (via Supabase reset email)
- ✅ Validación de edad (>= 18 años obligatorio)

### 2. Perfil de usuario
- ✅ Datos editables: nombre, apellido, teléfono, fecha nacimiento
- ✅ RUT: editable solo una vez (queda bloqueado tras guardarlo)
- ✅ Email no editable (viene de auth.users)

### 3. Interfaz de usuario
- ✅ `/mi-cuenta` - Dashboard principal
- ✅ `/mi-cuenta/login` - Iniciar sesión
- ✅ `/mi-cuenta/registro` - Crear cuenta
- ✅ `/mi-cuenta/perfil` - Editar perfil
- ✅ `/mi-cuenta/olvido-contrasena` - Solicitar reset
- ✅ `/mi-cuenta/restablecer-contrasena` - Nueva contraseña

### 4. Navbar actualizado
- ✅ Link "Admin" reemplazado por "Mi cuenta" / Avatar
- ✅ Avatar con iniciales cuando hay sesión
- ✅ Dropdown con: Mi cuenta, Mi perfil, Panel Admin, Cerrar sesión
- ✅ Panel Admin sigue accesible (ruta directa /admin)

## Configuración necesaria

### Variables de entorno (ya deben existir)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Ejecutar migración SQL

1. Ir a Supabase Dashboard → SQL Editor
2. Pegar y ejecutar el contenido de: `docs/sql/20260125_user_profiles_auth.sql`
3. Verificar que la tabla `user_profiles` se creó correctamente
4. Verificar que las políticas RLS están activas

### Configuración de Supabase Auth

1. En Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `https://fundaciontraesol.cl` (o tu dominio)
   - Redirect URLs agregar: `https://fundaciontraesol.cl/mi-cuenta/restablecer-contrasena`

2. En Authentication → Email Templates (opcional):
   - Personalizar template de "Reset Password" si lo deseas

## Archivos creados/modificados

### Nuevos archivos

| Archivo | Descripción |
|---------|-------------|
| `docs/sql/20260125_user_profiles_auth.sql` | Migración SQL para tabla user_profiles |
| `src/lib/userAuth.ts` | Helpers de autenticación |
| `src/lib/hooks/useUserSession.ts` | Hook para sesión en cliente |
| `src/components/UserAvatar.tsx` | Componente avatar con dropdown |
| `src/app/mi-cuenta/page.tsx` | Dashboard principal |
| `src/app/mi-cuenta/login/page.tsx` | Página de login |
| `src/app/mi-cuenta/registro/page.tsx` | Página de registro |
| `src/app/mi-cuenta/perfil/page.tsx` | Página de edición de perfil |
| `src/app/mi-cuenta/olvido-contrasena/page.tsx` | Solicitar reset |
| `src/app/mi-cuenta/restablecer-contrasena/page.tsx` | Nueva contraseña |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/Navbar.tsx` | Reemplazado link "Admin" por UserAvatar |

## Probar en local

```bash
# 1. Instalar dependencias (si no están)
npm install

# 2. Ejecutar en desarrollo
npm run dev

# 3. Probar flujo completo:
#    - Ir a http://localhost:3000
#    - Click en "Mi cuenta" en el navbar
#    - Crear cuenta nueva (email real para verificación)
#    - Verificar que el navbar muestra el avatar
#    - Editar perfil
#    - Cerrar sesión
```

## Estructura de la base de datos

### Tabla: user_profiles

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  rut TEXT UNIQUE,           -- Opcional, bloqueado tras guardar
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthdate DATE,
  phone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Políticas RLS

- SELECT: usuario puede leer su propio perfil
- INSERT: usuario puede crear su propio perfil
- UPDATE: usuario puede actualizar su propio perfil
- Service role: acceso total

## Notas importantes

1. **No rompe flujos existentes**: Todo el sistema de admin, voluntarios por RUT, encuestas, invitaciones y portal de pacientes sigue funcionando exactamente igual.

2. **Panel Admin**: Sigue accesible en `/admin` (ruta directa). También aparece en el dropdown del avatar para usuarios autenticados.

3. **Menores de edad**: El registro está bloqueado para menores de 18 años con mensaje para contactar a `contacto@fundaciontraesol.cl`.

4. **RUT bloqueado**: Una vez que el usuario guarda su RUT, no puede modificarlo. Esto es por seguridad.

5. **Email no editable**: El email viene de Supabase Auth y no se puede cambiar desde el perfil.

## Próximos pasos (Fase 2 - opcional)

- [ ] Vincular cuenta con perfil de voluntario existente (por RUT)
- [ ] Mostrar historial de participación en operativos
- [ ] Notificaciones por email de nuevos operativos
- [ ] Postular a operativos directamente desde Mi cuenta
