# Traesol Web 2026 — Índice de Proyecto (v0.2)

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
  - `components/`
    - `Carousel.tsx` ← **fallback de imagen + `unoptimized` (Codespaces)**
    - `CTAButtons.tsx`
    - `MetricBlocks.tsx`
    - `OperativosCarousel.tsx` ← **fallback de imagen + `unoptimized`**
  - `lib/`
    - `supabase.ts` ← cliente navegador (anon)
    - `supabaseServer.ts` ← **cliente server simple con `@supabase/supabase-js` (sin cookies) para lecturas públicas**

## Configuración local (no versionada)
- `.env.local`
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
