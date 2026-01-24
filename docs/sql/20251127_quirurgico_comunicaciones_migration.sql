begin;

-- Ensure legacy columns are renamed to the new schema (asunto -> subject, enviado_a -> to_email).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quirurgico_comunicaciones' and column_name = 'asunto'
  ) then
    execute 'alter table public.quirurgico_comunicaciones rename column asunto to subject';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quirurgico_comunicaciones' and column_name = 'enviado_a'
  ) then
    execute 'alter table public.quirurgico_comunicaciones rename column enviado_a to to_email';
  end if;
end;
$$;

-- Add the new columns expected by the application.
alter table public.quirurgico_comunicaciones
  add column if not exists body_preview text,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.quirurgico_comunicaciones
  alter column metadata set default '{}'::jsonb;

-- Backfill body_preview from the legacy cuerpo_html column if it is still around.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quirurgico_comunicaciones' and column_name = 'cuerpo_html'
  ) then
    execute $$
      update public.quirurgico_comunicaciones
         set body_preview = left(
           regexp_replace(coalesce(cuerpo_html, ''), '<[^>]+>', ' ', 'gi'),
           400
         )
       where coalesce(body_preview, '') = '';
    $$;
  end if;
end;
$$;

-- Backfill metadata with the previous enviado_por/estado/error fields before we drop them.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quirurgico_comunicaciones' and column_name = 'enviado_por'
  ) then
    execute $$
      update public.quirurgico_comunicaciones
         set metadata = jsonb_strip_nulls(
           coalesce(metadata, '{}'::jsonb) ||
           jsonb_build_object(
             'enviado_por', enviado_por,
             'estado', estado,
             'error_detalle', error_detalle
           )
         );
    $$;
  end if;
end;
$$;

-- Drop legacy columns that the application no longer reads.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quirurgico_comunicaciones' and column_name = 'cuerpo_html'
  ) then
    execute 'alter table public.quirurgico_comunicaciones drop column cuerpo_html';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quirurgico_comunicaciones' and column_name = 'enviado_por'
  ) then
    execute 'alter table public.quirurgico_comunicaciones drop column enviado_por';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quirurgico_comunicaciones' and column_name = 'estado'
  ) then
    execute 'alter table public.quirurgico_comunicaciones drop column estado';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quirurgico_comunicaciones' and column_name = 'error_detalle'
  ) then
    execute 'alter table public.quirurgico_comunicaciones drop column error_detalle';
  end if;
end;
$$;

-- Reset RLS policies so the service role can perform any operation (select + insert) on this table.
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_comunicaciones'
      and policyname = 'quirurgico_comunicaciones_service_select'
  ) then
    execute 'drop policy quirurgico_comunicaciones_service_select on public.quirurgico_comunicaciones';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_comunicaciones'
      and policyname = 'quirurgico_comunicaciones_service_insert'
  ) then
    execute 'drop policy quirurgico_comunicaciones_service_insert on public.quirurgico_comunicaciones';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quirurgico_comunicaciones'
      and policyname = 'quirurgico_comunicaciones_service_all'
  ) then
    execute $$
      create policy quirurgico_comunicaciones_service_all
        on public.quirurgico_comunicaciones
        for all
        using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    $$;
  end if;
end;
$$;

commit;
