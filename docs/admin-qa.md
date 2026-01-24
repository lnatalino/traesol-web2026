# Admin Panel QA Checklist

> Sprint: "ADMIN UX UNIFICADO + QA FUNCIONAL"  
> Meta: Que cualquier usuario no técnico entienda cada pantalla en 5-10 segundos
> 
> **Última actualización**: 21 enero 2026  
> **Sprint de corrección**: Invitaciones, Mensajería, Inventario

## ✅ Resumen de cambios

### UI Kit creado (`/src/components/admin/ui/`)

| Componente | Propósito |
|------------|-----------|
| `AdminPageHeader` | Header de página con breadcrumb, título, descripción, acciones y mensajes |
| `AdminSectionCard` | Card/isla para agrupar contenido relacionado |
| `StatusBadge` | Badges de estado unificados (draft, published, pending, etc.) |
| `StatTile` / `StatTileGrid` | Tiles de estadísticas con variantes de color (highlight/highlightVariant) |
| `EmptyState` | Estado vacío para listas sin datos |
| `SearchBar` | Barra de búsqueda con botón de limpiar |

### Módulos actualizados

| Módulo | Cambios |
|--------|---------|
| **Dashboard** (`/admin`) | Stats en vivo (operativos, voluntarios, pendientes, novedades) |
| **Operativos** (`/admin/operativos`) | Ya tenía card-based UI, revisado |
| **Operativo Detalle** (`/admin/operativos/[id]`) | Secciones ordenadas, search en confirmados |
| **Voluntarios** (`/admin/voluntarios`) | Stats, header unificado |
| **Inscripciones** (`/admin/inscripciones`) | Stats, EmptyState, header |
| **Invitaciones** (`/admin/invitaciones`) | **CORREGIDO**: Selector de operativo obligatorio, historial de invitaciones |
| **Mensajería** (`/admin/mensajeria`) | Stats, header, 3 modos (todos/operativo/personalizado) |
| **Novedades** (`/admin/novedades`) | Stats (total, publicadas, carrusel), header |
| **Empresas** (`/admin/empresas/productos`) | Stats, AdminSectionCard para métricas |
| **Inventario** (`/admin/inventario`) | Stats, AdminSectionCard para filtros |
| **Quirúrgico** (`/admin/quirurgico`) | Layout con back link |

---

## 🔧 Sprint de Corrección (21 enero 2026)

### Invitaciones - CORREGIDO ✅

**Problema**: El selector de operativo no aparecía prominente y no había historial de invitaciones.

**Solución implementada**:
1. **Selector de operativo obligatorio** (Paso 1) - debe seleccionar antes de ver voluntarios
2. **EmptyState** si no hay operativos publicados con CTA a "Ir a Operativos"
3. **Historial de invitaciones** (Paso 3) - muestra invitaciones enviadas por operativo
4. **Persistencia URL** - `?operativo=ID` se mantiene en la URL
5. **Stats dinámicos** - muestra voluntarios seleccionados e invitaciones enviadas

**Archivos modificados**:
- `/src/app/admin/invitaciones/page.tsx` - Carga historial de invitaciones
- `/src/app/admin/invitaciones/InviteManager.tsx` - Nuevo flujo de 3 pasos
- `/src/app/admin/invitaciones/OperativoSelector.tsx` - Componente de selector
- `/src/app/admin/invitaciones/InvitacionesHistorial.tsx` - Componente de historial

### Mensajería - OK ✅

**Estado**: Ya funcionaba correctamente con:
- 3 modos de envío: Todos, Por operativo, Personalizado
- Selector de operativo en modo "Por operativo"
- Preview de destinatarios
- Filtros por búsqueda

### Inventario - OK ✅

**Estado**: Ya funcionaba correctamente con:
- Stats: Ítems totales, Activos, Inactivos, Categorías
- Filtros: búsqueda, categoría, solo activos
- Tabs de navegación (Items, Categorías)
- CRUD completo de items

---

## 📋 Checklist de QA por módulo

### 1. Dashboard (`/admin`)

- [ ] Se muestran 4 StatTiles: operativos activos, voluntarios, pendientes, novedades
- [ ] Las cards de módulos tienen hover effect
- [ ] El botón "Cerrar sesión" funciona
- [ ] Se muestra rol y email del usuario

### 2. Operativos (`/admin/operativos`)

- [ ] Lista de operativos en cards
- [ ] Badge de estado visible (Publicado/Borrador/Cerrado)
- [ ] Botón "Nuevo operativo" visible
- [ ] Click en card lleva al detalle

### 3. Detalle de Operativo (`/admin/operativos/[id]`)

- [ ] Summary card muestra datos clave
- [ ] Sección "Confirmados" con búsqueda y filtros
- [ ] Sección "Postulaciones pendientes" con acciones
- [ ] Sección "Invitaciones" con historial
- [ ] Sección "Inventario" con conteo coherente

