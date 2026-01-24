# Sistema de Autenticación Admin - Traesol

## Resumen

Sistema de usuarios **cerrado** para el panel administrativo. No hay registro público; solo un superadmin puede crear usuarios.

## Arquitectura

### Tabla `admin_users`
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- SHA-256
  role TEXT NOT NULL DEFAULT 'editor',  -- superadmin, admin, editor, viewer
  enabled BOOLEAN NOT NULL DEFAULT true,
  force_password_change BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla `password_reset_codes`
```sql
CREATE TABLE password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,               -- SHA-256 del código de 6 dígitos
  expires_at TIMESTAMPTZ NOT NULL,       -- created_at + 15 min
  used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
);
```

## Roles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `superadmin` | Administrador principal | Gestionar usuarios + todo |
| `admin` | Administrador | Acceso completo excepto usuarios |
| `editor` | Editor | Crear/editar contenido |
| `viewer` | Visor | Solo lectura |

## Flujos

### 1. Login Normal
1. Usuario ingresa email + contraseña en `/login`
2. `POST /api/auth/simple-login` verifica credenciales
3. Si `force_password_change = true` → redirige a `/cambiar-contrasena`
4. Si no → establece cookies `traesol-role` y `traesol-email` (8 horas)

### 2. Cambio Forzado de Contraseña
1. Usuario llega a `/cambiar-contrasena` (cookie temporal `traesol-pending-email`)
2. Ingresa contraseña actual + nueva contraseña
3. `POST /api/admin/auth/change-password` valida y actualiza
4. Se establecen cookies de sesión normales

### 3. Recuperación de Contraseña
1. Usuario va a `/olvido-contrasena`
2. Ingresa su email
3. `POST /api/admin/auth/request-reset` genera código OTP de 6 dígitos
4. Email enviado con código (válido 15 minutos)
5. Usuario va a `/restablecer-contrasena`
6. Ingresa código + nueva contraseña
7. `POST /api/admin/auth/confirm-reset` valida y actualiza

### 4. Gestión de Usuarios (Solo Superadmin)
- Página: `/admin/usuarios`
- Crear usuarios con contraseña temporal
- Habilitar/deshabilitar usuarios
- Resetear contraseñas
- Eliminar usuarios (excepto a sí mismo)

## API Endpoints

### Auth Público
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/simple-login` | Login con email/password |
| POST | `/api/auth/simple-logout` | Cerrar sesión |

### Auth Admin
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/auth/request-reset` | Solicitar código OTP |
| POST | `/api/admin/auth/confirm-reset` | Validar código y cambiar contraseña |
| POST | `/api/admin/auth/change-password` | Cambiar contraseña (forzado) |
| GET | `/api/admin/session` | Obtener rol/email de sesión actual |

### Gestión de Usuarios (Superadmin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/usuarios` | Listar usuarios |
| POST | `/api/admin/usuarios` | Crear usuario |
| PATCH | `/api/admin/usuarios/[id]` | Actualizar usuario |
| DELETE | `/api/admin/usuarios/[id]` | Eliminar usuario |

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/login` | Formulario de login |
| `/olvido-contrasena` | Solicitar código de recuperación |
| `/restablecer-contrasena` | Ingresar código y nueva contraseña |
| `/cambiar-contrasena` | Cambio forzado de contraseña |
| `/admin/usuarios` | Gestión de usuarios (superadmin) |

## Seguridad

### Medidas Implementadas
- ✅ Contraseñas hasheadas con SHA-256
- ✅ Rate limiting: 2 minutos entre solicitudes de código OTP
- ✅ Códigos OTP expiran en 15 minutos
- ✅ Respuestas genéricas para evitar enumeración de emails
- ✅ Cookies HttpOnly para `traesol-role`
- ✅ Sesiones expiran en 8 horas
- ✅ Usuarios pueden ser deshabilitados sin eliminar
- ✅ No se puede auto-eliminar usuario

### Recomendaciones Adicionales
- Configurar HTTPS en producción
- Considerar migrar a bcrypt/argon2 para hashing
- Implementar logs de auditoría
- Agregar 2FA para superadmin

## UI Features

- 👁️ Toggle de visibilidad de contraseña (ojito)
- 🔢 Input de código OTP con auto-focus y paste
- ⚙️ Generador de contraseñas aleatorias
- 🎨 Badges de rol con colores distintivos
- ⚠️ Indicador de "cambiar contraseña" en tabla de usuarios

## Archivos Creados/Modificados

### Nuevos
- `docs/sql/20251128_password_reset_codes.sql`
- `src/app/olvido-contrasena/page.tsx`
- `src/app/restablecer-contrasena/page.tsx`
- `src/app/cambiar-contrasena/page.tsx`
- `src/app/admin/usuarios/page.tsx`
- `src/app/admin/usuarios/UsuariosClient.tsx`
- `src/app/api/admin/auth/request-reset/route.ts`
- `src/app/api/admin/auth/confirm-reset/route.ts`
- `src/app/api/admin/auth/change-password/route.ts`
- `src/app/api/admin/usuarios/route.ts`
- `src/app/api/admin/usuarios/[id]/route.ts`
- `src/app/api/admin/session/route.ts`

### Modificados
- `src/app/login/page.tsx` - Toggle de contraseña + link recuperación
- `src/app/api/auth/simple-login/route.ts` - Check `force_password_change`
- `src/lib/adminSession.ts` - Agregar rol `superadmin`
- `src/app/admin/AdminNav.tsx` - Tab de usuarios para superadmin

## Migración SQL

Ejecutar en Supabase:
```sql
-- Ver docs/sql/20251128_password_reset_codes.sql
```

## Crear Superadmin Inicial

```sql
INSERT INTO admin_users (email, password_hash, role, enabled, force_password_change)
VALUES (
  'superadmin@traesol.cl',
  -- SHA-256 de 'TuPasswordSeguro123'
  '...',
  'superadmin',
  true,
  true  -- Forzar cambio en primer login
);
```

Para generar el hash en Node.js:
```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256').update('TuPassword').digest('hex');
console.log(hash);
```
