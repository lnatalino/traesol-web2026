# Sistema de Inventario Traesol - Implementación Completa

## 📋 Resumen de Implementación

Se ha completado la refactorización del módulo de inventario para soportar el modelo real de Fundación Traesol, incluyendo:

- ✅ Kit obligatorio por voluntario (lanyard + credencial)
- ✅ Uniformes reutilizables con ciclo cada 5 operativos
- ✅ Lanyards temáticos por color/cáncer
- ✅ Stock gestionable y exportable
- ✅ Historial de entregas auditado
- ✅ Integración automática con asistencias

---

## 🗄️ Base de Datos

### Nuevas Tablas Creadas

#### 1. `lanyard_types`
Catálogo de tipos de lanyard temáticos (cintas de cáncer).

**Campos principales:**
- `id`, `name`, `slug`, `ribbon_color_name`, `ribbon_hex`
- `is_active`, `display_order`

**Datos iniciales:**
- Cáncer de mama (Rosado)
- Cáncer de próstata (Celeste)
- Cáncer cervicouterino (Teal)
- Cáncer de pulmón (Blanco)
- Melanoma/Piel (Negro)
- Genérico/Sin tema (Azul Traesol)

#### 2. `volunteer_gear_status`
Estado actual del equipamiento de cada voluntario.

**Campos principales:**
- `volunteer_id` (PK)
- `has_lanyard`, `has_id_card` (booleans)
- `lanyard_type_id` (FK a lanyard_types)
- `uniform_cycles_since_issue` (contador 0-5)
- `uniform_last_issued_at` (timestamp)
- `notes`

#### 3. `inventory_deliveries`
Historial auditado de entregas de items a voluntarios.

**Campos principales:**
- `id`, `volunteer_id`, `operativo_id`, `item_id`
- `quantity`, `notes`
- `created_at`, `created_by` (email admin)

### Campos Agregados

#### `operativos`
- `lanyard_type_id` (FK a lanyard_types) - Tema del operativo

#### `inventario_items`
- `lanyard_type_id` - Para lanyards temáticos
- `variante` - Tallas u otras variantes
- `stock_reservado` - Stock reservado
- `umbral_reorden` - Alerta de reorden

### Funciones y Triggers

#### `decrement_inventory_stock(p_item_id, p_quantity)`
RPC para decrementar stock de forma atómica.

#### `increment_uniform_cycle_on_attendance()`
Trigger que se ejecuta cuando un voluntario cambia a estado "asistio":
- Incrementa `uniform_cycles_since_issue` en `volunteer_gear_status`
- Crea registro si no existe (con valores por defecto)

---

## 💻 Código TypeScript

### Types Actualizados

**`/src/lib/inventario/types.ts`**
- `LanyardType` - Tipos de lanyard
- `VolunteerGearStatus` - Estado de equipamiento
- `InventoryDelivery` - Entregas
- `DeliveryWithDetails` - Entregas con joins

### APIs Nuevas

#### `/api/admin/voluntarios/[id]/gear-status`
- **GET**: Obtener estado de equipamiento de voluntario
- **PATCH**: Actualizar campos individuales (has_lanyard, has_id_card, etc.)

#### `/api/admin/voluntarios/register-uniform`
- **POST**: Registrar entrega de uniforme completo
  - Crea deliveries para polera + pantalón
  - Resetea `uniform_cycles_since_issue` a 0
  - Actualiza `uniform_last_issued_at`
  - Decrementa stock automáticamente

#### `/api/admin/inventario/export`
- **GET** `?type=stock`: Exportar CSV de stock completo
- **GET** `?type=deliveries&start_date=&end_date=&operativo_id=`: Exportar CSV de entregas

### APIs Actualizadas

#### `/api/admin/operativos/create`
- Ahora acepta `lanyard_type_id` para asignar tema al operativo

#### `/api/admin/operativos/update`
- Ahora actualiza `lanyard_type_id`

#### `/api/admin/inventario/deliveries`
- Ya existía, ahora integrado con gear_status
- Actualiza automáticamente el estado del voluntario según el tipo de item entregado

---

## 🎨 UI/UX

### Componente `VolunteerGearSection`

**Ubicación:** `/src/app/admin/voluntarios/[id]/VolunteerGearSection.tsx`

**Funcionalidades:**
- Visualización de kit base (lanyard + credencial) con toggles editables
- Estado de uniforme con contador de ciclos (X/5)
- Alerta visual cuando ciclos >= 5 (requiere reposición)
- Modal para registrar entrega de uniforme
- Historial de últimas 10 entregas

### Formulario de Operativos

**Archivos modificados:**
- `/src/app/admin/operativos/_form.tsx`
- `/src/app/admin/operativos/nuevo/page.tsx`
- `/src/app/admin/operativos/[id]/editar/page.tsx`

**Nuevo campo:**
- Selector de "Tema / Lanyard" con opciones de:
  - Sin tema específico (lanyard genérico)
  - Tipos temáticos disponibles (mama, próstata, etc.)

