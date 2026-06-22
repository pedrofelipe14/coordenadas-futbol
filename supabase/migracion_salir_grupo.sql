-- ============================================================
-- MIGRACIÓN: Salir y eliminar grupo
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- RPC: eliminar el grupo completo (solo el creador puede hacerlo)
-- El cascade borra partidos, goles, mensajes, etc.
-- ON DELETE SET NULL ya pone grupo_id = null en todos los profiles.
create or replace function eliminar_grupo()
returns void
language plpgsql
security definer
as $$
declare
  v_grupo_id uuid;
  v_es_creador boolean;
begin
  v_grupo_id := get_mi_grupo_id();

  if v_grupo_id is null then
    raise exception 'No estás en ningún grupo';
  end if;

  select (creado_por = auth.uid()) into v_es_creador
  from grupos where id = v_grupo_id;

  if not coalesce(v_es_creador, false) then
    raise exception 'Solo el creador puede eliminar el grupo';
  end if;

  -- Resetear es_admin antes de borrar (ON DELETE SET NULL maneja grupo_id)
  update profiles set es_admin = false where grupo_id = v_grupo_id;

  -- Borrar grupo (cascade a partidos, mensajes, etc.)
  delete from grupos where id = v_grupo_id;
end;
$$;
