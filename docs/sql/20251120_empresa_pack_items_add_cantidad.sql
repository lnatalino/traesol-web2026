begin;

alter table if exists public.empresa_pack_items
  add column if not exists cantidad integer;

update public.empresa_pack_items
set cantidad = 1
where cantidad is null;

alter table if exists public.empresa_pack_items
  alter column cantidad set default 1,
  alter column cantidad set not null;

commit;
