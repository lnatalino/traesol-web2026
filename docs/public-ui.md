# Sistema de Diseño UI Público

**Última actualización:** Enero 2026  
**TypeScript:** ✅ Compila sin errores

---

## 📦 Importación

Todos los componentes se importan desde `@/components/public`:

```tsx
import {
  // Layout
  PublicPageLayout,
  PublicPageHeader,
  PublicSection,
  PublicSectionHeader,
  
  // Cards
  PublicCard, PublicCardImage, PublicCardBody, PublicCardEyebrow,
  OperativoCard,
  NovedadCard,
  
  // Buttons
  PrimaryButton, SecondaryButton,
  PrimaryButtonLink, SecondaryButtonLink,
  TextLink,
  
  // UI Elements
  Badge, estadoToBadgeVariant,
  DatePill, formatDateChile,
  IconRow, OperativoIconRow,
  EmptyState,
} from "@/components/public";
```

---

## 🏗️ Layout Components

### `PublicPageLayout`

Envuelve toda la página con max-width, padding y fondo consistente.

```tsx
<PublicPageLayout bg="slate">  {/* bg: "white" | "slate" | "light" */}
  <PublicPageHeader ... />
  <section>...</section>
</PublicPageLayout>
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `bg` | `"white" \| "slate" \| "light"` | `"slate"` | Color de fondo |
| `children` | `ReactNode` | — | Contenido de la página |

---

### `PublicPageHeader`

Hero header para páginas públicas. Tres variantes visuales.

```tsx
<PublicPageHeader
  eyebrow="Operativos"
  title="Próximos operativos"
  description="Descripción del contenido de la página."
  variant="gradient"
>
  {/* Contenido adicional opcional */}
</PublicPageHeader>
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `eyebrow` | `string` | — | Texto pequeño sobre el título |
| `title` | `string` | — | Título principal (H1) |
| `description` | `string` | — | Descripción debajo del título |
| `variant` | `"gradient" \| "white" \| "light"` | `"gradient"` | Estilo visual |
| `children` | `ReactNode` | — | Contenido extra dentro del header |

**Variantes:**
- `gradient`: Fondo azul gradiente con texto blanco (hero principal)
- `white`: Fondo blanco con texto oscuro
- `light`: Fondo slate claro con texto oscuro

---

## 🃏 Cards

### `OperativoCard`

Card para mostrar operativos en listados públicos. Estilo "isla" con imagen, fecha prominente y CTA.

```tsx
<OperativoCard
  slug="operativo-2025-atacama"
  titulo="Operativo Atacama 2025"
  fecha_inicio="2025-03-15"
  lugar="Copiapó, Atacama"
  imagen="https://..."
  showPostular={true}  // true = "Postular", false = "Ver detalles"
/>
```

### `NovedadCard`

Card estilo "Instagram" para novedades. Imagen cuadrada con badge de tipo.

```tsx
<NovedadCard
  slug="noticia-2025"
  titulo="Nueva alianza con hospital"
  resumen="Resumen de la noticia..."
  imagen="https://..."
  fecha_publicacion="2025-01-20"
  tipo="noticia"  // "noticia" | "comunicado" | "evento"
/>
```

---

## 🔘 Buttons

