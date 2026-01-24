# Inventario de Emails Transaccionales - Traesol

**Fecha:** 2026-01-24  
**Proveedor:** Resend  
**Desde:** `EMAIL_FROM` / `RESEND_FROM` (ej: `Traesol <hola@mail.traesol.cl>`)

---

## Resumen de Emails

| # | Nombre | Cuándo se dispara | Destinatario | Archivo |
|---|--------|-------------------|--------------|---------|
| 1 | Bienvenida Admin | Al crear usuario admin | Admin nuevo | `api/admin/usuarios/route.ts` |
| 2 | Código de Recuperación | Solicitar reset contraseña | Admin | `api/admin/auth/request-reset/route.ts` |
| 3 | Gracias Voluntario (Registro) | Nuevo registro voluntario | Voluntario | `lib/email.ts` → `sendRegistroVoluntarioEmail` |
| 4 | Actualización Voluntario | Actualizar datos voluntario | Voluntario | `lib/email.ts` → `sendActualizacionVoluntarioEmail` |
| 5 | Postulación Operativo | Postular a operativo específico | Voluntario | `lib/email.ts` → `sendPostulacionOperativoEmails` |
| 6 | Postulación Interna | Postulación recibida | Admin interno | `lib/email.ts` → `tplInternoNuevaInscripcionOperativo` |
| 7 | Inscripción Aceptada | Admin aprueba inscripción | Voluntario | `lib/email.ts` → `sendInscripcionAceptadaEmail` |
| 8 | Inscripción Rechazada | Admin rechaza inscripción | Voluntario | `lib/email.ts` → `sendInscripcionRechazadaEmail` |
| 9 | Invitación Operativo | Admin invita voluntario | Voluntario | `lib/email.ts` → `sendInvitacionOperativoEmail` |
| 10 | Mensajería Masiva | Envío masivo desde admin | Voluntarios | `api/admin/mensajeria/enviar/route.ts` |
| 11 | Contacto General | Formulario contacto web | Usuario + Interno | `api/contacto/route.ts` |
| 12 | Contacto Empresas | Formulario empresas | Empresa + Interno | `api/empresas-contacto/route.ts` |
| 13 | Solicitud Empresas | Carrito de servicios empresas | Empresa + Interno | `api/empresas/solicitudes/route.ts` |
| 14 | Confirmación Quirúrgico | Confirmar datos paciente | Paciente | `lib/quirurgico/quirurgicoEmail.ts` |
| 15 | Email Paciente Custom | Email manual a paciente | Paciente | `api/admin/quirurgico/pacientes/[id]/email/route.ts` |

---

## Detalle por Email

### 1. Bienvenida Admin (con clave temporal)
- **Trigger:** POST `/api/admin/usuarios` - crear usuario
- **Template:** HTML inline en `sendWelcomeEmail()`
- **Variables:**
  - `firstName` - nombre del admin
  - `to` - email (usuario)
  - `tempPassword` - contraseña temporal
  - `loginUrl` - URL de login
- **Subject:** "Bienvenido/a al Panel Admin de Traesol - Credenciales de acceso"
- **Estado:** ✅ Diseño actual es el "modelo" a seguir

### 2. Código de Recuperación
- **Trigger:** POST `/api/admin/auth/request-reset`
- **Template:** HTML inline básico
- **Variables:**
  - `code` - código de 6 dígitos
  - `CODE_VALIDITY_MINUTES` - tiempo de validez
- **Subject:** "Tu código de recuperación: {code}"
- **Estado:** ⚠️ Necesita unificación visual

### 3. Gracias por Registrarte (Voluntario)
- **Trigger:** POST `/api/postulaciones/registrar` (nuevo voluntario)
- **Template:** `tplGraciasVoluntario()` en `lib/email.ts`
- **Variables:**
  - `nombres` - nombre del voluntario
- **Subject:** "¡Gracias por sumarte como voluntario!"

### 4. Actualización de Datos (Voluntario)
- **Trigger:** POST `/api/postulaciones/registrar` (actualización)
- **Template:** `tplActualizacionVoluntario()` en `lib/email.ts`
- **Variables:**
  - `nombres` - nombre del voluntario
- **Subject:** "Actualizamos tus datos de voluntario"

### 5. Postulación a Operativo
- **Trigger:** POST `/api/postulaciones/registrar` (postulación específica)
- **Template:** `tplGraciasPostulacionOperativo()` en `lib/email.ts`
- **Variables:**
  - `voluntario.nombres`
  - `operativo.titulo`, `operativo.fecha_inicio`, `operativo.fecha_fin`, `operativo.lugar`, `operativo.link`
- **Subject:** "Postulación registrada: {operativo.titulo}"

### 6. Nueva Inscripción (Interno)
- **Trigger:** Con email 5
- **Template:** `tplInternoNuevaInscripcionOperativo()` en `lib/email.ts`
- **Destinatario:** `RESEND_INTERNAL_TO` (ej: contacto@fundaciontraesol.cl)

