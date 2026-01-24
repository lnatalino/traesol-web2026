# Resultados QA Funcional - Admin + Público

**Fecha:** 22 de enero de 2026  
**TypeScript:** ✅ Compila sin errores

---

## A) Operativos (Admin)

| Flujo | Estado | Notas |
|-------|--------|-------|
| 1. Crear operativo | ✅ PASS | Form en `/admin/operativos/nuevo` → API POST `/api/admin/operativos/create` → redirect a lista |
| 2. Editar operativo | ✅ PASS | Form en `/admin/operativos/[id]/editar` → API POST `/api/admin/operativos/update` |
| 3. Publicar/Despublicar | ✅ PASS | Select de estado en form (borrador/publicado/cerrado/finalizado), badge se actualiza |
| 4. Cerrar/Finalizar | ✅ PASS | Estado "cerrado" disponible en dropdown, filtros respetan el estado |
| 5. Eliminar | ✅ PASS | API POST `/api/admin/operativos/delete`, redirect con mensaje |

**Archivos clave:**
- [src/app/admin/operativos/page.tsx](../src/app/admin/operativos/page.tsx) - Lista
- [src/app/admin/operativos/_form.tsx](../src/app/admin/operativos/_form.tsx) - Formulario reutilizable
- [src/app/admin/operativos/[id]/page.tsx](../src/app/admin/operativos/[id]/page.tsx) - Detalle
- [src/app/api/admin/operativos/create/route.ts](../src/app/api/admin/operativos/create/route.ts)
- [src/app/api/admin/operativos/delete/route.ts](../src/app/api/admin/operativos/delete/route.ts)

---

## B) Postulaciones / Inscripciones (Admin)

| Flujo | Estado | Notas |
|-------|--------|-------|
| 1. Ver postulaciones por operativo | ✅ PASS | Sección en `/admin/operativos/[id]` con tablas separadas |
| 2. Aceptar postulación | ✅ PASS | Form → `/api/admin/inscripciones/update` con estado "aprobado" |
| 3. Rechazar postulación | ✅ PASS | Form → `/api/admin/inscripciones/update` con estado "rechazado" |
| 4. Mensajes/toasts | ✅ PASS | Redirect con `?success=` y `?error=` query params |
| 5. Vista centralizada | ✅ PASS | `/admin/inscripciones` muestra pendientes agrupados por operativo |

**Archivos clave:**
- [src/app/admin/inscripciones/page.tsx](../src/app/admin/inscripciones/page.tsx)
- [src/app/admin/operativos/[id]/page.tsx](../src/app/admin/operativos/[id]/page.tsx) - PostulacionesTable
- [src/app/api/admin/inscripciones/update/route.ts](../src/app/api/admin/inscripciones/update/route.ts)

---

## C) Invitaciones (Admin)

| Flujo | Estado | Notas |
|-------|--------|-------|
| 1. Selector de operativo | ✅ PASS | Filtra solo operativos abiertos (publicados + fechas vigentes) |
| 2. Invitar voluntarios | ✅ PASS | POST `/api/admin/invitaciones` con JSON body |
| 3. Historial invitaciones | ✅ PASS | InvitacionesHistorial muestra por operativo |
| 4. Aceptar/Rechazar invitación | ✅ PASS | Se gestiona igual que postulaciones vía inscripciones |
| 5. Notice messages | ✅ PASS (FIX APLICADO) | Ahora se muestra `?notice=` en UI |

