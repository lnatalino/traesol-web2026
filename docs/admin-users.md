# Administración de Usuarios

**Última actualización:** Enero 2026

---

## Resumen

El módulo de **Usuarios** permite a los superadmins crear y gestionar cuentas del panel administrativo. Solo usuarios con rol `superadmin` pueden acceder a esta sección.

---

## Acceso al módulo

### Requisitos

1. Estar autenticado en el panel admin
2. Ser reconocido como **superadmin** por alguna de estas vías:
   - Tener `role = "superadmin"` en la tabla `admin_users`
   - Tener el email incluido en la variable de entorno `SUPERADMIN_EMAILS`

### Variable de entorno SUPERADMIN_EMAILS

```bash
# .env.local
SUPERADMIN_EMAILS="admin@fundaciontraesol.cl,backup@fundaciontraesol.cl"
```

- Múltiples emails separados por coma
- Se normalizan a minúsculas automáticamente
- Sirve como **override**: si tu email está en esta lista, eres superadmin aunque tu rol en DB sea otro

---

## Crear un usuario

### Flujo

1. Ir a **Admin → Usuarios**
2. Click en "Crear usuario"
3. Completar:
   - **Nombre** (obligatorio)
   - **Apellido** (obligatorio)
   - **Email** (obligatorio, único)
   - **Rol** (superadmin, admin, editor, viewer)
4. Click en "Crear"

### ¿Qué ocurre al crear?

1. Se genera una **contraseña temporal** aleatoria (12 caracteres)
2. Se crea el registro en `admin_users` con `force_password_change = true`
3. Se envía un **email de bienvenida** al nuevo usuario con:
   - Su email de acceso
   - La contraseña temporal
   - Link al login
   - Instrucción de cambiar la contraseña al primer ingreso

### Primer login del usuario

1. El usuario accede con email + contraseña temporal
2. Se detecta `force_password_change = true`
3. Es redirigido a `/cambiar-contrasena`
4. Debe establecer una nueva contraseña
5. Al cambiarla, `force_password_change` se setea a `false`

---

## Roles disponibles

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| `superadmin` | 100 | Acceso total, puede crear usuarios |
| `admin` | 50 | Acceso a todas las secciones operativas |
| `editor` | 10 | Puede editar contenido pero no configuración |
| `viewer` | 5 | Solo lectura |

---

## Protección de rutas

### Ruta `/admin/usuarios`

- **Server-side:** `getAdminSession()` verifica `isSuperAdmin`
- Si no es superadmin → redirect a `/admin?error=no_autorizado`

### Menú de navegación

- El item "Usuarios" solo aparece si `role === "superadmin"` (rol efectivo)
- Se obtiene del endpoint `GET /api/admin/session`

---

## API Endpoints

### GET /api/admin/session

Retorna la sesión actual del usuario admin.

```json
{
  "role": "superadmin",
  "email": "admin@fundaciontraesol.cl",
  "isSuperAdmin": true
}
```

### GET /api/admin/usuarios

Lista todos los usuarios admin (solo superadmin).

### POST /api/admin/usuarios

Crea un nuevo usuario admin.

**Body:**
```json
{
  "email": "nuevo@empresa.cl",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "editor"
}
```

**Response:**
```json
{
  "ok": true,
  "user": { "id": "...", "email": "...", ... }
}
```

### PATCH /api/admin/usuarios/[id]

Actualiza un usuario (habilitar/deshabilitar, resetear contraseña).

### DELETE /api/admin/usuarios/[id]

Elimina un usuario admin.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      AdminNav (Client)                       │
│  - Fetch rol desde /api/admin/session                       │
│  - Muestra "Usuarios" solo si role === "superadmin"         │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 /api/admin/session (Server)                  │
│  - getAdminSession() → effectiveRole, isSuperAdmin          │
│  - Considera SUPERADMIN_EMAILS como override                │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    adminAuth.ts (Lib)                        │
│  - isSuperAdmin(role, email)                                │
│  - isSuperAdminEmail(email)                                 │
│  - getEffectiveRole(dbRole, email)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "No veo el menú Usuarios"

1. Verifica que tu email esté en `SUPERADMIN_EMAILS` o que tu rol en DB sea `superadmin`
2. Reinicia el servidor de desarrollo si cambiaste `.env.local`
3. Cierra sesión y vuelve a entrar para refrescar las cookies

### "No puedo acceder a /admin/usuarios"

1. Mismo que arriba
2. Verifica en la consola del navegador: `fetch('/api/admin/session').then(r => r.json()).then(console.log)`
3. Debe mostrar `role: "superadmin"` y `isSuperAdmin: true`

### "El email de bienvenida no llega"

1. Verifica que `RESEND_API_KEY` esté configurado
2. Verifica que el email no esté en spam
3. Revisa los logs del servidor para errores de Resend

---

## Archivos relacionados

- [AdminNav.tsx](../src/app/admin/AdminNav.tsx) - Menú de navegación
- [adminSession.ts](../src/lib/adminSession.ts) - Sesión admin server-side
- [adminAuth.ts](../src/lib/adminAuth.ts) - Lógica de autorización
- [/api/admin/session](../src/app/api/admin/session/route.ts) - Endpoint de sesión
- [/api/admin/usuarios](../src/app/api/admin/usuarios/route.ts) - CRUD usuarios
- [UsuariosClient.tsx](../src/app/admin/usuarios/UsuariosClient.tsx) - UI de gestión
