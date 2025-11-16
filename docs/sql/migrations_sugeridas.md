# Migraciones sugeridas para el módulo de inscripciones

Copiar y ejecutar en Supabase (SQL editor) según corresponda:

```sql
-- 1. Columna para registrar el origen de la inscripción.
ALTER TABLE public.inscripciones
ADD COLUMN IF NOT EXISTS origen text;

-- 2. Token único para respuestas (aceptar / rechazar invitaciones).
ALTER TABLE public.inscripciones
ADD COLUMN IF NOT EXISTS token_respuesta uuid;

-- 3. Marca temporal de respuesta (útil para auditoría / futuras métricas).
ALTER TABLE public.inscripciones
ADD COLUMN IF NOT EXISTS respondido_en timestamptz;

-- 4. Valor por defecto del estado en nuevas inscripciones desde formularios.
ALTER TABLE public.inscripciones
ALTER COLUMN estado SET DEFAULT 'postulado';

-- 5. (Opcional) Asegurar unicidad del token cuando exista.
CREATE UNIQUE INDEX IF NOT EXISTS inscripciones_token_respuesta_key
ON public.inscripciones(token_respuesta)
WHERE token_respuesta IS NOT NULL;
```

> Nota: ejecutar los comandos sobre la base de datos `postgres` de Supabase. Ajustar los nombres de tablas/esquemas si difieren del entorno actual.

## Métricas para empresas

```sql
create table if not exists public.empresa_metrics (
  id uuid primary key default gen_random_uuid(),
  operativos_con_empresas integer not null,
  colaboradores_movilizados integer not null,
  regiones_impactadas integer not null,
  updated_at timestamptz not null default now()
);

alter table public.empresa_metrics enable row level security;

create policy "Empresa metrics public read" on public.empresa_metrics
  for select
  using (true);

create policy "Empresa metrics admin write" on public.empresa_metrics
  for insert with check (auth.role() = 'service_role');

create policy "Empresa metrics admin update" on public.empresa_metrics
  for update using (auth.role() = 'service_role');
```

> Nota: la API realizará `upsert` sobre un identificador fijo (por ejemplo `00000000-0000-0000-0000-000000000001`) para mantener un único registro activo.
