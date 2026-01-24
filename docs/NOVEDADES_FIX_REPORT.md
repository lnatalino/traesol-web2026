# NOVEDADES FIX REPORT

**Fecha:** 2026-01-24  
**Sprint:** Unificación Sistema de Novedades

---

## 1. Diagnóstico del Problema

### Síntomas Reportados:
- Novedades publicadas SÍ aparecen en el público pero NO en el Admin
- Al crear nuevas novedades, a veces dice "ya existe" pero no aparece en ningún lado
- Inconsistencia entre lo que muestra carrusel, página de novedades, y admin

### Causa Raíz Identificada:

#### A) Diferencia de Clientes Supabase
- **Admin** usa `supabaseService` con `SERVICE_ROLE_KEY` → bypasea RLS
- **Público** usa `createSupabaseServer` con `ANON_KEY` → sujeto a RLS

Si las políticas RLS no estaban correctamente configuradas para `anon`, el público no podía ver ciertas novedades.

#### B) Campo `en_novedades` Inexistente
El sistema solo tenía:
- `publicado` - controla visibilidad general
- `en_carrusel` - controla si aparece en carrusel home

**Faltaba** un campo para controlar si la novedad aparece en la página `/novedades`, haciendo imposible tener una novedad **solo** en carrusel.

#### C) Bug "Ya Existe"
El error ocurre por constraint `UNIQUE` en el campo `slug`. Cuando se intenta insertar con un slug duplicado, Supabase retorna error código `23505` (unique_violation), pero el código no lo manejaba específicamente, mostrando un error genérico.

---

## 2. Solución Implementada

### Archivos Modificados:

| Archivo | Cambio |
|---------|--------|
| `src/lib/novedades.ts` | Agregar filtro `.eq("en_novedades", true)` en `getUltimasNovedades()` y `getPublicNovedades()` |
| `src/app/admin/novedades/page.tsx` | Agregar campo `en_novedades` al tipo y query, nuevo stat tile |
| `src/app/admin/novedades/NovedadesTable.tsx` | Agregar columna y toggle para `en_novedades` |
| `src/app/admin/novedades/_form.tsx` | Agregar checkbox "En novedades" con default `true` |
| `src/app/admin/novedades/[id]/editar/page.tsx` | Agregar `en_novedades` al tipo y query |
| `src/app/api/admin/novedades/create/route.ts` | Agregar `en_novedades`, manejar error de slug duplicado |
| `src/app/api/admin/novedades/update/route.ts` | Agregar `en_novedades`, manejar error de slug duplicado |
| `src/app/api/admin/novedades/toggle-novedades/route.ts` | **NUEVO** endpoint para toggle |

### Migración SQL:
Ver: `docs/sql/20260124_novedades_unificado.sql`

La migración:
1. Agrega columna `en_novedades` con default `TRUE`
2. Establece defaults correctos: `publicado=FALSE`, `en_carrusel=FALSE`, `en_novedades=TRUE`
3. Actualiza registros existentes con valores nulos
4. Crea índices optimizados para queries públicas
5. Configura RLS:
   - `anon`: solo SELECT donde `publicado=TRUE`
   - `authenticated`: acceso completo
   - `service_role`: acceso completo

---

## 3. Nuevo Comportamiento del Sistema

### Campos de Control:
| Campo | Default | Descripción |
|-------|---------|-------------|
| `publicado` | `false` | Si está visible en el sitio público |
| `en_carrusel` | `false` | Si aparece en carrusel de Home |
| `en_novedades` | `true` | Si aparece en página /novedades |

### Combinaciones Posibles:
| publicado | en_carrusel | en_novedades | Resultado |
|-----------|-------------|--------------|-----------|
| ❌ | ❌ | ❌ | Borrador, no visible |
| ✅ | ✅ | ❌ | Solo en carrusel Home |
| ✅ | ❌ | ✅ | Solo en /novedades |
| ✅ | ✅ | ✅ | En ambos lugares |
| ❌ | ✅ | ✅ | Borrador (no visible aunque tenga flags) |

### Queries Públicas:
- **Carrusel Home**: `publicado=true AND en_carrusel=true`
- **Página /novedades**: `publicado=true AND en_novedades=true`

---

## 4. Instrucciones de Despliegue

### Paso 1: Ejecutar Migración SQL
```bash
# Opción A: Desde Supabase Dashboard
# SQL Editor → Pegar contenido de docs/sql/20260124_novedades_unificado.sql → Run

# Opción B: Con CLI
supabase db execute --file docs/sql/20260124_novedades_unificado.sql
```

### Paso 2: Verificar Migración
```sql
-- Verificar que la columna existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'novedades' AND column_name = 'en_novedades';

-- Verificar RLS
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'novedades';
```

### Paso 3: Deploy del Código
```bash
git add -A
git commit -m "fix: unificar sistema de novedades Admin + Público"
git push
```

---

## 5. Checklist de QA

Ver archivo `docs/qa/novedades-qa-checklist.md` para el checklist completo de pruebas manuales.

---

## 6. Notas Adicionales

- El campo `en_novedades` tiene default `TRUE` para que novedades existentes sigan apareciendo donde estaban
- La UI del Admin mantiene el estilo existente (cards/islas, StatTiles)
- El manejo de error de slug duplicado ahora muestra mensaje claro: "El slug X ya existe"
- No se modificó ninguna funcionalidad fuera del módulo de novedades
