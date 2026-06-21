-- ============================================================
-- MIGRACIÓN: Flujo de partido en 2 secciones
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- ----------------------------------------------------------
-- 1. NUEVAS COLUMNAS EN PARTIDOS
-- ----------------------------------------------------------
alter table partidos
  add column if not exists estado text not null default 'finalizado'
    check (estado in ('en_curso', 'finalizado'));

alter table partidos
  add column if not exists equipo_saque text
    check (equipo_saque in ('A', 'B'));

-- Partidos existentes ya están terminados
update partidos set estado = 'finalizado' where estado is null;

-- ----------------------------------------------------------
-- 2. MINUTO EN GOLES
-- ----------------------------------------------------------
alter table goles
  add column if not exists minuto int
    check (minuto >= 0 and minuto <= 120);

-- ----------------------------------------------------------
-- 3. TABLA PARTIDO_JUGADORES (lineup)
-- ----------------------------------------------------------
create table if not exists partido_jugadores (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos(id) on delete cascade,
  jugador_id uuid not null references profiles(id) on delete cascade,
  equipo text not null check (equipo in ('A', 'B')),
  created_at timestamptz not null default now(),
  unique(partido_id, jugador_id)
);

alter table partido_jugadores enable row level security;

create policy "Ver lineup del grupo"
  on partido_jugadores for select
  to authenticated
  using (
    partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

create policy "Crear lineup del grupo"
  on partido_jugadores for insert
  to authenticated
  with check (
    partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

create policy "Borrar lineup del grupo"
  on partido_jugadores for delete
  to authenticated
  using (
    partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

-- ----------------------------------------------------------
-- 4. TABLA JUGADAS_EPICAS
-- ----------------------------------------------------------
create table if not exists jugadas_epicas (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos(id) on delete cascade,
  jugador_id uuid references profiles(id) on delete set null,
  descripcion text not null,
  minuto int check (minuto >= 0 and minuto <= 120),
  created_at timestamptz not null default now()
);

alter table jugadas_epicas enable row level security;

create policy "Ver jugadas del grupo"
  on jugadas_epicas for select
  to authenticated
  using (
    partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

create policy "Crear jugadas del grupo"
  on jugadas_epicas for insert
  to authenticated
  with check (
    partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

create policy "Borrar jugadas del grupo"
  on jugadas_epicas for delete
  to authenticated
  using (
    partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );

-- ----------------------------------------------------------
-- 5. ÍNDICES
-- ----------------------------------------------------------
create index if not exists idx_partido_jugadores_partido on partido_jugadores(partido_id);
create index if not exists idx_jugadas_partido on jugadas_epicas(partido_id);
