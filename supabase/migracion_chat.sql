-- ============================================================
-- MIGRACIÓN: Chat de grupo
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- ----------------------------------------------------------
-- 1. TABLA MENSAJES
-- ----------------------------------------------------------
create table if not exists mensajes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos(id) on delete cascade,
  autor_id uuid not null references profiles(id) on delete cascade,
  contenido text not null check (char_length(trim(contenido)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table mensajes enable row level security;

-- Miembros pueden leer mensajes de su grupo
create policy "Ver mensajes del grupo"
  on mensajes for select
  to authenticated
  using (grupo_id = get_mi_grupo_id());

-- Miembros pueden enviar mensajes a su grupo (solo como ellos mismos)
create policy "Enviar mensajes al grupo"
  on mensajes for insert
  to authenticated
  with check (grupo_id = get_mi_grupo_id() and autor_id = auth.uid());

-- ----------------------------------------------------------
-- 2. HABILITAR REALTIME
-- ----------------------------------------------------------
alter publication supabase_realtime add table mensajes;

-- ----------------------------------------------------------
-- 3. ÍNDICE
-- ----------------------------------------------------------
create index if not exists idx_mensajes_grupo_fecha on mensajes(grupo_id, created_at desc);
