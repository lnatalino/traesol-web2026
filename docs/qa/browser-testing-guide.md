# 🧪 Guía de Pruebas en Navegador

**Fix:** Operativos publicados ahora aparecen en Admin  
**Fecha:** 2026-01-23  
**Tiempo estimado:** 10-15 minutos

---

## 🎯 Objetivo

Verificar que los operativos con `estado = "publicado"` aparecen correctamente en todos los dropdowns de Admin:
- ✅ Mensajería
- ✅ Invitaciones
- ✅ Perfil de voluntario (invitar)

Y que los borradores NO aparecen en esos dropdowns.

---

## 🚀 Pre-requisitos

1. **Servidor corriendo:** `npm run dev` en puerto 3008
2. **Sesión admin activa:** Login en `/admin`
3. **Base de datos:** Acceso a Supabase

---

## 📝 Escenario 1: Operativo Borrador NO Aparece

### Paso 1: Crear operativo borrador
1. Ir a: `http://localhost:3008/admin/operativos`
2. Hacer clic en **"Nuevo Operativo"**
3. Llenar datos mínimos:
   - Título: `Test QA 2026-01-23`
   - Slug: `test-qa-20260123`
   - Fecha inicio: `2026-02-15`
   - Fecha fin: `2026-02-20`
   - Lugar: `Buenos Aires`
   - Descripción: `Operativo de prueba`
4. **NO hacer clic en "Publicar"** - Guardar como borrador
5. Confirmar que se creó correctamente

### Paso 2: Verificar que NO aparece en Mensajería
1. Ir a: `http://localhost:3008/admin/mensajeria`
2. Abrir dropdown de "Seleccionar operativo"
3. **Verificar:** `Test QA 2026-01-23` NO debe estar en la lista
4. **Resultado esperado:** ✅ Borrador no visible

### Paso 3: Verificar que NO aparece en Invitaciones
1. Ir a: `http://localhost:3008/admin/invitaciones`
2. Abrir dropdown de "Seleccionar operativo"
3. **Verificar:** `Test QA 2026-01-23` NO debe estar en la lista
4. **Resultado esperado:** ✅ Borrador no visible

### Paso 4: Verificar que NO aparece en Perfil Voluntario
1. Ir a: `http://localhost:3008/admin/voluntarios`
2. Elegir cualquier voluntario
3. Scroll hasta "Invitar a operativo"
4. Abrir dropdown de operativos
5. **Verificar:** `Test QA 2026-01-23` NO debe estar en la lista
6. **Resultado esperado:** ✅ Borrador no visible

### Paso 5: Verificar que SÍ aparece en Gestión
1. Ir a: `http://localhost:3008/admin/operativos`
2. **Verificar:** `Test QA 2026-01-23` SÍ debe estar en la lista
3. Debe tener badge "Borrador" o similar
4. **Resultado esperado:** ✅ Visible en gestión

**✅ Checkpoint 1:** Operativo borrador NO visible en dropdowns, SÍ en gestión

---

## 📝 Escenario 2: Operativo Publicado SÍ Aparece

### Paso 6: Publicar el operativo
1. Ir a: `http://localhost:3008/admin/operativos`
2. Hacer clic en `Test QA 2026-01-23`
3. Hacer clic en botón **"Publicar"**
4. Confirmar la publicación
5. **Verificar:** Estado cambió a "Publicado"

### Paso 7: Verificar que SÍ aparece en Mensajería
1. Ir a: `http://localhost:3008/admin/mensajeria`
2. Refrescar página (F5) si es necesario
3. Abrir dropdown de "Seleccionar operativo"
4. **Verificar:** `Test QA 2026-01-23` SÍ debe estar en la lista
5. **Resultado esperado:** ✅ Publicado visible
6. **Extra:** Seleccionarlo y verificar que carga datos

### Paso 8: Verificar que SÍ aparece en Invitaciones
1. Ir a: `http://localhost:3008/admin/invitaciones`
2. Refrescar página (F5) si es necesario
3. Abrir dropdown de "Seleccionar operativo"
4. **Verificar:** `Test QA 2026-01-23` SÍ debe estar en la lista
5. **Resultado esperado:** ✅ Publicado visible
6. **Extra:** Seleccionarlo y verificar que permite seleccionar voluntarios

### Paso 9: Verificar que SÍ aparece en Perfil Voluntario
1. Ir a: `http://localhost:3008/admin/voluntarios`
2. Elegir cualquier voluntario
3. Scroll hasta "Invitar a operativo"
4. Refrescar si es necesario
5. Abrir dropdown de operativos
6. **Verificar:** `Test QA 2026-01-23` SÍ debe estar en la lista
7. **Resultado esperado:** ✅ Publicado visible
8. **Extra:** Seleccionarlo e invitar al voluntario

