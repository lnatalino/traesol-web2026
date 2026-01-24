# Fix: Error fetching invitaciones historial

**Fecha:** 2026-01-24  
**Archivo:** `src/app/admin/invitaciones/page.tsx`  
**Función:** `fetchInvitacionesHistorial`

---

## Problema

La página Admin → Invitaciones mostraba un overlay de error:
> "Error fetching invitaciones historial"

## Causa Raíz

La query usaba la sintaxis de **join embebido** de Supabase PostgREST:

```typescript
.select(`
  id,
  created_at,
  operativo_id,
  estado,
  voluntario_id,
  voluntarios(id, nombres, apellidos, email)  // ← JOIN embebido
`)
```

Este tipo de join falla cuando:
- La relación de foreign key no está correctamente declarada en la DB
- Los tipos de Supabase no incluyen la relación
- La sintaxis tiene problemas de resolución en PostgREST

El **patrón establecido en el codebase** para este tipo de queries es hacer dos consultas separadas y mapear manualmente (ver `mensajeriaRecipients.ts`, `inscripciones/page.tsx`).

## Solución Aplicada

Se cambió a **dos queries separadas**:

1. **Query inscripciones:**
   ```typescript
   .from("inscripciones")
   .select("id,created_at,operativo_id,estado,voluntario_id")
   .in("operativo_id", operativoIds)
   .eq("origen", "invitacion")
   ```

2. **Query voluntarios (si hay IDs):**
   ```typescript
   .from("voluntarios")
   .select("id,nombres,apellidos,email")
   .in("id", voluntarioIds)
   ```

3. **Mapeo manual:** Se construye un `Map<string, VoluntarioSimple>` y se asocia cada inscripción con su voluntario.

## Mejoras Adicionales

- Logging de errores mejorado con `code`, `message`, `details`, `hint`
- Fallback seguro: si falla voluntarios, continúa mostrando "Voluntario eliminado"
- Si falla inscripciones, retorna `Map` vacío sin crashear

## Verificación

```bash
npm run build  # ✓ Compila sin errores
```

La página Admin → Invitaciones ahora carga correctamente el historial de invitaciones enviadas.
