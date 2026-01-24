begin;

alter table public.voluntarios
  add column if not exists operativos_asistidos integer not null default 0,
  add column if not exists uniformes_entregados integer not null default 0,
  add column if not exists ultima_entrega_uniforme_en timestamptz,
  add column if not exists nota_inventario text;

commit;
