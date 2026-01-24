# Superadmin Configuration

Este documento describe cómo configurar la "Cuenta Madre" (superadmin) del sistema Admin de Traesol.

## Configuración de SUPERADMIN_EMAILS

### Variable de entorno

El sistema utiliza la variable de entorno `SUPERADMIN_EMAILS` para definir qué correos tienen acceso de superadmin.

```env
SUPERADMIN_EMAILS=lnatalino@fundaciontraesol.cl
```

### Características

- **Separación por comas**: Puedes agregar múltiples emails separados por coma.
- **Normalización automática**: Los emails se normalizan a minúsculas y se eliminan espacios.
- **Override de rol**: Si un usuario está en esta lista, su rol efectivo es `superadmin` independientemente del rol guardado en la base de datos.
- **Sin necesidad de registro**: El sistema es cerrado; los superadmins no necesitan estar registrados en la tabla `admin_users` para obtener el rol.

### Ejemplo

```env
# Superadmin principal
SUPERADMIN_EMAILS=lnatalino@fundaciontraesol.cl

# Múltiples superadmins (si se necesita backup)
SUPERADMIN_EMAILS=lnatalino@fundaciontraesol.cl,backup@fundaciontraesol.cl
```

## Configuración en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega:
   - **Name**: `SUPERADMIN_EMAILS`
   - **Value**: Los emails separados por coma
   - **Environment**: Production, Preview, Development (según necesites)

---

## Flujo de Creación de Usuarios Admin

### Paso 1: Superadmin crea usuario

En `/admin/usuarios`, el superadmin puede crear nuevos usuarios con:

- **Nombre** y **Apellido**
- **Email** (será el usuario de login)
- **Rol** (admin, editor, viewer)

Al crear el usuario:
1. Se genera una **contraseña temporal segura** automáticamente (12 caracteres)
2. Se crea el registro en `admin_users` con `force_password_change = true`
3. Se envía un **email de bienvenida** con:
   - Credenciales de acceso
   - Link al login
   - Aviso de cambio obligatorio de contraseña

### Paso 2: Usuario recibe email

El nuevo usuario recibe un email con:
- Su correo (usuario)
- Contraseña temporal
- Link directo al login

### Paso 3: Primer login

Cuando el usuario ingresa con su contraseña temporal:
1. Se detecta `force_password_change = true`
2. Se redirige automáticamente a `/cambiar-contrasena`
3. **NO puede acceder al dashboard** hasta cambiar la contraseña

### Paso 4: Cambio de contraseña

En la página de cambio de contraseña:
1. Ingresa la contraseña temporal (la del email)
2. Crea una nueva contraseña (mínimo 8 caracteres)
3. Confirma la nueva contraseña
4. Al guardar:
   - Se actualiza la contraseña en DB
   - Se setea `force_password_change = false`
   - Se redirige al Dashboard Admin

### Paso 5: Acceso normal

A partir de ahora, el usuario puede ingresar normalmente con su nueva contraseña.

---

## Permisos de Superadmin

Un superadmin tiene acceso a:

| Módulo | Permiso |
|--------|---------|
| `/admin/usuarios` | Crear, editar, eliminar usuarios admin |
| Todos los módulos | Acceso completo |

## Jerarquía de Roles

```
superadmin (100) > admin (50) > editor (10) > viewer (5)
```

- **superadmin**: Acceso total, gestión de usuarios
- **admin**: Acceso a todos los módulos, sin gestión de usuarios
- **editor**: Acceso limitado a edición de contenido
- **viewer**: Solo lectura

## Código relevante

La lógica está en `/src/lib/adminAuth.ts`:

```typescript
// Verificar si un email es superadmin
isSuperAdminEmail(email: string): boolean

// Verificar si un usuario es superadmin (por rol o email)
isSuperAdmin(role: string, email: string): boolean

// Obtener rol efectivo (con override por email)
getEffectiveRole(dbRole: string, email: string): string
```

## Notas de seguridad

- La variable `SUPERADMIN_EMAILS` solo debe contener emails de confianza.
- No expongas esta variable en el cliente/frontend.
- Revisa periódicamente quién tiene acceso.
- Considera usar emails institucionales, no personales.

## Troubleshooting

### El superadmin no puede acceder

1. Verifica que la variable `SUPERADMIN_EMAILS` está configurada en Vercel
2. Revisa que el email esté exactamente igual (case-insensitive)
3. Verifica que no haya espacios extra en la variable
4. Redespliega si acabas de agregar la variable

### El rol no se muestra correctamente

El rol mostrado en la UI es el `effectiveRole`, que puede ser diferente al rol guardado en DB si el email está en `SUPERADMIN_EMAILS`.
