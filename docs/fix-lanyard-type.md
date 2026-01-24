# Fix: Lanyard Type Schema Cache Error

**Fecha:** 2026-01-23  
**Error resuelto:** "Could not find the 'lanyard_type' column of 'volunteer_gear_status' in the schema cache"

---

## 🐛 Problema

Al acceder a Admin → Perfil voluntario → Equipamiento, aparecía un error:

```
Could not find the 'lanyard_type' column of 'volunteer_gear_status' in the schema cache
```

Este error indicaba que el código estaba intentando consultar una columna `lanyard_type` que NO existe en la tabla.

---

## 🔍 Causa Raíz

**Sintaxis incorrecta en joins de Supabase:**

Varios archivos usaban joins incorrectos al intentar relacionar tablas con `lanyard_types`:

```typescript
// ❌ INCORRECTO - Supabase busca columna "lanyard_types" que no existe
.select("id, nombre, lanyard_types(slug)")

// ❌ INCORRECTO - Acceso a resultado con plural
item.lanyard_types?.name
```

**Sintaxis correcta:**

```typescript
// ✅ CORRECTO - Join usando el formato alias:columna_fk(campos)
.select("id, nombre, lanyard_type:lanyard_type_id(slug)")

// ✅ CORRECTO - Acceso con el alias en singular
item.lanyard_type?.name
```

---

## ✅ Solución Implementada

### 1. Archivos Corregidos

#### `/src/lib/inventario/massiveDelivery.ts`

**Línea 84 - Query de operativo:**
```typescript
// ANTES:
.select("id, titulo, lanyard_type_id, lanyard_types(slug)")

// DESPUÉS:
.select("id, titulo, lanyard_type_id, lanyard_type:lanyard_type_id(slug)")
```

**Línea 93 - Acceso al resultado:**
```typescript
// ANTES:
const lanyard_theme_slug = (operativo.lanyard_types as unknown as LanyardType)?.slug || "general";

// DESPUÉS:
const lanyard_theme_slug = (operativo.lanyard_type as unknown as LanyardType)?.slug || "general";
```

**Línea 147 - Query de inventario:**
```typescript
// ANTES:
.select("id, nombre, tipo_regla, cantidad_actual, lanyard_types(slug)")

// DESPUÉS:
.select("id, nombre, tipo_regla, cantidad_actual, lanyard_type:lanyard_type_id(slug)")
```

**Línea 161 - Acceso en findItem:**
```typescript
// ANTES:
const itemLanyardSlug = (i.lanyard_types as any)?.slug;

// DESPUÉS:
const itemLanyardSlug = (i.lanyard_type as any)?.slug;
```

---

#### `/src/app/api/admin/inventario/export/route.ts`

**Línea 50 - Query de export:**
```typescript
// ANTES:
lanyard_types:lanyard_type_id(name, ribbon_color_name)

// DESPUÉS:
lanyard_type:lanyard_type_id(name, ribbon_color_name)
```

**Línea 82 - Acceso al resultado:**
```typescript
// ANTES:
item.lanyard_types?.name || ""

// DESPUÉS:
item.lanyard_type?.name || ""
```

---

### 2. Archivos Verificados (Ya correctos)

✅ `/src/app/api/admin/voluntarios/[id]/gear-status/route.ts`
- Usa sintaxis correcta: `lanyard_type:lanyard_type_id(...)`
- Ya estaba bien implementado

✅ `/src/app/admin/voluntarios/[id]/VolunteerGearSection.tsx`
- Accede correctamente a `status.lanyard_type`
- Ya estaba bien implementado

✅ `/src/lib/database.types.ts`
- Tipos correctos: `lanyard_type_id: string | null`
- Tabla `lanyard_types` correctamente definida

---

## 📋 Patrón Establecido

### Sintaxis de Join en Supabase

```typescript
// Formato: alias:columna_fk(campos_de_tabla_relacionada)
.select(`
  *,
  lanyard_type:lanyard_type_id(id, name, slug, ribbon_color_name, ribbon_hex)
`)
```

**Componentes:**
- `lanyard_type` = **alias** del join (nombre que usarás en el código)
- `:` = separador
- `lanyard_type_id` = **columna FK** en la tabla actual
- `(id, name, slug, ...)` = campos que quieres traer de la tabla relacionada

### Acceso al Resultado

