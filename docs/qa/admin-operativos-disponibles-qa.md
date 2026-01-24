# QA - Operativos Disponibles

**Fecha:** 2026-01-23  
**Fix:** Operativos publicados ahora aparecen en todos los dropdowns de Admin  
**Relacionado:** [admin-operativos-disponibles.md](../admin-operativos-disponibles.md)

---

## 📋 Checklist de Pruebas

### ✅ Prueba 1: Operativo borrador NO aparece en dropdowns

**Setup:**
1. Ir a `/admin/operativos`
2. Crear un nuevo operativo con datos válidos
3. **NO publicar** - dejarlo como borrador
4. Guardar

**Verificar:**
- [ ] El operativo NO aparece en `/operativos` (web pública)
- [ ] El operativo NO aparece en dropdown de `/admin/invitaciones`
- [ ] El operativo NO aparece en dropdown de `/admin/mensajeria`
- [ ] El operativo NO aparece en formulario de invitar en `/admin/voluntarios/[id]`
- [ ] El operativo SÍ aparece en lista de `/admin/operativos` (gestión)

**Resultado esperado:** ✅ Borradores solo visibles en gestión admin

---

### ✅ Prueba 2: Operativo publicado SÍ aparece en dropdowns

**Setup:**
1. Usar el mismo operativo borrador de la prueba anterior
2. Ir a `/admin/operativos/[id]/editar`
3. Hacer clic en botón **"Publicar"**
4. Confirmar que `estado` cambió a `"publicado"`

**Verificar:**
- [ ] El operativo SÍ aparece en `/operativos` (web pública)
- [ ] El operativo SÍ aparece en dropdown de `/admin/invitaciones`
- [ ] El operativo SÍ aparece en dropdown de `/admin/mensajeria`
- [ ] El operativo SÍ aparece en formulario de invitar en `/admin/voluntarios/[id]`
- [ ] El operativo SÍ aparece en lista de `/admin/operativos` (gestión)

**Resultado esperado:** ✅ Publicados visibles en TODO el sistema

---

### ✅ Prueba 3: Operativo cerrado NO aparece en dropdowns

**Setup:**
1. Usar el mismo operativo publicado
2. Ir a `/admin/operativos/[id]/editar`
3. Hacer clic en botón **"Cerrar inscripciones"** (si existe)
4. O actualizar manualmente `estado = "cerrado"` en DB

**Verificar:**
- [ ] El operativo NO aparece en `/operativos` (web pública)
- [ ] El operativo NO aparece en dropdown de `/admin/invitaciones`
- [ ] El operativo NO aparece en dropdown de `/admin/mensajeria`
- [ ] El operativo SÍ aparece en lista de `/admin/operativos` (gestión con badge "Cerrado")

**Resultado esperado:** ✅ Cerrados solo visibles en gestión admin

---

### ✅ Prueba 4: Operativo con fecha pasada NO aparece

**Setup:**
1. Crear operativo publicado con:
   - `estado = "publicado"`
   - `fecha_inicio = "2025-12-01"` (pasado)
   - `fecha_fin = "2025-12-15"` (pasado)

**Verificar:**
- [ ] El operativo NO aparece en `/operativos` (web pública)
- [ ] El operativo NO aparece en dropdown de `/admin/invitaciones`
- [ ] El operativo NO aparece en dropdown de `/admin/mensajeria`
- [ ] El operativo SÍ aparece en lista de `/admin/operativos` con badge "Finalizado"

**Resultado esperado:** ✅ Pasados auto-finalizados por `isOperativoAbierto()`

---

### ✅ Prueba 5: Operativo futuro SÍ aparece

**Setup:**
1. Crear operativo publicado con:
   - `estado = "publicado"`
   - `fecha_inicio = "2026-03-01"` (futuro)
   - `fecha_fin = "2026-03-15"` (futuro)

**Verificar:**
- [ ] El operativo SÍ aparece en `/operativos` (web pública)
- [ ] El operativo SÍ aparece en dropdown de `/admin/invitaciones`
- [ ] El operativo SÍ aparece en dropdown de `/admin/mensajeria`
- [ ] El operativo SÍ aparece en formulario de invitar en `/admin/voluntarios/[id]`

**Resultado esperado:** ✅ Futuros publicados disponibles en TODO

---

### ✅ Prueba 6: Mensajería - Enviar email a operativo

**Setup:**
1. Asegurarse de tener al menos 1 operativo publicado futuro
2. Ir a `/admin/mensajeria`
3. Seleccionar el operativo publicado del dropdown
4. Verificar que aparece en la lista

**Verificar:**
- [ ] Dropdown muestra SOLO operativos publicados
- [ ] Al seleccionar, carga los voluntarios inscritos
- [ ] Se puede enviar email (usar email de prueba)

**Resultado esperado:** ✅ Solo operativos publicados disponibles para mensajería

---

### ✅ Prueba 7: Invitaciones - Invitar múltiples voluntarios

**Setup:**
1. Asegurarse de tener al menos 1 operativo publicado futuro
2. Ir a `/admin/invitaciones`
3. Seleccionar el operativo publicado del dropdown
4. Seleccionar 2-3 voluntarios

**Verificar:**
- [ ] Dropdown muestra SOLO operativos publicados
- [ ] Se pueden seleccionar múltiples voluntarios
- [ ] Al enviar, se crean las inscripciones con estado "invitado"