```tsx
// Botones (onClick)
<PrimaryButton onClick={...} size="md">Acción principal</PrimaryButton>
<SecondaryButton onClick={...} size="sm">Acción secundaria</SecondaryButton>

// Links (href)
<PrimaryButtonLink href="/postular">Postular</PrimaryButtonLink>
<SecondaryButtonLink href="/contacto">Contacto</SecondaryButtonLink>

// Text link
<TextLink href="/sobre-nosotros">Conoce más →</TextLink>
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño del botón |
| `disabled` | `boolean` | `false` | Deshabilitar botón |

---

## 🎨 UI Elements

| Componente | Descripción |
|------------|-------------|
| `Badge` | Etiqueta de estado con colores semánticos |
| `DatePill` | Fecha formateada en píldora con ícono |
| `EmptyState` | Estado vacío con ícono, mensaje y acción opcional |
| `IconRow` | Fila de íconos + labels (fecha, lugar, etc.) |

---

## 🔗 Constantes de Contacto

```tsx
import { PUBLIC_CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/constants/publicContact";

// PUBLIC_CONTACT_EMAIL = "contacto@fundaciontraesol.cl"
// SOCIAL_LINKS = { instagram, linkedin, facebook }
```

---

## 📐 Guía de Estilo

### Spacing
- **Page padding**: `px-4 py-12 lg:px-6`
- **Section gap**: `space-y-10` o `space-y-12`
- **Card grid**: `gap-6`

### Border Radius
- **Cards/Sections**: `rounded-2xl` (16px) o `rounded-3xl` (24px)
- **Headers hero**: `rounded-[32px]`
- **Buttons**: `rounded-2xl`
- **Inputs**: `rounded-xl`

### Colores
- **Primary**: `blue-600` / `blue-700`
- **Background**: `slate-50` (páginas), `white` (cards)
- **Text**: `slate-900` (títulos), `slate-600` (body)
- **Gradients**: `from-blue-700 via-blue-600 to-cyan-500`

### Typography
- **Eyebrow**: `text-xs font-semibold uppercase tracking-[0.35em]`
- **H1**: `text-4xl font-semibold sm:text-5xl`
- **H2**: `text-3xl font-semibold`
- **Body**: `text-base text-slate-600`

---

## 📱 Mobile First

Todos los componentes están diseñados mobile-first:
- Grids colapsan a una columna en móvil
- Cards se apilan verticalmente
- Padding se ajusta con breakpoints

---

## B) Lógica de Agenda - "Próximos Operativos"

### Función Principal

```typescript
// src/lib/operativosAgenda.ts
getUpcomingOperativos(limit: number = 3): Promise<AgendaOperativo[]>
```

### Reglas de Filtrado

1. **Estado = "publicado"** (excluye borrador, cerrado, finalizado)
2. **fecha_inicio >= hoy** (operativos futuros)
3. **fecha_fin > ahora** (si existe, no auto-finalizado)

### Orden

- `ORDER BY fecha_inicio ASC` (los más próximos primero)
- Si empata: `ORDER BY created_at ASC`

### Ejemplo de Query

```sql
SELECT * FROM operativos
WHERE estado = 'publicado'
  AND fecha_inicio >= '2026-01-22'  -- hoy en Chile
ORDER BY fecha_inicio ASC, created_at ASC
LIMIT 3
```

### Timezone

Se usa **America/Santiago** para todas las comparaciones de fecha:

```typescript
// src/lib/operativosShared.ts
getNowInChile(): Date
toChileDateString(date?: Date): string  // "YYYY-MM-DD"
```

---

## C) Auto-Finalización / Auto-Exclusión

### Estado Computado

El sistema calcula un "estado computado" que puede diferir del estado en DB:

```typescript
// src/lib/operativosShared.ts
type ComputedOperativoEstado = "publicado" | "cerrado" | "finalizado" | "borrador";

getComputedEstado(operativo, referenceDate): ComputedOperativoEstado
```

### Reglas

| Condición | Estado Computado |
|-----------|------------------|
| `estado = "finalizado"` | `"finalizado"` |
| `fecha_fin < ahora` | `"finalizado"` (auto) |
| `estado = "cerrado"` | `"cerrado"` |
| `estado = "publicado"` | `"publicado"` |
| default | `"borrador"` |

### Comportamiento

- **Admin:** El badge muestra el estado computado (incluye auto-finalizado)
- **Agenda Home:** Excluye operativos con estado computado ≠ "publicado"
- **No se modifica la DB:** El cálculo es on-the-fly

### Componente Admin Actualizado

[OperativoAdminCard.tsx](../src/components/admin/operativos/OperativoAdminCard.tsx) ahora usa `getComputedEstado()` para mostrar el badge correcto.

---

## D) Páginas Refactorizadas

| Página | Archivo | Cambios |
|--------|---------|---------|
| Inicio | [page.tsx](../src/app/page.tsx) | Usa `getUpcomingOperativos()`, componentes reutilizables, empty state |
| Operativos | [operativos/page.tsx](../src/app/operativos/page.tsx) | Header hero, empty state mejorado |
| Novedades | [novedades/page.tsx](../src/app/novedades/page.tsx) | Header hero, cards consistentes |

### Estilo Visual

- Fondo: `bg-slate-50`
- Cards: `rounded-2xl border border-slate-200 shadow-sm`
- Hover: `hover:-translate-y-0.5 hover:shadow-lg`
- Hero sections: `bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500`

---

## E) Archivos Creados/Modificados

### Nuevos

- `/src/components/public/PublicSectionHeader.tsx`
- `/src/components/public/PublicSection.tsx`
- `/src/components/public/Badge.tsx`
- `/src/components/public/DatePill.tsx`
- `/src/components/public/IconRow.tsx`
- `/src/components/public/PublicCard.tsx`
- `/src/components/public/EmptyState.tsx`
- `/src/components/public/index.ts`
- `/src/lib/operativosAgenda.ts`

### Modificados

- `/src/lib/operativosShared.ts` - Agregado: `getNowInChile`, `toChileDateString`, `getComputedEstado`, `isOperativoParaAgenda`
- `/src/app/page.tsx` - Refactor completo
- `/src/app/operativos/page.tsx` - Hero + empty state
- `/src/app/novedades/page.tsx` - Hero + cards consistentes
- `/src/components/admin/operativos/OperativoAdminCard.tsx` - Estado computado

---

## Verificación

```bash
npx tsc --noEmit  # ✅ Sin errores
```
