-- ============================================================
-- MIGRACIÓN: Sistema de grupos
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- ----------------------------------------------------------
-- 1. TABLA GRUPOS
-- ----------------------------------------------------------
create table if not exists grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text not null unique,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table grupos enable row level security;

-- ----------------------------------------------------------
-- 2. AGREGAR grupo_id A PROFILES (debe ir antes de la función)
-- ----------------------------------------------------------
alter table profiles
  add column if not exists grupo_id uuid references grupos(id) on delete set null;

-- ----------------------------------------------------------
-- 3. FUNCIÓN HELPER (ahora que grupo_id ya existe en profiles)
-- ----------------------------------------------------------
create or replace function get_mi_grupo_id()
returns uuid
language sql
security definer
stable
as $$
  select grupo_id from profiles where id = auth.uid()
$$;

-- ----------------------------------------------------------
-- 4. FUNCIÓN RPC: buscar grupo por código
-- ----------------------------------------------------------
create or replace function buscar_grupo_por_codigo(p_codigo text)
returns table(id uuid, nombre text, codigo text)
language sql
security definer
stable
as $$
  select id, nombre, codigo
  from grupos
  where upper(codigo) = upper(p_codigo)
$$;

-- ----------------------------------------------------------
-- 5. RLS PARA GRUPOS
-- ----------------------------------------------------------
create policy "Cualquier autenticado puede crear un grupo"
  on grupos for insert
  to authenticated
  with check (true);

create policy "Miembros pueden ver su grupo"
  on grupos for select
  to authenticated
  using (id = get_mi_grupo_id());

-- ----------------------------------------------------------
-- 6. ACTUALIZAR RLS DE PROFILES
-- ----------------------------------------------------------
drop policy if exists "Cualquier usuario autenticado puede ver perfiles" on profiles;

create policy "Ver perfiles del mismo grupo o el propio"
  on profiles for select
  to authenticated
  using (
    id = auth.uid()
    or grupo_id = get_mi_grupo_id()
  );

-- ----------------------------------------------------------
-- 7. AGREGAR grupo_id A PARTIDOS Y ACTUALIZAR RLS
-- ----------------------------------------------------------
alter table partidos
  add column if not exists grupo_id uuid references grupos(id) on delete cascade;

drop policy if exists "Cualquier usuario autenticado puede ver partidos" on partidos;
drop policy if exists "Cualquier usuario autenticado puede crear partidos" on partidos;
drop policy if exists "Cualquier usuario autenticado puede editar partidos" on partidos;
drop policy if exists "Cualquier usuario autenticado puede borrar partidos" on partidos;

create policy "Ver partidos del grupo"
  on partidos for select
  to authenticated
  using (grupo_id = get_mi_grupo_id());

create policy "Crear partidos en el grupo"
  on partidos for insert
  to authenticated
  with check (grupo_id = get_mi_grupo_id());

create policy "Editar partidos del grupo"
  on partidos for update
  to authenticated
  using (grupo_id = get_mi_grupo_id());

create policy "Borrar partidos del grupo"
  on partidos for delete
  to authenticated
  using (grupo_id = get_mi_grupo_id());

-- ----------------------------------------------------------
-- 8. ÍNDICES
-- ----------------------------------------------------------
create index if not exists idx_partidos_grupo on partidos(grupo_id);
create index if not exists idx_profiles_grupo on profiles(grupo_id);
create index if not exists idx_grupos_codigo on grupos(codigo);
