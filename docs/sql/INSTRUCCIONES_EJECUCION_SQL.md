# 📋 Instrucciones de Ejecución - Sistema de Inventario

## ✅ Script CORREGIDO y Autosuficiente

El archivo `20260123_completar_inventario_sistema.sql` ha sido **completamente corregido** para ser **autosuficiente** y ejecutable en una base de datos con prerequisitos mínimos.

---

## 🔍 ¿Qué se corrigió?

### ❌ Problema Original:
- El script asumía que `lanyard_types` existía previamente
- Error al ejecutar: `ERROR: relation "public.lanyard_types" does not exist`

### ✅ Solución Aplicada:
- **Ahora el script crea `lanyard_types` PRIMERO** (sección 1)
- Todas las tablas dependientes se crean **DESPUÉS** (secciones 2-3)
- Todo usa `IF NOT EXISTS` para ser idempotente
- Puede ejecutarse múltiples veces sin errores

---

## 📦 ¿Qué crea el script?

### 1️⃣ **Tabla `lanyard_types`** (catálogo de temas/cáncer)
- 6 tipos por defecto: mama, próstata, cervicouterino, pulmón, melanoma, genérico
- Cada tipo tiene: nombre, slug único, color de cinta (nombre + hex)
- Lectura pública, escritura solo admin (RLS)

### 2️⃣ **Tabla `volunteer_gear_status`** (equipamiento por voluntario)
- Seguimiento de: lanyard, credencial, uniforme
- Contador de ciclos (cada 5 operativos → nuevo uniforme)
- FK a `lanyard_types` para saber qué tipo tiene asignado

### 3️⃣ **Tabla `inventory_deliveries`** (historial de entregas)
- Audit log de cada entrega
- Relaciona: voluntario + item + operativo + cantidad

### 4️⃣ **Columnas agregadas a tablas existentes**
- `operativos.lanyard_type_id` → tema del operativo
- `inventario_items.lanyard_type_id` → para items temáticos
- `inventario_items.variante` → tallas (S, M, L, XL)
- `inventario_items.stock_reservado` → para reservas
- `inventario_items.umbral_reorden` → alerta cuando queda poco

### 5️⃣ **Función RPC `decrement_inventory_stock()`**
- Decrementa stock atómicamente
- Nunca permite negativos (GREATEST con 0)

### 6️⃣ **Trigger automático en `inscripciones`**
- Se dispara cuando `estado = 'asistio'`
- Incrementa `uniform_cycles_since_issue` en +1
- Crea gear_status si no existe

### 7️⃣ **Vista `vw_volunteer_recent_deliveries`**
- Historial completo de entregas por voluntario
- Join con voluntarios, items y operativos

### 8️⃣ **Índices optimizados**
- FK en deliveries (volunteer, operativo, item)
- Búsqueda rápida de voluntarios con ciclo >= 5
- Búsqueda de lanyards activos ordenados

---

## 🚀 Pasos de Ejecución

### **Paso 1: Ejecutar el Test de Prerequisitos**

```bash
# Abrir Supabase SQL Editor
# Copiar y ejecutar: docs/sql/TEST_20260123_completar_inventario_sistema.sql
```

**Resultado esperado:**
```
✓ Tabla voluntarios existe
✓ Tabla inscripciones existe
✓ Tabla inventario_items existe
✓ Tabla operativos existe
✓ lanyard_types será creada por el script
✓ volunteer_gear_status será creada
✓ inventory_deliveries será creada

=== ✓ LISTO PARA EJECUTAR MIGRACIÓN ===
```

### **Paso 2: Ejecutar la Migración Principal**

```bash
# En Supabase SQL Editor
# Copiar y ejecutar: docs/sql/20260123_completar_inventario_sistema.sql
```

**Resultado esperado:**
```
========================================
✓ MIGRACIÓN COMPLETADA EXITOSAMENTE
========================================

TABLAS CREADAS/VERIFICADAS:
  → lanyard_types: 6 registros
  → volunteer_gear_status: X registros
  → inventory_deliveries: 0 registros

FUNCIONES CREADAS:
  → decrement_inventory_stock()
  → increment_uniform_cycle_on_attendance()

TRIGGERS ACTIVOS:
  → trigger_increment_uniform_cycle en inscripciones

VISTAS CREADAS:
  → vw_volunteer_recent_deliveries

COLUMNAS AGREGADAS:
  → operativos.lanyard_type_id
  → inventario_items.lanyard_type_id, variante, stock_reservado, umbral_reorden

========================================
Sistema de inventario listo para usar
========================================
```

---

## ⚠️ Prerequisitos OBLIGATORIOS

El script **requiere** que estas tablas existan previamente:

| Tabla | ¿Por qué? |
|-------|-----------|
| `voluntarios` | FK en `volunteer_gear_status.volunteer_id` |
| `inscripciones` | Trigger se activa en esta tabla |
| `inventario_items` | FK en `inventory_deliveries.item_id` |
| `operativos` | FK en columnas agregadas |

Si alguna no existe, el test fallará con mensaje claro.

---

## 🔄 Idempotencia

El script es **100% idempotente**:
- ✅ Puede ejecutarse múltiples veces sin errores
- ✅ Usa `IF NOT EXISTS` en todas las tablas
- ✅ Usa `IF NOT EXISTS` en todos los índices
- ✅ Usa `ON CONFLICT DO NOTHING` en inserts
- ✅ Usa `DO $$ BEGIN IF NOT EXISTS` en policies
- ✅ Usa `CREATE OR REPLACE` en funciones

**Resultado:** Si ejecutas 10 veces, crea todo 1 vez y las otras 9 no hace nada.

---

## 📊 Verificación Post-Ejecución

Ejecuta estas queries para verificar que todo está OK:

```sql
-- 1. Verificar lanyard_types
SELECT COUNT(*) FROM lanyard_types; -- Debe ser 6

-- 2. Verificar gear_status creado
SELECT COUNT(*) FROM volunteer_gear_status;

-- 3. Ver tipos de lanyard disponibles
SELECT name, ribbon_color_name, ribbon_hex 
FROM lanyard_types 
WHERE is_active = TRUE
ORDER BY display_order;

-- 4. Verificar trigger funciona
-- (Marca una inscripción como 'asistio' y verifica que el ciclo incrementa)
UPDATE inscripciones 
SET estado = 'asistio' 
WHERE id = '<algún-id>' AND estado != 'asistio';

SELECT uniform_cycles_since_issue 
FROM volunteer_gear_status 
WHERE volunteer_id = '<voluntario-id>'; -- Debe haber incrementado +1

-- 5. Verificar funciones existen
SELECT proname FROM pg_proc 
WHERE proname IN ('decrement_inventory_stock', 'increment_uniform_cycle_on_attendance');
```

---

## 🐛 Troubleshooting

### Error: "relation voluntarios does not exist"
**Causa:** Tabla prerequisito faltante  
**Solución:** Ejecutar primero las migraciones base del módulo de voluntarios

### Error: "relation already exists"
**Causa:** Tabla ya creada en ejecución previa  
**Solución:** Normal, el script usa IF NOT EXISTS, continuar ejecución

### Error: "duplicate key value violates unique constraint lanyard_types_slug_key"
**Causa:** Los 6 lanyards por defecto ya existen  
**Solución:** Normal, el script usa ON CONFLICT DO NOTHING, continuar

### El trigger no incrementa ciclos
**Causa:** El trigger solo funciona cuando `estado` cambia **a** `'asistio'`  
**Solución:** Verificar que el UPDATE sí esté cambiando el valor de NULL/'inscrito' a 'asistio'

---

## 📁 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| [20260123_completar_inventario_sistema.sql](./20260123_completar_inventario_sistema.sql) | **Script principal corregido** (ejecutar este) |
| [TEST_20260123_completar_inventario_sistema.sql](./TEST_20260123_completar_inventario_sistema.sql) | Test de prerequisitos (opcional pero recomendado) |
| [20260122_inventario_lanyard_types_gear.sql](./20260122_inventario_lanyard_types_gear.sql) | Script anterior (obsoleto, no ejecutar) |

---

## ✅ Checklist Final

- [ ] Ejecuté el TEST y pasó sin errores
- [ ] Ejecuté el script principal sin errores
- [ ] Verifico que existen 6 registros en `lanyard_types`
- [ ] Verifico que existen registros en `volunteer_gear_status`
- [ ] Ejecuté las queries de verificación post-ejecución
- [ ] El trigger funciona (cambie estado a 'asistio' y verifico incremento)
- [ ] Reinicié `npm run dev` para cargar nuevos tipos TypeScript

---

## 🎯 Próximos Pasos

Una vez ejecutado el SQL:

1. **Reiniciar Next.js:** `npm run dev` para que TypeScript detecte nuevas tablas
2. **Probar UI:** Ir a Admin → Operativos → Nuevo, debe aparecer selector de tema/lanyard
3. **Probar entrega:** Ir a Admin → Voluntarios → [voluntario] → Sección "Equipamiento"
4. **Exportar CSV:** Botones de export en página de Inventario deben funcionar
5. **Verificar trigger:** Marcar asistencia en un operativo y ver que el ciclo incrementa

---

**Última actualización:** 23 de enero de 2026  
**Estado:** ✅ Script corregido y listo para producción