### Página de Inventario

**Archivo:** `/src/app/admin/inventario/page.tsx`

**Nuevos botones:**
- "Exportar stock (CSV)" - Descarga inventario completo
- "Exportar entregas (CSV)" - Descarga historial de entregas

---

## 🔄 Lógica de Negocio

### Kit Base por Defecto

Cuando se crea un voluntario o se registra en el sistema:
1. Se crea automáticamente un registro en `volunteer_gear_status`
2. `has_lanyard = true` y `has_id_card = true` por defecto
3. `uniform_cycles_since_issue = 0`

### Ciclo de Uniformes (Cada 5 Operativos)

**Automático al confirmar asistencia:**
1. Voluntario cambia a estado "asistio" en tabla `inscripciones`
2. Trigger `increment_uniform_cycle_on_attendance` se ejecuta
3. `uniform_cycles_since_issue` incrementa en 1
4. Si llega a 5, la UI muestra alerta "Requiere reposición"

**Manual al entregar uniforme:**
1. Admin registra entrega desde perfil de voluntario
2. Se crean deliveries para polera + pantalón
3. Se decrementa stock
4. `uniform_cycles_since_issue` resetea a 0
5. `uniform_last_issued_at` actualiza a NOW()

### Lanyards Temáticos

1. Admin crea/edita operativo y selecciona tema (ej: "Cáncer de mama")
2. Se guarda `lanyard_type_id` en tabla `operativos`
3. Items de inventario se pueden crear con `lanyard_type_id` específico
4. Al entregar lanyard temático, se actualiza `lanyard_type_id` del voluntario en `volunteer_gear_status`

---

## 📁 Archivos Creados/Modificados

### SQL (Migraciones)
- ✅ `/docs/sql/20251117_inventario_module.sql` (existente)
- ✅ `/docs/sql/20260122_inventario_lanyard_types_gear.sql` (existente)
- ✨ `/docs/sql/20260123_completar_inventario_sistema.sql` (nuevo)

### TypeScript - Types
- 🔧 `/src/lib/inventario/types.ts` (actualizado)

### TypeScript - APIs
- ✨ `/src/app/api/admin/voluntarios/[id]/gear-status/route.ts` (nuevo)
- ✨ `/src/app/api/admin/voluntarios/register-uniform/route.ts` (nuevo)
- ✨ `/src/app/api/admin/inventario/export/route.ts` (nuevo)
- 🔧 `/src/app/api/admin/operativos/create/route.ts` (actualizado)
- 🔧 `/src/app/api/admin/operativos/update/route.ts` (actualizado)
- ✅ `/src/app/api/admin/inventario/deliveries/route.ts` (existente)

### TypeScript - UI Components
- ✅ `/src/app/admin/voluntarios/[id]/VolunteerGearSection.tsx` (existente, ya implementado)
- 🔧 `/src/app/admin/operativos/_form.tsx` (actualizado)
- 🔧 `/src/app/admin/operativos/nuevo/page.tsx` (actualizado)
- 🔧 `/src/app/admin/operativos/[id]/editar/page.tsx` (actualizado)
- 🔧 `/src/app/admin/inventario/page.tsx` (actualizado)

---

## 🚀 Instrucciones de Despliegue

### 1. Ejecutar Migraciones SQL

Ejecutar en orden en Supabase Dashboard (SQL Editor):

```bash
# Si aún no se ejecutó:
docs/sql/20251117_inventario_module.sql
docs/sql/20260122_inventario_lanyard_types_gear.sql

# Nueva migración:
docs/sql/20260123_completar_inventario_sistema.sql
```

### 2. Verificar Tablas Creadas

En Supabase Dashboard > Table Editor, verificar que existan:
- ✅ `lanyard_types` (con 6 registros iniciales)
- ✅ `volunteer_gear_status`
- ✅ `inventory_deliveries`
- ✅ `inventario_items` (con campos nuevos)
- ✅ `operativos` (con campo `lanyard_type_id`)

### 3. Verificar Funciones y Triggers

En Supabase Dashboard > Database > Functions:
- ✅ `decrement_inventory_stock`
- ✅ `increment_uniform_cycle_on_attendance`

En Database > Triggers:
- ✅ `trigger_increment_uniform_cycle` en tabla `inscripciones`

### 4. Migrar Datos Existentes (Automático)

La migración SQL ya incluye scripts para:
- Crear `volunteer_gear_status` para todos los voluntarios existentes
- Calcular ciclos basado en `operativos_asistidos` y `uniformes_entregados`
- Crear items de inventario base (lanyard, credencial, uniforme)

### 5. Deploy de Código

```bash
# Build local para verificar TypeScript
npm run build

# Deploy a producción (según tu pipeline)
git push origin main
```

### 6. Verificación Post-Deploy

