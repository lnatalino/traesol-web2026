begin;

create table if not exists public.quirurgico_comunicaciones (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.quirurgico_pacientes(id) on delete cascade,
  tipo text not null,
  to_email text not null,
  subject text not null,
  body_preview text,
  enviado_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

alter table if exists public.quirurgico_comunicaciones
  enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_comunicaciones'
      and policyname = 'quirurgico_comunicaciones_service_all'
  ) then
    create policy quirurgico_comunicaciones_service_all
      on public.quirurgico_comunicaciones
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end;
$$;

commit;
