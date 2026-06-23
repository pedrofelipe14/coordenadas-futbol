-- ============================================================
-- MIGRACIÓN: Cambio de apodo con límite de 1 vez por semana
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- Columna para registrar cuándo se cambió el apodo por última vez
alter table profiles
  add column if not exists apodo_cambiado_at timestamptz;

-- RPC que valida y ejecuta el cambio (server-side enforcement)
create or replace function cambiar_apodo(p_nuevo_apodo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ultimo_cambio timestamptz;
begin
  -- Leer cuándo fue el último cambio
  select apodo_cambiado_at into ultimo_cambio
  from profiles where id = auth.uid();

  -- Verificar que pasó al menos 1 semana
  if ultimo_cambio is not null and ultimo_cambio > now() - interval '7 days' then
    raise exception 'COOLDOWN:%', (ultimo_cambio + interval '7 days')::text;
  end if;

  -- Verificar que el apodo no esté en uso
  if exists (select 1 from profiles where apodo = p_nuevo_apodo and id != auth.uid()) then
    raise exception 'APODO_OCUPADO';
  end if;

  -- Validar longitud mínima
  if length(trim(p_nuevo_apodo)) < 2 then
    raise exception 'APODO_CORTO';
  end if;

  -- Aplicar el cambio
  update profiles
  set apodo = trim(p_nuevo_apodo), apodo_cambiado_at = now()
  where id = auth.uid();
end;
$$;
