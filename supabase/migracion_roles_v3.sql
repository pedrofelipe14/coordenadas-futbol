-- ============================================================
-- MIGRACIÓN: Roles v3 — solo el creador puede dar/quitar admin
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

create or replace function promover_admin(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_es_creador boolean;
  v_same_group boolean;
begin
  select (creado_por = auth.uid()) into v_es_creador
  from grupos where id = get_mi_grupo_id();
  if not coalesce(v_es_creador, false) then
    raise exception 'Solo el creador del grupo puede dar admin';
  end if;

  select (grupo_id = get_mi_grupo_id()) into v_same_group
  from profiles where id = p_user_id;
  if not coalesce(v_same_group, false) then
    raise exception 'El jugador no está en tu grupo';
  end if;

  update profiles set es_admin = true where id = p_user_id;
end;
$$;

create or replace function quitar_admin(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_es_creador boolean;
  v_same_group boolean;
begin
  select (creado_por = auth.uid()) into v_es_creador
  from grupos where id = get_mi_grupo_id();
  if not coalesce(v_es_creador, false) then
    raise exception 'Solo el creador del grupo puede quitar admin';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'No podés quitarte el admin a vos mismo';
  end if;

  select (grupo_id = get_mi_grupo_id()) into v_same_group
  from profiles where id = p_user_id;
  if not coalesce(v_same_group, false) then
    raise exception 'El jugador no está en tu grupo';
  end if;

  update profiles set es_admin = false where id = p_user_id;
end;
$$;
