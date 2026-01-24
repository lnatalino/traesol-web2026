# Fix: Token del Portal del Paciente

> Documento de corrección para el bug de regeneración de tokens.
> Fecha: 2026-01-24

## Problema Original

### Síntoma
- Al generar enlace de acceso al portal del paciente, el link funciona correctamente
- Al **revocar** el acceso y volver a generar un token nuevo, fallaba con error
- El paciente quedaba sin acceso

### Causa Raíz
La tabla `paciente_portal_tokens` tiene un constraint `UNIQUE` sobre `paciente_id`:

```sql
paciente_id uuid NOT NULL UNIQUE REFERENCES public.pacientes(id) ON DELETE CASCADE
```

El código anterior hacía:
1. `UPDATE ... SET revoked_at = now()` para revocar
2. `INSERT ...` para crear nuevo token

El paso 2 fallaba porque ya existía un registro con ese `paciente_id` (el revocado).

## Solución Implementada

### Cambio en `src/lib/quirurgico/portalTokens.ts`

**Antes (problemático):**
```typescript
// Revocar token existente si hay uno
await supabaseService
  .from("paciente_portal_tokens")
  .update({ revoked_at: new Date().toISOString() })
  .eq("paciente_id", pacienteId)
  .is("revoked_at", null);

// Crear nuevo token (FALLA si ya existe registro)
const { error } = await supabaseService
  .from("paciente_portal_tokens")
  .insert({ ... });
```

**Después (correcto):**
```typescript
// UPSERT: crear nuevo token o actualizar existente
const { error } = await supabaseService
  .from("paciente_portal_tokens")
  .upsert(
    {
      paciente_id: pacienteId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      created_by: createdBy || "system",
      revoked_at: null,     // Limpiar revocación previa
      last_used_at: null,   // Resetear uso
      created_at: new Date().toISOString(),
    },
    { 
      onConflict: "paciente_id",
      ignoreDuplicates: false
    }
  );
```

### Comportamiento del UPSERT

| Escenario | Acción |
|-----------|--------|
| No existe token para el paciente | Crea nuevo registro |
| Existe token activo | Actualiza con nuevo hash, resetea campos |
| Existe token revocado | Actualiza con nuevo hash, limpia `revoked_at` |

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| [src/lib/quirurgico/portalTokens.ts](../src/lib/quirurgico/portalTokens.ts) | Cambio de INSERT a UPSERT en `createPortalToken()` |

## Flujo de QA

### Escenario 1: Primer token
1. ✅ Crear paciente nuevo
2. ✅ Generar token → debe crear registro y devolver URL válida
3. ✅ Verificar que el link funciona

### Escenario 2: Regenerar sin revocar
1. ✅ Con paciente existente que ya tiene token
2. ✅ Generar nuevo token → debe actualizar el registro
3. ✅ Link anterior NO debe funcionar (hash cambió)
4. ✅ Link nuevo SÍ debe funcionar

### Escenario 3: Revocar y regenerar (el bug original)
1. ✅ Con paciente que tiene token activo
2. ✅ Revocar token → debe marcar `revoked_at`
3. ✅ Generar nuevo token → **NO debe fallar**
4. ✅ Link nuevo debe funcionar
5. ✅ Portal muestra datos correctos del paciente

### Escenario 4: Verificar consistencia
1. ✅ Solo puede existir UN registro por paciente (constraint UNIQUE)
2. ✅ `revoked_at = null` indica token activo
3. ✅ Expiración respetada

## Notas de Seguridad

- El token RAW nunca se guarda en la base de datos
- Solo se guarda el hash HMAC-SHA256 del token
- El token se genera con `crypto.randomBytes(32)`
- La URL se construye con el token raw, que solo se devuelve una vez al admin

## Endpoint Relacionado

```
POST /api/admin/quirurgico/pacientes-v2/[id]/portal-token
```

Respuesta exitosa:
```json
{
  "success": true,
  "portal_url": "https://fundaciontraesol.cl/paciente/portal?token=abc123...",
  "expires_at": "2026-02-23T12:00:00.000Z"
}
```

---

*Fix implementado: 2026-01-24*
*Build verificado: ✅*
