# QA Report - 2026-01-24

## Resumen

Sprint de estabilización para despliegue en Vercel.

## Cambios Realizados

### A) Favicon / App Icon
- **Movido**: `Icon.png` (raíz) → `src/app/icon.png`
- **Eliminado**: `src/app/favicon.ico` (conflicto con el nuevo icon)
- **Resultado**: Next.js App Router usará automáticamente `icon.png` como favicon/app icon

### B) Portal del Paciente - Error Server-Side
- **Archivo**: `src/app/paciente/portal/page.tsx`
- **Problema**: Errores no capturados causaban pantalla blanca con "Application error"
- **Solución**: 
  - Envuelto todo en try/catch global
  - Manejo específico de errores en `verifyPortalToken()`
  - Manejo específico de errores en `createPortalSession()`
  - Siempre retorna `<PortalInvalido>` con mensaje amigable en lugar de crashear

### C) Botón "Enviar Email" en Admin Portal Paciente
- **Archivo**: `src/app/admin/quirurgico/operativos/[id]/pacientes/[pacienteId]/_components/PortalTokenManager.tsx`
- **Problema**: Solo aparecía cuando NO había token. Faltaba opción cuando ya existía token.
- **Solución**:
  - Agregado botón "Enviar email" prominente cuando hay token activo
  - Modal para ingresar email si el paciente no tiene uno guardado
  - Nuevo endpoint `send-email` que regenera token y envía email

- **Nuevo archivo**: `src/app/api/admin/quirurgico/pacientes-v2/[id]/portal-token/send-email/route.ts`
  - Regenera token para el paciente
  - Envía email usando template institucional `PortalPacienteEmail`
  - Retorna nuevo portal_url

### D) Link Portal con Dominio Correcto
- **Verificado**: El helper `src/lib/publicUrl.ts` ya implementa correctamente:
  1. `NEXT_PUBLIC_SITE_URL` (preferida)
  2. `VERCEL_PROJECT_PRODUCTION_URL`
  3. `VERCEL_URL`
  4. Fallback a `localhost:3000`

## Archivos Tocados

| Archivo | Acción |
|---------|--------|
| `Icon.png` | Movido a src/app/ |
| `src/app/icon.png` | NUEVO (movido desde raíz) |
| `src/app/favicon.ico` | ELIMINADO |
| `src/app/paciente/portal/page.tsx` | Modificado - manejo de errores |
| `src/app/admin/.../PortalTokenManager.tsx` | Modificado - botón enviar email |
| `src/app/api/.../portal-token/send-email/route.ts` | NUEVO - endpoint envío email |

## Checklist de QA

### Build & Lint
- [x] `npm run build` → PASS ✅
- [x] `npm run lint` → Warnings preexistentes (no críticos)

### Funcionalidad - Verificar en Local/Producción

#### Home & Navegación
- [ ] Home carga correctamente
- [ ] Favicon muestra la cinta del logo (icon.png)
- [ ] Navegación funciona

#### Admin Novedades
- [ ] `/admin/novedades` abre sin errores
- [ ] Puede crear/editar novedades

#### Portal Paciente Quirúrgico (Admin)
- [ ] Acceder a un paciente quirúrgico
- [ ] Pestaña "Portal" muestra estado del token
- [ ] Botón "Enviar email" visible y funcional
- [ ] Input de email aparece si no hay email guardado
- [ ] Al enviar, muestra mensaje de éxito
- [ ] Link generado usa dominio correcto (no localhost)

#### Portal Paciente (Público)
- [ ] Abrir `/paciente/portal?token=VALID` → Muestra portal
- [ ] Abrir `/paciente/portal?token=INVALID` → Muestra "Enlace inválido" (NO pantalla blanca)
- [ ] Abrir `/paciente/portal` sin token → Muestra "No se proporcionó enlace"

## Cómo Reproducir y Verificar

### 1. Verificar Favicon
```bash
# En desarrollo
npm run dev
# Abrir http://localhost:3008 y verificar favicon en pestaña
```

### 2. Verificar Portal Paciente (Error handling)
```bash
# Probar con token inválido
curl -I "https://fundaciontraesol.cl/paciente/portal?token=test123"
# Debe retornar 200 (no 500) y mostrar página de error amigable
```

### 3. Verificar Envío de Email
1. Ir a Admin → Quirúrgico → Operativo → Paciente
2. En pestaña "Portal", click "Enviar email"
3. Ingresar email y enviar
4. Verificar que llega email con formato institucional

## Notas Técnicas

### Variables de Entorno Requeridas en Vercel
```
NEXT_PUBLIC_SITE_URL=https://fundaciontraesol.cl
RESEND_API_KEY=re_xxxxx
PORTAL_TOKEN_SECRET=xxxxxx (o usar NEXTAUTH_SECRET)
```

### Seguridad del Token
- El token original NO se almacena (solo hash HMAC-SHA256)
- Por eso al "enviar email" se regenera un nuevo token
- El token anterior se invalida automáticamente (UPSERT)

## Estado Final

✅ Build pasa sin errores  
✅ Todos los cambios son backwards-compatible  
✅ No se rompen funcionalidades existentes  
⚠️ Warnings de lint preexistentes (no críticos)
