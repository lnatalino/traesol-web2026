# Traesol Web 2026 — Índice de Proyecto (v0.1)

> Este índice se actualiza en cada sprint. **No incluir `.env.local`** (está en .gitignore).

## Raíz
- `.gitignore`
- `package.json` (dev en puerto 3008)
- `next.config.ts` (imágenes remotas: placehold.co y *.supabase.co)
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
    - `Carousel.tsx`
    - `CTAButtons.tsx`
    - `MetricBlocks.tsx`
    - `OperativosCarousel.tsx`
  - `lib/`
    - `supabase.ts` ← cliente para navegador (anon)
    - `supabaseServer.ts` ← cliente para RSC/servidor (cookies)

## Configuración local (no versionada)
- `.env.local`  
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
