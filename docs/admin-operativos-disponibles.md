# Operativos Disponibles - Criterio Unificado

**Fecha:** 2026-01-23  
**Estado:** ✅ Implementado y documentado

---

## 🎯 Problema Resuelto

**Bug crítico:** Los operativos publicados no aparecían en módulos de Admin (invitaciones, mensajería, etc.) aunque sí en la web pública.

**Causa:** Queries inconsistentes - algunos módulos no filtraban por `estado = "publicado"`.

---

## 📋 Campo de Estado

La tabla `operativos` usa el campo **`estado`** con estos valores posibles:

- `"borrador"` - No publicado, solo visible en gestión admin
- `"publicado"` - Visible en público y disponible para invitar
- `"cerrado"` - Inscripciones cerradas manualmente
- `"finalizado"` - Operativo terminado/archivado

---

## 🔍 Scopes de Visibilidad

### 1. **PUBLIC** (Web pública)
**Dónde:** `/operativos`, `/`, operativo detail

**Criterio:**
- `estado = "publicado"`
- `fecha_inicio >= hoy` (solo futuros)
- NOT finalizado automáticamente por fecha

**Función helper:** `isOperativoParaPublico()`

**Query ejemplo:**
```typescript
supabaseService
  .from("operativos")
  .select("*")
  .eq("estado", "publicado")
  .gte("fecha_inicio", hoy)
```

---

### 2. **ADMIN_SELECT** (Dropdowns/selects en admin)
**Dónde:** Invitaciones, Mensajería, Perfil voluntario

**Criterio:**
- `estado = "publicado"`
- NOT finalizado automáticamente por fecha (`isOperativoAbierto()`)

**Función helper:** `isOperativoAbierto()`

**Query ejemplo:**
```typescript
supabaseService
  .from("operativos")
  .select("id,titulo,fecha_inicio,fecha_fin,estado")
  .eq("estado", "publicado")
  .order("fecha_inicio", { ascending: true })
  
// Luego filtrar con isOperativoAbierto() para excluir finalizados
```

---

### 3. **ADMIN_ALL** (Gestión de operativos)
**Dónde:** `/admin/operativos`, `/admin/operativos/[id]`

**Criterio:**
- SIN filtro de estado (muestra borradores, publicados, cerrados, finalizados)

**Query ejemplo:**
```typescript
supabaseService
  .from("operativos")
  .select("*")
  .order("fecha_inicio", { ascending: false })
  // No filtrar por estado - admin ve todo
```

---

## ✅ Módulos Corregidos

### 1. Mensajería
**Archivo:** [src/app/admin/mensajeria/page.tsx](../src/app/admin/mensajeria/page.tsx)

**Antes:**
```typescript
.from("operativos")
.select("id,titulo,fecha_inicio,lugar")
.order("fecha_inicio", { ascending: false });
```

**Después:**
```typescript
.from("operativos")
.select("id,titulo,fecha_inicio,lugar")
.eq("estado", "publicado")  // ← AGREGADO
.order("fecha_inicio", { ascending: false });
```

---

### 2. Invitaciones
**Archivo:** [src/app/admin/invitaciones/page.tsx](../src/app/admin/invitaciones/page.tsx)

**Antes:**
```typescript
.from("operativos")
.select("id,titulo,fecha_inicio,fecha_fin,lugar,estado")
.order("fecha_inicio", { ascending: true });
```

**Después:**
```typescript
.from("operativos")
.select("id,titulo,fecha_inicio,fecha_fin,lugar,estado")
.eq("estado", "publicado")  // ← AGREGADO
.order("fecha_inicio", { ascending: true });
```

Luego filtra con `isOperativoAbierto()` para excluir finalizados por fecha.

---

### 3. Perfil Voluntario (Invitar a operativo)
**Archivo:** [src/app/admin/voluntarios/[id]/page.tsx](../src/app/admin/voluntarios/[id]/page.tsx)

**Ya corregido en sesión anterior:**
```typescript
.from("operativos")
.select("id,titulo,fecha_inicio,estado,fecha_fin")
.eq("estado", "publicado")  // ← YA ESTABA
.order("fecha_inicio", { ascending: true });
```

---

## 🔄 Flujo de Publicación

### Publicar un operativo:
```typescript
// Endpoint: /api/admin/operativos/publish
supabaseService
  .from("operativos")
  .update({ estado: "publicado" })
  .eq("id", operativoId);
```

**Resultado:**
- ✅ Aparece inmediatamente en web pública (si `fecha_inicio >= hoy`)
- ✅ Aparece en dropdowns de admin (invitaciones, mensajería)
- ✅ Disponible para invitar voluntarios