1. **Tipos de Lanyard:** Ir a `/admin/inventario/lanyard-types`
   - Verificar que aparezcan los 6 tipos
   - Probar crear/editar uno

2. **Crear Operativo:** Ir a `/admin/operativos/nuevo`
   - Verificar que aparezca selector "Tema / Lanyard"
   - Crear operativo con tema "Cáncer de mama"

3. **Perfil Voluntario:** Ir a `/admin/voluntarios/[id]`
   - Verificar sección "Equipamiento del voluntario"
   - Probar toggles de lanyard y credencial
   - Ver contador de uniformes
   - Registrar entrega de uniforme

4. **Inventario:** Ir a `/admin/inventario`
   - Probar botones "Exportar stock" y "Exportar entregas"
   - Verificar que descarguen CSV

5. **Asistencias:** Marcar un voluntario como "asistió" en un operativo
   - Verificar que su contador de uniformes incrementó en 1

---

## 📊 Reportes y Exportación

### CSV de Stock
Incluye todas las columnas:
- ID, Nombre, Slug, Categoría
- Tipo, Variante, Lanyard Tema
- Stock Disponible, Stock Reservado, Umbral Reorden
- Unidad, Activo, Descripción

### CSV de Entregas
Incluye:
- ID, Fecha
- Voluntario (RUT, Nombre, Email)
- Item, Tipo, Cantidad
- Operativo, Notas

**Filtros disponibles:**
- `?type=deliveries&start_date=2026-01-01&end_date=2026-12-31`
- `?type=deliveries&operativo_id=<uuid>`

---

## ✅ Checklist de Validación

### Funcionalidad Básica
- [ ] Lanyard types se muestran en `/admin/inventario/lanyard-types`
- [ ] Crear operativo con tema funciona
- [ ] Editar operativo permite cambiar tema
- [ ] Perfil voluntario muestra sección de equipamiento
- [ ] Toggles de lanyard/credencial funcionan

### Lógica de Uniformes
- [ ] Contador inicia en 0 para voluntarios nuevos
- [ ] Contador incrementa al marcar asistencia
- [ ] Alerta visual aparece cuando ciclos >= 5
- [ ] Registrar entrega resetea contador a 0
- [ ] Stock se decrementa al entregar

### Exportación
- [ ] CSV de stock descarga correctamente
- [ ] CSV de entregas descarga correctamente
- [ ] CSV incluye todos los campos esperados

### Base de Datos
- [ ] Trigger funciona al cambiar estado a "asistio"
- [ ] RPC decrement_inventory_stock reduce stock
- [ ] Todos los voluntarios tienen gear_status
- [ ] Deliveries se registran con created_by

---

## 🐛 Troubleshooting

### Error: "No se encontraron items de uniforme"
**Causa:** No hay items con `tipo_regla = 'UNIFORME'` en inventario.
**Solución:** Crear items de uniforme en `/admin/inventario/items/nuevo`

### Contador no incrementa al marcar asistencia
**Causa:** Trigger no configurado o deshabilitado.
**Solución:** Ejecutar nuevamente la migración `20260123_completar_inventario_sistema.sql`

### Exportación descarga vacío
**Causa:** Rol del usuario no tiene permisos de lectura.
**Solución:** Verificar RLS policies en Supabase

### Lanyard types no aparecen en selector
**Causa:** No hay registros con `is_active = true`
**Solución:** Ejecutar `INSERT` de lanyard_types de la migración

---

## 📝 Notas Importantes

1. **Campos legacy:** Se mantienen `operativos_asistidos`, `uniformes_entregados` en tabla `voluntarios` por compatibilidad, pero el nuevo sistema usa `volunteer_gear_status`.

2. **Migraciones idempotentes:** Todas las migraciones usan `IF NOT EXISTS` y `ON CONFLICT DO NOTHING` para ser seguras de re-ejecutar.

3. **RLS Policies:** Todas las tablas nuevas tienen policies para `service_role` (admin) y algunas para lectura pública.

4. **Soft deletes:** Los items de inventario usan campo `activo` en lugar de delete físico.

5. **Auditoría:** Todas las entregas registran `created_by` con el email del admin que las creó.

---

## 🎯 Próximos Pasos Sugeridos

1. **Dashboard de inventario:** Crear vista con gráficos de stock vs uso
2. **Alertas automáticas:** Email cuando stock < umbral_reorden
3. **Solicitudes de reposición:** Formulario para voluntarios que necesiten items
4. **Integración con scanner:** QR codes en credenciales para check-in
5. **Reportes automáticos:** PDF mensuales de entregas por operativo

---

## 📞 Soporte

Para dudas o problemas, revisar:
1. Este documento
2. Comentarios en migraciones SQL
3. Tipos TypeScript en `/src/lib/inventario/types.ts`
4. Código de APIs en `/src/app/api/admin/`

---

**Última actualización:** 23 de enero de 2026
**Implementado por:** GitHub Copilot (Claude Sonnet 4.5)
