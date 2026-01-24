# QA Checklist - Portal del Paciente

**Fecha:** 2026-01-24  
**Versión:** 1.0  
**Última actualización:** Después del deploy a Vercel

---

## Pre-requisitos

### 1. Migración SQL
- [ ] Ejecutar `docs/sql/20260124_casos_quirurgicos_y_encuestas.sql` en Supabase
- [ ] Verificar que las tablas existen:
  - `casos_quirurgicos`
  - `survey_templates`
  - `survey_questions`
  - `survey_assignments`
  - `survey_responses`
- [ ] Verificar que `paciente_portal_tokens` tiene columna `caso_id`

### 2. Variables de entorno en Vercel
- [ ] `RESEND_API_KEY` - Para envío real de emails
- [ ] `NEXT_PUBLIC_SITE_URL` - URL de producción (ej: `https://fundaciontraesol.cl`)
- [ ] `PORTAL_TOKEN_SECRET` o `NEXTAUTH_SECRET` - Para firmar tokens JWT

---

## Flujos a Probar

### Portal del Paciente (Acceso por Token)

#### A. Generación de Token desde Admin
1. [ ] Admin > Quirúrgico > Pacientes > [Seleccionar paciente]
2. [ ] Click "Generar nuevo enlace"
3. [ ] Verificar que la URL generada NO contiene `localhost`
4. [ ] Verificar que el token tiene expiración (30 días por defecto)

#### B. Envío de Email con Token
1. [ ] Admin > Paciente > "Enviar por email"
2. [ ] Ingresar email válido y enviar
3. [ ] **IMPORTANTE:** Verificar que el email LLEGA realmente (revisar bandeja de entrada/spam)
4. [ ] Verificar contenido del email:
   - Saludo personalizado
   - Botón "Acceder al Portal" con URL correcta
   - Fecha de expiración
   - Email de contacto: `contacto@fundaciontraesol.cl`

#### C. Acceso al Portal
1. [ ] Abrir URL del portal con token válido
2. [ ] Verificar que carga sin errores server-side
3. [ ] Verificar datos del paciente mostrados correctamente
4. [ ] Verificar sección de cirugía (diagnóstico, fecha, hora)
5. [ ] Verificar logística de viaje (si aplica)

#### D. Edición de Datos del Paciente
**Nota:** Requiere `patient_can_edit = true` en la base de datos

1. [ ] Si botón "Editar" NO aparece:
   - Verificar en Supabase: `SELECT patient_can_edit FROM pacientes WHERE id = '[id]'`
   - Si es `false`, cambiar a `true` para prueba
2. [ ] Click "Editar"
3. [ ] Modificar datos (nombres, teléfono, dirección, etc.)
4. [ ] Click "Guardar"
5. [ ] Verificar mensaje de éxito
6. [ ] Refrescar página y verificar que cambios persisten

#### E. Contactos de Emergencia
1. [ ] Click "Agregar contacto"
2. [ ] Llenar: nombre, relación, teléfono
3. [ ] Guardar
4. [ ] Verificar que aparece en la lista
5. [ ] Probar edición de contacto existente
6. [ ] Probar eliminación de contacto

#### F. Subida de Archivos
1. [ ] En sección "Documentos Requeridos", click "Subir archivo"
2. [ ] Seleccionar archivo (PDF, JPG, PNG ≤ 10MB)
3. [ ] Verificar progreso de subida
4. [ ] Verificar mensaje de éxito
5. [ ] Verificar que archivo aparece en lista
6. [ ] **Admin:** Verificar que archivo se ve en panel admin del paciente

---

### Sistema de Encuestas (Nuevo)

#### G. Admin - Crear Encuesta
1. [ ] Admin > Encuestas > "Nueva Encuesta"
2. [ ] Llenar: nombre, tipo (Voluntarios/Pacientes), días delay
3. [ ] Guardar
4. [ ] Agregar preguntas:
   - Rating (estrellas)
   - Texto libre
   - Opción múltiple
5. [ ] Verificar orden de preguntas

#### H. Portal Público de Encuesta
1. [ ] Obtener un token de encuesta (crear manualmente en DB o via endpoint)
2. [ ] Abrir `/encuesta?token=[token]`
3. [ ] Verificar carga correcta de preguntas
4. [ ] Responder todas las preguntas
5. [ ] Enviar
6. [ ] Verificar mensaje de agradecimiento

#### I. Admin - Ver Resultados
1. [ ] Admin > Encuestas > [Seleccionar] > Ver Resultados
2. [ ] Verificar estadísticas:
   - Total enviadas
   - Completadas
   - Tasa de respuesta
   - Promedio rating
3. [ ] Verificar distribución por pregunta

---

## Casos de Error a Probar

### Token Inválido
1. [ ] Abrir `/paciente/portal?token=abc123fake`
2. [ ] Verificar mensaje "Enlace inválido o expirado"
3. [ ] Verificar link de contacto visible

### Token Expirado
1. [ ] Crear token con `expires_at` en el pasado
2. [ ] Intentar acceder
3. [ ] Verificar mensaje apropiado

### Sin Permiso de Edición
1. [ ] Asegurar `patient_can_edit = false`
2. [ ] Intentar acceder a `/api/paciente/update`
3. [ ] Verificar error 403 con mensaje claro

### Archivo Inválido
1. [ ] Intentar subir archivo >10MB
2. [ ] Intentar subir archivo .exe o tipo no permitido
3. [ ] Verificar mensajes de error claros

---

## Verificaciones de Producción

### URLs
- [ ] Ninguna URL generada contiene `localhost`
- [ ] Todas las URLs usan HTTPS
- [ ] Dominio correcto (fundaciontraesol.cl o similar)

### Emails
- [ ] Email de remitente: `no-reply@fundaciontraesol.cl`
- [ ] Email de contacto: `contacto@fundaciontraesol.cl`
- [ ] Emails llegan sin ir a spam (verificar SPF/DKIM en Resend)

### Seguridad
- [ ] Tokens no aparecen en logs de servidor
- [ ] Cookies httpOnly configuradas correctamente
- [ ] No hay exposición de datos sensibles en errores

---

## Admin - Funcionalidades Existentes (No Romper)

- [ ] Login admin funciona
- [ ] Operativos se listan correctamente
- [ ] Voluntarios se gestionan correctamente
- [ ] Novedades funcionan
- [ ] Invitaciones funcionan
- [ ] Mensajería funciona

---

## Notas de la Migración SQL

```sql
-- Verificar estado de migración
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('casos_quirurgicos', 'survey_templates', 'survey_questions', 'survey_assignments', 'survey_responses');

-- Verificar columna caso_id en tokens
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'paciente_portal_tokens' 
AND column_name = 'caso_id';
```

---

## Contacto para Problemas

- **Email técnico:** contacto@fundaciontraesol.cl
- **Documentación:** `/docs/` en el repositorio