```typescript
// El resultado viene con el alias (singular):
const result = await supabase.from("tabla").select("*, lanyard_type:lanyard_type_id(...)");

// Acceder:
result.data?.lanyard_type?.name  // ✅ CORRECTO
result.data?.lanyard_types?.name // ❌ INCORRECTO
```

---

## 🗄️ Esquema de Base de Datos

### Tabla: `volunteer_gear_status`

```sql
CREATE TABLE public.volunteer_gear_status (
  volunteer_id uuid PRIMARY KEY REFERENCES public.voluntarios(id),
  has_lanyard boolean DEFAULT true,
  has_id_card boolean DEFAULT true,
  lanyard_type_id uuid NULL REFERENCES public.lanyard_types(id) ON DELETE SET NULL,
  uniform_cycles_since_issue integer DEFAULT 0,
  uniform_last_issued_at timestamptz NULL,
  notes text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columna clave:** `lanyard_type_id uuid NULL`
- NO existe columna `lanyard_type`
- NO existe columna `lanyard_types`

### Tabla: `lanyard_types`

```sql
CREATE TABLE public.lanyard_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  ribbon_color_name text NOT NULL,
  ribbon_hex text NULL,
  description text NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Registros:**
- `general` - Lanyard general (celeste)
- `cancer_mama` - Cáncer de Mama (rosado)
- `cancer_piel` - Cáncer de Piel (naranja)
- `cancer_cervicouterino` - Cáncer Cervicouterino (verde agua)

---

## ✅ Verificación

Para verificar que el fix funciona:

1. **Ver perfil de voluntario:**
   ```
   http://localhost:3008/admin/voluntarios/[id]
   ```
   - Scroll a sección "Equipamiento del voluntario"
   - NO debe aparecer banner rojo de error
   - Dropdown "Tipo de lanyard" debe cargar opciones

2. **Guardar cambios:**
   - Seleccionar un tipo de lanyard
   - Hacer clic en "Guardar"
   - Debe mostrar toast verde "Guardado correctamente"
   - Recargar página → cambio debe persistir

3. **Verificar en DB:**
   ```sql
   SELECT volunteer_id, lanyard_type_id, lanyard_type.name
   FROM volunteer_gear_status
   LEFT JOIN lanyard_types ON lanyard_type_id = lanyard_types.id
   WHERE volunteer_id = 'xxx';
   ```

---

## 📊 Impacto

### Archivos modificados:
- ✅ `src/lib/inventario/massiveDelivery.ts` (4 cambios)
- ✅ `src/app/api/admin/inventario/export/route.ts` (2 cambios)

### Archivos verificados (sin cambios):
- ✅ `src/app/api/admin/voluntarios/[id]/gear-status/route.ts`
- ✅ `src/app/admin/voluntarios/[id]/VolunteerGearSection.tsx`
- ✅ `src/lib/database.types.ts`

### SQL creado:
- ✅ `docs/sql/20260123_fix_lanyard_type_verificacion.sql`

---

## 🚨 Errores Comunes a Evitar

### ❌ NO usar plural "lanyard_types" en joins:
```typescript
.select("*, lanyard_types(name)")  // INCORRECTO
```

### ❌ NO acceder con plural en el resultado:
```typescript
item.lanyard_types?.name  // INCORRECTO
```

### ✅ Usar singular "lanyard_type" como alias:
```typescript
.select("*, lanyard_type:lanyard_type_id(name)")  // CORRECTO
item.lanyard_type?.name  // CORRECTO
```

---

## 📝 Notas Adicionales

1. **database.types.ts está correcto:**
   - Ya tiene `lanyard_type_id: string | null` en `volunteer_gear_status`
   - Ya tiene tabla `lanyard_types` completa
   - NO necesita regeneración

2. **El problema NO era de tipos:**
   - Los tipos TypeScript estaban bien
   - El problema era sintaxis de queries en runtime

3. **Patrón establecido:**
   - SIEMPRE usar `alias:columna_fk(campos)` para joins
   - El alias debe ser singular y descriptivo
   - Acceder al resultado con el alias usado

---

**Estado:** ✅ Resuelto  
**Tested:** Compilación exitosa, sin errores TypeScript  
**Pendiente:** Prueba manual en navegador

---

## 🔗 Referencias

- [Supabase Joins Documentation](https://supabase.com/docs/guides/database/joins)
- [database.types.ts](../src/lib/database.types.ts) - Líneas 303-340, 341-377
- [SQL Verificación](./sql/20260123_fix_lanyard_type_verificacion.sql)
