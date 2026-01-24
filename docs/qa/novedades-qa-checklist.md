# Checklist QA - Sistema de Novedades

**Fecha:** 2026-01-24  
**Tester:** _______________  
**Ambiente:** _______________

---

## Pre-requisitos

- [ ] Migración SQL ejecutada (`docs/sql/20260124_novedades_unificado.sql`)
- [ ] Código desplegado
- [ ] Acceso a Admin con credenciales válidas

---

## Test 1: Novedad Solo en Carrusel

**Objetivo:** Verificar que una novedad puede aparecer SOLO en el carrusel de Home

**Pasos:**
1. [ ] Ir a `/admin/novedades/nueva`
2. [ ] Completar título: "Test Carrusel Único"
3. [ ] Marcar: ✅ Publicado, ✅ En carrusel, ❌ En novedades
4. [ ] Guardar
5. [ ] Verificar que aparece en la lista de Admin con badges correctos
6. [ ] Ir a Home (`/`) y verificar que aparece en el carrusel
7. [ ] Ir a `/novedades` y verificar que NO aparece

**Resultado esperado:**
- Visible en: Admin, Carrusel Home
- NO visible en: Página /novedades

**Estado:** ⬜ Pasó / ⬜ Falló

---

## Test 2: Novedad Solo en Novedades

**Objetivo:** Verificar que una novedad puede aparecer SOLO en /novedades

**Pasos:**
1. [ ] Ir a `/admin/novedades/nueva`
2. [ ] Completar título: "Test Novedades Único"
3. [ ] Marcar: ✅ Publicado, ❌ En carrusel, ✅ En novedades
4. [ ] Guardar
5. [ ] Verificar en Admin
6. [ ] Ir a Home y verificar que NO está en carrusel
7. [ ] Ir a `/novedades` y verificar que SÍ aparece

**Resultado esperado:**
- Visible en: Admin, Página /novedades
- NO visible en: Carrusel Home

**Estado:** ⬜ Pasó / ⬜ Falló

---

## Test 3: Novedad en Ambos

**Objetivo:** Verificar que una novedad puede aparecer en carrusel Y novedades

**Pasos:**
1. [ ] Ir a `/admin/novedades/nueva`
2. [ ] Completar título: "Test Ambos Lugares"
3. [ ] Marcar: ✅ Publicado, ✅ En carrusel, ✅ En novedades
4. [ ] Guardar
5. [ ] Verificar en Admin
6. [ ] Ir a Home y verificar que está en carrusel
7. [ ] Ir a `/novedades` y verificar que también aparece

**Resultado esperado:**
- Visible en: Admin, Carrusel Home, Página /novedades

**Estado:** ⬜ Pasó / ⬜ Falló

---

## Test 4: Despublicar Novedad

**Objetivo:** Verificar que despublicar oculta de público pero mantiene en Admin

**Pasos:**
1. [ ] Usar novedad del Test 3 o crear una nueva publicada
2. [ ] En Admin, hacer click en "Marcar como borrador" (toggle Publicado)
3. [ ] Verificar que sigue visible en Admin con badge "No"
4. [ ] Ir a Home y verificar que NO está en carrusel
5. [ ] Ir a `/novedades` y verificar que NO aparece

**Resultado esperado:**
- Visible en: Admin (como borrador)
- NO visible en: Carrusel Home, Página /novedades

**Estado:** ⬜ Pasó / ⬜ Falló

---

## Test 5: Editar Título e Imagen

**Objetivo:** Verificar que los cambios se reflejan en público

**Pasos:**
1. [ ] Ir a Admin y editar una novedad publicada
2. [ ] Cambiar título a "Título Modificado Test"
3. [ ] Cambiar imagen de portada
4. [ ] Guardar
5. [ ] Ir a Home (si está en carrusel) y verificar cambios
6. [ ] Ir a `/novedades` (si está en novedades) y verificar cambios

**Resultado esperado:**
- Título nuevo visible en público
- Nueva imagen visible

**Estado:** ⬜ Pasó / ⬜ Falló

---

## Test 6: Slug Duplicado

**Objetivo:** Verificar manejo correcto de error de slug duplicado

**Pasos:**
1. [ ] Crear novedad con slug "test-duplicado"
2. [ ] Guardar exitosamente
3. [ ] Crear OTRA novedad con el mismo slug "test-duplicado"
4. [ ] Verificar que aparece mensaje de error claro

**Resultado esperado:**
- Mensaje: "El slug 'test-duplicado' ya existe. Por favor usa otro slug..."
- NO se crea registro fantasma
- Usuario puede corregir y reintentar

**Estado:** ⬜ Pasó / ⬜ Falló

---

## Test 7: Toggle desde Tabla Admin

**Objetivo:** Verificar que los toggles de la tabla funcionan

**Pasos:**
1. [ ] En Admin, encontrar una novedad
2. [ ] Click en toggle "Publicar" / "Marcar como borrador"
3. [ ] Verificar que cambia el badge
4. [ ] Click en toggle "Agregar" / "Quitar" en columna Carrusel
5. [ ] Verificar que cambia el badge
6. [ ] Click en toggle "Agregar" / "Quitar" en columna Novedades
7. [ ] Verificar que cambia el badge

**Resultado esperado:**
- Cada toggle cambia su respectivo campo
- Cambios persisten al recargar

**Estado:** ⬜ Pasó / ⬜ Falló

---

## Test 8: Admin Lista TODAS las Novedades

**Objetivo:** Verificar que Admin muestra todas las novedades sin importar su estado

**Pasos:**
1. [ ] Crear novedad como borrador (publicado=false)
2. [ ] Ir a `/admin/novedades`
3. [ ] Verificar que aparece en la lista

**Resultado esperado:**
- Admin muestra novedades publicadas Y borradores
- Stats tiles muestran conteo correcto

**Estado:** ⬜ Pasó / ⬜ Falló

---

## Resumen de Resultados

| Test | Resultado |
|------|-----------|
| 1. Solo Carrusel | ⬜ |
| 2. Solo Novedades | ⬜ |
| 3. Ambos Lugares | ⬜ |
| 4. Despublicar | ⬜ |
| 5. Editar | ⬜ |
| 6. Slug Duplicado | ⬜ |
| 7. Toggles | ⬜ |
| 8. Admin Lista Todo | ⬜ |

**Total Pasados:** ___ / 8  
**Observaciones:**

---

**Firma Tester:** _______________  
**Fecha Completado:** _______________