### 4. Voluntarios (`/admin/voluntarios`)

- [ ] Stats: Total voluntarios, Profesiones distintas
- [ ] Filtros funcionan (búsqueda, profesión, especialidad, alimentación)
- [ ] Botón "Exportar CSV" funciona
- [ ] Click en "Ver perfil" lleva al detalle

### 5. Voluntario Detalle (`/admin/voluntarios/[id]`)

- [ ] AdminHero muestra datos clave del voluntario
- [ ] Cards de datos personales, contacto, identificación
- [ ] Historial de participación visible
- [ ] Estado de uniforme correcto

### 6. Inscripciones (`/admin/inscripciones`)

- [ ] Stats: Total pendientes, Postulaciones, Invitaciones, Operativos con pendientes
- [ ] EmptyState cuando no hay pendientes
- [ ] Agrupación por operativo funciona
- [ ] Botones Aceptar/Rechazar funcionan

### 7. Invitaciones (`/admin/invitaciones`)

- [x] **Selector de operativo obligatorio** - Paso 1 antes de seleccionar voluntarios
- [x] Stats: Voluntarios disponibles, Operativos abiertos
- [x] EmptyState si no hay operativos publicados
- [x] Filtros por profesión/especialidad funcionan
- [x] Selección múltiple funciona
- [x] **Historial de invitaciones** - Paso 3 muestra invitaciones enviadas
- [x] Persistencia de operativo seleccionado en URL
- [ ] Envío de invitaciones funciona (probar con Supabase conectado)

### 8. Mensajería (`/admin/mensajeria`)

- [x] Stats: Destinatarios disponibles, Operativos disponibles
- [x] 3 modos de envío: Todos, Por operativo, Personalizado
- [x] Selector de operativo en modo "Por operativo"
- [x] Preview de destinatarios funciona
- [ ] Envío de emails funciona (probar con SMTP conectado)

### 9. Novedades (`/admin/novedades`)

- [ ] Stats: Total, Publicadas, En carrusel
- [ ] Toggle de publicado/carrusel funciona
- [ ] Botón "Nueva novedad" funciona
- [ ] Edición de novedad funciona

### 10. Empresas (`/admin/empresas/productos`)

- [ ] Stats: Total productos, Productos activos
- [ ] AdminSectionCard de métricas funciona
- [ ] Lista de productos con orden
- [ ] Botón "Nuevo producto" funciona

### 11. Inventario (`/admin/inventario`)

- [x] Stats: Ítems totales, Activos, Inactivos, Categorías
- [x] Filtros funcionan (búsqueda, categoría, solo activos)
- [x] Tabs de navegación funcionan (Items, Categorías)
- [x] Botón "Nuevo ítem" funciona
- [ ] CRUD de items funciona (probar con Supabase conectado)

### 12. Quirúrgico (`/admin/quirurgico/pacientes`)

- [ ] Header con back link a /admin
- [ ] Tabs de navegación funcionan
- [ ] Búsqueda por nombre/RUT funciona
- [ ] Filtro por operativo funciona
- [ ] Botón "Nuevo paciente" funciona

---

## 🎨 Guía de estilo unificada

### Colores de estado

| Estado | Clase Tailwind |
|--------|---------------|
| Success/Confirmado | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| Warning/Pendiente | `bg-amber-50 text-amber-700 border-amber-200` |
| Danger/Rechazado | `bg-rose-50 text-rose-700 border-rose-200` |
| Info/Invitación | `bg-blue-50 text-blue-700 border-blue-200` |
| Default/Neutral | `bg-slate-50 text-slate-700 border-slate-200` |

### Tipografía

- **Eyebrow**: `text-xs font-semibold uppercase tracking-widest text-blue-600`
- **Title**: `text-2xl font-semibold text-slate-900`
- **Subtitle**: `text-sm text-slate-500`
- **Section heading**: `text-base font-semibold text-slate-900`
- **Label**: `text-xs font-medium uppercase tracking-wide text-slate-500`

### Espaciado

- Entre secciones principales: `space-y-6`
- Dentro de cards: `p-5` o `p-6`
- Entre elementos en cards: `space-y-4`

### Bordes y sombras

- Cards principales: `rounded-2xl border border-slate-100 bg-white/95 shadow-sm`
- Cards hover: `hover:-translate-y-0.5 hover:shadow-lg`
- Inputs: `rounded-xl border border-slate-200`
- Buttons primary: `rounded-xl bg-blue-600 text-white`
- Buttons secondary: `rounded-xl border border-slate-200 text-slate-700`

---

## 🔄 Próximos pasos sugeridos

1. **Tests E2E**: Agregar tests con Playwright para flujos críticos
2. **Loading states**: Agregar skeletons durante carga
3. **Optimistic updates**: Mejorar UX en acciones (aceptar/rechazar)
4. **Dark mode**: Considerar soporte para modo oscuro
5. **Accesibilidad**: Auditar con herramientas como axe
