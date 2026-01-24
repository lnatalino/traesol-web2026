# Reporte de Estabilización - Build & TypeScript Fixes

**Fecha:** 2026-01-24  
**Objetivo:** Hacer que `npm run dev` y `npm run build` funcionen sin errores de TypeScript

## Resumen Ejecutivo

✅ **Build pasa correctamente** (~20-25 segundos)  
✅ **Dev server inicia sin crash** (puerto 3008)  
⚠️ **Warning en runtime** (columna `atenciones_salud` no existe en DB - no afecta build)

---

## Problemas Raíz Identificados y Solucionados

### 1. Path Resolution: `@/lib/quirurgico`

**Problema:** El path `@/lib/quirurgico` resolvía al archivo `quirurgico.ts` en lugar de la carpeta `quirurgico/`.

**Solución:** Se modificó `quirurgico.ts` para re-exportar explícitamente desde `./quirurgico/index`.

**Archivos modificados:**
- `src/lib/quirurgico.ts`

---

### 2. Server/Client Boundary: portalSession

**Problema:** `portalSession.ts` usa `next/headers` (server-only) pero era exportado en barrel exports que llegaban a componentes client.

**Solución:** Removido de barrel exports. Ahora requiere import directo:
```typescript
import { createPortalSession } from "@/lib/quirurgico/portalSession"
```

**Archivos modificados:**
- `src/lib/quirurgico/index.ts`
- `src/app/paciente/portal/page.tsx`
- `src/app/api/paciente/portal/verify/route.ts`
- `src/app/api/admin/quirurgico/pacientes-v2/[id]/portal-token/route.ts`

---

### 3. Supabase Types: Tablas no definidas en `database.types.ts`

**Problema:** Muchas tablas del proyecto no están en el archivo de tipos generado de Supabase, causando errores de tipo `never` en queries.

**Solución:** Cast pattern aplicado: `.from("tabla" as unknown as never)`

**Tablas afectadas:**
- `pacientes`
- `paciente_contactos`
- `paciente_requerimientos`
- `paciente_archivos`
- `paciente_portal_tokens`
- `operativos_quirurgicos`
- `postulaciones_equipo_quirurgico`
- `inventario_deliveries`
- `inventario_items`
- `volunteer_gear_status`

**Archivos modificados:**
- `src/lib/quirurgico/operativosQuirurgicosService.ts`
- `src/lib/quirurgico/pacientesService.ts`
- `src/lib/quirurgico/portalTokens.ts`
- `src/app/api/admin/inventario/deliveries/route.ts`
- `src/app/api/admin/voluntarios/[id]/gear-status/route.ts`
- `src/app/api/admin/voluntarios/register-uniform/route.ts`
- `src/app/api/paciente/contactos/route.ts`
- `src/app/api/paciente/me/route.ts`
- `src/app/api/paciente/update/route.ts`
- `src/app/api/paciente/upload/route.ts`
- `src/app/paciente/portal/_components/PortalContenido.tsx`

---

### 4. Type Export Names: Tipos inexistentes en barrel exports

**Problema:** `quirurgico.ts` exportaba tipos con nombres que no existían (ej: `PacienteCreateInput` en vez de `PacienteInsert`).

**Solución:** Corregidos los nombres de tipos a los reales definidos en `types.ts`.

**Cambios:**
- `PacienteCreateInput` → `PacienteInsert`
- `PacienteUpdateInput` → `PacienteUpdate`
- `ContactoCreateInput` → `PacienteContactoInsert`
- `ContactoUpdateInput` → `PacienteContactoUpdate`
- `RequerimientoCreateInput` → `PacienteRequerimientoInsert`
- `RequerimientoUpdateInput` → `PacienteRequerimientoUpdate`
- `ArchivoCreateInput` → `PacienteArchivoInsert`
- `OperativoQuirurgicoCreateInput` → `OperativoQuirurgicoInsert`

---

### 5. Property Mismatches: MassInventoryDelivery

**Problema:** Componente usaba propiedades que no existían en el tipo `DeliverySimulation`.

**Solución:** Adaptado a usar los nombres correctos de propiedades.

**Archivo modificado:**
- `src/components/admin/operativos/MassInventoryDelivery.tsx`

---

### 6. Implicit `any` en callbacks

**Problema:** TypeScript estricto requiere tipos explícitos en parámetros de callbacks.

**Solución:** Añadidos tipos explícitos con `eslint-disable-next-line` donde necesario.

**Archivo modificado:**
- `src/lib/inventario/massiveDelivery.ts`

---

### 7. Deprecated `config` export

**Problema:** Next.js 16 no soporta `export const config` para configuración de rutas.

**Solución:** Removido el export deprecado.

**Archivo modificado:**
- `src/app/api/paciente/upload/route.ts`

---

## Recomendación Futura

Para evitar los errores de tipo `never` en Supabase, se recomienda:

1. **Regenerar types de Supabase:**
   ```bash
   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
   ```

2. O crear un archivo `database-extensions.d.ts` con las definiciones de las tablas faltantes.

---

## Verificación

```bash
# Build de producción
npm run build   # ✅ Compila en ~20-25s

# Servidor de desarrollo  
npm run dev     # ✅ Inicia en puerto 3008
```
