begin;

-- Tabla de operativos quirúrgicos (solo si no existe)
create table if not exists public.operativos_quirurgicos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  slug text not null unique,
  descripcion text,
  fecha_inicio date,
  fecha_fin date,
  ciudad text,
  lugar text,
  estado text not null default 'borrador', -- borrador / publicado / cerrado, por ahora solo texto
  created_at timestamptz not null default now()
);

-- Habilitar RLS
alter table if exists public.operativos_quirurgicos
  enable row level security;

-- Policies idempotentes
do $$
begin
  -- Lectura pública (puede ser anónima, no hay datos sensibles)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operativos_quirurgicos'
      and policyname = 'operativos_quirurgicos_public_select'
  ) then
    create policy operativos_quirurgicos_public_select
      on public.operativos_quirurgicos
      for select
      using (true);
  end if;

  -- Insert solo para service_role
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operativos_quirurgicos'
      and policyname = 'operativos_quirurgicos_service_insert'
  ) then
    create policy operativos_quirurgicos_service_insert
      on public.operativos_quirurgicos
      for insert
      with check (auth.role() = 'service_role');
  end if;

  -- Update solo para service_role
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operativos_quirurgicos'
      and policyname = 'operativos_quirurgicos_service_update'
  ) then
    create policy operativos_quirurgicos_service_update
      on public.operativos_quirurgicos
      for update
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  -- Delete solo para service_role
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operativos_quirurgicos'
      and policyname = 'operativos_quirurgicos_service_delete'
  ) then
    create policy operativos_quirurgicos_service_delete
      on public.operativos_quirurgicos
      for delete
      using (auth.role() = 'service_role');
  end if;
end;
$$;

commit;
