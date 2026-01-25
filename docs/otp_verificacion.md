# Sistema de Verificación OTP y Autenticación Unificada

## Resumen

Este documento describe los cambios implementados para:

1. **Unificar la autenticación** entre Mi Cuenta (voluntarios) y Panel Admin
2. **Reemplazar Magic Link** por OTP de 6 dígitos para verificación de email

---

## 1. Variables de Entorno Requeridas

Agregar al archivo `.env.local`:

```bash
# Ya existentes (requeridas)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # Nueva: requerida para OTP
RESEND_API_KEY=re_xxxx
RESEND_FROM=Fundación Traesol <noreply@fundaciontraesol.cl>

# Opcional: lista de emails que siempre son superadmin
SUPERADMIN_EMAILS=admin@fundaciontraesol.cl,backup@fundaciontraesol.cl
```

---

## 2. Migraciones SQL Requeridas

Ejecutar en orden en Supabase SQL Editor:

### 2.1 Crear tabla `user_roles`
```sql
-- docs/sql/20260125_user_roles.sql
```

### 2.2 Crear tabla `email_otps`
```sql
-- docs/sql/20260125_email_otps.sql
```

### 2.3 Agregar campo `verified` a `user_profiles`
```sql
-- docs/sql/20260125_user_profiles_verified.sql
```

---

## 3. Flujos de Usuario

### 3.1 Registro de nuevo usuario

1. Usuario completa formulario en `/mi-cuenta/registro`
2. Se crea usuario en `auth.users` (Supabase Auth)
3. Se crea perfil en `user_profiles` con `verified=false`
4. Se genera OTP de 6 dígitos y se envía por email
5. Usuario es redirigido a `/mi-cuenta/verificar?email=...`
6. Usuario ingresa código OTP
7. Si es válido: `verified=true` y acceso a Mi Cuenta
8. Si es inválido/expirado: mensaje de error + opción de reenviar

### 3.2 Login de usuario existente

1. Usuario inicia sesión en `/mi-cuenta/login`
2. Si `profile.verified=false`: redirige a `/mi-cuenta/verificar`
3. Si `profile.verified=true`: acceso normal a Mi Cuenta

### 3.3 Acceso al Panel Admin

1. Usuario con sesión activa intenta acceder a `/admin`
2. Sistema verifica:
   - ¿Hay sesión Supabase Auth? → Usa rol de `user_roles`
   - ¿No hay sesión pero hay cookie legacy? → Usa sistema anterior
3. Si rol es `admin` o `superadmin` y `verified=true`: acceso permitido
4. Si no tiene sesión: redirige a `/mi-cuenta/login?next=/admin`
5. Si tiene sesión pero no es admin: redirige a `/mi-cuenta?error=no_admin`

---

## 4. Sistema OTP

### Características:
- **Código**: 6 dígitos numéricos
- **Expiración**: 15 minutos
- **Un solo uso**: marcado como `used_at` después de verificación
- **Almacenamiento seguro**: hash SHA-256 del código
- **Rate limiting básico**: 60 segundos entre reenvíos (client-side)

### API Endpoints:

#### `POST /api/auth/otp/send`
```json
{
  "email": "usuario@email.com",
  "purpose": "verify_email",  // o "reset_password"
  "userId": "uuid-opcional"
}
```

#### `POST /api/auth/otp/verify`
```json
{
  "email": "usuario@email.com",
  "code": "123456",
  "purpose": "verify_email"
}
```

---

## 5. Sistema de Roles

### Roles disponibles:
- `volunteer` (default): Usuario normal, solo Mi Cuenta
- `admin`: Acceso al Panel Admin
- `superadmin`: Acceso total + gestión de usuarios

### Asignación de roles:

Los roles se asignan via:
1. Tabla `user_roles` (user_id + role)
2. Variable `SUPERADMIN_EMAILS` (override automático a superadmin)

Para asignar rol admin a un usuario:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('uuid-del-usuario', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

---

## 6. Compatibilidad con Sistema Anterior

El sistema mantiene compatibilidad hacia atrás:

- **Cookies legacy**: Si no hay sesión Supabase pero hay cookies `traesol-role` y `traesol-email`, se usan como fallback
- **admin_users**: La tabla sigue funcionando para login legacy via `/login`
- **Ambos métodos de autenticación** funcionan en paralelo

---

## 7. Testing / QA Checklist

### ✅ Registro y verificación OTP
- [ ] Registrar nuevo usuario
- [ ] Verificar que llega email con código 6 dígitos
- [ ] Ingresar código correcto → acceso a Mi Cuenta
- [ ] Ingresar código incorrecto → error
- [ ] Ingresar código expirado (esperar 15 min) → error
- [ ] Reenviar código funciona (con cooldown 60s)

### ✅ Gate de verificación
- [ ] Usuario no verificado intenta `/mi-cuenta` → redirige a verificar
- [ ] Usuario verificado accede a `/mi-cuenta` → OK

### ✅ Autenticación unificada Admin
- [ ] Admin con rol en `user_roles` accede a `/admin` sin segundo login
- [ ] Usuario sin rol admin intenta `/admin` → error/redirect
- [ ] Usuario no logeado intenta `/admin` → redirect a login

### ✅ Badge en Navbar
- [ ] Usuario admin ve badge "Admin" en dropdown
- [ ] Usuario admin ve link "Panel Admin" en dropdown
- [ ] Usuario normal NO ve link "Panel Admin"

---

## 8. Archivos Nuevos/Modificados

### Nuevos:
- `docs/sql/20260125_user_roles.sql`
- `docs/sql/20260125_email_otps.sql`
- `docs/sql/20260125_user_profiles_verified.sql`
- `src/lib/unifiedAuth.ts`
- `src/lib/otpService.ts`
- `src/emails/VerificationCodeEmail.tsx`
- `src/app/api/auth/otp/send/route.ts`
- `src/app/api/auth/otp/verify/route.ts`
- `src/app/mi-cuenta/verificar/page.tsx`

### Modificados:
- `src/lib/supabaseRoute.ts` - Agregado `createSupabaseServiceRole`
- `src/lib/adminSession.ts` - Integración con `unifiedAuth`
- `src/lib/userAuth.ts` - Campo `verified` en UserProfile
- `src/lib/hooks/useUserSession.ts` - Incluye `role`
- `src/app/admin/page.tsx` - Redirect a `/mi-cuenta/login`
- `src/app/mi-cuenta/page.tsx` - Gate de verificación
- `src/app/mi-cuenta/login/page.tsx` - Soporte param `next`
- `src/app/mi-cuenta/registro/page.tsx` - Envío de OTP después de registro
- `src/components/UserAvatar.tsx` - Badge admin y link condicional