**Bug corregido:**
- **Archivo:** [src/app/admin/operativos/[id]/page.tsx](../src/app/admin/operativos/[id]/page.tsx#L256)
- **Problema:** El parámetro `notice` del API de invitaciones no se mostraba
- **Fix:** Agregada lectura de `noticeMessage` y banner ámbar para mostrarlo

**Archivos clave:**
- [src/app/admin/invitaciones/page.tsx](../src/app/admin/invitaciones/page.tsx)
- [src/app/admin/invitaciones/OperativoSelector.tsx](../src/app/admin/invitaciones/OperativoSelector.tsx)
- [src/app/admin/invitaciones/InviteManager.tsx](../src/app/admin/invitaciones/InviteManager.tsx)
- [src/app/api/admin/invitaciones/route.ts](../src/app/api/admin/invitaciones/route.ts)

---

## D) Voluntarios (Admin)

| Flujo | Estado | Notas |
|-------|--------|-------|
| 1. Lista con búsqueda | ✅ PASS (FIX APLICADO) | Ahora incluye búsqueda por Instagram |
| 2. Detalle voluntario | ✅ PASS | `/admin/voluntarios/[id]` con ficha completa |
| 3. Editar datos | ✅ PASS | `/admin/voluntarios/[id]/editar` → API update |
| 4. Historial participaciones | ✅ PASS | Muestra inscripciones confirmadas, postulaciones e invitaciones |
| 5. Export CSV | ✅ PASS | `/api/admin/voluntarios/export` con filtros |

**Bug corregido:**
- **Archivo:** [src/lib/voluntariosAdmin.ts](../src/lib/voluntariosAdmin.ts#L138)
- **Problema:** El placeholder decía "Instagram" pero no buscaba en ese campo
- **Fix:** Agregada cláusula `instagram.ilike.${pattern}` al array de búsqueda

**Archivos clave:**
- [src/app/admin/voluntarios/page.tsx](../src/app/admin/voluntarios/page.tsx)
- [src/app/admin/voluntarios/VoluntariosTable.tsx](../src/app/admin/voluntarios/VoluntariosTable.tsx)
- [src/app/admin/voluntarios/[id]/page.tsx](../src/app/admin/voluntarios/[id]/page.tsx)
- [src/lib/voluntariosAdmin.ts](../src/lib/voluntariosAdmin.ts)

---

## E) Mensajería (Admin)

| Flujo | Estado | Notas |
|-------|--------|-------|
| 1. Selección audiencia | ✅ PASS | 3 modos: todos, por operativo, personalizado |
| 2. Envío correo | ✅ PASS | POST `/api/admin/mensajeria/enviar` con batching |
| 3. Resumen enviados/fallidos | ✅ PASS | Se muestra en redirect con query params |
| 4. Historial mensajes | ⚠️ NO EXISTE | No hay persistencia de mensajes enviados |

**Nota:** El historial de mensajes no existe (sin tabla en BD). Es una mejora futura, no un bug.

**Archivos clave:**
- [src/app/admin/mensajeria/page.tsx](../src/app/admin/mensajeria/page.tsx)
- [src/app/admin/mensajeria/MessagingForm.tsx](../src/app/admin/mensajeria/MessagingForm.tsx)
- [src/app/api/admin/mensajeria/enviar/route.ts](../src/app/api/admin/mensajeria/enviar/route.ts)
- [src/lib/mensajeriaRecipients.ts](../src/lib/mensajeriaRecipients.ts)

---

## F) Público

| Flujo | Estado | Notas |
|-------|--------|-------|
| 1. Postulación voluntario | ✅ PASS | `/postular` con form completo y validaciones |
| 2. Lista operativos públicos | ✅ PASS | `/operativos` muestra solo estado "publicado" |
| 3. Página de privacidad | ✅ PASS | `/privacidad` accesible desde navbar y footer |

**Archivos clave:**
- [src/app/postular/page.tsx](../src/app/postular/page.tsx)
- [src/app/operativos/page.tsx](../src/app/operativos/page.tsx)
- [src/app/privacidad/page.tsx](../src/app/privacidad/page.tsx)
- [src/components/Navbar.tsx](../src/components/Navbar.tsx)
- [src/components/Footer.tsx](../src/components/Footer.tsx)

---

## Resumen de Fixes Aplicados

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| 1 | `src/lib/voluntariosAdmin.ts` | Búsqueda no incluía Instagram | Agregada cláusula `instagram.ilike.${pattern}` |
| 2 | `src/app/admin/operativos/[id]/page.tsx` | `notice` de invitaciones no se mostraba | Agregada lectura y renderizado de `noticeMessage` |

---

## Pendientes / Mejoras Futuras (NO bugs)

1. **Historial de mensajería:** Crear tabla y UI para auditoría de correos enviados
2. **Modal de confirmación pre-envío masivo:** Prevenir envíos accidentales
3. **Rate limiting server-side:** Para proteger el endpoint de mensajería

---

## Verificación Final

```bash
# TypeScript compila sin errores
npx tsc --noEmit
# ✅ OK (sin output = sin errores)
```
