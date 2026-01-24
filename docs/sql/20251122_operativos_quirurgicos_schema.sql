begin;

create table if not exists public.operativos_quirurgicos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  slug text not null,
  descripcion text,
  fecha_inicio date,
  fecha_fin date,
  ubicacion text,
  estado text default 'planificado',
  created_at timestamptz not null default now()
);

alter table if exists public.operativos_quirurgicos
  enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.operativos_quirurgicos'::regclass
      and conname = 'operativos_quirurgicos_slug_key'
  ) then
    alter table public.operativos_quirurgicos
      add constraint operativos_quirurgicos_slug_key unique (slug);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operativos_quirurgicos'
      and policyname = 'operativos_quirurgicos_public_select'
  ) then
    create policy operativos_quirurgicos_public_select on public.operativos_quirurgicos
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operativos_quirurgicos'
      and policyname = 'operativos_quirurgicos_service_insert'
  ) then
    create policy operativos_quirurgicos_service_insert on public.operativos_quirurgicos
      for insert
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operativos_quirurgicos'
      and policyname = 'operativos_quirurgicos_service_update'
  ) then
    create policy operativos_quirurgicos_service_update on public.operativos_quirurgicos
      for update
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operativos_quirurgicos'
      and policyname = 'operativos_quirurgicos_service_delete'
  ) then
    create policy operativos_quirurgicos_service_delete on public.operativos_quirurgicos
      for delete
      using (auth.role() = 'service_role');
  end if;
end;
$$;

commit;
