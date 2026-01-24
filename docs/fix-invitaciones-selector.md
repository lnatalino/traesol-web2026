# Fix: Selector de Operativos en Invitaciones

**Fecha:** 2026-01-24  
**Bug:** El selector de operativos en Admin → Invitaciones mostraba "No hay operativos publicados" aunque existían operativos publicados y vigentes.

## Diagnóstico

### Problema Raíz

La función `isOperativoAbierto()` usada para filtrar operativos tiene esta lógica:

```typescript
// Si now < inicio (fecha actual es ANTERIOR al inicio), retorna false
if (typeof inicio === "number" && now < inicio) return false;
```

Esto está diseñado para **inscripciones** (permite inscribirse mientras el operativo está en curso), pero para **invitaciones** necesitamos lo opuesto: operativos **FUTUROS** (donde fecha_inicio es después de ahora).

### Lógica Incorrecta vs Correcta

| Caso | `isOperativoAbierto` | `isOperativoParaPublico` |
|------|---------------------|-------------------------|
| Operativo futuro (fecha > hoy) | ❌ false | ✅ true |
| Operativo en curso (inicio < hoy < fin) | ✅ true | ❌ false |
| Operativo pasado (fecha < hoy) | ❌ false | ❌ false |

Para invitaciones, queremos enviar invitaciones a operativos **futuros**, no a los que ya están en curso.

## Solución

### Archivo: `src/app/admin/invitaciones/page.tsx`

**Antes:**
```typescript
import { isOperativoAbierto } from "@/lib/operativosShared";
// ...
const referenceDate = new Date();
return ((data ?? []) as InviteOperativo[]).filter((item) => isOperativoAbierto(item, referenceDate));
```

**Después:**
```typescript
import { isOperativoParaPublico, getNowInChile } from "@/lib/operativosShared";
// ...
const referenceDate = getNowInChile();
return ((data ?? []) as InviteOperativo[]).filter((item) => isOperativoParaPublico(item, referenceDate));
```

### Cambios Adicionales

- Actualizado el mensaje de error en `OperativoSelector.tsx` para ser más claro:
  - Antes: "...estado 'publicado' y fechas vigentes"
  - Después: "...publicado con fecha de inicio futura"

## Definición de "Disponible para Invitar"

Un operativo aparece en el selector de invitaciones cuando:

1. ✅ Estado = "publicado" (no borrador, cerrado ni finalizado)
2. ✅ Fecha de inicio >= hoy (operativo futuro o que empieza hoy)
3. ✅ No está auto-finalizado por fecha pasada

## Verificación

```bash
npm run build  # ✅ Pasa
npm run dev    # ✅ Funciona
```

### Casos de Prueba

| Operativo | ¿Aparece? |
|-----------|----------|
| Publicado, fecha futura | ✅ Sí |
| Publicado, fecha hoy | ✅ Sí |
| Publicado, fecha pasada | ❌ No |
| Cerrado, cualquier fecha | ❌ No |
| Borrador, fecha futura | ❌ No |
