begin;

alter table if exists public.quirurgico_pacientes
  add column if not exists alta_hospitalaria_estimada date,
  add column if not exists vuelo_ida_fecha date,
  add column if not exists vuelo_ida_numero text,
  add column if not exists vuelo_ida_hora_salida time,
  add column if not exists vuelo_ida_hora_llegada time,
  add column if not exists vuelo_regreso_fecha date,
  add column if not exists vuelo_regreso_hora_salida time,
  add column if not exists vuelo_regreso_hora_llegada time,
  add column if not exists hotel_nombre text,
  add column if not exists hotel_direccion text,
  add column if not exists hotel_checkin_inicial date,
  add column if not exists hotel_checkout_inicial date,
  add column if not exists hotel_checkin_post_cirugia date,
  add column if not exists hotel_checkout_final date,
  add column if not exists visita_enfermera_fecha date,
  add column if not exists primera_kine_fecha date,
  add column if not exists segunda_kine_fecha date,
  add column if not exists curacion_fecha date,
  add column if not exists dias_estimados_santiago integer;

commit;
