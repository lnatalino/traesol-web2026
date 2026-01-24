-- Necesito que repares la migración 20251121_empresa_productos_pack_items_schema.sql.
-- Problema: la versión actual tiene begin/commit duplicados y bloques do $$ mal cerrados, lo que
-- provoca errores de sintaxis (“syntax error at or near begin”).
-- Reemplaza TODO el contenido de ese archivo por una migración idempotente con esta estructura.

begin;

-- 1) Garantizar detalles_json jsonb not null default '{}'
alter table if exists public.empresa_productos
  add column if not exists detalles_json jsonb;

alter table if exists public.empresa_productos
  alter column detalles_json type jsonb using coalesce(detalles_json, '{}'::jsonb),
  alter column detalles_json set default '{}'::jsonb;

update public.empresa_productos
set detalles_json = '{}'::jsonb
where detalles_json is null;

alter table if exists public.empresa_productos
  alter column detalles_json set not null;

-- 2) Garantizar cantidad integer not null default 1
alter table if exists public.empresa_pack_items
  add column if not exists cantidad integer;

update public.empresa_pack_items
set cantidad = 1
where cantidad is null;

alter table if exists public.empresa_pack_items
  alter column cantidad set default 1,
  alter column cantidad set not null;

-- 3) Habilitar RLS
alter table if exists public.empresa_productos enable row level security;
alter table if exists public.empresa_pack_items enable row level security;

-- 4) Políticas
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'empresa_productos'
      and policyname = 'empresa_productos_public_select'
  ) then
    create policy empresa_productos_public_select on public.empresa_productos
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'empresa_productos'
      and policyname = 'empresa_productos_service_insert'
  ) then
    create policy empresa_productos_service_insert on public.empresa_productos
      for insert
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'empresa_productos'
      and policyname = 'empresa_productos_service_update'
  ) then
    create policy empresa_productos_service_update on public.empresa_productos
      for update
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'empresa_productos'
      and policyname = 'empresa_productos_service_delete'
  ) then
    create policy empresa_productos_service_delete on public.empresa_productos
      for delete
      using (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'empresa_pack_items'
      and policyname = 'empresa_pack_items_public_select'
  ) then
    create policy empresa_pack_items_public_select on public.empresa_pack_items
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'empresa_pack_items'
      and policyname = 'empresa_pack_items_service_insert'
  ) then
    create policy empresa_pack_items_service_insert on public.empresa_pack_items
      for insert
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'empresa_pack_items'
      and policyname = 'empresa_pack_items_service_update'
  ) then
    create policy empresa_pack_items_service_update on public.empresa_pack_items
      for update
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'empresa_pack_items'
      and policyname = 'empresa_pack_items_service_delete'
  ) then
    create policy empresa_pack_items_service_delete on public.empresa_pack_items
      for delete
      using (auth.role() = 'service_role');
  end if;
end;
$$;

commit;
