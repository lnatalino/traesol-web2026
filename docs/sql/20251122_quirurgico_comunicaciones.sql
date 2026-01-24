begin;

create table if not exists public.quirurgico_comunicaciones (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.quirurgico_pacientes(id) on delete cascade,
  tipo text not null, -- por ahora: 'confirmacion_cirugia'
  asunto text not null,
  cuerpo_html text not null,
  enviado_a text not null, -- email destino
  enviado_por text,        -- email del admin (si lo tenemos disponible)
  enviado_at timestamptz not null default now(),
  estado text not null default 'enviado', -- 'enviado', 'error'
  error_detalle text
);

alter table if exists public.quirurgico_comunicaciones
  enable row level security;

-- Policies: solo service_role puede operar
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_comunicaciones'
      and policyname = 'quirurgico_comunicaciones_service_select'
  ) then
    create policy quirurgico_comunicaciones_service_select
      on public.quirurgico_comunicaciones
      for select
      using (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_comunicaciones'
      and policyname = 'quirurgico_comunicaciones_service_insert'
  ) then
    create policy quirurgico_comunicaciones_service_insert
      on public.quirurgico_comunicaciones
      for insert
      with check (auth.role() = 'service_role');
  end if;
end;
$$;

commit;
