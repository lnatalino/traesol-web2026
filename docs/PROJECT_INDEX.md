# Traesol Web 2026 — Índice de Proyecto (v0.4)

> Este índice se actualiza en cada sprint. **No incluir `.env.local`** (está en .gitignore).

## Raíz
- `.gitignore`
- `package.json` (dev en puerto **3008**)
- `next.config.ts` (imágenes remotas: `placehold.co` y `*.supabase.co`)
- `postcss.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`
- `README.md`

## Public
- `public/` (assets estáticos por defecto)

## Código fuente
- `src/`
  - `app/`
    - `globals.css`
    - `layout.tsx`
    - `page.tsx` ← Home conectada a Supabase (carrusel, CTAs, operativos, métricas)
    - `operativos/`
      - `[slug]/`
        - `page.tsx` ← Detalle operativo (dynamic metadata + force-dynamic)
        - `loading.tsx`
        - `not-found.tsx`
    - `postular/`
      - `page.tsx` ← Página de postulación (lee `?operativo=slug`)
  - `components/`
    - `Carousel.tsx` ← fallback + `unoptimized`
    - `CTAButtons.tsx`
    - `MetricBlocks.tsx`
    - `OperativosCarousel.tsx` ← fallback + `unoptimized`
    - `forms/`
      - `PostulacionVoluntarioForm.tsx` ← formulario cliente con RPC
  - `lib/`
    - `supabase.ts` ← cliente navegador (anon)
    - `supabaseServer.ts` ← cliente server simple (`@supabase/supabase-js`) para lecturas públicas

## Backend (Supabase)
- RPC: `public.api_postular_voluntario(...)` (SECURITY DEFINER, upsert voluntario + inscripción opcional)
- Permisos: `GRANT EXECUTE ... TO anon`

## Configuración local (no versionada)
- `.env.local`
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

## SQL / Migraciones recientes
- `docs/sql/20251127_quirurgico_comunicaciones_migration.sql` ← actualiza la tabla `quirurgico_comunicaciones` al nuevo esquema (renombres, body_preview, metadata y policy `service_all`).
- `docs/sql/20251124_quirurgico_comunicaciones.sql` ← referencia del esquema esperado tras la migración.
- `docs/sql/20260122_admin_users_nombre_apellido.sql` ← agrega campos nombre/apellido a admin_users.
- `docs/sql/20260122_inventario_lanyard_types_gear.sql` ← tabla lanyard_types para inventario.

## Fixes recientes (Enero 2026)

### 2026-01-23: Operativos publicados ahora aparecen en Admin
**Problema crítico:** Operativos con `estado="publicado"` aparecían en la web pública pero NO en dropdowns de Admin (invitaciones, mensajería, perfil voluntario).

**Causa:** Queries inconsistentes - algunos módulos no filtraban por `estado="publicado"`.

**Solución implementada:**
- ✅ [admin/mensajeria/page.tsx](../src/app/admin/mensajeria/page.tsx): Agregado `.eq("estado", "publicado")`
- ✅ [admin/invitaciones/page.tsx](../src/app/admin/invitaciones/page.tsx): Agregado `.eq("estado", "publicado")`
- ✅ [admin/voluntarios/[id]/page.tsx](../src/app/admin/voluntarios/[id]/page.tsx): Ya corregido en sesión anterior

**Patrón establecido:**
```typescript
// Para dropdowns/selects de "operativos disponibles":
supabaseService
  .from("operativos")
  .select("...")
  .eq("estado", "publicado")  // ← OBLIGATORIO
  .order("fecha_inicio", { ascending: true })

// Luego aplicar isOperativoAbierto() para filtrar por fechas
```

**Documentación:**
- [docs/admin-operativos-disponibles.md](./admin-operativos-disponibles.md) - Criterio unificado y scopes de visibilidad
- [docs/qa/admin-operativos-disponibles-qa.md](./qa/admin-operativos-disponibles-qa.md) - 10 escenarios de prueba + casos edge

**Estados de operativo:**
- `borrador` - Solo visible en admin gestión
- `publicado` - Visible en público + admin dropdowns
- `cerrado` - Solo visible en admin gestión
- `finalizado` - Solo visible en admin gestión
