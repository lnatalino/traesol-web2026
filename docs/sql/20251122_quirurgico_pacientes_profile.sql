begin;

alter table if exists public.quirurgico_pacientes
  add column if not exists email text,
  add column if not exists telefono text,
  add column if not exists telefono_emergencia text,
  add column if not exists nombre_contacto_emergencia text,
  add column if not exists ciudad_origen text,
  add column if not exists requiere_vuelo boolean default false,
  add column if not exists requiere_hospedaje boolean default false,
  add column if not exists diagnostico text,
  add column if not exists cirugia_planificada text,
  add column if not exists fecha_cirugia date,
  add column if not exists hora_cirugia time,
  add column if not exists fecha_llegada_ciudad date,
  add column if not exists fecha_regreso_ciudad date,
  add column if not exists portal_token uuid,
  add column if not exists rut_ultimos4 text,
  add column if not exists portal_last_access_at timestamptz,
  add column if not exists portal_is_active boolean not null default true,
  add column if not exists comentarios_paciente text;

alter table if exists public.quirurgico_pacientes
  alter column requiere_vuelo set default false;

alter table if exists public.quirurgico_pacientes
  alter column requiere_hospedaje set default false;

alter table if exists public.quirurgico_pacientes
  alter column portal_is_active set default true;

alter table if exists public.quirurgico_pacientes
  alter column portal_is_active set not null;

alter table if exists public.quirurgico_pacientes
  enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quirurgico_pacientes'::regclass
      and conname = 'quirurgico_pacientes_portal_token_key'
  ) then
    alter table public.quirurgico_pacientes
      add constraint quirurgico_pacientes_portal_token_key unique (portal_token);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_pacientes'
      and policyname = 'quirurgico_pacientes_service_select'
  ) then
    create policy quirurgico_pacientes_service_select on public.quirurgico_pacientes
      for select
      using (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_pacientes'
      and policyname = 'quirurgico_pacientes_service_insert'
  ) then
    create policy quirurgico_pacientes_service_insert on public.quirurgico_pacientes
      for insert
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_pacientes'
      and policyname = 'quirurgico_pacientes_service_update'
  ) then
    create policy quirurgico_pacientes_service_update on public.quirurgico_pacientes
      for update
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_pacientes'
      and policyname = 'quirurgico_pacientes_service_delete'
  ) then
    create policy quirurgico_pacientes_service_delete on public.quirurgico_pacientes
      for delete
      using (auth.role() = 'service_role');
  end if;
end;
$$;

commit;