### 7. Inscripción Aceptada
- **Trigger:** POST `/api/admin/inscripciones/update` (estado → aprobado/confirmado)
- **Template:** `sendInscripcionAceptadaEmail()` en `lib/email.ts`
- **Variables:**
  - `to`, `nombre`, `operativoTitulo`, `fechaInicio`, `fechaFin`, `lugar`, `whatsappGrupoUrl`
- **Subject:** "Tu postulación al operativo {titulo} fue aceptada"

### 8. Inscripción Rechazada
- **Trigger:** POST `/api/admin/inscripciones/update` (estado → rechazado)
- **Template:** `sendInscripcionRechazadaEmail()` en `lib/email.ts`
- **Variables:**
  - `to`, `nombre`, `operativoTitulo`
- **Subject:** "Actualización sobre tu postulación a {titulo}"

### 9. Invitación a Operativo
- **Trigger:** POST `/api/admin/invitaciones` o `/api/admin/inscripciones/invitar`
- **Template:** `tplInvitacionOperativo()` → `sendInvitacionOperativoEmail()` en `lib/email.ts`
- **Variables:**
  - `voluntario.nombres`, `voluntario.email`
  - `operativo.titulo`, `operativo.fecha_inicio`, `operativo.fecha_fin`, `operativo.lugar`
  - `acceptUrl`, `rejectUrl`
- **Subject:** "Invitación al operativo {titulo}"

### 10. Mensajería Masiva
- **Trigger:** POST `/api/admin/mensajeria/enviar`
- **Template:** `wrapEmail()` + `formatBodyHtml()` inline en route
- **Variables:**
  - `subject` - asunto libre
  - `body` - contenido libre
- **Subject:** (variable)
- **Estado:** ⚠️ Template inline, necesita unificación

### 11. Contacto General
- **Trigger:** POST `/api/contacto`
- **Templates:**
  - Usuario: `tplGraciasContacto()`
  - Interno: `tplInternoContacto()`
- **Variables:**
  - `nombre`, `email`, `telefono`, `asunto`, `mensaje`

### 12. Contacto Empresas
- **Trigger:** POST `/api/empresas-contacto`
- **Templates:**
  - Empresa: `tplGraciasEmpresa()`
  - Interno: `tplInternoEmpresa()`
- **Variables:**
  - `nombre_persona`, `nombre_empresa`, `productos[]`, `mensaje`

### 13. Solicitud Empresas (Carrito)
- **Trigger:** POST `/api/empresas/solicitudes`
- **Templates:**
  - Empresa: `tplEmpresaSolicitudConfirmacion()`
  - Interno: `tplEmpresaSolicitudInterna()`
- **Variables:**
  - `empresaNombre`, `contactoNombre`, `contactoEmail`, `contactoTelefono`, `ciudad`, `carritoResumen`, `deseaReunion`, `comentario`, `fechaRecepcion`

### 14. Confirmación Quirúrgico
- **Trigger:** POST `/api/admin/quirurgico/pacientes/[id]/confirmacion`
- **Template:** `buildSurgicalConfirmationEmail()` en `lib/quirurgico/quirurgicoEmail.ts`
- **Componente React:** `SurgicalConfirmationEmail.tsx` en `src/emails/`
- **Variables:**
  - Datos completos del paciente (nombre, diagnóstico, cirugía, vuelos, hotel, etc.)

### 15. Email Manual Paciente
- **Trigger:** POST `/api/admin/quirurgico/pacientes/[id]/email`
- **Template:** HTML renderizado desde React Email
- **Variables:**
  - `subject`, `html` (contenido completo)

---

## Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `src/lib/email.ts` | Funciones principales de envío y templates HTML |
| `src/emails/TraesolEmailLayout.tsx` | Layout React Email (parcialmente usado) |
| `src/emails/SurgicalConfirmationEmail.tsx` | Email quirúrgico React Email |
| `src/lib/quirurgico/quirurgicoEmail.ts` | Lógica de emails quirúrgicos |

---

## Variables de Entorno Requeridas

```env
RESEND_API_KEY=re_xxxx          # API key de Resend
EMAIL_FROM=Traesol <hola@mail.traesol.cl>
RESEND_FROM=Traesol <hola@mail.traesol.cl>
RESEND_INTERNAL_TO=contacto@fundaciontraesol.cl
NEXT_PUBLIC_BASE_URL=https://fundaciontraesol.cl
NEXT_PUBLIC_LOGO_URL=https://...logo-traesol.png
```

---

## Conclusiones

1. **Ya usa React Email** para algunos templates (`TraesolEmailLayout.tsx`, `SurgicalConfirmationEmail.tsx`)
2. **La mayoría usa HTML inline** en `lib/email.ts` con función `shell()`
3. **El diseño de referencia** es el de "Bienvenida Admin" en `/api/admin/usuarios/route.ts`
4. **Unificación necesaria:**
   - Código de recuperación
   - Mensajería masiva
   - Algunos templates quirúrgicos
5. **Ya existe un layout reutilizable:** `shell()` en `lib/email.ts` que se puede mejorar