---

### Cerrar un operativo:
```typescript
supabaseService
  .from("operativos")
  .update({ estado: "cerrado" })
  .eq("id", operativoId);
```

**Resultado:**
- ❌ NO aparece en web pública
- ❌ NO aparece en dropdowns de admin
- ✅ Visible en gestión admin (`/admin/operativos`)

---

## 🧪 Escenarios de Prueba

### Escenario 1: Operativo borrador
- **Estado:** `borrador`
- **Visible en público:** ❌ No
- **Visible en admin_select:** ❌ No
- **Visible en admin_all:** ✅ Sí

### Escenario 2: Operativo publicado futuro
- **Estado:** `publicado`
- **Fecha:** `fecha_inicio = "2026-02-01"`
- **Hoy:** `2026-01-23`
- **Visible en público:** ✅ Sí
- **Visible en admin_select:** ✅ Sí
- **Visible en admin_all:** ✅ Sí

### Escenario 3: Operativo publicado pero cerrado
- **Estado:** `cerrado`
- **Visible en público:** ❌ No
- **Visible en admin_select:** ❌ No (filtrado por `estado != "publicado"`)
- **Visible en admin_all:** ✅ Sí

### Escenario 4: Operativo publicado pero finalizado por fecha
- **Estado:** `publicado`
- **Fecha:** `fecha_fin = "2026-01-20"` (pasada)
- **Visible en público:** ❌ No (`isOperativoParaPublico()` lo excluye)
- **Visible en admin_select:** ❌ No (`isOperativoAbierto()` lo excluye)
- **Visible en admin_all:** ✅ Sí

### Escenario 5: Operativo publicado hoy
- **Estado:** `publicado`
- **Fecha:** `fecha_inicio = "2026-01-23"`
- **Hoy:** `2026-01-23`
- **Visible en público:** ✅ Sí (fecha_inicio >= hoy)
- **Visible en admin_select:** ✅ Sí
- **Visible en admin_all:** ✅ Sí

---

## 📚 Funciones Helper

### `isOperativoParaPublico(operativo, referenceDate)`
**Ubicación:** [src/lib/operativosShared.ts](../src/lib/operativosShared.ts)

**Criterio:**
1. `getComputedEstado(operativo) === "publicado"`
2. `isOperativoFuturo(operativo)` - fecha_inicio >= hoy

**Uso:** Filtro final para web pública.

---

### `isOperativoAbierto(operativo, referenceDate)`
**Ubicación:** [src/lib/operativosShared.ts](../src/lib/operativosShared.ts)

**Criterio:**
1. `estado === "publicado"`
2. NOT antes de fecha_inicio
3. NOT después de fecha_fin (si existe)

**Uso:** Filtro para admin_select (invitar, mensajería).

---

### `getComputedEstado(operativo, referenceDate)`
**Ubicación:** [src/lib/operativosShared.ts](../src/lib/operativosShared.ts)

**Retorna:**
- `"finalizado"` - si estado manual = "finalizado" O fecha ya pasó
- `"cerrado"` - si estado manual = "cerrado"
- `"publicado"` - si estado = "publicado" y fecha vigente
- `"borrador"` - cualquier otro caso

---

## 🎯 Regla de Oro

**Para que un operativo aparezca en admin_select (invitaciones/mensajería):**

```typescript
// 1. Query debe filtrar por estado
.eq("estado", "publicado")

// 2. Luego aplicar isOperativoAbierto() para excluir finalizados
operativos.filter(op => isOperativoAbierto(op, new Date()))
```

---

## 🚨 Checklist de Implementación

- [x] Mensajería: Query con `.eq("estado", "publicado")`
- [x] Invitaciones: Query con `.eq("estado", "publicado")`
- [x] Perfil voluntario: Query con `.eq("estado", "publicado")`
- [x] Inscripciones: Usa IDs relacionados (no necesita filtro)
- [x] Público: Query con `.eq("estado", "publicado")`
- [x] Documentación creada

---

## 🔍 Verificación

Para verificar que un módulo está correcto, buscar la query y confirmar:

```typescript
// ✅ CORRECTO
supabaseService
  .from("operativos")
  .select("...")
  .eq("estado", "publicado")  // ← DEBE TENER ESTO

// ❌ INCORRECTO (trae todo)
supabaseService
  .from("operativos")
  .select("...")
  // Sin filtro de estado
```

---

**Última actualización:** 2026-01-23  
**Responsable:** GitHub Copilot (Claude Sonnet 4.5)
