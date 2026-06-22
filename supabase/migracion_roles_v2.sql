-- ============================================================
-- MIGRACIÓN: Roles v2 — sin límite de admins por grupo
-- El creador puede dar admin a cualquier miembro del grupo.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- Reemplaza promover_admin: quita el tope de 2 admins
create or replace function promover_admin(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_caller_admin boolean;
  v_same_group   boolean;
begin
  select es_admin into v_caller_admin from profiles where id = auth.uid();
  if not coalesce(v_caller_admin, false) then
    raise exception 'No tenés permisos para promover admins';
  end if;

  select (grupo_id = get_mi_grupo_id()) into v_same_group
  from profiles where id = p_user_id;
  if not coalesce(v_same_group, false) then
    raise exception 'El jugador no está en tu grupo';
  end if;

  update profiles set es_admin = true where id = p_user_id;
end;
$$;