### Paso 10: Verificar que SÍ aparece en Web Pública
1. Abrir ventana incógnito
2. Ir a: `http://localhost:3008/operativos`
3. **Verificar:** `Test QA 2026-01-23` SÍ debe estar en la lista
4. **Resultado esperado:** ✅ Publicado visible en público
5. Hacer clic para ver detalle
6. Verificar página de detalle carga correctamente

**✅ Checkpoint 2:** Operativo publicado VISIBLE en todos lados

---

## 📝 Escenario 3: Operativo Cerrado NO Aparece

### Paso 11: Cerrar el operativo
1. Ir a: `http://localhost:3008/admin/operativos`
2. Hacer clic en `Test QA 2026-01-23`
3. Cambiar estado manualmente a "Cerrado" (o usar botón si existe)
4. Guardar cambios
5. **Verificar:** Estado cambió a "Cerrado"

### Paso 12: Verificar que NO aparece en dropdowns
1. Ir a `/admin/mensajeria` → NO debe aparecer
2. Ir a `/admin/invitaciones` → NO debe aparecer
3. Ir a `/admin/voluntarios/[id]` → NO debe aparecer
4. Ir a `/operativos` (público) → NO debe aparecer
5. Ir a `/admin/operativos` → SÍ debe aparecer con badge "Cerrado"

**✅ Checkpoint 3:** Operativo cerrado NO visible en dropdowns

---

## 📝 Escenario 4: Operativo con Fecha Pasada

### Paso 13: Crear operativo con fecha pasada
1. Ir a: `http://localhost:3008/admin/operativos`
2. Crear nuevo operativo:
   - Título: `Test Pasado QA`
   - Fecha inicio: `2025-12-01`
   - Fecha fin: `2025-12-15`
   - Estado: **Publicado**
3. Guardar

### Paso 14: Verificar que NO aparece
1. Ir a `/admin/mensajeria` → NO debe aparecer (filtrado por `isOperativoAbierto`)
2. Ir a `/admin/invitaciones` → NO debe aparecer
3. Ir a `/operativos` (público) → NO debe aparecer
4. Ir a `/admin/operativos` → SÍ debe aparecer con badge "Finalizado"

**✅ Checkpoint 4:** Operativo pasado auto-finalizado

---

## 🧹 Limpieza

1. Ir a `/admin/operativos`
2. Eliminar operativos de prueba:
   - `Test QA 2026-01-23`
   - `Test Pasado QA`

---

## 📊 Checklist Final

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| ✅ Borrador NO en mensajería | ⬜ | |
| ✅ Borrador NO en invitaciones | ⬜ | |
| ✅ Borrador NO en perfil voluntario | ⬜ | |
| ✅ Borrador SÍ en gestión | ⬜ | |
| ✅ Publicado SÍ en mensajería | ⬜ | |
| ✅ Publicado SÍ en invitaciones | ⬜ | |
| ✅ Publicado SÍ en perfil voluntario | ⬜ | |
| ✅ Publicado SÍ en web pública | ⬜ | |
| ✅ Cerrado NO en dropdowns | ⬜ | |
| ✅ Pasado NO en dropdowns | ⬜ | |

---

## 🐛 Si algo falla...

### Problema: Operativo publicado NO aparece en dropdown

**Solución:**
1. Verificar en DB que `estado = 'publicado'`
2. Verificar que `fecha_inicio` es futuro
3. Refrescar página (F5)
4. Revisar console de navegador (F12) por errores
5. Verificar logs del servidor

### Problema: Operativo borrador SÍ aparece en dropdown

**Solución:**
1. Verificar que el fix se aplicó correctamente
2. Ejecutar: `./scripts/verify-operativos-fix.sh`
3. Revisar [src/app/admin/mensajeria/page.tsx](../../src/app/admin/mensajeria/page.tsx) línea 20
4. Revisar [src/app/admin/invitaciones/page.tsx](../../src/app/admin/invitaciones/page.tsx) línea 32

### Problema: Servidor no responde

**Solución:**
```bash
# Terminal 1
cd /workspaces/traesol-web2026
npm run dev

# Esperar a que diga "Ready in X.Xs"
# Abrir navegador en http://localhost:3008
```

---

## ✅ Resultado Esperado

Después de completar estas pruebas:

✅ Operativos con `estado = "borrador"`:
- NO aparecen en dropdowns de admin
- NO aparecen en web pública
- SÍ aparecen en gestión admin

✅ Operativos con `estado = "publicado"`:
- SÍ aparecen en dropdowns de admin
- SÍ aparecen en web pública (si fecha es futura)
- SÍ aparecen en gestión admin

✅ Operativos con `estado = "cerrado"`:
- NO aparecen en dropdowns de admin
- NO aparecen en web pública
- SÍ aparecen en gestión admin

✅ Operativos con fecha pasada:
- NO aparecen en dropdowns (auto-finalizados)
- NO aparecen en web pública
- SÍ aparecen en gestión con badge "Finalizado"

---

**¡Listo para probar!** 🚀

Si todas las pruebas pasan, el fix está funcionando correctamente y listo para merge/deploy.
