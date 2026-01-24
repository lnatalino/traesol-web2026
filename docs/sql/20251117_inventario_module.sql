begin;

create table if not exists public.inventario_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  descripcion text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventario_items (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.inventario_categorias(id) on delete set null,
  nombre text not null,
  slug text not null unique,
  descripcion text,
  foto_url text,
  cantidad_actual integer not null default 0,
  unidad text default 'unidad',
  valor_unitario integer,  uso text,
  tipo_regla text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.inventario_categorias enable row level security;
alter table public.inventario_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventario_categorias'
      and policyname = 'Inventario categorias public read'
  ) then
    create policy "Inventario categorias public read" on public.inventario_categorias
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventario_categorias'
      and policyname = 'Inventario categorias admin insert'
  ) then
    create policy "Inventario categorias admin insert" on public.inventario_categorias
      for insert
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventario_categorias'
      and policyname = 'Inventario categorias admin update'
  ) then
    create policy "Inventario categorias admin update" on public.inventario_categorias
      for update
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventario_categorias'
      and policyname = 'Inventario categorias admin delete'
  ) then
    create policy "Inventario categorias admin delete" on public.inventario_categorias
      for delete
      using (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventario_items'
      and policyname = 'Inventario items public read'
  ) then
    create policy "Inventario items public read" on public.inventario_items
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventario_items'
      and policyname = 'Inventario items admin insert'
  ) then
    create policy "Inventario items admin insert" on public.inventario_items
      for insert
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventario_items'
      and policyname = 'Inventario items admin update'
  ) then
    create policy "Inventario items admin update" on public.inventario_items
      for update
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventario_items'
      and policyname = 'Inventario items admin delete'
  ) then
    create policy "Inventario items admin delete" on public.inventario_items
      for delete
      using (auth.role() = 'service_role');
  end if;
end;
$$;

commit;
