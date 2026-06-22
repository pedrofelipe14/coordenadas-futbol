-- ============================================================
-- MIGRACIÓN: Sistema de roles (admin / jugador)
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- ----------------------------------------------------------
-- 1. COLUMNA es_admin EN PROFILES
-- ----------------------------------------------------------
alter table profiles
  add column if not exists es_admin boolean not null default false;

-- ----------------------------------------------------------
-- 2. FUNCIONES HELPER
-- ----------------------------------------------------------

-- ¿El usuario actual es admin?
create or replace function soy_admin_del_grupo()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select es_admin from profiles where id = auth.uid()),
    false
  )
$$;

-- ----------------------------------------------------------
-- 3. RPC: promover a un miembro como admin
--    Solo puede ejecutarlo un admin del mismo grupo.
--    El grupo no puede tener más de 2 admins.
-- ----------------------------------------------------------
create or replace function promover_admin(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_caller_admin boolean;
  v_same_group   boolean;
  v_admin_count  int;
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

  select count(*)::int into v_admin_count
  from profiles
  where grupo_id = get_mi_grupo_id() and es_admin = true;
  if v_admin_count >= 2 then
    raise exception 'El grupo ya tiene 2 admins';
  end if;

  update profiles set es_admin = true where id = p_user_id;
end;
$$;

-- ----------------------------------------------------------
-- 4. RPC: quitar admin al segundo admin
--    Solo el creador del grupo puede hacerlo.
--    El creador no puede quitarse el admin a sí mismo.
-- ----------------------------------------------------------
create or replace function quitar_admin(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_caller_admin boolean;
  v_same_group   boolean;
  v_es_creador   boolean;
begin
  select es_admin into v_caller_admin from profiles where id = auth.uid();
  if not coalesce(v_caller_admin, false) then
    raise exception 'No tenés permisos';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'No podés quitarte el admin a vos mismo';
  end if;

  select (p.grupo_id = get_mi_grupo_id()) into v_same_group
  from profiles p where p.id = p_user_id;
  if not coalesce(v_same_group, false) then
    raise exception 'El jugador no está en tu grupo';
  end if;

  -- El creador del grupo nunca puede ser removido por esta función
  select (creado_por = p_user_id) into v_es_creador
  from grupos where id = get_mi_grupo_id();
  if coalesce(v_es_creador, false) then
    raise exception 'No se puede quitar el admin al creador del grupo';
  end if;

  update profiles set es_admin = false where id = p_user_id;
end;
$$;

-- ----------------------------------------------------------
-- 5. ACTUALIZAR RLS DE PARTIDOS — solo admins escriben
-- ----------------------------------------------------------
drop policy if exists "Crear partidos en el grupo" on partidos;
drop policy if exists "Editar partidos del grupo" on partidos;
drop policy if exists "Borrar partidos del grupo" on partidos;

create policy "Solo admins pueden crear partidos"
  on partidos for insert
  to authenticated
  with check (grupo_id = get_mi_grupo_id() and soy_admin_del_grupo());

create policy "Solo admins pueden editar partidos"
  on partidos for update
  to authenticated
  using (grupo_id = get_mi_grupo_id() and soy_admin_del_grupo());

create policy "Solo admins pueden borrar partidos"
  on partidos for delete
  to authenticated
  using (grupo_id = get_mi_grupo_id() and soy_admin_del_grupo());

-- ----------------------------------------------------------
-- 6. ACTUALIZAR RLS DE GOLES — solo admins escriben
-- ----------------------------------------------------------
drop policy if exists "Cualquier usuario autenticado puede cargar goles" on goles;
drop policy if exists "Cualquier usuario autenticado puede editar goles" on goles;
drop policy if exists "Cualquier usuario autenticado puede borrar goles" on goles;

create policy "Solo admins pueden cargar goles"
  on goles for insert
  to authenticated
  with check (soy_admin_del_grupo());

create policy "Solo admins pueden editar goles"
  on goles for update
  to authenticated
  using (soy_admin_del_grupo());

create policy "Solo admins pueden borrar goles"
  on goles for delete
  to authenticated
  using (soy_admin_del_grupo());

-- ----------------------------------------------------------
-- 7. ACTUALIZAR RLS DE PARTIDO_JUGADORES — solo admins escriben
-- ----------------------------------------------------------
drop policy if exists "Crear lineup del grupo" on partido_jugadores;
drop policy if exists "Borrar lineup del grupo" on partido_jugadores;

create policy "Solo admins pueden crear lineup"
  on partido_jugadores for insert
  to authenticated
  with check (
    soy_admin_del_grupo()
    and partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

create policy "Solo admins pueden borrar lineup"
  on partido_jugadores for delete
  to authenticated
  using (
    soy_admin_del_grupo()
    and partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

-- ----------------------------------------------------------
-- 8. ACTUALIZAR RLS DE JUGADAS_EPICAS — solo admins escriben
-- ----------------------------------------------------------
drop policy if exists "Crear jugadas del grupo" on jugadas_epicas;
drop policy if exists "Borrar jugadas del grupo" on jugadas_epicas;

create policy "Solo admins pueden crear jugadas"
  on jugadas_epicas for insert
  to authenticated
  with check (
    soy_admin_del_grupo()
    and partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

create policy "Solo admins pueden borrar jugadas"
  on jugadas_epicas for delete
  to authenticated
  using (
    soy_admin_del_grupo()
    and partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

-- UPDATE para jugadas (editar URL) — solo admins
drop policy if exists "Editar URL de jugada" on jugadas_epicas;

create policy "Solo admins pueden editar jugadas"
  on jugadas_epicas for update
  to authenticated
  using (
    soy_admin_del_grupo()
    and partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

-- ----------------------------------------------------------
-- NOTA: Después de ejecutar esta migración
-- ----------------------------------------------------------
-- Los usuarios que ya crearon grupos necesitan que se les ponga
-- es_admin = true manualmente, o podés correr:
--
--   update profiles p
--   set es_admin = true
--   from grupos g
--   where g.creado_por = p.id
--     and p.grupo_id = g.id;
--
-- Esto pone como admin a todos los que crearon su propio grupo.
