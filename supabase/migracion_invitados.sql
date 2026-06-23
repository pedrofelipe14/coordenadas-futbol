-- ============================================================
-- MIGRACIÓN: Jugadores invitados por partido (no son del grupo)
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

create table if not exists partido_invitados (
  id uuid default gen_random_uuid() primary key,
  partido_id uuid not null references partidos(id) on delete cascade,
  nombre text not null,
  equipo text not null check (equipo in ('A', 'B')),
  created_at timestamptz not null default now()
);

alter table partido_invitados enable row level security;

create policy "invitados_select"
  on partido_invitados for select
  using (
    exists (
      select 1 from partidos p
      where p.id = partido_id
      and p.grupo_id = get_mi_grupo_id()
    )
  );

create policy "invitados_insert"
  on partido_invitados for insert
  with check (
    exists (
      select 1 from partidos p
      where p.id = partido_id
      and p.grupo_id = get_mi_grupo_id()
    )
  );

create policy "invitados_delete"
  on partido_invitados for delete
  using (
    exists (
      select 1 from partidos p
      where p.id = partido_id
      and p.grupo_id = get_mi_grupo_id()
    )
  );
