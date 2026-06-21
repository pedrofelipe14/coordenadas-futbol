-- ============================================================
-- ESQUEMA: Futbol entre amigos
-- Ejecutar esto en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------
-- PERFILES (un perfil de jugador por usuario autenticado)
-- ----------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  apodo text not null unique,
  dorsal int not null check (dorsal between 1 and 99),
  avatar_color text not null default '#7CB342',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Cualquier usuario autenticado puede ver perfiles"
  on profiles for select
  to authenticated
  using (true);

create policy "Un usuario solo puede crear su propio perfil"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Un usuario solo puede editar su propio perfil"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- ----------------------------------------------------------
-- PARTIDOS
-- ----------------------------------------------------------
create table if not exists partidos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora time,
  lugar text not null default '',
  formato text not null default '5' check (formato in ('5','7','9')),
  equipo_a text not null default 'Claros',
  equipo_b text not null default 'Oscuros',
  goles_a int not null default 0,
  goles_b int not null default 0,
  costo_cancha numeric,
  creado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table partidos enable row level security;

create policy "Cualquier usuario autenticado puede ver partidos"
  on partidos for select
  to authenticated
  using (true);

create policy "Cualquier usuario autenticado puede crear partidos"
  on partidos for insert
  to authenticated
  with check (true);

create policy "Cualquier usuario autenticado puede editar partidos"
  on partidos for update
  to authenticated
  using (true);

create policy "Cualquier usuario autenticado puede borrar partidos"
  on partidos for delete
  to authenticated
  using (true);

-- ----------------------------------------------------------
-- GOLES (cada fila es un gol de un jugador en un partido)
-- ----------------------------------------------------------
create table if not exists goles (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos(id) on delete cascade,
  jugador_id uuid not null references profiles(id) on delete cascade,
  cantidad int not null default 1 check (cantidad > 0),
  equipo text check (equipo in ('A','B')),
  created_at timestamptz not null default now()
);

alter table goles enable row level security;

create policy "Cualquier usuario autenticado puede ver goles"
  on goles for select
  to authenticated
  using (true);

create policy "Cualquier usuario autenticado puede cargar goles"
  on goles for insert
  to authenticated
  with check (true);

create policy "Cualquier usuario autenticado puede editar goles"
  on goles for update
  to authenticated
  using (true);

create policy "Cualquier usuario autenticado puede borrar goles"
  on goles for delete
  to authenticated
  using (true);

-- ----------------------------------------------------------
-- Índices para que las consultas de temporada/goleadores rindan
-- ----------------------------------------------------------
create index if not exists idx_partidos_fecha on partidos(fecha desc);
create index if not exists idx_goles_partido on goles(partido_id);
create index if not exists idx_goles_jugador on goles(jugador_id);

-- ============================================================
-- NOTA SOBRE AUTENTICACIÓN
-- ============================================================
-- Esta app usa email + contraseña de Supabase Auth por simplicidad
-- y seguridad (Supabase maneja el hash de contraseñas).
-- El "perfil de jugador" (apodo, dorsal) se crea aparte, en la
-- tabla profiles, ligado al usuario autenticado.
-- Para producción, andá a:
-- Authentication > Providers > Email
-- y desactivá "Confirm email" si querés que los amigos entren
-- al toque sin verificar el mail (recomendado para un grupo chico).