**Resultado esperado:** ✅ Solo operativos publicados disponibles para invitaciones

---

### ✅ Prueba 8: Perfil voluntario - Invitar individual

**Setup:**
1. Ir a `/admin/voluntarios` y elegir un voluntario
2. Entrar a su perfil `/admin/voluntarios/[id]`
3. Scroll hasta sección "Invitar a operativo"

**Verificar:**
- [ ] Dropdown muestra SOLO operativos publicados futuros
- [ ] Se puede seleccionar un operativo
- [ ] Al enviar, se crea la inscripción con estado "invitado"

**Resultado esperado:** ✅ Solo operativos publicados disponibles

---

### ✅ Prueba 9: Web pública - Listado de operativos

**Setup:**
1. Cerrar sesión (o abrir ventana incógnito)
2. Ir a `/operativos`

**Verificar:**
- [ ] Solo aparecen operativos con `estado = "publicado"`
- [ ] Solo aparecen operativos con `fecha_inicio >= hoy`
- [ ] NO aparecen borradores
- [ ] NO aparecen cerrados
- [ ] NO aparecen finalizados

**Resultado esperado:** ✅ Público solo ve operativos activos

---

### ✅ Prueba 10: Postulación pública

**Setup:**
1. En `/operativos`, hacer clic en un operativo
2. Ir a `/operativos/[slug]`
3. Hacer clic en "Postularme"

**Verificar:**
- [ ] El formulario de postulación funciona
- [ ] Se crea inscripción con `tipo = "postulacion"`, `estado = "pendiente"`
- [ ] El operativo sigue siendo visible en `/operativos`

**Resultado esperado:** ✅ Postulación pública funciona correctamente

---

## 🔍 Casos Edge

### Edge 1: Operativo hoy (fecha_inicio = hoy)
**Estado:** `publicado`  
**Fecha:** `fecha_inicio = "2026-01-23"` (HOY)

**Esperado:**
- ✅ Visible en web pública
- ✅ Visible en admin dropdowns

---

### Edge 2: Operativo que termina hoy (fecha_fin = hoy)
**Estado:** `publicado`  
**Fecha:** `fecha_fin = "2026-01-23"` (HOY)

**Esperado:**
- ✅ Visible en web pública (hasta fin del día)
- ✅ Visible en admin dropdowns

---

### Edge 3: Operativo sin fecha_fin
**Estado:** `publicado`  
**Fecha:** `fecha_inicio = "2026-02-01"`, `fecha_fin = null`

**Esperado:**
- ✅ Visible en web pública
- ✅ Visible en admin dropdowns
- ℹ️ `isOperativoAbierto()` no aplica filtro por fecha_fin

---

### Edge 4: Múltiples operativos mismo día
**Setup:** 3 operativos con `fecha_inicio = "2026-03-01"`:
- Operativo A: `estado = "borrador"`
- Operativo B: `estado = "publicado"`
- Operativo C: `estado = "cerrado"`

**Esperado:**
- Web pública: Solo muestra Operativo B
- Admin dropdowns: Solo muestra Operativo B
- Admin gestión: Muestra A, B y C

---

## 🐛 Regresiones a Verificar

### Regresión 1: Admin gestión NO debe filtrar
**Verificar:** `/admin/operativos` muestra TODOS los estados (borrador, publicado, cerrado, finalizado)

**Por qué:** Administradores necesitan ver y editar borradores.

---

### Regresión 2: Inscripciones existentes
**Verificar:** `/admin/inscripciones` muestra inscripciones de operativos en cualquier estado

**Por qué:** Query usa `.in("id", operativoIds)` de inscripciones existentes, no debe filtrar por estado.

---

### Regresión 3: API endpoints
**Verificar:**
- `/api/admin/inscripciones/invitar` - Usa ID específico (OK)
- `/api/admin/invitaciones` - Usa ID específico (OK)
- `/api/operativos/public` - Usa `PUBLIC_OPERATIVO_STATES` (OK)

**Por qué:** Estos endpoints buscan operativos por ID específico o usan constante correcta.

---

## 📊 Resumen

| Módulo | Filtro Correcto | Estado |
|--------|----------------|--------|
| **Web pública** | `.eq("estado", "publicado")` + fecha | ✅ Implementado |
| **Admin Mensajería** | `.eq("estado", "publicado")` | ✅ Implementado |
| **Admin Invitaciones** | `.eq("estado", "publicado")` | ✅ Implementado |
| **Admin Perfil Voluntario** | `.eq("estado", "publicado")` | ✅ Implementado |
| **Admin Inscripciones** | `.in("id", ...)` (no filtrar) | ✅ Correcto |
| **Admin Gestión Operativos** | Sin filtro (mostrar todo) | ✅ Correcto |

---

## ✅ Checklist Final

- [ ] Todas las pruebas 1-10 pasadas
- [ ] Casos edge verificados
- [ ] No hay regresiones
- [ ] Documentación actualizada en `/docs/admin-operativos-disponibles.md`
- [ ] Usuario puede publicar operativo y verlo inmediatamente en dropdowns
- [ ] Usuario puede crear borrador y NO verlo en dropdowns (solo en gestión)

---

**Estado:** ⏳ Pendiente de pruebas  
**Responsable QA:** [Tu nombre]  
**Fecha pruebas:** ___________
