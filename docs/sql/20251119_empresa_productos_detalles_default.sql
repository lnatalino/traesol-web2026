begin;

update public.empresa_productos
  set detalles_json = '{}'::jsonb
where detalles_json is null;

alter table public.empresa_productos
  alter column detalles_json set default '{}'::jsonb;

commit;
