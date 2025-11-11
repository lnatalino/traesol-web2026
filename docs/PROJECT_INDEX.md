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
